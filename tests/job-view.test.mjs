/**
 * 轮询视图回归（零依赖，node:test）。
 *
 * 0.7.2 修的是一次「明明成功却报失败」：满量迁移的隐私命中 2000+ 条，
 * 终态轮询要把整份 `result.privacy` 搬回浏览器，宿主桥断掉就变成
 * `network · Failed to fetch`。现在视图只回 `privacyCount`，这里把它锁死。
 */
import test from 'node:test'
import assert from 'node:assert/strict'

import { jobView } from '../lib/jobs.mjs'

const job = (result) => ({
  id: 'job-test',
  kind: 'create',
  phase: 'done',
  done: 3,
  total: 3,
  cancelled: false,
  error: null,
  result,
})

test('创建作业的轮询视图不带 privacy 明细，只回条数', () => {
  const view = jobView(job({ ok: true, pack: { name: 'a.zip' }, warnings: ['w'], privacy: [1, 2, 3] }))
  assert.equal(view.result.privacy, undefined, '大数组必须被剔掉')
  assert.equal(view.result.privacyCount, 3)
  assert.equal(view.result.warnings.length, 1, 'warnings 仍要给 UI')
  assert.equal(view.result.pack.name, 'a.zip')
})

test('没有 privacy 的结果原样透传（恢复作业不受影响）', () => {
  const result = { ok: true, stats: { applied: 1 } }
  assert.deepEqual(jobView(job(result)).result, result)
})

test('空结果 / 非对象结果不炸', () => {
  assert.equal(jobView(job(null)).result, null)
  assert.equal(jobView(job(undefined)).result, undefined)
  assert.deepEqual(jobView(job('done')).result, 'done')
})
