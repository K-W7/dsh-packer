// ============================================================================
// jobs.mjs —— 异步作业（进度 / 取消 / 结果轮询）
//
// 契约要点：
//   - 取消只在**文件边界**生效；取消 / 失败都不留半成品（create 写临时文件后 rename）；
//   - 内存保留最近 JOB_MAX 条；终态作业保留 JOB_RETAIN_MS（惰性 prune，无定时器，内存有界）；
//   - 终态 phase='done' 由运行器在**写入 result 之后**才设置，
//     否则轮询者会看到「phase=done 但 result 还是 null」的中间态。
// ============================================================================
import fsp from 'node:fs/promises'

import { JOB_MAX, JOB_RETAIN_MS } from './constants.mjs'
import { ApiError, ERROR_CODES, isCancelled } from './errors.mjs'
import { logger } from './logger.mjs'
import { createPack } from './pack.mjs'
import { applyRestore } from './restore.mjs'
import { isBadPasswordError } from '../crypto.mjs'

const JOBS = new Map()
let JOB_SEQ = 0

function isJobTerminal(job) {
  return job.finishedAt !== null
}

/** 清理过期作业 + 控制总量（惰性 prune，无定时器，内存有界） */
function pruneJobs(now = Date.now()) {
  for (const [id, job] of JOBS) {
    if (isJobTerminal(job) && now - job.finishedAt > JOB_RETAIN_MS) JOBS.delete(id)
  }
  while (JOBS.size > JOB_MAX) {
    let oldest = null
    for (const job of JOBS.values()) {
      if (!oldest || job.createdAt < oldest.createdAt) oldest = job
    }
    if (!oldest) break
    JOBS.delete(oldest.id)
  }
}

function newJob(kind) {
  pruneJobs()
  const job = {
    id: `job-${Date.now().toString(36)}-${(++JOB_SEQ).toString(36)}`,
    kind,
    phase: 'collect',
    done: 0,
    total: 0,
    cancelled: false,
    error: null,
    result: null,
    cancelRequested: false,
    createdAt: Date.now(),
    finishedAt: null,
  }
  JOBS.set(job.id, job)
  pruneJobs()
  return job
}

/**
 * 轮询视图。`result.privacy` 是逐条隐私命中（满量迁移 2000+ 条、约 400 KB），
 * UI 的创建流程只用到 `pack` / `warnings`，所以这里只回条数 —— 否则每次终态轮询
 * 都要搬一份大数组，宿主桥一旦断，就把「其实已经成功」的打包显示成失败。
 */
function trimResult(result) {
  if (!result || typeof result !== 'object') return result
  if (!Array.isArray(result.privacy)) return result
  const { privacy, ...rest } = result
  return { ...rest, privacyCount: privacy.length }
}

export function jobView(job) {
  return {
    id: job.id,
    kind: job.kind,
    phase: job.phase,
    done: job.done,
    total: job.total,
    cancelled: job.cancelled,
    error: job.error,
    result: trimResult(job.result),
  }
}

export function getJob(id) {
  pruneJobs()
  const job = JOBS.get(String(id))
  if (!job) throw new ApiError(ERROR_CODES.job_not_found, 'job_not_found', `作业不存在或已过期: ${id}`)
  return job
}

export function listJobs() {
  pruneJobs()
  return [...JOBS.values()].sort((a, b) => b.createdAt - a.createdAt).slice(0, JOB_MAX).map(jobView)
}

/** 已终态也返回 ok（幂等），没跑完则置取消标志，等文件边界生效 */
export function cancelJob(id) {
  const job = getJob(id)
  if (!isJobTerminal(job)) job.cancelRequested = true
  return { ok: true, cancelled: !isJobTerminal(job) }
}

/** 作业进度钩子：文件边界产生 {phase, done, total} */
function jobHooks(job) {
  return {
    progress: (phase, done, total) => {
      if (isJobTerminal(job)) return
      job.phase = phase
      job.done = Number(done) || 0
      job.total = Number(total) || 0
    },
    shouldCancel: () => job.cancelRequested === true,
  }
}

export function startCreateJob(opts) {
  const job = newJob('create')
  const hooks = jobHooks(job)
  setImmediate(() => { void runCreateJob(job, opts, hooks) })
  return job
}

async function runCreateJob(job, opts, hooks) {
  try {
    const result = await createPack({ ...opts, hooks })
    job.result = result
    job.done = job.total || result?.pack?.fileCount || job.done
    job.total = job.total || result?.pack?.fileCount || job.done
    job.phase = 'done'
  } catch (err) {
    if (isCancelled(err) || job.cancelRequested) {
      job.cancelled = true
      job.result = { ok: false, code: 'cancelled', error: '任务已取消，未生成包（无半成品残留）' }
    } else {
      job.error = String(err?.message || err)
      logger.error('打包作业失败', { jobId: job.id, error: job.error })
    }
    job.phase = 'done'
  } finally {
    job.finishedAt = Date.now()
  }
}

export function startRestoreJob(opts) {
  const job = newJob('restore')
  const hooks = jobHooks(job)
  setImmediate(() => { void runRestoreJob(job, opts, hooks) })
  return job
}

async function runRestoreJob(job, opts, hooks) {
  try {
    const { readManifestFromZip } = await import('./archive.mjs')
    const { manifest, dir } = await readManifestFromZip(opts.zip, opts.password)
    try {
      manifest._dir = dir
      const eligible = (manifest.files || []).filter((f) => !opts.modules || opts.modules.includes(f.module))
      job.total = eligible.length
      const stats = await applyRestore(manifest, {
        strategy: opts.strategy,
        moduleFilter: opts.modules,
        includeDb: opts.includeDb,
        onProgress: hooks.progress,
        shouldCancel: hooks.shouldCancel,
      })
      job.result = { ok: !(stats.aborted && stats.cancelled), stats }
      if (stats.aborted && stats.cancelled) job.cancelled = true
      job.done = job.total
      job.phase = 'done'
    } finally {
      await fsp.rm(dir, { recursive: true, force: true })
    }
  } catch (err) {
    if (isCancelled(err) || job.cancelRequested) {
      job.cancelled = true
      job.result = { ok: false, code: 'cancelled', error: '任务已取消，已回滚本次已应用的文件' }
    } else if (isBadPasswordError(err)) {
      // 密码错误 / 缺失：保留稳定 code，UI 才能提示「密码错误」而不是一句内部报错
      job.error = String(err?.message || err)
      job.result = { ok: false, code: 'bad_password', error: job.error }
    } else {
      job.error = String(err?.message || err)
      logger.error('恢复作业失败', { jobId: job.id, error: job.error })
    }
    job.phase = 'done'
  } finally {
    job.finishedAt = Date.now()
  }
}

/** 插件卸载 / 热重载时清理（配合 ctx.effect 的 disposer） */
export function disposeJobs() {
  JOBS.clear()
}
