// ============================================================================
// logger.mjs —— 结构化日志
//
// 插件跑在宿主进程里，不能用 console.log 乱喷（会污染 DSH 自己的输出），
// 也不需要引入日志库（零运行时依赖是硬约束）。所以这里做一层薄封装：
//   - 统一前缀 `[dsh-packer]`，宿主侧可据此过滤；
//   - 分级：debug（默认关）/ info / warn / error；
//   - 结构化：附加字段以 key=value 形式输出，便于检索；
//   - 出网安全：日志不落盘，但错误文案在出网前仍要过 redactPaths。
//
// 开启 debug：部署时设环境变量 DSH_PACKER_DEBUG=1。
// ============================================================================

const PREFIX = '[dsh-packer]'
const DEBUG_ENABLED = process.env.DSH_PACKER_DEBUG === '1' || process.env.DSH_PACKER_DEBUG === 'true'

/**
 * 把附加字段格式化成 `k=v` 片段；值是对象时转 JSON，过长截断。
 * @param {Record<string, unknown>} [fields]
 */
function formatFields(fields) {
  if (!fields) return ''
  const parts = []
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined || v === null) continue
    const text = typeof v === 'object' ? JSON.stringify(v) : String(v)
    parts.push(`${k}=${text.length > 200 ? `${text.slice(0, 200)}…` : text}`)
  }
  return parts.length ? ` ${parts.join(' ')}` : ''
}

/** 内部写出：debug/info 走 log，warn/error 走对应级别 */
function emit(level, message, fields) {
  const line = `${PREFIX} ${level} ${message}${formatFields(fields)}`
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.log(line)
}

export const logger = {
  /** 调试级：默认静默，设 DSH_PACKER_DEBUG=1 打开 */
  debug(message, fields) {
    if (DEBUG_ENABLED) emit('debug', message, fields)
  },
  info(message, fields) {
    emit('info', message, fields)
  },
  warn(message, fields) {
    emit('warn', message, fields)
  },
  error(message, fields) {
    emit('error', message, fields)
  },
  /**
   * 记录"回调/旁路失败"：这类错误不该打断主流程，但也不能静默吞掉。
   * @param {string} scope 出错位置（如 'progress-hook'）
   * @param {unknown} err
   */
  nonFatal(scope, err) {
    emit('warn', `${scope} 失败（已忽略，不影响主流程）`, { error: String(err?.message ?? err) })
  },
  /** 计时：返回 stop()，用于各阶段耗时统计 */
  timer(label) {
    const start = Date.now()
    return () => Date.now() - start
  },
  get debugEnabled() {
    return DEBUG_ENABLED
  },
}
