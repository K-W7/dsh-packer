/**
 * 隐私口径回归（零依赖，node:test）。
 *
 * 0.7.0 把「扫描」与「脱敏」收敛成单一规则源，同时收窄了 Unix 路径口径。
 * 这两件事都容易在后续重构里悄悄退回旧行为，所以锁死三条：
 *   ① shebang（`#!/usr/bin/env node`）必须原样保留 —— 旧版会被换成 `#!<Unix路径> node`，脚本直接报废；
 *   ② `/usr` `/etc` 这类系统公共路径不含个人信息，不计命中也不脱敏；
 *   ③ 家目录路径（`/home/<名>`、`/Users/<名>`、Windows `C:\Users\<名>`）必须脱敏；URL 整段不动。
 *
 * 另加一条兼容性断言：`SCHEMA_VERSION` 维持 1，老包仍可 restore。
 */
import test from 'node:test'
import assert from 'node:assert/strict'

import { sanitizeText } from '../lib/privacy.mjs'
import { SCHEMA_VERSION } from '../lib/constants.mjs'

const clean = (text) => sanitizeText(text, 'sample.txt')

test('shebang 原样保留（旧版会把它脱敏成 #!<Unix路径> node）', () => {
  const text = '#!/usr/bin/env node\nconst a = 1\n'
  const out = clean(text)
  assert.equal(out.text, text, 'shebang 不得被改写')
  assert.equal(out.redactions, 0)
})

test('Unix 系统公共路径不计命中、不脱敏', () => {
  for (const text of ['sed -n 1p /etc/hosts', 'cp /usr/bin/node /opt/x', 'mount /var/log /mnt/data']) {
    const out = clean(text)
    assert.equal(out.text, text, `系统路径不该被改写：${text}`)
    assert.equal(out.redactions, 0, `系统路径不该产生脱敏：${text}`)
  }
})

test('家目录路径脱敏，同一条里的系统路径保持原样', () => {
  const out = clean('home file /home/alice/notes.txt and system /usr/bin/node')
  assert.equal(out.redactions, 1)
  assert.ok(!out.text.includes('/home/alice'), '家目录名必须消失')
  assert.ok(out.text.includes('/usr/bin/node'), '系统路径必须保留')
})

test('Windows 用户目录同样脱敏', () => {
  const out = clean('C:\\Users\\bob\\secret.txt')
  assert.equal(out.redactions, 1)
  assert.ok(!out.text.includes('bob'), '用户名必须消失')
  assert.ok(out.text.endsWith('secret.txt'), '文件名结构保留')
})

test('URL 整段不动', () => {
  const text = 'see https://example.com/a/b?c=d for details'
  const out = clean(text)
  assert.equal(out.text, text)
  assert.equal(out.redactions, 0)
})

test('清单版本维持 1（老包仍可 restore）', () => {
  assert.equal(SCHEMA_VERSION, 1)
})
