// ============================================================================
// util.mjs —— 基础工具（纯函数优先，无业务语义）
//
// 全部异步 IO 走 node:fs/promises，绝不出现 fs.readFileSync 阻塞事件循环。
// ============================================================================
import fsp from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import crypto from 'node:crypto'

import {
  HASH_CHUNK_BYTES,
  IO_CONCURRENCY,
  TEXT_EXT,
  BINARY_EXT,
  TEXT_BASENAMES,
  TRASH_PLATFORMS,
  FILE_PICKER_PLATFORMS,
} from './constants.mjs'

// ---------- 文件系统 ----------

/** 存在性判断：唯一允许的「探测」方式，不抛错 */
export async function exists(p) {
  try {
    await fsp.access(p)
    return true
  } catch {
    return false
  }
}

/** 读文本文件；读不出返回空串（与既有语义一致，调用方按空串处理） */
export async function readFileText(p) {
  try {
    return await fsp.readFile(p, 'utf-8')
  } catch {
    return ''
  }
}

/**
 * 流式 SHA-256：用 filehandle.read 分块读取，大文件不再整份进内存。
 * 计算失败必须抛错 —— 绝不返回空串，否则空指纹会与「目标侧也算不出指纹」
 * 撞成「相同」，完整性校验被静默跳过。
 */
export async function sha256(p) {
  const hash = crypto.createHash('sha256')
  const handle = await fsp.open(p, 'r')
  try {
    const buf = Buffer.allocUnsafe(HASH_CHUNK_BYTES)
    for (;;) {
      const { bytesRead } = await handle.read(buf, 0, buf.length, null)
      if (bytesRead <= 0) break
      hash.update(bytesRead === buf.length ? buf : buf.subarray(0, bytesRead))
    }
  } finally {
    await handle.close()
  }
  return hash.digest('hex')
}

/** 比较用哈希：目标读不出来时返回 null（与"合法指纹"永远不相等） */
export async function trySha256(p) {
  try {
    return await sha256(p)
  } catch {
    return null
  }
}

/** Buffer → SHA-256（脱敏后按新内容重算清单指纹） */
export function sha256Buffer(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex')
}

export async function fileSize(p) {
  try {
    return (await fsp.stat(p)).size
  } catch {
    return 0
  }
}

/** 临时目录（staging / 解压 / 快照）；调用方负责 try/finally 清理 */
export function stagingDir(prefix = 'packer-') {
  return fsp.mkdtemp(path.join(os.tmpdir(), prefix))
}

// ---------- 并发 ----------

/**
 * 有界并发映射：保留输入顺序，workers 数受限。
 * 单条 fn 抛错由调用方处理（本函数不吞错，Promise.all 会 reject）。
 */
export async function mapLimit(items, limit, fn) {
  const out = new Array(items.length)
  let cursor = 0
  const width = Math.max(1, Math.min(limit, items.length))
  const workers = Array.from({ length: width }, async () => {
    for (;;) {
      const index = cursor++
      if (index >= items.length) return
      out[index] = await fn(items[index], index)
    }
  })
  await Promise.all(workers)
  return out
}

// ---------- 字符串 / 哈希校验 ----------

const SHA256_RE = /^[0-9a-f]{64}$/i

/** 清单指纹必须存在且是合法 SHA-256（fail-closed） */
export function isValidSha256(s) {
  return typeof s === 'string' && SHA256_RE.test(s)
}

/** 定长比较，避免令牌比对泄漏长度 / 前缀信息 */
export function safeEqual(a, b) {
  const left = Buffer.from(String(a))
  const right = Buffer.from(String(b))
  return left.length === right.length && crypto.timingSafeEqual(left, right)
}

/** 时间戳文件名片段：YYYY-MM-DD-HHMMSS */
export function nowStamp() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
}

/** 唯一后缀：同一秒内多次打包不再互相覆盖 */
export function uniqueSuffix() {
  return crypto.randomBytes(3).toString('hex')
}

/**
 * 出网文案脱敏：抹掉盘符路径 / UNC / Unix 用户目录路径。
 * 内部报错常带服务端绝对路径（如「文件不存在: E:\...」），不该出现在浏览器可见的错误里。
 */
export function redactPaths(message) {
  return String(message ?? '')
    .replace(/[A-Za-z]:[\\/][^\s"'`<>|?*]+/g, '<路径已隐去>')
    .replace(/\\\\[^\s"'`<>|?*]+/g, '<路径已隐去>')
    .replace(/(?<![\w.-])\/(?:home|Users|root|mnt|media|opt|srv|etc|var|tmp|usr)\/[^\s"'`<>|]*/g, '<路径已隐去>')
}

/**
 * 递归脱敏：对整棵响应树做一次出网脱敏。
 *
 * 只 redact 顶层 error 是不够的 —— stats.backupDir / failures[].target 等字段
 * 同样是服务端绝对路径。这里统一处理，白名单字段（前端必需、且前端自己会遮蔽）除外。
 * @param {unknown} value
 * @param {string[]} [allowPaths] 允许透出绝对路径的字段白名单
 */
export function deepRedact(value, allowPaths = []) {
  if (typeof value === 'string') return redactPaths(value)
  if (Array.isArray(value)) return value.map((v) => deepRedact(v, allowPaths))
  if (value && typeof value === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(value)) {
      out[k] = allowPaths.includes(k) ? v : deepRedact(v, allowPaths)
    }
    return out
  }
  return value
}

// ---------- 路径安全 ----------

/** 目标路径是否落在 base 目录内（防 zip-slip / 篡改清单的 ../ 越界） */
export function pathContained(base, target) {
  const b = path.resolve(base)
  const t = path.resolve(target)
  return t === b || t.startsWith(b + path.sep)
}

/**
 * 清单 rel 白名单校验：显式拒绝绝对路径 / 盘符路径 / UNC / `..` 片段 / NUL / 空段。
 * 打包时 rel 由相对遍历生成，绝不会出现这些形状 —— 出现即为篡改。
 */
export function assertSafeRel(rel) {
  if (typeof rel !== 'string' || !rel) {
    throw new Error('清单条目 rel 非法（空或非字符串），已拒绝恢复（fail-closed）')
  }
  if (rel.includes('\0')) throw new Error('清单条目 rel 含非法字符，已拒绝恢复（fail-closed）')
  if (/^[A-Za-z]:/.test(rel)) throw new Error(`目标路径越界（盘符路径）: ${rel}，已拒绝恢复（fail-closed）`)
  if (rel.startsWith('/') || rel.startsWith('\\')) {
    throw new Error(`目标路径越界（绝对路径/UNC）: ${rel}，已拒绝恢复（fail-closed）`)
  }
  if (path.isAbsolute(rel)) throw new Error(`目标路径越界（绝对路径）: ${rel}，已拒绝恢复（fail-closed）`)
  const segs = rel.split(/[\\/]/)
  if (segs.includes('..')) throw new Error(`目标路径越界（含 .. 片段）: ${rel}，已拒绝恢复（fail-closed）`)
  if (segs.some((s) => s === '')) throw new Error(`目标路径非法（空路径段）: ${rel}，已拒绝恢复（fail-closed）`)
  return rel
}

/** 字节数人类可读（前端也有一份，这里是服务端文案用） */
export function formatBytes(n) {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = Number(n) || 0
  let unit = 0
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024
    unit += 1
  }
  return `${unit === 0 ? size : size.toFixed(1)} ${units[unit]}`
}

// ---------- 文本判定 ----------

/** 内容嗅探：前 4KB 出现 NUL 字节视为二进制；读不到则按二进制处理（不扫，避免假结果） */
export async function looksBinary(p) {
  let handle
  try {
    handle = await fsp.open(p, 'r')
    const buf = Buffer.allocUnsafe(4096)
    const { bytesRead } = await handle.read(buf, 0, buf.length, 0)
    for (let i = 0; i < bytesRead; i++) if (buf[i] === 0) return true
    return false
  } catch {
    return true
  } finally {
    if (handle !== undefined) {
      try {
        await handle.close()
      } catch {
        /* ignore */
      }
    }
  }
}

/** 是否按文本处理：已知文本后缀 / 已知文本文件名 → 是；已知二进制或含 NUL → 否 */
export async function isTextFile(p) {
  const base = path.basename(p)
  const ext = path.extname(p).toLowerCase()
  if (BINARY_EXT.has(ext)) return false
  if (TEXT_EXT.has(ext) || p.endsWith('.i18n.yaml')) return true
  if (TEXT_BASENAMES.has(base) || base.startsWith('.env.')) return true
  return !(await looksBinary(p))
}

// ---------- 平台 ----------

/** 归一化平台标识：鸿蒙的 Node 可能报 ohos / openharmony / harmonyos，统一成 'harmony' */
export function platformTag(platform = process.platform) {
  const p = String(platform || '').toLowerCase()
  if (p === 'ohos' || p.includes('harmony')) return 'harmony'
  return p
}

/** 当前平台是否有系统回收站 */
export function hasSystemTrash(platform = process.platform) {
  return TRASH_PLATFORMS.has(platformTag(platform))
}

/** 当前平台的宿主是否有系统文件选择框 */
export function hasSystemFilePicker(platform = process.platform) {
  return FILE_PICKER_PLATFORMS.has(platformTag(platform))
}

/** 当前用户名（回填 `<用户名>` 用）：home 末段，取不到用环境变量兜底 */
export function currentUsername() {
  const base = path.basename(os.homedir())
  if (base) return base
  return process.env.USER || process.env.USERNAME || 'user'
}
