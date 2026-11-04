// ============================================================================
// cli.mjs —— /pack 命令（list / create / restore / scan）
//
// 与 Web API 同一套 fail-closed 校验：模式白名单、分享模式敏感模块拦截、策略白名单、
// 加密口令长度——命令行的容错不得比 HTTP 接口更宽松，否则「绕过 UI 就能打包敏感内容」。
// ============================================================================
import fsp from 'node:fs/promises'

import { SENSITIVE_MODULES, RESTORE_STRATEGIES } from './constants.mjs'
import { MODULES, defaultModulesFor, collectModuleFiles, withSnapshots } from './modules.mjs'
import { privacyScan, countFindings, formatFinding } from './privacy.mjs'
import { createPack, listPacks } from './pack.mjs'
import { applyRestore } from './restore.mjs'
import { MIN_PASSWORD_LENGTH } from '../crypto.mjs'

/** 解析 `/pack` 参数：`--flag [value]`；booleanFlags 里的开关不需要取值 */
export function parsePackArgs(tokens, booleanFlags = []) {
  const positional = []
  const flags = {}
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]
    if (!t.startsWith('--')) {
      positional.push(t)
      continue
    }
    const name = t.slice(2)
    if (!name) throw new Error('存在空的 -- 选项')
    if (booleanFlags.includes(name)) {
      flags[name] = true
      continue
    }
    const value = tokens[i + 1]
    if (value === undefined || value.startsWith('--')) throw new Error(`选项 --${name} 缺少取值`)
    flags[name] = value
    i++
  }
  return { positional, flags }
}

export const PACK_USAGE = [
  '用法: /pack list',
  '     | create [--modules a,b] [--mode migrate|share] [--share] [--note 备注] [--dry-run] [--encrypt 密码]',
  '     | restore <包路径> [--strategy overwrite|skip|merge] [--modules a,b] [--include-db] [--password 密码]',
  '     | scan',
].join('\n')

/** 隐私扫描（CLI）：所有模块 —— 同样包在 withSnapshots 里，避免 SQLite 快照泄漏 */
async function scanAllModules() {
  return withSnapshots(async () => {
    const files = []
    for (const m of Object.keys(MODULES)) {
      for (const f of await collectModuleFiles(MODULES[m])) files.push(f)
    }
    return files
  })
}

export function registerPackCommand(ctx) {
  ctx.inject(['commands'], (commandCtx) => {
    commandCtx.commands.register({
      name: 'pack',
      description: '配置打包：list / create / restore / scan',
      async handler(invocation) {
        const { rawInput } = invocation
        const tokens = (rawInput || '').trim().split(/\s+/).filter(Boolean)
        const verb = tokens[0]
        const rest = tokens.slice(1)
        try {
          if (!verb) return { kind: 'success', text: PACK_USAGE }

          if (verb === 'list') {
            const packs = await listPacks()
            if (!packs.length) return { kind: 'success', text: '（暂无配置包）' }
            return {
              kind: 'success',
              text: packs.map((p) => `- ${p.name}${p.encrypted ? ' [加密]' : ''}（${p.mode || '?'} · ${p.fileCount || 0} 文件 · ${Math.round((p.totalBytes || 0) / 1024)}KB${p.note ? ' · ' + p.note : ''}）`).join('\n'),
            }
          }

          if (verb === 'create') {
            const { flags } = parsePackArgs(rest, ['dry-run', 'share'])
            const mode = flags.share ? 'share' : (flags.mode || 'migrate')
            if (mode !== 'migrate' && mode !== 'share') throw new Error('--mode 只能是 migrate 或 share')
            const modules = flags.modules
              ? flags.modules.split(',').map((s) => s.trim()).filter(Boolean)
              : defaultModulesFor(mode)
            if (!modules.length) throw new Error('未选择任何模块')
            for (const m of modules) if (!MODULES[m]) throw new Error(`未知模块: ${m}`)
            if (mode === 'share') {
              const blocked = modules.filter((m) => SENSITIVE_MODULES.includes(m))
              if (blocked.length) throw new Error(`分享模式不允许包含敏感模块：${blocked.join(', ')}（请改用迁移模式）`)
            }
            const encrypt = flags.encrypt !== undefined
            const password = encrypt ? String(flags.encrypt) : ''
            if (encrypt && password.length < MIN_PASSWORD_LENGTH) throw new Error(`加密密码至少 ${MIN_PASSWORD_LENGTH} 位`)
            const dryRun = flags['dry-run'] === true
            const r = await createPack({ modules, mode, note: flags.note || '', dryRun, encrypt, password })
            const unreadableNote = r.unreadable?.length ? `\n（${r.unreadable.length} 个文件读不出内容已跳过，未写入指纹）` : ''
            if (dryRun) {
              return {
                kind: 'success',
                text: `【预览】模块 ${r.manifest.modules.join(', ')} · ${r.manifest.files.length} 文件 · ${Math.round(r.totalBytes / 1024)}KB${r.encrypted ? ' · 将加密（PKENC1）' : ''}\n隐私扫描：${r.privacy.length ? r.privacy.map((p) => `- ${formatFinding(p)}`).join('\n') : '无发现'}${unreadableNote}`,
              }
            }
            return {
              kind: 'success',
              text: `已生成 ${r.pack.name}${r.pack.encrypted ? ' [加密]' : ''}（${r.pack.fileCount} 文件 · ${Math.round(r.pack.totalBytes / 1024)}KB${r.pack.note ? ' · ' + r.pack.note : ''}）\n路径：${r.pack.path}${unreadableNote}`,
            }
          }

          if (verb === 'scan') {
            const files = await scanAllModules()
            const findings = await privacyScan(files)
            const total = countFindings(findings)
            return {
              kind: 'success',
              text: total
                ? `发现 ${total} 处敏感痕迹（${findings.length} 个命中点）：\n` + findings.slice(0, 15).map((f) => `- ${formatFinding(f)}`).join('\n')
                : '未发现敏感痕迹',
            }
          }

          if (verb === 'restore') {
            const { positional, flags } = parsePackArgs(rest, ['include-db'])
            const zip = positional[0]
            if (!zip) return { kind: 'success', text: '用法: /pack restore <包路径> [--strategy overwrite|skip|merge] [--modules a,b] [--include-db] [--password 密码]' }
            const strategy = flags.strategy === undefined ? 'overwrite' : flags.strategy
            if (!RESTORE_STRATEGIES.includes(strategy)) throw new Error('--strategy 只能是 overwrite / skip / merge')
            const moduleFilter = flags.modules ? flags.modules.split(',').map((s) => s.trim()).filter(Boolean) : null
            if (moduleFilter) {
              if (!moduleFilter.length) throw new Error('--modules 不能为空')
              for (const m of moduleFilter) if (!MODULES[m]) throw new Error(`未知模块: ${m}`)
            }
            const includeDb = flags['include-db'] === true
            const { readManifestFromZip } = await import('./archive.mjs')
            const { manifest, dir } = await readManifestFromZip(zip, flags.password || '')
            try {
              manifest._dir = dir
              const stats = await applyRestore(manifest, { strategy, moduleFilter, includeDb })
              const parts = [`恢复完成（策略 ${strategy}）：新增 ${stats.added} · 覆盖 ${stats.overwritten} · 合并 ${stats.merged} · 跳过 ${stats.skipped}`]
              if (stats.failed) parts.push(`失败 ${stats.failed}${stats.aborted ? '（已中止）' : ''}`)
              if (stats.rolledBack) parts.push(`已回滚 ${stats.rolledBack} 个文件`)
              if (stats.rollbackFailures.length) parts.push(`回滚失败 ${stats.rollbackFailures.length}`)
              if (stats.excluded.length) parts.push(`未恢复 SQLite 库 ${stats.excluded.length} 个（加 --include-db 才恢复）`)
              if (stats.backupDir) parts.push(`备份：${stats.backupDir}（可用 /restore/rollback 回滚）`)
              const detail = stats.failures.length ? '\n' + stats.failures.map((f) => `- ${f.rel}: ${f.error}`).join('\n') : ''
              return { kind: stats.failed ? 'error' : 'success', text: parts.join(' · ') + detail }
            } finally {
              await fsp.rm(dir, { recursive: true, force: true }) // 无论成败都清理临时解压目录
            }
          }
          return { kind: 'success', text: PACK_USAGE }
        } catch (err) {
          return { kind: 'error', text: String(err?.message || err) }
        }
      },
    })
  })
}
