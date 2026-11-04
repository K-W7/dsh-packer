// ============================================================================
// constants.mjs —— 全插件唯一的常量来源
//
// 约定：任何"数值上限 / 字面量 / 路径 / 枚举"都必须定义在这里，业务模块不得硬编码。
// 好处有三：① 改一处即全局生效；② release-check 可以断言常量与文档一致；
// ③ 新贡献者看这个文件就能知道系统的边界在哪。
// ============================================================================
import path from 'node:path'
import os from 'node:os'

/** 清单结构版本（manifest.schemaVersion）；破坏性变更才递增 */
export const SCHEMA_VERSION = 1

/** 工具标识（写进 manifest.tool，恢复端据此识别包来源） */
export const TOOL_NAME = 'dsh-packer'

// ---------- 运行时路径（import 时求值，与既有行为一致） ----------

export const DSH_HOME = process.env.DSH_HOME || path.join(os.homedir(), '.dsh')
export const PACKS_DIR = process.env.DSH_PACKS_DIR || path.join(DSH_HOME, 'packs')
export const MEMORY_ROOT = process.env.DSH_MEMORY_ROOT || path.join(DSH_HOME, 'memory')
export const BIOMEMORY_DIR = process.env.DSH_BIOMEMORY_DIR || path.join(DSH_HOME, 'biomemory')
export const BIOMEMORY_DB = path.join(BIOMEMORY_DIR, 'biomemory.db')

/** 恢复备份目录（相对 PACKS_DIR） */
export const RESTORE_BACKUP_DIR = '.restore-backups'

// ---------- 永不打包 ----------

/** 本地身份 / 凭据文件：遍历任何模块时一律跳过，不允许进入任何包 */
export const NEVER_PACK = ['.credentials.yaml', '.anonymous-user-id']

/**
 * 运行中的 SQLite 数据库（含 WAL / SHM / journal）：默认不打包、不恢复。
 * 复制被 DSH 持有的 WAL 库可能得到半写状态。
 */
export const DB_FILE_RE = /(^|\.)db(-wal|-shm|-journal)?$|\.sqlite3?$/i

// ---------- 打包模式与模块 ----------

export const MODES = ['migrate', 'share']

/** 分享模式服务端强制拦截的敏感模块（不能只靠 UI 置灰） */
export const SENSITIVE_MODULES = [
  'sessions', 'attachments', 'profiles', 'settings', 'presets', 'memory', 'memoryDb', 'plugins',
]

/** 恢复策略白名单（fail-closed：非法值 400 bad_strategy，不再退化成 overwrite） */
export const RESTORE_STRATEGIES = ['overwrite', 'skip', 'merge']

/** 结构化配置文件：禁止通用 append merge（拼接即损坏） */
export const STRUCTURED_EXT = ['.json', '.yaml', '.yml', '.jsonl', '.toml']

// ---------- 包文件 ----------

/** 包文件名：.zip（明文）或 .pkenc（加密）；其余一律不当成包 */
export const PACK_EXT_RE = /\.(zip|pkenc)$/i
/** 包名长度上限 */
export const PACK_NAME_MAX = 120

// ---------- 作业 ----------

/** 内存最多保留的作业条数 */
export const JOB_MAX = 20
/** 终态作业保留时长（毫秒） */
export const JOB_RETAIN_MS = 5 * 60 * 1000

// ---------- IO ----------

/** 有界并发：既不串行等 I/O，也不为大批量文件同时打开上千个句柄 */
export const IO_CONCURRENCY = 16
/** 流式哈希的分块大小 */
export const HASH_CHUNK_BYTES = 1024 * 1024

/** 送系统回收站的外部命令调用超时（毫秒）：超时即视为失败并降级 */
export const RECYCLE_TIMEOUT_MS = 30_000

/** 解包单成员解压后的体积上限（防 zip bomb），默认 512 MB */
export const MAX_ENTRY_BYTES = 512 * 1024 * 1024
/** 解包总体积上限，默认 2 GB */
export const MAX_TOTAL_BYTES = 2 * 1024 * 1024 * 1024

// ---------- Web API 默认限额 ----------

export const DEFAULT_MAX_BODY_BYTES = 8 * 1024 * 1024
export const DEFAULT_RATE_LIMIT = 60
export const DEFAULT_RATE_WINDOW_MS = 60_000
/** 速率窗口跟踪的客户端键数量上限（内存有界） */
export const MAX_RATE_KEYS = 4096
export const TOKEN_HEADER = 'x-dsh-packer-token'
export const TOKEN_GLOBAL = '__DSH_PACKER_TOKEN__'

// ---------- 平台能力 ----------

/** 有系统回收站的平台（其余平台降级为永久删除并回报 warning） */
export const TRASH_PLATFORMS = new Set(['win32', 'darwin', 'linux'])
/** 宿主能提供系统文件选择框的平台 */
export const FILE_PICKER_PLATFORMS = new Set(['win32', 'darwin', 'linux'])

// ---------- 隐私：kind 枚举与占位符 ----------

/** finding.kind 的固定枚举（契约字段，UI 按它分组） */
export const PRIVACY_KINDS = ['path', 'userpath', 'unc', 'unix', 'credential', 'key', 'personal']

/** kind → 固定占位符（恢复端按这些字面量回填 / 统计，勿改） */
export const KIND_PLACEHOLDER = {
  path: '<本机路径>',
  userpath: '<用户目录>',
  unc: '<UNC路径>',
  unix: '<Unix路径>',
  credential: '<已移除的密钥>',
  key: '<已移除的密钥>',
  personal: '<个人信息>',
}

/**
 * 隐私扫描结果缓存的文件条目上限（LRU 近似：满则丢最早的一条）。
 * 「扫描 → 打包」是两次 /create，同一批文件会被扫两遍；缓存以内容指纹为键，
 * 只省掉重复读盘与重复正则，不改变任何结论。
 */
export const PRIVACY_SCAN_CACHE_MAX = 512

/** 恢复时能自动回填的占位符 */
export const PLACEHOLDER_HOME = '<用户目录>'
export const PLACEHOLDER_USER = '<用户名>'
/** 无法自动回填、保留原样并计入 warnings 的占位符 */
export const RETAINED_PLACEHOLDERS = [
  '<本机路径>', '<UNC路径>', '<Unix路径>', '<已移除的密钥>', '<个人信息>',
]

/**
 * 结构敏感字符：出现在「被替换掉的那段」里，说明这段可能跨了语法边界
 * （引号里再出现引号、JSON/YAML 的括号逗号、注释符、HTML 尖括号等）——
 * 这种情况一律跳过该处替换并记 warning：宁可不脱敏，也不产出坏文件。
 * 刻意不含 `:`：盘符 `C:` 必须能替换。
 */
export const SANITIZE_UNSAFE_CHARS = /["'`{}[\],|#&*!<>]/

// ---------- 文本判定 ----------

/** 已知文本后缀：直接按文本处理 */
export const TEXT_EXT = new Set([
  '.md', '.yaml', '.yml', '.json', '.js', '.mjs', '.cjs', '.txt', '.jsonl', '.log',
  '.py', '.ps1', '.ts', '.toml', '.patch', '.sh', '.bash', '.zsh', '.env',
])

/** 明确二进制后缀：直接跳过扫描（不做内容嗅探） */
export const BINARY_EXT = new Set([
  '.zstd', '.zip', '.gz', '.tar', '.tgz', '.bz2', '.xz', '.7z', '.rar',
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.pdf', '.db', '.db-wal', '.db-shm',
  '.sqlite', '.sqlite3', '.exe', '.dll', '.node', '.so', '.dylib', '.wasm', '.bin',
  '.woff', '.woff2', '.ttf', '.otf', '.mp3', '.mp4', '.webm',
])

/** 无扩展名但确定是文本的常见文件（如 .env），必须纳入扫描 */
export const TEXT_BASENAMES = new Set(['.env', 'Dockerfile', 'Makefile', 'LICENSE', 'Procfile'])

/** node_modules 里绝不能当「插件本体」带走的东西 */
export const PACKAGE_SKIP_NAMES = new Set(['.pnpm', '.bin', '.modules.yaml', '.cache'])
