// ============================================================================
// recycle.mjs —— 删除包时按平台送进系统回收站
//
// 契约（不变）：
//   成功 → true；平台不支持 → false；调用失败 → **抛出**（由 deletePack 降级并回报 warning）。
//   绝不静默：任何一路失败都会让用户看到「已永久删除」的明确提示。
//
// 命令拼装与执行分离（buildMacRecycleArgs 是纯函数），因此非 macOS 上也能单测拼装结果。
// ============================================================================
import fsp from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import { RECYCLE_TIMEOUT_MS } from './constants.mjs'
import { exists, platformTag } from './util.mjs'

const execFileAsync = promisify(execFile)

/** PowerShell 单引号字符串：内部单引号翻倍转义（避免路径里的引号被当成语句边界） */
export function psSingleQuoted(value) {
  return `'${String(value).replace(/'/g, "''")}'`
}

/**
 * Windows：PowerShell 自带的 Microsoft.VisualBasic.FileIO.FileSystem::DeleteFile(..., SendToRecycleBin)。
 * 不装任何模块 / 依赖（系统自带能力）。
 * @param {Function} [exec] 注入点（测试用）
 */
export async function recycleFileWindows(filePath, exec = execFileAsync) {
  const script = 'Add-Type -AssemblyName Microsoft.VisualBasic; '
    + `[Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile(${psSingleQuoted(filePath)}, 'OnlyErrorDialogs', 'SendToRecycleBin')`
  await exec('powershell', ['-NoProfile', '-NonInteractive', '-Command', script], {
    windowsHide: true,
    timeout: RECYCLE_TIMEOUT_MS,
  })
  return true
}

/** AppleScript 字符串字面量转义：先反斜杠再双引号（顺序反了会双重转义） */
export function escapeAppleScriptString(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

/** macOS：让 Finder 删除（进废纸篓）。纯函数，只拼命令不执行。 */
export function buildMacRecycleArgs(filePath) {
  return ['-e', `tell application "Finder" to delete POSIX file "${escapeAppleScriptString(filePath)}"`]
}

/** macOS：osascript 调 Finder 删除；失败 / 超时抛出，由 deletePack 降级并回报 */
export async function recycleFileMac(filePath, exec = execFileAsync) {
  await exec('osascript', buildMacRecycleArgs(filePath), { timeout: RECYCLE_TIMEOUT_MS })
  return true
}

/** freedesktop Trash 规范的根目录：$XDG_DATA_HOME（缺省 ~/.local/share） */
export function trashDataHome(env = process.env, homeDir = os.homedir()) {
  const xdg = typeof env.XDG_DATA_HOME === 'string' ? env.XDG_DATA_HOME.trim() : ''
  return xdg || path.join(homeDir, '.local', 'share')
}

/** `.trashinfo` 的 `Path=` 值：逐段 percent-encode、保留 `/` 分隔符 */
export function encodeTrashPath(absPath) {
  return String(absPath).split('/').map((seg) => encodeURIComponent(seg)).join('/')
}

/** `.trashinfo` 的 `DeletionDate=` 值：本地时间 YYYY-MM-DDThh:mm:ss（规范要求，不带时区） */
export function formatTrashDate(date = new Date()) {
  const p = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`
    + `T${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())}`
}

/** 一份 `.trashinfo` 的内容：[Trash Info] 段 + Path + DeletionDate */
export function buildTrashInfo(absPath, date = new Date()) {
  return `[Trash Info]\nPath=${encodeTrashPath(absPath)}\nDeletionDate=${formatTrashDate(date)}\n`
}

/** files/ 与 info/ 都未被占用才算可用名；冲突按规范加 .1 / .2 … 后缀 */
export async function uniqueTrashBaseName(filesDir, infoDir, baseName) {
  let candidate = baseName
  for (let i = 1; i <= 1000; i += 1) {
    const inFiles = await exists(path.join(filesDir, candidate))
    const inInfo = await exists(path.join(infoDir, `${candidate}.trashinfo`))
    if (!inFiles && !inInfo) return candidate
    candidate = `${baseName}.${i}`
  }
  throw new Error('回收站同名文件过多（>1000）')
}

/**
 * Linux：按 freedesktop Trash 规范把文件移进回收站（纯 Node，不调外部命令）。
 * 先写 .trashinfo 再挪文件：挪失败就把 info 回滚掉，绝不留「有记录没文件」的空壳。
 */
export async function recycleFileLinux(filePath, opts = {}) {
  const env = opts.env || process.env
  const homeDir = opts.homeDir || os.homedir()
  const dataHome = opts.xdgDataHome || trashDataHome(env, homeDir)
  const filesDir = path.join(dataHome, 'Trash', 'files')
  const infoDir = path.join(dataHome, 'Trash', 'info')
  const abs = path.resolve(filePath)
  const stat = await fsp.stat(abs)
  if (!stat.isFile()) throw new Error('只支持把普通文件移入回收站')
  await fsp.mkdir(filesDir, { recursive: true })
  await fsp.mkdir(infoDir, { recursive: true })
  const name = await uniqueTrashBaseName(filesDir, infoDir, path.basename(abs))
  const dest = path.join(filesDir, name)
  const infoPath = path.join(infoDir, `${name}.trashinfo`)
  await fsp.writeFile(infoPath, buildTrashInfo(abs, opts.now), { mode: 0o600 })
  try {
    await fsp.rename(abs, dest)
  } catch (err) {
    if (err?.code !== 'EXDEV') {
      await fsp.rm(infoPath, { force: true })
      throw err
    }
    // 跨设备（源文件与回收站不在同一分区）：复制 + 删源
    try {
      await fsp.copyFile(abs, dest)
      await fsp.unlink(abs)
    } catch (copyErr) {
      await fsp.rm(dest, { force: true })
      await fsp.rm(infoPath, { force: true })
      throw copyErr
    }
  }
  return true
}

/**
 * 把单个文件送进当前平台的系统回收站。
 * - Windows：PowerShell + SendToRecycleBin；
 * - macOS：osascript 让 Finder 删除（进废纸篓）；
 * - Linux：freedesktop Trash（纯 Node 实现）；
 * - 鸿蒙 / 其它：返回 false（JS 层拿不到 ArkTS 的 @ohos.file.trash，走永久删除 + warning）。
 */
/**
 * 按平台分派到对应的回收站实现。
 * `exec` 是注入点：三个实现都接受它，因此在任意平台上都能验证「win32/darwin 真的走了各自那条路」，
 * 而不必真的去调 PowerShell / osascript。
 */
export async function recycleFileNative(filePath, platform = process.platform, exec = execFileAsync) {
  switch (platformTag(platform)) {
    case 'win32': return recycleFileWindows(filePath, exec)
    case 'darwin': return recycleFileMac(filePath, exec)
    // Linux 是纯 Node 实现（freedesktop Trash），不需要 exec
    case 'linux': return recycleFileLinux(filePath)
    default: return false
  }
}
