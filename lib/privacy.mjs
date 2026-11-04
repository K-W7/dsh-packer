// ============================================================================
// privacy.mjs —— 隐私扫描与脱敏（**同一套规则源**）
//
// 设计要点（v0.7.0 重写）：
//
// 1. **规则只定义一次**。旧实现里「扫描」与「脱敏」各写了一份正则，必然漂移 ——
//    实际后果是扫描端把 `https://github.com/...` 当成"本地盘符路径"报警，
//    而脱敏端正确地跳过了它：UI 报 N 处命中，点「清理后打包」却发现一处没清，
//    报警的可信度被假阳性稀释。现在两者共用 `defaultRules()`，结构上不可能再分叉。
//
// 2. **隐私 = 含个人标识**。旧口径把凡是绝对路径都算隐私，于是
//    `#!/usr/bin/env node` 被替换成 `#!<Unix路径> node`——脚本 shebang 直接报废，
//    而现有的三重校验（结构字符 / JSON 解析 / 行结构）全都拦不住：
//    它只保证"语法还合法"，不保证"语义还成立"。
//    现在：只有含用户名/用户目录的路径才替换；`/usr` `/etc` `/var` 这类系统公共路径
//    不含任何个人信息，不再扫描也不再脱敏。
//
// 3. **保护区（protected ranges）**：shebang 行与 URL 整段跳过。
//    这是"语义优先于语法"的最后一道闸 —— 宁可少脱敏一处，也不产出坏文件。
//
// 4. **扫描与脱敏的口径刻意不同**（两者回答的是两个问题，别强行统一）：
//    - 扫描（`privacyScan`）回答「有风险吗」：每条规则**独立**整篇扫描、各报各的，
//      允许重叠——`/home/alice` 会同时被 user-path 与 unix-path 各报一次，
//      计数如实反映「命中了几条规则」，宁可多报也不漏报。
//    - 脱敏（`collectHits`）回答「改成什么」：单遍最左扫描 + 区间去重，
//      游标消费掉命中区间后不再重复匹配，因此一个路径只被替换一次，
//      不会出现 `<用户目录>/<Unix路径>` 这种占位符套占位符的坏结果。
//
// 5. **扫描结果按内容指纹缓存**（v0.7.0）。界面的「扫描」与「开始打包」是两次
//    `/create`（一次 dryRun、一次真打包），同一批文件会被整篇读两遍、跑两遍全规则。
//    缓存键 = `rel + 文件 sha256`：内容一变键就变，绝不会拿旧结论当新结论，
//    所以这是纯性能优化、不是正确性妥协。没有 sha256 的调用（`/scan` 只带 size）
//    不进缓存；规则表变了（部署者注入/撤掉个人敏感词）整体失效。
// ============================================================================
import fsp from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'

import {
  KIND_PLACEHOLDER,
  SANITIZE_UNSAFE_CHARS,
  PLACEHOLDER_HOME,
  PLACEHOLDER_USER,
  RETAINED_PLACEHOLDERS,
  PRIVACY_KINDS,
  PRIVACY_SCAN_CACHE_MAX,
} from './constants.mjs'
import { isTextFile, readFileText, currentUsername } from './util.mjs'

// 路径片段允许的字符：排除空白、引号（含反引号）、`< > | ? *`、YAML/JSON 流式结构符
// `{ } [ ] , ;`、括号与 `# & !`（注释 / HTML 符）。
// 刻意不含 `:`：盘符 `C:` 必须能替换；路径里的冒号后面永远是 `\` 或 `/`。
const PATH_TAIL = String.raw`[^\s"'<>|?*{}[\],;()#&!` + '`' + ']'

// 卷名 / 挂载名单段：允许空格（macOS 卷名常见 "Macintosh HD"），但**绝不允许跨过 `/`**
// —— 正是这条限制让它能安全吃下带空格的卷名：长度天然被下一个 `/` 限死，吃不掉整句中文。
const VOL_SEG = String.raw`[^\/\\"'<>|\r\n]`
// 挂载根必须以「段边界」收尾：否则 `/privateers/x`、`/nix/storehouse/x` 会被当成
// `/private` / `/nix/store` 命中，把好文件改坏。允许的后继只有 `/`、空白、结构符或行尾。
const SEG_CHAR = String.raw`[^\s"'<>|?*{}[\],;()#&!` + '`' + String.raw`\\\/]`
/**
 * 家目录之前可能出现的挂载前缀（v0.7.0 补漏）：
 *   - `/System/Volumes/Data` macOS firmlink 真实路径（`realpath` 出来的 /Users 都带这层）
 *   - `/Volumes/<卷名>`      外挂卷 / 非启动盘上的家目录
 *   - `/mnt/<名>` `/media/<名>` Linux 挂载点下的家目录
 * 旧实现只认 `/Users` 本身，于是 `/System/Volumes/Data/Users/alice/x`
 * 被换成 `/System/Volumes/Data<用户目录>/x` —— 半脱敏：用户名盖住了，机器布局还露着。
 */
const VOL_PREFIX = String.raw`\/(?:System\/Volumes\/Data|Volumes\/${VOL_SEG}+?|mnt\/[^\s"'<>\\\/]+|media\/[^\s"'<>\\\/]+)`

/** 规则 id → kind（部署者个人规则一律归 personal） */
export const PATTERN_KIND = {
  'user-path': 'userpath',
  'abs-path': 'path',
  'unc-path': 'unc',
  'unix-path': 'unix',
  'vol-path': 'path',
  credential: 'credential',
  'key-shape': 'key',
}

let PERSONAL_RULES = []

/**
 * 内置规则表。**扫描与脱敏共用这一份**，任何改动同时作用于两端。
 *
 * 每条规则：
 *   - `kind`        固定枚举（PRIVACY_KINDS），UI 按它分组
 *   - `spanOf(m)`   「被替换掉的那段」——结构字符检查只针对它
 *   - `rebuild(m,ph)` 如何拼回替换结果（默认整段换成占位符）
 *
 * 顺序即优先级（同一起点取靠前的规则）：
 *   user-path → 盘符 → UNC → Unix 家目录 → credential → key-shape → 个人规则
 */
export function defaultRules() {
  return [
    {
      id: 'abs-path',
      kind: 'path',
      label: '本地绝对路径（盘符）',
      // `[A-Za-z]:` 后必须跟 `\` 或**单个** `/`：排除 `https://` / `file://` 这类协议前缀
      re: new RegExp(String.raw`[A-Za-z]:(?:\\{1,2}|\/(?!\/))` + `${PATH_TAIL}+`, 'g'),
    },
    {
      id: 'unc-path',
      kind: 'unc',
      label: 'UNC / 网络路径',
      re: new RegExp(String.raw`\\{2,4}[A-Za-z0-9._$-]+\\{1,2}` + `${PATH_TAIL}+`, 'g'),
    },
    {
      id: 'unix-path',
      kind: 'unix',
      label: 'Unix 家目录路径',
      // 只保留 /home /Users /root —— 这三个含"谁的目录"的语义。
      // /usr /etc /var /opt /srv /mnt /media /tmp 是系统公共路径，不含个人信息，不再视为隐私。
      re: new RegExp(String.raw`(?<![\w.-])\/(?:home|Users|root)\/` + `${PATH_TAIL}+`, 'g'),
    },
    {
      id: 'vol-path',
      kind: 'path',
      label: '挂载卷 / 派生路径',
      // 这些前缀都是**本机特有**的：卷名由用户自定（`/Volumes/张三的备份`），
      // `/private` 是 macOS firmlink 根（ `/private/var/folders/<机器哈希>` 逐机不同），
      // `/nix/store/<hash>-<pkg>` 暴露本机包布局。它们与 `/usr` `/etc` 这类
      // **任何机器都一模一样**的系统公共路径不同，所以算隐私、要替换。
      // 组 1 = 卷名 / 挂载根之后的子路径（原样保留，与 user-path 的处理保持一致）。
      // `(?<![\w.-])`：避免把 `./private/x` 这种相对路径当成绝对路径改坏。
      re: new RegExp(
        String.raw`(?<![\w.-])\/(?:Volumes\/${VOL_SEG}+|System\/Volumes\/Data|private|nix\/store)`
          + String.raw`(?!${SEG_CHAR})((?:\/[^\s"'<>\\\/]+)*)`,
        'g',
      ),
      spanOf: (m) => m[0].slice(0, m[0].length - (m[1] || '').length),
      rebuild: (m, ph) => ph + (m[1] || ''),
    },
    {
      id: 'user-path',
      kind: 'userpath',
      label: '用户目录路径',
      // 组 1 = 用户目录之后的子路径（原样保留，迁移到新机最省事）
      re: new RegExp(
        String.raw`(?:[A-Za-z]:(?:\\{1,2}|\/(?!\/))Users(?:\\{1,2}|\/)|(?:${VOL_PREFIX})?\/(?:home|Users)\/)`
          + String.raw`[^\s"'<>\\/:]+((?:[\\/]{1,2}${PATH_TAIL}+)*)`,
        'g',
      ),
      spanOf: (m) => m[0].slice(0, m[0].length - (m[1] || '').length),
      rebuild: (m, ph) => ph + (m[1] || ''),
    },
    {
      id: 'credential',
      kind: 'credential',
      label: '疑似密钥 / Token 赋值',
      // 只替换**值**：key 名 / 冒号 / 引号原样保留，否则 `password: xxx` 会变成裸标量，YAML 结构就坏了
      re: /((?:api[_-]?key|apikey|access[_-]?key|secret|password|passwd|token|bearer|authorization|credential)[ \t]*[:=][ \t]*["']?)([A-Za-z0-9_\-./+=]{8,})(["']?)/gi,
      spanOf: (m) => String(m[2] ?? ''),
      rebuild: (m, ph) => `${m[1]}${ph}${m[3] || ''}`,
    },
    {
      id: 'key-shape',
      kind: 'key',
      label: '密钥形状（sk- / ghp_ / AKIA / JWT 等）',
      re: /(?:\bsk-[A-Za-z0-9_-]{16,}|\bghp_[A-Za-z0-9]{20,}|\bgithub_pat_[A-Za-z0-9_]{20,}|\bglpat-[A-Za-z0-9_-]{16,}|\bAKIA[0-9A-Z]{16}\b|\bxox[baprs]-[A-Za-z0-9-]{10,}|\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,})/g,
    },
    ...PERSONAL_RULES,
  ]
}

/**
 * 脱敏专用顺序：user-path 必须最优先，保证
 * `C:\Users\me\a\b` → `<用户目录>\a\b`（保留子路径、迁移到新机最省事），
 * 而不是被 abs-path 整段吞成 `<本机路径>`。与扫描顺序（abs-path 在前）刻意不同。
 */
export function sanitizeRules() {
  const rules = defaultRules()
  const idx = rules.findIndex((r) => r.id === 'user-path')
  if (idx <= 0) return rules
  const [user] = rules.splice(idx, 1)
  return [user, ...rules]
}

/** 对外暴露的只读快照（旧 __internals.PRIVACY_PATTERNS 的替代，保持可读） */
export const PRIVACY_PATTERNS = defaultRules()

/**
 * 部署者个人隐私规则注入（如个人昵称、本机用户名）。
 * 不硬编码进开源代码 —— 每个部署者自己的本地规则自己配。
 * @param {{id?:string,label?:string,re:RegExp|string}[]} list
 */
export function setPersonalPatterns(list) {
  PERSONAL_RULES = Array.isArray(list)
    ? list.map((p) => ({
        id: String(p.id || 'personal'),
        kind: 'personal',
        label: String(p.label || '个人敏感词'),
        re: p.re instanceof RegExp ? p.re : new RegExp(String(p.re)),
      }))
    : []
}

// ---------- 保护区：语义上不该被改写的区域 ----------

/** shebang 行：`#!/usr/bin/env node` 整行——改了脚本就执行不了 */
const SHEBANG_RE = /^#![^\n]*/gm
/** URL：`协议://...` 整段——既不是本机路径，改了链接也失效 */
const URL_RE = /\b[a-z][a-z0-9+.-]*:\/\/[^\s"'`<>|]+/gi

/**
 * 计算保护区间：命中落在这里的一律跳过（扫描不计、脱敏不改）。
 * @returns {{start:number,end:number,reason:string}[]}
 */
export function protectedRanges(text) {
  const out = []
  for (const [re, reason] of [[SHEBANG_RE, 'shebang 行'], [URL_RE, 'URL']]) {
    re.lastIndex = 0
    let m
    while ((m = re.exec(text)) !== null) {
      if (m[0] === '') { re.lastIndex++; continue }
      out.push({ start: m.index, end: m.index + m[0].length, reason })
    }
  }
  return out
}

/** 命中区间是否与任一保护区重叠 */
function inProtected(ranges, start, end) {
  for (const r of ranges) if (start < r.end && end > r.start) return r
  return null
}

// ---------- 单遍最左扫描：扫描与脱敏的共同内核 ----------

/**
 * 从左往右找「所有规则里最靠前的一个命中」，命中段整体消费掉再继续。
 *
 * 两个关键性质：
 *   ① 保留下来的子路径（userpath 的 group 1）不会被后续规则再扫一遍、误判成别的类型；
 *   ② 已插入的占位符永远不会被后面的规则二次处理；
 *   ③ 命中区间互不重叠 —— 因此计数天然去重（不再同一处被两条规则各计一次）。
 *
 * @param {string} text
 * @param {{start:number,end:number,reason:string}[]} ranges 保护区
 * @returns {{rule:object,m:RegExpExecArray,start:number,end:number,skipped:?{reason:string}}[]}
 */
export function collectHits(text, ranges = []) {
  const rules = sanitizeRules().map((rule) => {
    const flags = rule.re.flags.includes('g') ? rule.re.flags : `${rule.re.flags}g`
    return { ...rule, re: new RegExp(rule.re.source, flags) }
  })
  const hits = []
  let cursor = 0
  while (cursor < text.length) {
    let best = null
    for (const rule of rules) {
      rule.re.lastIndex = cursor
      const m = rule.re.exec(text)
      if (!m || m[0] === '') continue
      if (best === null || m.index < best.m.index) best = { rule, m }
    }
    if (!best) break
    const { rule, m } = best
    const start = m.index
    const end = start + m[0].length
    const guard = inProtected(ranges, start, end)
    if (guard) {
      hits.push({ rule, m, start, end, skipped: { reason: `位于${guard.reason}` } })
    } else {
      hits.push({ rule, m, start, end, skipped: null })
    }
    cursor = end
  }
  return hits
}

/** 命中总数（用于 UI 显示；命中已去重，不会虚高） */
export function countFindings(findings) {
  return findings.reduce((s, f) => s + (f.count || 1), 0)
}

export function formatFinding(f) {
  const line = f.line ? `:${f.line}` : ''
  const times = f.count > 1 ? `（本行 ${f.count} 处）` : ''
  return `${f.label} @ ${f.file}${line}${times}${f.sample ? `（${f.sample}）` : ''}`
}

// ---------- 扫描结果缓存（按内容指纹） ----------

/** 规则表指纹：规则集一变（注入/撤掉个人敏感词）缓存即整体失效 */
function rulesFingerprint(rules) {
  return rules.map((r) => `${r.id}|${r.re.source}|${r.re.flags}`).join('')
}

/**
 * 缓存键 = `rel` + 内容指纹。
 * **没有 sha256 就不进缓存** —— 拿 size/mtime 当弱校验器会在同一时间片内改写时漏报，
 * 隐私工具宁可多读一遍盘，也不冒"拿旧结论当新结论"的险。
 */
function scanCacheKey(f) {
  if (!f || typeof f.rel !== 'string') return null
  if (typeof f.sha256 !== 'string' || !/^[0-9a-f]{64}$/i.test(f.sha256)) return null
  return `${f.rel} ${f.sha256.toLowerCase()}`
}

const SCAN_CACHE = new Map()
let SCAN_CACHE_FP = ''
const SCAN_STATS = { hits: 0, misses: 0 }

function scanCacheTake(key) {
  const cached = SCAN_CACHE.get(key)
  if (!cached) return null
  // 读到后挪到末尾：Map 保持插入序，淘汰时删最老的一条（近似 LRU）
  SCAN_CACHE.delete(key)
  SCAN_CACHE.set(key, cached)
  return cached
}

function scanCachePut(key, findings) {
  while (SCAN_CACHE.size >= PRIVACY_SCAN_CACHE_MAX) {
    const oldest = SCAN_CACHE.keys().next().value
    if (oldest === undefined) break
    SCAN_CACHE.delete(oldest)
  }
  SCAN_CACHE.set(key, findings)
}

/** 清空扫描缓存（测试与「个人规则变更」场景用） */
export function clearPrivacyScanCache() {
  SCAN_CACHE.clear()
  SCAN_STATS.hits = 0
  SCAN_STATS.misses = 0
}

/** 缓存观测（测试断言复用次数 / 条数上限） */
export function privacyScanCacheStats() {
  return { entries: SCAN_CACHE.size, hits: SCAN_STATS.hits, misses: SCAN_STATS.misses }
}

/** 单文件扫描：读一次文本、每条规则独立整篇跑一遍 */
async function scanFile(f, rules) {
  const findings = []
  const probe = f.abs || f.rel
  if (!(await isTextFile(probe))) return findings
  const text = await readFileText(probe)
  if (!text) return findings
  // 行起始偏移：把命中位置映射回行号
  const lineStarts = [0]
  for (let i = 0; i < text.length; i++) if (text.charCodeAt(i) === 10) lineStarts.push(i + 1)
  const lineOf = (idx) => {
    let lo = 0
    let hi = lineStarts.length - 1
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1
      if (lineStarts[mid] <= idx) lo = mid
      else hi = mid - 1
    }
    return lo
  }
  // 每条规则独立整篇扫描后各自上报（允许重叠）：
  //   同一处 /home/alice 会同时被 user-path 与 unix-path 各报一次，
  //   因此计数如实反映「有几条规则命中」，UI 再按 kind 聚合。
  for (const rule of rules) {
    const re = rule.re.global ? rule.re : new RegExp(rule.re.source, `${rule.re.flags}g`)
    re.lastIndex = 0
    const perLine = new Map()
    let m
    while ((m = re.exec(text)) !== null) {
      if (m[0] === '') { re.lastIndex++; continue }
      const line = lineOf(m.index)
      const cur = perLine.get(line)
      if (cur) cur.count++
      else perLine.set(line, { count: 1, sample: String(m[0]).slice(0, 80) })
    }
    for (const [line, info] of perLine) {
      findings.push({
        file: f.rel,
        pattern: rule.id,
        kind: PATTERN_KIND[rule.id] || 'personal',
        label: rule.label || '个人敏感词',
        line: line + 1,
        count: info.count,
        sample: info.sample,
      })
    }
  }
  return findings
}

/**
 * 隐私扫描：文本文件按规则全量匹配，按「文件 + 规则 + 行」聚合计数。
 *
 * 与脱敏共用规则表（各自的处理口径不同，见文件头第 4 条），因此：
 *   - 保护区（shebang / URL）不计命中；
 *   - 命中区间去重，同一处路径不会被 abs-path 与 user-path 各算一次。
 *
 * 结果按「rel + sha256」缓存（见文件头第 5 条）。传 `{ cache: false }` 可强制重扫。
 * @param {{rel:string, abs?:string, sha256?:string}[]} files
 */
export async function privacyScan(files, opts = {}) {
  const rules = defaultRules()
  const fp = rulesFingerprint(rules)
  if (fp !== SCAN_CACHE_FP) {
    SCAN_CACHE.clear()
    SCAN_CACHE_FP = fp
  }
  const useCache = opts.cache !== false
  const list = Array.isArray(files) ? files : []
  // 逐文件结果先按下标存，最后按原顺序摊平 —— 命中缓存不会打乱 findings 的顺序
  const perFile = new Array(list.length)
  const todo = []
  for (let i = 0; i < list.length; i++) {
    const key = useCache ? scanCacheKey(list[i]) : null
    const cached = key ? scanCacheTake(key) : null
    if (cached) {
      SCAN_STATS.hits++
      perFile[i] = cached.map((f) => ({ ...f })) // 拷贝：调用方改 findings 不会污染缓存
      continue
    }
    if (key) SCAN_STATS.misses++
    todo.push({ index: i, key, file: list[i] })
  }
  for (const item of todo) {
    const found = await scanFile(item.file, rules)
    // 入缓存的是副本：调用方改自己那份 findings 不会反过来污染缓存
    if (item.key) scanCachePut(item.key, found.map((f) => ({ ...f })))
    perFile[item.index] = found
  }
  const findings = []
  for (const group of perFile) if (group) findings.push(...group)
  return findings
}

// ---------- 脱敏 ----------

/**
 * 对一段文本做脱敏（只改调用方手上的副本，源文件永不由本函数写入）。
 *
 * 兜底三层，任一不过就整文件回退原文：
 *   ① 保护区（shebang / URL）跳过；
 *   ② 逐片段结构字符检查 —— 命中段含 JSON/YAML 结构符就不替换；
 *   ③ JSON 真解析 + 行结构不变量（由 sanitizePackFile 执行）。
 *
 * @returns {{ text: string, redactions: number, skipped: {rel:string,line:number,reason:string}[] }}
 */
export function sanitizeText(text, rel = '') {
  let redactions = 0
  const skipped = []
  if (typeof text !== 'string' || !text) return { text, redactions, skipped }
  const ranges = protectedRanges(text)
  const hits = collectHits(text, ranges)

  let out = ''
  let cursor = 0
  let line = 1
  const countLines = (s) => (s.match(/\n/g) || []).length

  for (const hit of hits) {
    const gap = text.slice(cursor, hit.start)
    out += gap
    line += countLines(gap)
    if (hit.skipped) {
      skipped.push({ rel, line, reason: hit.skipped.reason })
      out += hit.m[0]
      line += countLines(hit.m[0])
      cursor = hit.end
      continue
    }
    const ph = KIND_PLACEHOLDER[hit.rule.kind] || KIND_PLACEHOLDER.personal
    const span = hit.rule.spanOf ? String(hit.rule.spanOf(hit.m) ?? '') : hit.m[0]
    const skip = (reason) => {
      skipped.push({ rel, line, reason })
      out += hit.m[0]
    }
    if (!span) {
      out += hit.m[0]
    } else if (/[\r\n]/.test(hit.m[0])) {
      skip('命中跨行')
    } else if (SANITIZE_UNSAFE_CHARS.test(span)) {
      skip('命中含语法结构字符')
    } else {
      out += hit.rule.rebuild ? hit.rule.rebuild(hit.m, ph) : ph
      redactions++
    }
    line += countLines(hit.m[0])
    cursor = hit.end
  }
  out += text.slice(cursor)
  return { text: out, redactions, skipped }
}

/**
 * 脱敏后的可解析性校验。
 * - `.json` / `.jsonl`：真跑 JSON.parse（Node 内置，零依赖）；
 * - 其它（YAML / JS / 文本）：Node 没有内置 YAML 解析器（不引依赖），
 *   由「逐片段不含结构字符」+ `sameLineShape` 行结构不变量共同保证语法骨架没动。
 * @returns {string|null} null = 通过；否则是失败原因
 */
export function validateSanitizedStructured(text, ext) {
  if (ext === '.json') {
    try {
      JSON.parse(text)
      return null
    } catch (err) {
      return `JSON.parse 失败：${String(err?.message || err)}`
    }
  }
  if (ext === '.jsonl' || ext === '.ndjson') {
    const lines = text.split(/\r?\n/)
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].trim()) continue
      try {
        JSON.parse(lines[i])
      } catch (err) {
        return `第 ${i + 1} 行 JSON.parse 失败：${String(err?.message || err)}`
      }
    }
  }
  return null
}

/** 行数 + 每行缩进必须完全不变（替换本身不含换行，这是最后一道保险） */
export function sameLineShape(a, b) {
  const la = a.split('\n')
  const lb = b.split('\n')
  if (la.length !== lb.length) return false
  for (let i = 0; i < la.length; i++) {
    if ((/^[ \t]*/.exec(la[i]) || [''])[0] !== (/^[ \t]*/.exec(lb[i]) || [''])[0]) return false
  }
  return true
}

/**
 * 打包期脱敏一个文件：读源 →（必要时）写**脱敏后的副本**到 dest；源文件绝不写。
 * @returns {{ redactions: number, warnings: string[] }}
 */
export async function sanitizePackFile(src, dest, rel) {
  const buf = await fsp.readFile(src)
  // 非 UTF-8 文本（例如 GBK 的 .txt）：读成再写回会毁内容 → 不脱敏，如实告警
  if (!Buffer.from(buf.toString('utf-8'), 'utf-8').equals(buf)) {
    await fsp.writeFile(dest, buf)
    return { redactions: 0, warnings: [`已跳过脱敏（不是合法 UTF-8 文本）：${rel}`] }
  }
  const original = buf.toString('utf-8')
  if (!original) {
    await fsp.writeFile(dest, buf)
    return { redactions: 0, warnings: [] }
  }
  const { text, redactions, skipped } = sanitizeText(original, rel)
  const warnings = skipped.map((s) => `已跳过 1 处脱敏（${s.reason}）：${s.rel}:${s.line}`)
  if (redactions === 0) {
    await fsp.writeFile(dest, buf) // 没改动就按原字节写，不做无谓的编码往返
    return { redactions: 0, warnings }
  }
  const ext = path.extname(rel).toLowerCase()
  const reason = validateSanitizedStructured(text, ext)
  if (reason || !sameLineShape(original, text)) {
    await fsp.writeFile(dest, buf) // 回退：包内保留原文
    warnings.push(`脱敏后校验失败，已回退原文：${rel}（${reason || '行结构变化'}）`)
    return { redactions: 0, warnings }
  }
  await fsp.writeFile(dest, text, 'utf-8')
  return { redactions, warnings }
}

// ---------- 恢复期回填 ----------

/**
 * 反向回填：`<用户目录>` → 目标机 `os.homedir()`、`<用户名>` → 当前用户名。
 * 其余占位符**保留原样**（目标机上的信息无从得知，只能留给用户手工重填）。
 * @returns {{ text: string, backfilled: number }}
 */
export function backfillText(text, home = os.homedir(), username = currentUsername()) {
  if (typeof text !== 'string' || !text) return { text, backfilled: 0 }
  const parts = text.split(PLACEHOLDER_HOME)
  const homeHits = parts.length - 1
  let out = parts.join(home)
  const userParts = out.split(PLACEHOLDER_USER)
  const userHits = userParts.length - 1
  if (userHits) out = userParts.join(username)
  return { text: out, backfilled: homeHits + userHits }
}

/** 文本里还剩多少处「无法自动回填」的占位符（按固定词表统计） */
export function retainedPlaceholderCounts(text) {
  const counts = new Map()
  if (typeof text !== 'string' || !text) return counts
  for (const ph of RETAINED_PLACEHOLDERS) {
    const n = text.split(ph).length - 1
    if (n > 0) counts.set(ph, n)
  }
  return counts
}

export { PRIVACY_KINDS }
