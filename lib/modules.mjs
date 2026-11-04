// ============================================================================
// modules.mjs —— 打包模块定义与文件收集
//
// 模块 = 「逻辑名 → 本机路径 + 收集规则」。恢复时按同一逻辑名映射回当前机器的路径，
// 因此跨机器、跨平台迁移时 rel 保持不变，只有根路径重新解析。
// ============================================================================
import fsp from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'

import {
  DSH_HOME,
  MEMORY_ROOT,
  BIOMEMORY_DB,
  NEVER_PACK,
  DB_FILE_RE,
  IO_CONCURRENCY,
  PACKAGE_SKIP_NAMES,
} from './constants.mjs'
import { exists, fileSize, mapLimit, assertSafeRel, pathContained } from './util.mjs'
import { logger } from './logger.mjs'

export const MODULES = {
  skills: {
    label: 'Skills（含记忆机制 skill）',
    kind: 'dir',
    resolve: () => path.join(DSH_HOME, 'skills'),
    default: true,
    share: true,
    exclude: ['_shared'], // 分享时排除的本地子目录（个人 skill）
  },
  sessions: {
    label: '会话记录',
    kind: 'dir',
    resolve: () => path.join(DSH_HOME, 'sessions'),
    default: true,
    share: false,
  },
  attachments: {
    // 会话里的图片/文件**不在** sessions 日志里 —— 日志只存
    // `{"type":"image","attachment":{"attachmentId":"sha256:<64hex>"}}` 这样的引用，
    // 字节在 <DSH_HOME>/attachments/v1/objects/<前2位>/<sha256>（内容寻址、去重、只增不删）。
    // 只备份 sessions = 换机器恢复后图全裂，所以本模块补上对象库本身。
    // 对象名就是内容哈希，目标机不需要改写会话日志里的任何引用。
    label: '会话附件对象库（图片 / 文件；内容寻址，不含可重建的请求图片缓存）',
    kind: 'dir',
    resolve: () => path.join(DSH_HOME, 'attachments'),
    default: true,
    share: false,
    skipDirs: ['tmp'],
  },
  profiles: {
    label: 'Profile 配置（不含 node_modules）',
    kind: 'dir',
    resolve: () => path.join(DSH_HOME, 'profiles'),
    default: true,
    share: false,
    skipDirs: ['node_modules', 'node_modules/.pnpm'],
  },
  settings: {
    label: '全局设置（settings.yaml）',
    kind: 'file',
    resolve: () => path.join(DSH_HOME, 'settings.yaml'),
    default: true,
    share: false,
  },
  presets: {
    label: 'Agent 预设',
    kind: 'dir',
    resolve: () => path.join(DSH_HOME, '.agent-presets'),
    default: true,
    share: false,
  },
  memory: {
    // 本模块打包的是**记忆的 Markdown 只读镜像**；运行时事实源是 memoryDb 模块。
    label: '记忆镜像（Markdown 只读副本）',
    kind: 'dir',
    resolve: () => MEMORY_ROOT,
    default: true,
    share: false,
    skipDirs: ['backups'],
    skipFiles: DB_FILE_RE,
  },
  memoryDb: {
    // 记忆的运行时事实源（SQLite 真库），用 VACUUM INTO 取一致快照：
    // 只读连接、不碰运行中的 WAL；取不到就跳过并如实上报，绝不复制可能半写的库。
    label: '记忆真库（SQLite 一致快照：VACUUM INTO）',
    kind: 'file',
    resolve: () => BIOMEMORY_DB,
    default: true,
    share: false,
    snapshot: true,
  },
  plugins: {
    // 迁移的第一用途是换机器，光带 profiles 的配置文本不够 ——
    // 已安装插件本体在 profiles/<profile>/node_modules 里，不带过去新机器就是空壳。
    // 注意：node_modules 里的原生二进制是平台专属的，跨平台迁移见 restore 的平台提示。
    label: '已安装插件本体（profiles/<profile>/node_modules 一级包；体积大）',
    kind: 'dir',
    resolve: () => path.join(DSH_HOME, 'profiles'),
    default: true,
    share: false,
    packageDirs: true,
  },
}

/** 按模式取模块预设（迁移 = default，分享 = share） */
export function defaultModulesFor(mode = 'migrate') {
  const flag = mode === 'share' ? 'share' : 'default'
  return Object.keys(MODULES).filter((m) => MODULES[m][flag])
}

// ---------- SQLite 一致快照 ----------

/** 本次作用域内已生成的快照：src -> { path, dir } | null（null = 已失败，不再重试） */
const SNAPSHOT_CACHE = new Map()
/** 快照失败原因（并入 unreadable 如实上报） */
const SNAPSHOT_WARNINGS = []

/**
 * 取 SQLite 一致快照；失败返回 null 并记录原因（不抛错，不复制运行中的库）。
 * @param {string} src 源库路径
 */
export async function snapshotSqlite(src) {
  if (SNAPSHOT_CACHE.has(src)) return SNAPSHOT_CACHE.get(src)
  try {
    const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'dsh-pack-snap-'))
    const out = path.join(dir, path.basename(src))
    const { DatabaseSync } = await import('node:sqlite')
    const db = new DatabaseSync(src, { readOnly: true })
    try {
      db.exec(`VACUUM INTO '${out.replace(/'/g, "''")}'`)
    } finally {
      db.close()
    }
    const rec = { path: out, dir }
    SNAPSHOT_CACHE.set(src, rec)
    return rec
  } catch (err) {
    SNAPSHOT_WARNINGS.push({ src, error: String(err?.message || err) })
    SNAPSHOT_CACHE.set(src, null)
    return null
  }
}

/** 清理快照目录（失败不影响结果） */
export async function cleanupSnapshots() {
  for (const rec of SNAPSHOT_CACHE.values()) {
    if (!rec) continue
    try {
      await fsp.rm(rec.dir, { recursive: true, force: true })
    } catch {
      /* 忽略 */
    }
  }
  SNAPSHOT_CACHE.clear()
}

/**
 * **快照作用域包裹器**。
 *
 * 凡是「可能走到 snapshotSqlite」的入口（打包、预览、隐私扫描）都必须走它，
 * 否则 VACUUM INTO 落在系统临时目录里的快照永远不会回收 —— 这正是旧实现
 * 修了 /status 却漏了 /scan 的原因。把清理收敛到一处，入口就不可能再漏。
 * @template T
 * @param {() => Promise<T>} fn
 * @returns {Promise<T>}
 */
export async function withSnapshots(fn) {
  SNAPSHOT_WARNINGS.length = 0
  try {
    return await fn()
  } finally {
    await cleanupSnapshots()
  }
}

/** 取走并清空快照失败原因 */
export function drainSnapshotWarnings() {
  const out = SNAPSHOT_WARNINGS.slice()
  SNAPSHOT_WARNINGS.length = 0
  return out
}

/** 当前作用域内的快照缓存条数（测试断言「某接口不得产生快照」用） */
export function snapshotCacheSize() {
  return SNAPSHOT_CACHE.size
}

// ---------- 文件收集 ----------

/**
 * 收集 `profiles/<profile>/node_modules` 的**一级包目录**。
 * - `@scope/pkg` 取两级；
 * - 排除 `.pnpm` / `.bin` / `.modules.yaml` / `.cache` 与其它隐藏项；
 * - 判目录用 `stat` 而不是 dirent 类型：pnpm 的顶层包目录通常是符号链接 / junction，
 *   必须跟进去，否则会出现「装了插件、包里一个文件都没有」；每次跟链用 realpath 记录，防成环。
 */
export async function collectPackageDirs(root) {
  const out = []
  let profiles = []
  try {
    profiles = await fsp.readdir(root, { withFileTypes: true })
  } catch (err) {
    if (err?.code === 'ENOENT') return out // profiles 目录还没建：空结果不是错误
    throw new Error(`读取 profiles 目录失败：${String(err?.message || err)}`)
  }
  const walkTree = async (startDir, startRel) => {
    const visited = new Set()
    const walk = async (dir, rel) => {
      let real
      try {
        real = await fsp.realpath(dir)
      } catch {
        return // 悬空 junction：跳过这一支，不阻断整包
      }
      if (visited.has(real)) return
      visited.add(real)
      let entries = []
      try {
        entries = await fsp.readdir(dir, { withFileTypes: true })
      } catch {
        return
      }
      for (const e of entries) {
        if (NEVER_PACK.includes(e.name)) continue
        const full = path.join(dir, e.name)
        const relPath = rel ? `${rel}/${e.name}` : e.name
        let st
        try {
          st = await fsp.stat(full) // 跟随链接（pnpm 的包目录本身就是链接）
        } catch {
          continue
        }
        if (st.isDirectory()) await walk(full, relPath)
        else if (st.isFile()) out.push({ rel: relPath, abs: full })
      }
    }
    await walk(startDir, startRel)
  }
  for (const profile of profiles) {
    if (!profile.isDirectory()) continue
    const nm = path.join(root, profile.name, 'node_modules')
    let entries = []
    try {
      entries = await fsp.readdir(nm, { withFileTypes: true })
    } catch (err) {
      if (err?.code === 'ENOENT' || err?.code === 'ENOTDIR') continue // 该 profile 没装插件
      throw new Error(`读取 ${nm} 失败：${String(err?.message || err)}`)
    }
    for (const e of entries) {
      if (e.name.startsWith('.') || PACKAGE_SKIP_NAMES.has(e.name)) continue
      const full = path.join(nm, e.name)
      const relBase = `${profile.name}/node_modules/${e.name}`
      let st
      try {
        st = await fsp.stat(full)
      } catch {
        continue
      }
      if (!st.isDirectory()) continue // 一级普通文件（.package-lock.json 之类）不收
      if (e.name.startsWith('@')) {
        let scoped = []
        try {
          scoped = await fsp.readdir(full, { withFileTypes: true })
        } catch {
          continue
        }
        for (const s of scoped) {
          if (s.name.startsWith('.')) continue
          const sFull = path.join(full, s.name)
          let sSt
          try {
            sSt = await fsp.stat(sFull)
          } catch {
            continue
          }
          if (!sSt.isDirectory()) continue
          await walkTree(sFull, `${relBase}/${s.name}`)
        }
      } else {
        await walkTree(full, relBase)
      }
    }
  }
  return out
}

/**
 * 收集一个模块的文件。
 * @param {object} mod MODULES 中的一项
 * @param {boolean} [excludeSharePersonal] 分享模式排除个人子目录
 */
export async function collectModuleFiles(mod, excludeSharePersonal = false) {
  const root = mod.resolve()
  const files = []
  if (mod.packageDirs) return collectPackageDirs(root)
  if (mod.kind === 'file') {
    if (!(await exists(root)) || NEVER_PACK.includes(path.basename(root))) return files
    if (mod.snapshot) {
      const snap = await snapshotSqlite(root)
      if (!snap) return files // 快照失败 → 不打包（原因由 drainSnapshotWarnings 上报）
      files.push({ rel: path.basename(root), abs: snap.path })
      return files
    }
    files.push({ rel: path.basename(root), abs: root })
    return files
  }
  if (!(await exists(root))) return files
  const skipDirs = new Set(mod.skipDirs || [])
  const walk = async (dir, rel) => {
    let entries = []
    try {
      entries = await fsp.readdir(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const e of entries) {
      if (e.name === 'node_modules' || skipDirs.has(e.name)) continue
      if (NEVER_PACK.includes(e.name)) continue
      const full = path.join(dir, e.name)
      const relPath = rel ? `${rel}/${e.name}` : e.name
      if (e.isDirectory()) {
        if (excludeSharePersonal && mod.exclude?.includes(e.name)) continue
        await walk(full, relPath)
      } else if (e.isFile()) {
        if (mod.skipFiles && mod.skipFiles.test(e.name)) continue
        files.push({ rel: relPath, abs: full })
      }
    }
  }
  await walk(root, '')
  return files
}

/**
 * 统计模块大小（/status 用）。
 *
 * 关键约束：file 类模块（含 memoryDb）**只 stat**，绝不触发 VACUUM INTO。
 * /status 是「一打开设置页就调」的高频接口，走快照会在系统临时目录里留下永不清理的副本。
 */
export async function moduleStats(mod) {
  const root = mod.resolve()
  if (mod.kind === 'file') {
    try {
      const st = await fsp.stat(root)
      return { count: st.isFile() ? 1 : 0, bytes: st.isFile() ? st.size : 0 }
    } catch (err) {
      if (err?.code !== 'ENOENT') {
        logger.warn('模块 stat 失败', { module: mod.label, error: String(err?.message || err) })
      }
      return { count: 0, bytes: 0 }
    }
  }
  const files = await collectModuleFiles(mod)
  const sizes = await mapLimit(files, IO_CONCURRENCY, (f) => fileSize(f.abs))
  return { count: files.length, bytes: sizes.reduce((s, n) => s + n, 0) }
}

/**
 * 目标路径：先做 rel 白名单校验，再校验解析结果必须落在模块目标根内。
 * file 类型模块：resolve() 即文件全路径；dir 类型：resolve() + rel。
 */
export function resolveTarget(mod, rel) {
  assertSafeRel(rel)
  const root = path.resolve(mod.resolve())
  const target = mod.kind === 'file' ? root : path.resolve(root, rel)
  const base = mod.kind === 'file' ? path.dirname(root) : root
  if (!pathContained(base, target)) {
    throw new Error(`目标路径越界（不在模块目标根内）: ${rel}，已拒绝恢复（fail-closed）`)
  }
  return target
}

/** 目标路径是否落在「某个模块的目标根」内（journal 回滚用，防伪造 journal 写到任意路径） */
export function isAllowedModuleTarget(target) {
  const abs = path.resolve(String(target || ''))
  for (const mod of Object.values(MODULES)) {
    const root = path.resolve(mod.resolve())
    if (mod.kind === 'file') {
      if (abs === root) return true
    } else if (pathContained(root, abs)) {
      return true
    }
  }
  return false
}
