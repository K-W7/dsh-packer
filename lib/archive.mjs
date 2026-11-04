// ============================================================================
// archive.mjs —— 解包侧：安全校验 + 解压 + 读清单
//
// 安全模型（fail-closed，任一条不满足即拒绝整包，一个字节都不写）：
//   1. 加密包先嗅探魔数，缺口令 → BadPasswordError（400 bad_password），不当损坏 zip 处理；
//   2. 先解析中央目录做成员白名单校验（绝对路径 / 盘符 / UNC / `..` / 链接类成员一律拒绝）；
//   3. 校验通过才落盘；解压后再扫一遍解压结果，出现符号链接即拒绝（防列表解析被绕过）；
//   4. 临时解压目录统一在 try/finally 中清理（成功、失败都不残留）；
//   5. 解压体积有上限（防 zip bomb），单成员解压后长度必须与声明一致。
// ============================================================================
import fsp from 'node:fs/promises'
import path from 'node:path'

import { SCHEMA_VERSION, MAX_TOTAL_BYTES } from './constants.mjs'
import { exists, pathContained, readFileText, stagingDir } from './util.mjs'
import { readZipFile, entryKind, readEntryData } from '../zip.mjs'
import { isEncryptedBuffer } from '../crypto.mjs'
import { BadPasswordError } from '../crypto.mjs'
import { MODULES, resolveTarget } from './modules.mjs'

/** 读文件头 N 字节（嗅探 PKENC1 魔数用） */
export async function readHeadBytes(p, n = 8) {
  const handle = await fsp.open(p, 'r')
  try {
    const buf = Buffer.alloc(n)
    const { bytesRead } = await handle.read(buf, 0, n, 0)
    return buf.subarray(0, bytesRead)
  } finally {
    await handle.close()
  }
}

/** 直接对加密包调用解包接口时给出明确的 bad_password 语义（而不是「不是有效 zip」的 500） */
export async function rejectEncryptedPath(p) {
  if (!(await exists(p))) return
  const head = await readHeadBytes(p, 8)
  if (isEncryptedBuffer(head)) {
    throw new BadPasswordError('该包已加密（PKENC1）：请通过恢复接口并提供正确密码访问')
  }
}

/**
 * 读中央目录并做白名单校验。
 * @returns 条目元数据数组（校验通过）
 */
export async function listSafeEntries(zipPath, entries) {
  await rejectEncryptedPath(zipPath)
  let list = entries
  if (!list) {
    try {
      list = readZipFile(zipPath).entries
    } catch (err) {
      throw new Error(`包内清单非法或包已损坏（无法读取成员列表）: ${String(err?.message || err)}`)
    }
  }
  if (!list.length) throw new Error('包内没有任何成员（空包或不是有效 zip）')
  for (const e of list) {
    const name = e.name.replace(/^\.\//, '')
    if (!name) continue
    if (name.includes('\0')) throw new Error('包内成员名含非法字符，已拒绝解包（fail-closed）')
    if (/^[A-Za-z]:/.test(name)) throw new Error(`包内成员名非法（盘符路径）: ${name}`)
    if (name.startsWith('/') || name.startsWith('\\')) throw new Error(`包内成员名非法（绝对路径/UNC）: ${name}`)
    if (name.split(/[\\/]/).includes('..')) throw new Error(`包内成员名越界（含 .. 片段）: ${name}`)
    const kind = entryKind(e)
    if (kind !== 'file' && kind !== 'dir') {
      throw new Error(`包内含不允许的成员类型（${kind}），已拒绝解包（fail-closed）: ${name}`)
    }
  }
  return list
}

/** 成员名列表（对外语义不变：字符串数组） */
export async function validateArchiveMembers(zipPath) {
  const entries = await listSafeEntries(zipPath)
  return entries.map((e) => e.name)
}

/** 解压后再查一层：解压结果中出现符号链接即拒绝（防列表解析被绕过） */
export async function assertNoLinkEntries(dir) {
  const stack = [dir]
  while (stack.length) {
    const cur = stack.pop()
    let entries = []
    try {
      entries = await fsp.readdir(cur, { withFileTypes: true })
    } catch {
      continue
    }
    for (const e of entries) {
      const full = path.join(cur, e.name)
      let st
      try {
        st = await fsp.lstat(full)
      } catch {
        continue
      }
      if (st.isSymbolicLink()) {
        throw new Error(`包内成员为符号链接，已拒绝解包（fail-closed）: ${path.relative(dir, full)}`)
      }
      if (st.isDirectory()) stack.push(full)
    }
  }
}

/**
 * 解压到临时目录（调用方负责清理）。
 *
 * 校验与解压复用同一份中央目录：先全量校验，再落盘 —— 任一成员非法则一个字节都不写。
 * 解压时还原 Unix 权限位（v0.7.0：旧实现丢掉了可执行位，恢复后脚本跑不起来）。
 */
export async function extractZip(zipPath) {
  if (!(await exists(zipPath))) throw new Error(`文件不存在: ${zipPath}`)
  await rejectEncryptedPath(zipPath)
  const { buf, entries } = readZipFile(zipPath)
  await listSafeEntries(zipPath, entries)
  const dir = await stagingDir()
  try {
    let total = 0
    for (const e of entries) {
      const rel = e.name.replace(/^\.\//, '')
      if (!rel || entryKind(e) === 'dir') continue
      const dest = path.join(dir, ...rel.split('/'))
      await fsp.mkdir(path.dirname(dest), { recursive: true })
      const data = readEntryData(buf, e)
      total += data.length
      if (total > MAX_TOTAL_BYTES) {
        throw new Error(`解压后总体积超过 ${MAX_TOTAL_BYTES} 字节上限，已拒绝（可能是 zip bomb）`)
      }
      await fsp.writeFile(dest, data)
      // 还原权限位：只处理普通文件的低 9 位，非 POSIX 平台无意义但无害
      const mode = e.unixMode & 0o777
      if (mode) {
        try {
          await fsp.chmod(dest, mode)
        } catch {
          /* 文件系统不支持 chmod 时忽略 */
        }
      }
    }
    await assertNoLinkEntries(dir)
  } catch (err) {
    await fsp.rm(dir, { recursive: true, force: true })
    throw err
  }
  return dir
}

/**
 * 得到「可直接解析的 zip 路径」：明文包原样返回；PKENC1 加密包解密到临时 zip。
 * @returns {{zipPath:string, tempRoot:string|null, encrypted:boolean}} tempRoot 由调用方清理
 */
export async function openPackZipPath(packPath, password) {
  if (!(await exists(packPath))) throw new Error(`文件不存在: ${packPath}`)
  const head = await readHeadBytes(packPath, 8)
  if (!isEncryptedBuffer(head)) return { zipPath: packPath, tempRoot: null, encrypted: false }
  if (typeof password !== 'string' || password.length === 0) {
    throw new BadPasswordError('该包已加密（PKENC1），需要提供密码')
  }
  const { decryptZipBuffer } = await import('../crypto.mjs')
  const packed = await fsp.readFile(packPath)
  const plain = await decryptZipBuffer(packed, password) // 失败 → BadPasswordError
  const tempRoot = await stagingDir()
  const tempZip = path.join(tempRoot, 'decrypted.zip')
  await fsp.writeFile(tempZip, plain)
  return { zipPath: tempZip, tempRoot, encrypted: true }
}

/**
 * 读取并校验包内 manifest。支持 .pkenc（先嗅探魔数 → 需要密码 → 解密后按普通 zip 处理）。
 * @returns {{manifest:object, dir:string, encrypted:boolean}} dir 由调用方清理
 */
export async function readManifestFromZip(packPath, password) {
  const opened = await openPackZipPath(packPath, password)
  try {
    const dir = await extractZip(opened.zipPath)
    try {
      const raw = await readFileText(path.join(dir, 'manifest.json'))
      if (!raw.trim()) throw new Error('包内缺少 manifest.json（不是 dsh-packer 生成的包）')
      const manifest = JSON.parse(raw)
      if (manifest.schemaVersion !== SCHEMA_VERSION) {
        throw new Error(`清单版本不兼容（包 ${manifest.schemaVersion} vs 当前 ${SCHEMA_VERSION}）`)
      }
      if (!Array.isArray(manifest.files)) throw new Error('清单缺少 files 数组，已拒绝恢复（fail-closed）')
      // 清单路径整体校验：任一条目非法即拒绝整包（避免半个包被应用）
      for (const f of manifest.files) {
        const mod = MODULES[f.module]
        if (!mod) continue // 未知模块留给 diff/apply 逐条跳过
        resolveTarget(mod, f.rel)
      }
      return { manifest, dir, encrypted: opened.encrypted }
    } catch (err) {
      await fsp.rm(dir, { recursive: true, force: true })
      throw err
    }
  } finally {
    // 解密出来的临时 zip 不留在临时目录（无论成功失败）
    if (opened.tempRoot) await fsp.rm(opened.tempRoot, { recursive: true, force: true })
  }
}

/** 包内路径越界检测：src 解析后必须仍在解压目录内（防 manifest/zip 被改后越界恢复） */
export function containedInDir(dir, target) {
  return pathContained(dir, target)
}
