// ============================================================================
// dsh-packer — 配置打包器（Agent Config Packer for DeepSeek Harness）
//
// 本文件只做**装配**：拉起命令、挂载 Web API、注入配置，并把内部实现暴露给测试。
// 业务实现全部在 lib/ 下按职责分文件：
//
//   lib/constants.mjs  常量与边界（唯一来源）
//   lib/errors.mjs     统一错误模型与错误码表
//   lib/logger.mjs     结构化日志
//   lib/util.mjs       基础工具（IO / 并发 / 路径安全 / 平台）
//   lib/modules.mjs    模块定义、文件收集、SQLite 一致快照
//   lib/privacy.mjs    隐私扫描与脱敏（**同一套规则源**）
//   lib/recycle.mjs    回收站平台分派
//   lib/archive.mjs    解包安全校验与解压
//   lib/pack.mjs       打包流程与包管理
//   lib/restore.mjs    差异对比、备份、原子替换、回滚
//   lib/jobs.mjs       异步作业
//   lib/api.mjs        /packer/api/* 防护与路由
//   lib/cli.mjs        /pack 命令
//
// 官方契约要点（cordis-plugin-development）：
//   - 可选服务用 ctx.get(name) + 缺失处理；硬依赖才声明 inject（本插件均为可选 → inject = []）
//   - 副作用用 ctx.effect()（返回 disposer）
//   - webServer 由 dsh-web-app 提供（用 ctx.inject 懒注入，不能直接读 ctx.webServer）
//   - connection 由 dsh-client-connection 提供：requestRejection(req) 是官方给
//     「另一条 Web 路由」复用的 Host/Origin 信任 + 浏览器会话鉴权入口（401/403/undefined）
// ============================================================================

import * as C from './lib/constants.mjs'
import * as errors from './lib/errors.mjs'
import { logger } from './lib/logger.mjs'
import * as util from './lib/util.mjs'
import * as modules from './lib/modules.mjs'
import * as privacy from './lib/privacy.mjs'
import * as recycle from './lib/recycle.mjs'
import * as archive from './lib/archive.mjs'
import * as pack from './lib/pack.mjs'
import * as restore from './lib/restore.mjs'
import * as jobs from './lib/jobs.mjs'
import * as api from './lib/api.mjs'
import * as cli from './lib/cli.mjs'
import * as zip from './zip.mjs'
import * as cryptoMod from './crypto.mjs'

// ---------- 常量 ----------
export const {
  SCHEMA_VERSION, TOOL_NAME, DSH_HOME, PACKS_DIR, MEMORY_ROOT, BIOMEMORY_DB, BIOMEMORY_DIR,
  NEVER_PACK, DB_FILE_RE, SENSITIVE_MODULES, RESTORE_STRATEGIES, RESTORE_BACKUP_DIR,
  PRIVACY_KINDS, KIND_PLACEHOLDER, PLACEHOLDER_HOME, PLACEHOLDER_USER, RETAINED_PLACEHOLDERS,
  TOKEN_HEADER, TOKEN_GLOBAL, DEFAULT_MAX_BODY_BYTES, DEFAULT_RATE_LIMIT, DEFAULT_RATE_WINDOW_MS,
  PACKAGE_SKIP_NAMES, PACK_NAME_MAX, IO_CONCURRENCY, MAX_ENTRY_BYTES, MAX_TOTAL_BYTES,
} = C

// ---------- 错误 / 日志 ----------
export const { ApiError, PackerError, JobCancelled, ERROR_CODES, apiError } = errors
export { logger }

// ---------- 基础工具 ----------
export const {
  exists, readFileText, sha256, trySha256, sha256Buffer, fileSize, mapLimit,
  isValidSha256, safeEqual, nowStamp, uniqueSuffix, redactPaths, deepRedact,
  pathContained, assertSafeRel, isTextFile, looksBinary, formatBytes, stagingDir,
  platformTag, hasSystemTrash, hasSystemFilePicker, currentUsername,
} = util

// ---------- 模块 ----------
export const {
  MODULES, defaultModulesFor, collectModuleFiles, collectPackageDirs, moduleStats,
  resolveTarget, isAllowedModuleTarget, snapshotSqlite, cleanupSnapshots, withSnapshots,
  drainSnapshotWarnings, snapshotCacheSize,
} = modules

// ---------- 隐私 ----------
export const {
  PRIVACY_PATTERNS, PATTERN_KIND, setPersonalPatterns, defaultRules, protectedRanges,
  collectHits, privacyScan, countFindings, formatFinding,
  clearPrivacyScanCache, privacyScanCacheStats,
  sanitizeText, sanitizePackFile, validateSanitizedStructured, sameLineShape,
  backfillText, retainedPlaceholderCounts,
} = privacy

// ---------- 回收站 ----------
export const {
  recycleFileNative, recycleFileWindows, recycleFileMac, recycleFileLinux,
  buildMacRecycleArgs, escapeAppleScriptString, psSingleQuoted,
  trashDataHome, encodeTrashPath, formatTrashDate, buildTrashInfo, uniqueTrashBaseName,
} = recycle

// ---------- 解包 ----------
export const {
  readHeadBytes, rejectEncryptedPath, listSafeEntries, validateArchiveMembers,
  assertNoLinkEntries, extractZip, openPackZipPath, readManifestFromZip,
} = archive

// ---------- 打包与包管理 ----------
export const {
  createPack, buildManifest, publicManifest, listPacks, getPackInfo, renamePack,
  deletePack, packsDiskUsage, validatePackName, packSummaryName, packBaseName,
  packFilePath, packSummaryPath, isEncryptedPackName, readPackSummary,
} = pack

// ---------- 恢复 ----------
export const {
  diffRestore, applyRestore, importRestore, expectedTargetSha,
  listRestoreBackups, rollbackRestoreBackup, isStructuredFile,
} = restore

// ---------- 作业 ----------
export const {
  startCreateJob, startRestoreJob, getJob, listJobs, cancelJob, jobView, disposeJobs,
} = jobs

// ---------- Web API / CLI ----------
export const { createPackApiGuard, createPackApiHandler, requireStringParam, normalizeModulesStrict } = api
export const { registerPackCommand, parsePackArgs, PACK_USAGE } = cli

// ---------- zip / crypto ----------
export const {
  buildZip, readZipFile, parseZip, entryKind, readEntryData, crc32, writeZipFile, MAX_ENTRY_COUNT,
} = zip
export const {
  PKENC_EXT, ENC_MAGIC, MIN_PASSWORD_LENGTH, HEADER_BYTES, BadPasswordError,
  isBadPasswordError, isEncryptedBuffer, encryptZipBuffer, decryptZipBuffer,
} = cryptoMod

/** 本插件不硬依赖任何宿主服务：命令与 webServer 都用 ctx.inject 懒注入 */
export const inject = []

// ---------- 插件挂载 ----------

export function apply(ctx, config = {}) {
  // 部署者个人隐私规则（如个人昵称、本机用户名）——不进开源代码，由部署者配置注入
  if (config?.personalPatterns) privacy.setPersonalPatterns(config.personalPatterns)

  // 1. /pack 命令（可选服务）
  cli.registerPackCommand(ctx)

  // 2. 设置页 Web API（webServer 缺失时自动跳过）
  //    注：不能直接访问 ctx.webServer —— Cordis service 未注入时 Proxy getter 会抛
  //    "cannot get property without inject"（?. 拦不住）。用 ctx.inject 懒注入。
  ctx.inject(['webServer'], (httpCtx) => {
    const guard = api.createPackApiGuard(config?.api)
    const handler = api.createPackApiHandler({
      guard,
      // connection 是可选服务：ctx.get 拿不到就返回 undefined。
      // 默认 'auto' 下这等于 403（fail-closed）；只有显式 authMode: 'token' 才走令牌回退
      getConnection: () => {
        try {
          return httpCtx.get('connection')
        } catch {
          return undefined
        }
      },
    })
    if (typeof httpCtx.webServer?.register !== 'function') return // 宿主没有注册接口：不挂路由
    httpCtx.effect(() => httpCtx.webServer.register({
      kind: 'prefix',
      path: '/packer/api',
      handler,
    }), 'dsh-packer: settings web API')

    // 令牌只服务显式 opt-in 的 'token' 模式：注入同源 index.html（跨站页面读不到）
    if (guard.authMode === 'token' && typeof httpCtx.webServer.tapIndex === 'function') {
      httpCtx.effect(
        () => httpCtx.webServer.tapIndex((html) => guard.injectToken(html)),
        'dsh-packer: one-time API token injection',
      )
    }

    // 插件卸载 / 热重载时清掉内存中的作业记录
    httpCtx.effect(() => jobs.disposeJobs, 'dsh-packer: dispose jobs')
  })

  logger.debug('dsh-packer 已挂载', { authMode: config?.api?.authMode ?? 'auto' })
}

// ---------- 测试用内部接口 ----------
// 与 v0.6.5 保持完全兼容：键名一个都不能少，否则既有测试无法直接迁移。
export const __internals = {
  // 路径与常量
  DSH_HOME: C.DSH_HOME,
  PACKS_DIR: C.PACKS_DIR,
  MEMORY_ROOT: C.MEMORY_ROOT,
  BIOMEMORY_DIR: C.BIOMEMORY_DIR,
  BIOMEMORY_DB: C.BIOMEMORY_DB,
  SENSITIVE_MODULES: C.SENSITIVE_MODULES,
  RESTORE_STRATEGIES: C.RESTORE_STRATEGIES,
  RESTORE_BACKUP_DIR: C.RESTORE_BACKUP_DIR,
  DB_FILE_RE: C.DB_FILE_RE,
  PACKAGE_SKIP_NAMES: C.PACKAGE_SKIP_NAMES,
  PRIVACY_KINDS: C.PRIVACY_KINDS,
  PRIVACY_PATTERNS: privacy.PRIVACY_PATTERNS,
  PATTERN_KIND: privacy.PATTERN_KIND,
  KIND_PLACEHOLDER: C.KIND_PLACEHOLDER,
  PLACEHOLDER_HOME: C.PLACEHOLDER_HOME,
  PLACEHOLDER_USER: C.PLACEHOLDER_USER,
  RETAINED_PLACEHOLDERS: C.RETAINED_PLACEHOLDERS,
  TOKEN_HEADER: C.TOKEN_HEADER,
  TOKEN_GLOBAL: C.TOKEN_GLOBAL,
  DEFAULT_MAX_BODY_BYTES: C.DEFAULT_MAX_BODY_BYTES,
  DEFAULT_RATE_LIMIT: C.DEFAULT_RATE_LIMIT,
  DEFAULT_RATE_WINDOW_MS: C.DEFAULT_RATE_WINDOW_MS,
  PKENC_EXT: cryptoMod.PKENC_EXT,
  MIN_PASSWORD_LENGTH: cryptoMod.MIN_PASSWORD_LENGTH,
  JobCancelled: errors.JobCancelled,

  // 模块与收集
  MODULES: modules.MODULES,
  collectModuleFiles: modules.collectModuleFiles,
  collectPackageDirs: modules.collectPackageDirs,
  moduleStats: modules.moduleStats,
  defaultModulesFor: modules.defaultModulesFor,
  resolveTarget: modules.resolveTarget,
  snapshotSqlite: modules.snapshotSqlite,
  cleanupSnapshots: modules.cleanupSnapshots,
  withSnapshots: modules.withSnapshots,
  snapshotCacheSize: modules.snapshotCacheSize,

  // 工具
  sha256: util.sha256,
  sha256Buffer: util.sha256Buffer,
  isValidSha256: util.isValidSha256,
  isTextFile: util.isTextFile,
  exists: util.exists,
  stagingDir: util.stagingDir,
  mapLimit: util.mapLimit,
  pathContained: util.pathContained,
  assertSafeRel: util.assertSafeRel,
  redactPaths: util.redactPaths,
  currentUsername: util.currentUsername,
  platformTag: util.platformTag,
  hasSystemTrash: util.hasSystemTrash,
  hasSystemFilePicker: util.hasSystemFilePicker,

  // 隐私
  privacyScan: privacy.privacyScan,
  countFindings: privacy.countFindings,
  setPersonalPatterns: privacy.setPersonalPatterns,
  sanitizeRules: privacy.defaultRules,
  clearPrivacyScanCache: privacy.clearPrivacyScanCache,
  privacyScanCacheStats: privacy.privacyScanCacheStats,
  sanitizeText: privacy.sanitizeText,
  sanitizePackFile: privacy.sanitizePackFile,
  validateSanitizedStructured: privacy.validateSanitizedStructured,
  sameLineShape: privacy.sameLineShape,
  backfillText: privacy.backfillText,
  retainedPlaceholderCounts: privacy.retainedPlaceholderCounts,
  expectedTargetSha: restore.expectedTargetSha,

  // 打包 / 包管理
  createPack: pack.createPack,
  buildManifest: pack.buildManifest,
  publicManifest: pack.publicManifest,
  listPacks: pack.listPacks,
  getPackInfo: pack.getPackInfo,
  renamePack: pack.renamePack,
  deletePack: pack.deletePack,
  packsDiskUsage: pack.packsDiskUsage,
  validatePackName: pack.validatePackName,
  packSummaryName: pack.packSummaryName,

  // 解包
  readManifestFromZip: archive.readManifestFromZip,
  validateArchiveMembers: archive.validateArchiveMembers,
  assertNoLinkEntries: archive.assertNoLinkEntries,
  extractZip: archive.extractZip,

  // 恢复
  diffRestore: restore.diffRestore,
  applyRestore: restore.applyRestore,
  importRestore: restore.importRestore,
  listRestoreBackups: restore.listRestoreBackups,
  rollbackRestoreBackup: restore.rollbackRestoreBackup,

  // 作业
  startCreateJob: jobs.startCreateJob,
  startRestoreJob: jobs.startRestoreJob,
  getJob: jobs.getJob,
  listJobs: jobs.listJobs,
  cancelJob: jobs.cancelJob,
  jobView: jobs.jobView,

  // 回收站
  recycleFileNative: recycle.recycleFileNative,
  recycleFileWindows: recycle.recycleFileWindows,
  recycleFileMac: recycle.recycleFileMac,
  recycleFileLinux: recycle.recycleFileLinux,
  buildMacRecycleArgs: recycle.buildMacRecycleArgs,
  escapeAppleScriptString: recycle.escapeAppleScriptString,
  buildTrashInfo: recycle.buildTrashInfo,
  encodeTrashPath: recycle.encodeTrashPath,
  formatTrashDate: recycle.formatTrashDate,
  trashDataHome: recycle.trashDataHome,

  // 加密
  isEncryptedBuffer: cryptoMod.isEncryptedBuffer,
  encryptZipBuffer: cryptoMod.encryptZipBuffer,
  decryptZipBuffer: cryptoMod.decryptZipBuffer,

  // zip
  buildZip: zip.buildZip,
  readZipFile: zip.readZipFile,
  readEntryData: zip.readEntryData,

  // Web API / CLI（api-contract 测试通过 I = mod.__internals 访问）
  createPackApiGuard: api.createPackApiGuard,
  createPackApiHandler: api.createPackApiHandler,
  registerPackCommand: cli.registerPackCommand,
}
