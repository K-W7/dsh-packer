// ============================================================================
// api.mjs —— /packer/api/* 的防护器与路由处理器
//
// 判定顺序（前三步都在**读取请求体之前**完成）：
//   1. 速率限制（最外层，按客户端地址滑动窗口；未授权流量同样吃配额）
//   2. 鉴权（默认 fail-closed）
//   3. 请求体上限（有 Content-Length 先比对，超限 413 且一个字节都不读）
//   4. 路由
//
// 鉴权三种模式：
//   - 'auto'（默认）：只认官方 ctx.connection.requestRejection（与官方 /api 同一套判定）。
//     服务缺失 / 接口缺失 / 抛错一律 403，**绝不静默降级**到更弱的通道。
//   - 'token'：显式 opt-in 的回退（同源校验 + 一次性令牌，经 tapIndex 注入同源页面）。
//   - 'off'：仅供隔离测试，真实部署别开。
//
// 出网脱敏：响应整棵树递归脱敏（v0.7.0）。旧实现只 redact 了顶层 error，
// 而 stats.backupDir / failures[].target 等同样是服务端绝对路径，会原样回到浏览器。
// ============================================================================
import crypto from 'node:crypto'
import fsp from 'node:fs/promises'

import {
  DEFAULT_MAX_BODY_BYTES,
  DEFAULT_RATE_LIMIT,
  DEFAULT_RATE_WINDOW_MS,
  MAX_RATE_KEYS,
  TOKEN_HEADER,
  TOKEN_GLOBAL,
  SCHEMA_VERSION,
  PACKS_DIR,
  SENSITIVE_MODULES,
  RESTORE_STRATEGIES,
} from './constants.mjs'
import { ApiError, apiError, ERROR_CODES } from './errors.mjs'
import {
  safeEqual, deepRedact, platformTag, hasSystemTrash, hasSystemFilePicker, fileSize,
} from './util.mjs'
import { logger } from './logger.mjs'
import {
  MODULES, defaultModulesFor, moduleStats, collectModuleFiles, withSnapshots,
} from './modules.mjs'
import { privacyScan } from './privacy.mjs'
import {
  createPack, listPacks, getPackInfo, renamePack, deletePack, packsDiskUsage,
} from './pack.mjs'
import { importRestore, applyRestore, listRestoreBackups, rollbackRestoreBackup } from './restore.mjs'
import { startCreateJob, startRestoreJob, getJob, listJobs, cancelJob, jobView } from './jobs.mjs'
import { isBadPasswordError, MIN_PASSWORD_LENGTH } from '../crypto.mjs'

/**
 * 允许原样出网的字段。
 *
 * 这些是**设计上必须出网**的字段，脱敏它们会直接弄坏功能，而不是提升安全：
 *   - packsDir / path：包目录与新打包的落点（前端要按它定位，且可由 packsDir + name 反推）；
 *   - backupDir / dir：一键撤回必须由客户端把备份目录回传给 /restore/rollback，
 *     前端展示时另有 maskHome() 遮蔽（client.js）；
 *   - target：完整性校验失败项所指的目标文件，前端要列出是哪一项。
 *
 * 出网脱敏真正要堵的是**顺带夹带**的绝对路径：error / message 等文案里
 * 由异常栈抛出的本机目录结构——这些没有功能价值，一律替换。
 */
const OUTBOUND_PATH_FIELDS = ['packsDir', 'path', 'backupDir', 'dir', 'target']

/**
 * 预览（dryRun）最多回传多少条文件明细。
 *
 * 实测满量迁移有 17469 个文件，整份 manifest 约 3.5 MB；一次性塞回浏览器时，
 * 宿主桥/浏览器 socket 在这 4 MB 响应上会断（UI 报 `network · Failed to fetch`，
 * 而服务端其实已经把结果算完了）。预览面板本来就只渲染前 200 条，所以这里截断 +
 * 回传 filesTotal，功能不受影响。
 */
const PREVIEW_FILE_LIMIT = 1000

function positiveIntOr(value, fallback) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback
}

/** 客户端标识：IPv4-mapped IPv6 归一化，取不到就用 unknown（不会因此放大配额） */
function clientKey(req) {
  const raw = req.socket?.remoteAddress || req.connection?.remoteAddress || ''
  const addr = String(raw).replace(/^::ffff:/i, '')
  return addr || 'unknown'
}

/**
 * 构造防护器（纯函数、可脱离 HTTP 服务器测试）。
 * @param {object} [options] maxBodyBytes / rateLimit / rateWindowMs / token / authMode
 */
export function createPackApiGuard(options = {}) {
  const maxBodyBytes = positiveIntOr(options.maxBodyBytes, DEFAULT_MAX_BODY_BYTES)
  const rateLimit = positiveIntOr(options.rateLimit, DEFAULT_RATE_LIMIT)
  const rateWindowMs = positiveIntOr(options.rateWindowMs, DEFAULT_RATE_WINDOW_MS)
  const authMode = options.authMode === 'token' ? 'token' : options.authMode === 'off' ? 'off' : 'auto'
  const token = typeof options.token === 'string' && options.token.length >= 16
    ? options.token
    : crypto.randomBytes(24).toString('base64url')

  /** key → 窗口内命中时间戳（升序） */
  const windows = new Map()

  /** 清掉窗口内已无命中的键：无定时器，靠请求驱动，内存不会无限增长 */
  const prune = (now) => {
    for (const [key, stamps] of windows) {
      const live = stamps.filter((t) => now - t < rateWindowMs)
      if (live.length) windows.set(key, live)
      else windows.delete(key)
    }
  }

  /** 消费一次配额；拒绝时给出建议重试毫秒数 */
  const consume = (key) => {
    const now = Date.now()
    if (!windows.has(key) && windows.size >= MAX_RATE_KEYS) {
      prune(now)
      // 仍然超限：按插入顺序淘汰最旧键，键数量恒有上界
      while (!windows.has(key) && windows.size >= MAX_RATE_KEYS) {
        const oldest = windows.keys().next()
        if (oldest.done) break
        windows.delete(oldest.value)
      }
    }
    const stamps = (windows.get(key) || []).filter((t) => now - t < rateWindowMs)
    if (stamps.length >= rateLimit) {
      windows.set(key, stamps)
      return { ok: false, retryAfterMs: Math.max(1, rateWindowMs - (now - stamps[0])), limit: rateLimit }
    }
    stamps.push(now)
    windows.set(key, stamps)
    return { ok: true, remaining: rateLimit - stamps.length }
  }

  /** Host / Origin / Sec-Fetch-Site 同源校验（回退模式的外层防线） */
  const sameOriginRejection = (req) => {
    const headers = req.headers ?? {}
    const host = headers.host
    if (typeof host !== 'string' || !host) {
      return apiError('forbidden', '缺少 Host 头，无法确认请求来源（403）')
    }
    if (headers['sec-fetch-site'] === 'cross-site') {
      return apiError('forbidden', '跨站请求已被拒绝（Sec-Fetch-Site: cross-site，403）')
    }
    const origin = headers.origin
    if (origin === undefined) return null // 无 Origin：交给一次性令牌判定
    try {
      return new URL(origin).host === new URL(`http://${host}`).host
        ? null
        : apiError('forbidden', '请求 Origin 与本机不一致，已拒绝（403）')
    } catch {
      return apiError('forbidden', 'Origin 头无法解析，已拒绝（403）')
    }
  }

  /** 回退模式：同源校验 + 一次性令牌 */
  const tokenRejection = (req) => {
    const provided = req.headers?.[TOKEN_HEADER]
    if (typeof provided === 'string' && provided && safeEqual(provided, token)) return null
    return apiError('unauthorized',
      `未通过 DSH 会话鉴权（401）：请从 DSH 设置页内访问该接口（需要 ${TOKEN_HEADER}）`)
  }

  /**
   * 鉴权：返回 null 表示放行，否则返回 ApiError。
   * @param {object} req node:http 请求（只读 headers）
   * @param {object} [connection] 宿主 ctx.connection（可选服务）
   */
  const authorize = (req, connection) => {
    if (authMode === 'off') return null
    if (authMode === 'token') return sameOriginRejection(req) || tokenRejection(req)
    // 默认 'auto'：只认官方机制。拿不到鉴权服务 = 无法判定 = 拒绝（fail-closed）
    if (!connection || typeof connection.requestRejection !== 'function') {
      return apiError('forbidden',
        '宿主未提供可用的鉴权服务（connection.requestRejection 缺失），按 fail-closed 拒绝（403）。'
        + '若该宿主确实没有 connection 服务，请显式设置 api.authMode = "token" 后再访问')
    }
    let rejection
    try {
      rejection = connection.requestRejection({ headers: req.headers ?? {} })
    } catch {
      return apiError('forbidden', '宿主鉴权层调用失败，按 fail-closed 拒绝（403）')
    }
    if (rejection === 401) {
      return apiError('unauthorized', '未通过 DSH 会话鉴权（401）：请从 `dsh web` 打印的地址重新打开页面')
    }
    if (rejection === 403) {
      return apiError('forbidden', '请求来源不被信任（Host/Origin 非本机回环地址，403）')
    }
    if (rejection !== undefined) {
      return apiError('forbidden', `请求被宿主鉴权层拒绝（${rejection}）`)
    }
    return null
  }

  /** 读取请求体（仅 POST/DELETE 等有体的请求调用） */
  const readBody = (req) => new Promise((resolve, reject) => {
    const declared = Number(req.headers?.['content-length'])
    if (Number.isFinite(declared) && declared > maxBodyBytes) {
      reject(apiError('payload_too_large',
        `请求体 ${declared} 字节超过上限 ${maxBodyBytes} 字节（413），未读取任何字节`))
      return
    }
    const chunks = []
    let total = 0
    let settled = false
    const finish = (err, value) => {
      if (settled) return
      settled = true
      req.off?.('data', onData)
      req.off?.('end', onEnd)
      req.off?.('error', onError)
      if (err) reject(err)
      else resolve(value)
    }
    const onData = (chunk) => {
      total += chunk.length
      if (total > maxBodyBytes) {
        chunks.length = 0 // 立即丢弃已缓冲内容，不把超限请求留在内存里
        req.pause?.()
        finish(apiError('payload_too_large',
          `请求体超过上限 ${maxBodyBytes} 字节（已读 ${total} 字节，413），读取已中断`))
        return
      }
      chunks.push(chunk)
    }
    const onEnd = () => finish(null, Buffer.concat(chunks).toString('utf-8'))
    const onError = (err) => finish(err)
    req.on('data', onData)
    req.on('end', onEnd)
    req.on('error', onError)
  })

  /** 把一次性令牌注入 index.html（仅回退模式需要；幂等） */
  const injectToken = (html) => {
    if (typeof html !== 'string' || html.includes(TOKEN_GLOBAL)) return html
    const script = `<script>globalThis.${TOKEN_GLOBAL}=${JSON.stringify(token)}</script>`
    const open = /<head(?:\s[^>]*)?>/i.exec(html)
    if (!open) return script + html
    const at = open.index + open[0].length
    return `${html.slice(0, at)}${script}${html.slice(at)}`
  }

  return {
    maxBodyBytes,
    rateLimit,
    rateWindowMs,
    authMode,
    token,
    headerName: TOKEN_HEADER,
    authorize,
    consume,
    readBody,
    injectToken,
    /** 测试 / 诊断用：当前被跟踪的客户端键数量 */
    trackedKeys: () => windows.size,
  }
}

/** 请求体里的必填字符串参数（缺 / 空 → 400 bad_request） */
export function requireStringParam(value, field) {
  if (typeof value !== 'string' || !value.trim()) {
    throw apiError('bad_request', `${field} 必须是非空字符串`)
  }
  return value
}

/** modules 参数：非空数组 + 每个都是已知模块（未知模块 400 bad_modules） */
export function normalizeModulesStrict(value) {
  if (!Array.isArray(value) || !value.length) {
    throw apiError('bad_modules', 'modules 必须是非空数组（至少选择一个模块）')
  }
  const out = []
  for (const raw of value) {
    if (typeof raw !== 'string' || !raw) throw apiError('bad_modules', 'modules 只能包含模块名字符串')
    if (!MODULES[raw]) throw apiError('bad_modules', `未知模块: ${raw}`)
    if (!out.includes(raw)) out.push(raw)
  }
  return out
}

/**
 * 构造 /packer/api/* 处理器。
 * @param {object} deps guard / getConnection / recycleFn
 */
export function createPackApiHandler({ guard, getConnection, recycleFn } = {}) {
  const g = guard || createPackApiGuard()
  return async function packApiHandler(req, res) {
    /** 请求是否还带着没读完的体：拒绝它时要断开连接，绝不为它继续缓冲 */
    const bodyPending = () => {
      const len = Number(req.headers?.['content-length'])
      return (Number.isFinite(len) && len > 0) || req.headers?.['transfer-encoding'] !== undefined
    }
    const send = (code, body) => {
      if (res.headersSent) { res.end(); return }
      res.statusCode = code
      res.setHeader('content-type', 'application/json; charset=utf-8')
      res.setHeader('cache-control', 'no-store')
      // 出网前对**整棵响应树**脱敏（旧实现只处理了顶层 error，漏掉 backupDir / failures 等）
      const payload = body === undefined || body === null
        ? body
        : deepRedact(body, OUTBOUND_PATH_FIELDS)
      if (code >= 400 && bodyPending()) {
        res.setHeader('connection', 'close')
        // 响应写完再断开，避免未读完的请求体把 socket 挂住
        res.once('finish', () => { try { req.destroy?.() } catch { /* ignore */ } })
      }
      res.end(JSON.stringify(payload))
    }
    const parseBody = async () => {
      const raw = await g.readBody(req)
      if (!raw.trim()) return {}
      try {
        return JSON.parse(raw)
      } catch {
        throw apiError('bad_request', '请求体不是合法 JSON（400）')
      }
    }
    try {
      const url = new URL(req.url ?? '/', 'https://dsh.invalid')
      const p = url.pathname.replace(/^\/packer\/api/, '') || '/'

      // 1) 速率限制（最外层）
      const rate = g.consume(clientKey(req))
      if (!rate.ok) {
        const seconds = Math.max(1, Math.ceil(rate.retryAfterMs / 1000))
        res.setHeader('retry-after', String(seconds))
        return send(ERROR_CODES.rate_limited, {
          ok: false,
          code: 'rate_limited',
          error: `请求过于频繁（429）：上限 ${g.rateLimit} 次/${Math.round(g.rateWindowMs / 1000)} 秒，请 ${seconds} 秒后重试`,
          retryAfterSeconds: seconds,
        })
      }

      // 2) 鉴权（默认 fail-closed）
      const connection = typeof getConnection === 'function' ? getConnection() : undefined
      const rejection = g.authorize(req, connection)
      if (rejection) return send(rejection.status, { ok: false, code: rejection.code, error: rejection.message })

      // ---------------- 状态 ----------------
      if (req.method === 'GET' && p === '/status') {
        const moduleInfo = {}
        for (const [key, mod] of Object.entries(MODULES)) {
          const st = await moduleStats(mod)
          moduleInfo[key] = {
            label: mod.label, kind: mod.kind, default: mod.default, share: mod.share,
            count: st.count, bytes: st.bytes,
          }
        }
        return send(200, {
          ok: true,
          modules: moduleInfo,
          packs: await listPacks(),
          packsDir: PACKS_DIR,
          schemaVersion: SCHEMA_VERSION,
          disk: await packsDiskUsage(),
          platform: platformTag(),
          trash: hasSystemTrash(),
          filePicker: hasSystemFilePicker(),
        })
      }

      // ---------------- 隐私扫描 ----------------
      // withSnapshots：扫描会走到 memoryDb（SQLite 快照），必须包起来，否则临时副本永不回收
      if (req.method === 'POST' && p === '/scan') {
        const body = await parseBody()
        const mode = body.mode === undefined ? 'migrate' : body.mode
        if (mode !== 'migrate' && mode !== 'share') throw apiError('bad_mode', "mode 只能是 'migrate' 或 'share'")
        const share = mode === 'share'
        const modules = body.modules === undefined ? defaultModulesFor(mode) : normalizeModulesStrict(body.modules)
        const scanned = await withSnapshots(async () => {
          const out = []
          for (const m of modules) {
            for (const f of await collectModuleFiles(MODULES[m], share)) {
              out.push({ module: m, rel: f.rel, abs: f.abs, size: await fileSize(f.abs) })
            }
          }
          return out
        })
        const findings = await privacyScan(scanned)
        // 出网不带 abs：不把本机绝对路径回给浏览器
        const files = scanned.map(({ module, rel, size }) => ({ module, rel, size }))
        return send(200, { ok: true, files, privacy: findings, share })
      }

      // ---------------- 打包 ----------------
      if (req.method === 'POST' && p === '/create') {
        const body = await parseBody()
        if (body.mode !== 'migrate' && body.mode !== 'share') {
          throw apiError('bad_mode', "mode 只能是 'migrate' 或 'share'")
        }
        const mode = body.mode
        const modules = normalizeModulesStrict(body.modules)
        // 分享模式服务端强制拦截（不能只靠 UI 置灰）
        if (mode === 'share') {
          const blocked = modules.filter((m) => SENSITIVE_MODULES.includes(m))
          if (blocked.length) {
            throw apiError('share_scope',
              `分享模式不允许包含敏感模块：${blocked.join(', ')}（会话/凭据/机器配置不可安全分享，请改用迁移模式）`)
          }
        }
        const encrypt = body.encrypt === true
        if (encrypt && (typeof body.password !== 'string' || body.password.length < MIN_PASSWORD_LENGTH)) {
          throw apiError('weak_password', `加密密码至少 ${MIN_PASSWORD_LENGTH} 位`)
        }
        const opts = {
          modules,
          mode,
          note: typeof body.note === 'string' ? body.note : '',
          encrypt,
          password: encrypt ? body.password : '',
          sanitize: body.sanitize === true,
        }
        if (body.dryRun === true) {
          const r = await createPack({ ...opts, dryRun: true })
          const files = Array.isArray(r.manifest?.files) ? r.manifest.files : []
          return send(200, {
            ok: true,
            ...r,
            manifest: { ...(r.manifest || {}), files: files.slice(0, PREVIEW_FILE_LIMIT) },
            filesTotal: files.length,
            filesTruncated: files.length > PREVIEW_FILE_LIMIT,
          })
        }
        return send(200, { ok: true, jobId: startCreateJob(opts).id })
      }

      // ---------------- 异步作业 ----------------
      if (req.method === 'GET' && p === '/jobs') return send(200, { ok: true, jobs: listJobs() })
      if (req.method === 'POST' && p.startsWith('/jobs/') && p.endsWith('/cancel')) {
        const id = decodeURIComponent(p.slice('/jobs/'.length, -'/cancel'.length))
        return send(200, cancelJob(id))
      }
      if (req.method === 'GET' && p.startsWith('/jobs/')) {
        const id = decodeURIComponent(p.slice('/jobs/'.length))
        return send(200, { ok: true, job: jobView(getJob(id)) })
      }

      // ---------------- 包管理 ----------------
      if (req.method === 'GET' && p === '/packs') return send(200, { ok: true, packs: await listPacks() })
      if (req.method === 'POST' && p === '/packs/rename') {
        const body = await parseBody()
        return send(200, await renamePack(requireStringParam(body.from, 'from'), requireStringParam(body.to, 'to')))
      }
      {
        const infoMatch = /^\/packs\/([^/]+)\/info$/.exec(p)
        if (infoMatch) {
          const name = decodeURIComponent(infoMatch[1])
          if (req.method === 'GET') {
            // 历史契约：GET 从查询串取口令。新增 POST 走请求体的通道
            // （口令不进 URL，就不会落进浏览器历史 / 访问日志 / Referer），前端已改走 POST。
            return send(200, await getPackInfo(name, url.searchParams.get('password') || ''))
          }
          if (req.method === 'POST') {
            const body = await parseBody()
            return send(200, await getPackInfo(name, typeof body.password === 'string' ? body.password : ''))
          }
        }
      }
      if (req.method === 'DELETE' && p.startsWith('/packs/')) {
        const name = decodeURIComponent(p.slice('/packs/'.length))
        return send(200, await deletePack(name, recycleFn))
      }

      // ---------------- 恢复 ----------------
      if (req.method === 'POST' && p === '/restore/import') {
        const body = await parseBody()
        const zip = requireStringParam(body.zip, 'zip')
        const password = typeof body.password === 'string' ? body.password : ''
        return send(200, await importRestore(zip, password, { includeDb: body.includeDb === true }))
      }
      if (req.method === 'POST' && p === '/restore/apply') {
        const body = await parseBody()
        const zip = requireStringParam(body.zip, 'zip')
        const strategy = body.strategy === undefined ? 'overwrite' : body.strategy
        if (!RESTORE_STRATEGIES.includes(strategy)) {
          throw apiError('bad_strategy', "strategy 只能是 'overwrite' / 'skip' / 'merge'")
        }
        const modules = body.modules === undefined ? null : normalizeModulesStrict(body.modules)
        const includeDb = body.includeDb === true
        const password = typeof body.password === 'string' ? body.password : ''
        if (body.async === true) {
          return send(200, { ok: true, jobId: startRestoreJob({ zip, strategy, modules, includeDb, password }).id })
        }
        const { readManifestFromZip } = await import('./archive.mjs')
        const { manifest, dir } = await readManifestFromZip(zip, password)
        try {
          manifest._dir = dir
          const stats = await applyRestore(manifest, { strategy, moduleFilter: modules, includeDb })
          return send(200, { ok: true, stats })
        } finally {
          await fsp.rm(dir, { recursive: true, force: true }) // 失败也要清理临时解压目录
        }
      }
      if (req.method === 'GET' && p === '/restore/backups') {
        return send(200, { ok: true, items: await listRestoreBackups() })
      }
      if (req.method === 'POST' && p === '/restore/rollback') {
        const body = await parseBody()
        return send(200, await rollbackRestoreBackup(body.dir))
      }
      return send(ERROR_CODES.not_found, { ok: false, code: 'not_found', error: `未知接口: ${p}` })
    } catch (err) {
      if (err instanceof ApiError) return send(err.status, { ok: false, code: err.code, error: err.message })
      // 加密包密码错误 / 缺失：契约要求 400 bad_password，不得漏成 500
      if (isBadPasswordError(err)) {
        return send(ERROR_CODES.bad_password, { ok: false, code: 'bad_password', error: String(err?.message || err) })
      }
      logger.error('API 未捕获异常', { url: req.url, error: String(err?.message || err) })
      return send(ERROR_CODES.internal, { ok: false, code: 'internal', error: String(err?.message || err) })
    }
  }
}
