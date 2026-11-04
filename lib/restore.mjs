// ============================================================================
// restore.mjs —— 恢复：差异对比 → 备份 → 原子替换 → 失败回滚
//
// 安全不变式（任一被破坏即 fail-closed）：
//   1. 清单指纹必须存在且合法（缺 / 非法一律拒绝，不复制）；
//   2. 源路径必须在解压目录内、目标路径必须落在模块目标根内（双向 containment）；
//   3. 每个被覆盖 / 追加的目标先备份，写临时文件后 rename 原子替换；
//   4. 任一环节失败即中止，并按记录回滚本次已替换 / 已新增的文件；
//   5. SQLite 库（*.db*）默认不恢复，避免覆盖目标机上正在使用的记忆库。
// ============================================================================
import fsp from 'node:fs/promises'
import path from 'node:path'

import {
  PACKS_DIR,
  RESTORE_BACKUP_DIR,
  RESTORE_STRATEGIES,
  DB_FILE_RE,
  STRUCTURED_EXT,
} from './constants.mjs'
import { apiError } from './errors.mjs'
import {
  exists, trySha256, sha256, sha256Buffer, readFileText, isTextFile, fileSize,
  nowStamp, uniqueSuffix, pathContained,
} from './util.mjs'
import { logger } from './logger.mjs'
import { MODULES, resolveTarget, isAllowedModuleTarget } from './modules.mjs'
import { backfillText, retainedPlaceholderCounts } from './privacy.mjs'

/** 结构化配置文件：禁止通用 append merge（拼接即损坏） */
const STRUCTURED_SET = new Set(STRUCTURED_EXT)

export function isStructuredFile(p) {
  return STRUCTURED_SET.has(path.extname(p).toLowerCase())
}

/**
 * sanitized 包在**目标机**上应有的 SHA-256（回填后的内容）。
 * 非 sanitized 包直接用清单指纹。
 */
export async function expectedTargetSha(manifest, f) {
  if (manifest?.sanitized !== true || !manifest._dir) return f.sha256
  if (!/^[0-9a-f]{64}$/i.test(String(f.sha256))) return f.sha256
  const src = path.resolve(manifest._dir, String(f.module), String(f.rel))
  if (!pathContained(manifest._dir, src)) return f.sha256
  if (!(await exists(src))) return f.sha256
  if (!(await isTextFile(src))) return f.sha256
  const raw = await readFileText(src)
  if (!raw) return f.sha256
  const { text } = backfillText(raw)
  if (text === raw) return f.sha256
  return sha256Buffer(Buffer.from(text, 'utf-8'))
}

/**
 * 差异对比：新增 / 变更 / 相同 / 跳过。
 *
 * v0.7.0：`includeDb=false`（默认）时把 SQLite 库直接归入 skipped 并写明原因 ——
 * 旧实现把它们算成 added/changed，界面显示「将新增 N 个」而实际恢复时全被跳过，数字对不上。
 *
 * @param {object} manifest 需带 _dir（解压目录）
 * @param {{includeDb?: boolean}} [opts]
 */
export async function diffRestore(manifest, opts = {}) {
  const includeDb = opts.includeDb === true
  const diff = { added: [], changed: [], same: [], skipped: [] }
  for (const f of manifest.files || []) {
    const mod = MODULES[f.module]
    if (!mod) {
      diff.skipped.push({ module: f.module, rel: f.rel, reason: '未知模块' })
      continue
    }
    let target
    try {
      target = resolveTarget(mod, f.rel)
    } catch (err) {
      diff.skipped.push({ module: f.module, rel: f.rel, reason: String(err?.message || err) })
      continue
    }
    if (!/^[0-9a-f]{64}$/i.test(String(f.sha256))) {
      diff.skipped.push({ module: f.module, rel: f.rel, reason: '清单缺少合法 SHA-256 指纹（fail-closed）' })
      continue
    }
    if (!includeDb && DB_FILE_RE.test(path.basename(target))) {
      diff.skipped.push({
        module: f.module,
        rel: f.rel,
        reason: '记忆数据库默认不恢复（勾选「连记忆数据库一起恢复」才会写入）',
      })
      continue
    }
    if (!(await exists(target))) {
      diff.added.push({ module: f.module, rel: f.rel })
    } else if ((await trySha256(target)) === (await expectedTargetSha(manifest, f))) {
      diff.same.push({ module: f.module, rel: f.rel })
    } else {
      diff.changed.push({ module: f.module, rel: f.rel })
    }
  }
  return diff
}

/**
 * 执行恢复。
 *
 * @param {object} manifest 需带 _dir（解压目录）
 * @param {object} [options]
 * @param {'overwrite'|'skip'|'merge'} [options.strategy]
 * @param {string[]|null} [options.moduleFilter]
 * @param {boolean} [options.includeDb]
 * @param {string|null} [options.backupRoot]
 * @param {Function} [options.onProgress]
 * @param {Function} [options.shouldCancel]
 */
export async function applyRestore(manifest, {
  strategy = 'overwrite',
  moduleFilter = null,
  includeDb = false,
  backupRoot = null,
  onProgress = null,
  shouldCancel = null,
} = {}) {
  // 策略白名单 fail-closed：旧实现 `strategy || 'overwrite'` 把任何非法值都静默当成覆盖
  if (!RESTORE_STRATEGIES.includes(strategy)) {
    throw apiError('bad_strategy', "strategy 只能是 'overwrite' / 'skip' / 'merge'")
  }
  const stats = {
    overwritten: 0, added: 0, merged: 0, skipped: 0, failed: 0, failures: [],
    excluded: [], aborted: false, cancelled: false, rolledBack: 0, rollbackFailures: [], backupDir: null,
    backfilled: 0, warnings: [],
  }
  const doBackfill = manifest.sanitized === true
  const retained = new Map()
  const tallyRetained = (text) => {
    for (const [ph, n] of retainedPlaceholderCounts(text)) retained.set(ph, (retained.get(ph) || 0) + n)
  }
  /** sanitized 包写盘前的内容准备：文本文件 → 回填 <用户目录>/<用户名> */
  const prepareContent = async (src) => {
    if (!doBackfill) return null
    if (!(await isTextFile(src))) return null
    const raw = await readFileText(src)
    if (!raw) return null
    const { text, backfilled } = backfillText(raw)
    return { text, raw, backfilled, changed: text !== raw }
  }
  const writePrepared = async (dest, src, prepared, mode) => {
    if (prepared?.changed) {
      await fsp.writeFile(dest, prepared.text, 'utf-8')
      stats.backfilled += prepared.backfilled
    } else {
      await fsp.copyFile(src, dest)
    }
    await applyMode(dest, mode)
    if (prepared) tallyRetained(prepared.text)
  }
  /** 还原权限位（清单里的 mode 是可选字段，旧包没有则跳过） */
  const applyMode = async (dest, mode) => {
    if (!Number.isInteger(mode) || mode <= 0) return
    try {
      await fsp.chmod(dest, mode & 0o777)
    } catch {
      /* 文件系统不支持 chmod 时忽略 */
    }
  }

  const eligible = (manifest.files || []).filter((f) => !moduleFilter || moduleFilter.includes(f.module))
  const total = eligible.length
  let done = 0
  const report = (phase = 'apply') => {
    try {
      onProgress?.(phase, done, total)
    } catch (err) {
      logger.nonFatal('恢复进度回调', err)
    }
  }
  const applied = []
  let backupDir = null
  let seq = 0
  const ensureBackupDir = async () => {
    if (!backupDir) {
      const root = backupRoot || path.join(PACKS_DIR, RESTORE_BACKUP_DIR)
      backupDir = path.join(root, `${nowStamp()}-${uniqueSuffix()}`)
      await fsp.mkdir(backupDir, { recursive: true })
      stats.backupDir = backupDir
    }
    return backupDir
  }
  /** 增量写 journal：恢复中途崩溃 / 被取消时，用户仍能从 /restore/rollback 还原 */
  const writeJournal = async () => {
    if (!applied.length) return
    // 纯新增（没有覆盖既有文件）也要建备份目录：否则 /restore/rollback 无法撤销「新增」
    if (!backupDir) await ensureBackupDir()
    const records = applied.map((r) => ({ target: r.target, backup: r.backup, kind: r.kind }))
    await fsp.writeFile(path.join(backupDir, 'journal.json'), JSON.stringify(records, null, 2), 'utf-8')
  }
  const backupTarget = async (target) => {
    const dest = path.join(await ensureBackupDir(), `${String(seq++).padStart(4, '0')}-${path.basename(target)}`)
    await fsp.copyFile(target, dest)
    return dest
  }
  const rollback = async () => {
    for (const rec of applied.slice().reverse()) {
      try {
        if (rec.backup && (await exists(rec.backup))) {
          const tmp = `${rec.target}.packer-rb-${uniqueSuffix()}`
          await fsp.copyFile(rec.backup, tmp)
          await fsp.rename(tmp, rec.target) // 原子还原
        } else {
          await fsp.rm(rec.target, { force: true })
        }
        if (rec.kind === 'overwrite') stats.overwritten--
        else if (rec.kind === 'merge') stats.merged--
        else stats.added--
        stats.rolledBack++
      } catch (err) {
        stats.rollbackFailures.push({ target: rec.target, error: String(err?.message || err) })
      }
    }
  }

  report('prepare')
  for (const f of eligible) {
    // 取消只在文件边界生效；中止后回滚本次已应用的文件，不留半恢复状态
    if (shouldCancel?.()) {
      stats.aborted = true
      stats.cancelled = true
      await rollback()
      break
    }
    const mod = MODULES[f.module]
    if (!mod) { stats.skipped++; done++; report(); continue }
    try {
      const target = resolveTarget(mod, f.rel)
      if (!includeDb && DB_FILE_RE.test(path.basename(target))) {
        stats.skipped++
        stats.excluded.push({ rel: f.rel, reason: 'SQLite 数据库（含 WAL/SHM）默认不恢复，避免覆盖运行中的记忆数据' })
        continue
      }
      if (!/^[0-9a-f]{64}$/i.test(String(f.sha256))) {
        throw new Error('清单条目缺少合法 SHA-256 指纹，已拒绝恢复（fail-closed）')
      }
      const src = path.resolve(manifest._dir, f.module, f.rel)
      if (!pathContained(manifest._dir, src)) throw new Error('包内路径越界，已拒绝恢复（fail-closed）')
      if (!(await exists(src))) throw new Error('包内源文件缺失')
      const srcHash = await sha256(src)
      if (srcHash !== f.sha256) {
        throw new Error(`源文件完整性校验失败（${f.sha256} ≠ ${srcHash}），已拒绝恢复（fail-closed）`)
      }
      const prepared = await prepareContent(src)
      const expectedSha = prepared?.changed ? sha256Buffer(Buffer.from(prepared.text, 'utf-8')) : f.sha256

      if (await exists(target)) {
        if ((await trySha256(target)) === expectedSha) { stats.skipped++; continue } // 已是最新（含回填后内容）
        if (strategy === 'skip') { stats.skipped++; continue }
        if (strategy === 'merge' && (await isTextFile(target))) {
          if (isStructuredFile(target)) {
            throw new Error('结构化配置文件不支持 append merge（会破坏语法），请改用 overwrite 策略或手工合并')
          }
          const backup = await backupTarget(target)
          const sep = `\n<!-- merged from dsh-packer pack ${manifest.createdAt} -->\n`
          // 复制到临时文件 → 追加 → rename 原子替换 → 失败清理临时文件
          // （旧实现直接 appendFile：中途失败会留下半截文件，只能靠备份兜底）
          const mergeTmp = `${target}.merge-tmp-${process.pid}`
          await fsp.copyFile(target, mergeTmp)
          try {
            // 追加的包内内容同样要回填（否则 merge 出来的永远是占位符）
            const appendText = prepared ? prepared.text : await readFileText(src)
            if (prepared?.changed) stats.backfilled += prepared.backfilled
            if (prepared) tallyRetained(prepared.text)
            await fsp.appendFile(mergeTmp, sep + appendText, 'utf-8')
            await fsp.rename(mergeTmp, target)
          } catch (err) {
            try { await fsp.rm(mergeTmp, { force: true }) } catch { /* 忽略 */ }
            throw err
          }
          applied.push({ target, backup, kind: 'merge' })
          stats.merged++
          await writeJournal()
          continue
        }
      }
      const existed = await exists(target)
      const backup = existed ? await backupTarget(target) : null
      await fsp.mkdir(path.dirname(target), { recursive: true })
      const tmp = `${target}.packer-tmp-${uniqueSuffix()}`
      try {
        await writePrepared(tmp, src, prepared, f.mode)
        await fsp.rename(tmp, target) // 原子替换
      } catch (err) {
        await fsp.rm(tmp, { force: true }) // 失败不残留临时文件
        throw err
      }
      if (existed) {
        applied.push({ target, backup, kind: 'overwrite' })
        stats.overwritten++
      } else {
        applied.push({ target, backup, kind: 'add' })
        stats.added++
      }
      await writeJournal()
    } catch (err) {
      stats.failed++
      stats.failures.push({ rel: f.rel, error: String(err?.message || err) })
      stats.aborted = true
      await rollback() // 任一环节失败即中止并回滚
      break
    } finally {
      // done = 已处理数（成功 / 跳过 / 失败都算；取消时不重复计数）
      if (!stats.cancelled) {
        done++
        report('apply')
      }
    }
  }
  for (const [ph, n] of retained) stats.warnings.push(`${n} 处占位符无法自动回填（${ph}）`)
  report('apply')
  return stats
}

/**
 * 导入检查：解包 → 校验 manifest → 逐文件 status（added/changed/same/skipped）+ diff 计数。
 * @param {string} packPath
 * @param {string} [password]
 * @param {{includeDb?: boolean}} [opts]
 */
export async function importRestore(packPath, password, opts = {}) {
  const { readManifestFromZip } = await import('./archive.mjs')
  const { manifest, dir, encrypted } = await readManifestFromZip(packPath, password)
  try {
    manifest._dir = dir
    const diff = await diffRestore(manifest, opts)
    const statusByKey = new Map()
    for (const f of diff.added) statusByKey.set(`${f.module}\u0000${f.rel}`, 'added')
    for (const f of diff.changed) statusByKey.set(`${f.module}\u0000${f.rel}`, 'changed')
    for (const f of diff.same) statusByKey.set(`${f.module}\u0000${f.rel}`, 'same')
    for (const f of diff.skipped) statusByKey.set(`${f.module}\u0000${f.rel}`, 'skipped')
    const files = []
    for (const f of manifest.files || []) {
      const key = `${f.module}\u0000${f.rel}`
      let size = Number(f.size)
      if (!Number.isFinite(size) || size < 0) size = await fileSize(path.join(dir, String(f.module), String(f.rel)))
      files.push({ module: f.module, rel: f.rel, size, status: statusByKey.get(key) || 'skipped' })
    }
    return {
      ok: true,
      manifest: publicManifestOf(manifest),
      files,
      diff: {
        added: diff.added.length,
        changed: diff.changed.length,
        same: diff.same.length,
        skipped: diff.skipped.length,
      },
      encrypted,
    }
  } finally {
    await fsp.rm(dir, { recursive: true, force: true })
  }
}

function publicManifestOf(manifest) {
  return {
    schemaVersion: manifest.schemaVersion,
    mode: manifest.mode,
    modules: Array.isArray(manifest.modules) ? manifest.modules : [],
    note: manifest.note || '',
    createdAt: manifest.createdAt,
    sanitized: manifest.sanitized === true,
    redactions: Number(manifest.redactions) || 0,
  }
}

/** 恢复备份目录列表：items [{dir, createdAt, files, bytes}] */
export async function listRestoreBackups() {
  const base = path.join(PACKS_DIR, RESTORE_BACKUP_DIR)
  let entries
  try {
    entries = await fsp.readdir(base, { withFileTypes: true })
  } catch (err) {
    if (err?.code === 'ENOENT') return []
    throw new Error(`读取恢复备份目录失败：${String(err?.message || err)}`)
  }
  const items = []
  for (const e of entries) {
    if (!e.isDirectory()) continue
    const abs = path.join(base, e.name)
    let files = 0
    let bytes = 0
    const stack = [abs]
    while (stack.length) {
      const cur = stack.pop()
      const list = await fsp.readdir(cur, { withFileTypes: true })
      for (const c of list) {
        const full = path.join(cur, c.name)
        if (c.isDirectory()) { stack.push(full); continue }
        if (!c.isFile()) continue
        if (cur === abs && c.name === 'journal.json') continue // 索引文件不计入
        files++
        bytes += await fileSize(full)
      }
    }
    const st = await fsp.stat(abs)
    items.push({ dir: abs, createdAt: st.mtime.toISOString(), files, bytes })
  }
  items.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
  return items
}

/**
 * 一键回滚：从 .restore-backups/<dir>/journal.json 逆向还原。
 * containment 校验：dir 必须落在 .restore-backups 内，备份文件也必须在 dir 内。
 */
export async function rollbackRestoreBackup(dir) {
  const base = path.resolve(PACKS_DIR, RESTORE_BACKUP_DIR)
  const abs = path.resolve(String(dir || ''))
  if (typeof dir !== 'string' || !dir || !pathContained(base, abs) || abs === base) {
    throw apiError('bad_dir', 'dir 必须位于恢复备份目录（.restore-backups）内')
  }
  if (!(await exists(abs))) throw apiError('bad_dir', '备份目录不存在')
  const journalPath = path.join(abs, 'journal.json')
  if (!(await exists(journalPath))) throw apiError('bad_dir', '备份目录缺少 journal.json，无法回滚')
  let journal
  try {
    journal = JSON.parse(await fsp.readFile(journalPath, 'utf-8'))
  } catch (err) {
    throw apiError('bad_dir', `备份目录的 journal.json 非法：${String(err?.message || err)}`)
  }
  if (!Array.isArray(journal)) throw apiError('bad_dir', 'journal.json 必须是记录数组')
  let restored = 0
  let failed = 0
  const failures = []
  // 逆序回滚：先还原最后应用的文件
  for (const rec of [...journal].reverse()) {
    try {
      const target = String(rec?.target || '')
      if (!target) throw new Error('journal 记录缺少 target')
      // fail-closed：只允许还原到模块目标根内（防伪造 journal 写到任意路径）
      if (!isAllowedModuleTarget(target)) throw new Error('journal 目标不在任何模块目标根内（fail-closed）')
      if (rec.backup) {
        const backup = path.resolve(String(rec.backup))
        if (!pathContained(abs, backup)) throw new Error('备份文件越界（不在备份目录内）')
        if (!(await exists(backup))) throw new Error('备份文件缺失')
        await fsp.mkdir(path.dirname(target), { recursive: true })
        const tmp = `${target}.packer-rb-${uniqueSuffix()}`
        await fsp.copyFile(backup, tmp)
        await fsp.rename(tmp, target) // 原子还原
      } else {
        // 本次恢复新增的文件：回滚 = 删除
        await fsp.rm(target, { force: true })
      }
      restored++
    } catch (err) {
      failed++
      failures.push({ target: String(rec?.target ?? ''), error: String(err?.message || err) })
    }
  }
  const result = { ok: true, restored, failed }
  if (failures.length) result.failures = failures // 失败明细上报，不静默吞
  return result
}
