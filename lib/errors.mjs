// ============================================================================
// errors.mjs —— 统一错误模型
//
// 为什么单独一个文件：错误码是给调用方（HTTP 层 / CLI / 前端）看的契约。
// 散落在各处就会漂移，集中之后才能做到「同一个错误码在任何入口语义一致」，
// 也才能被 release-check 断言「错误码表与文档一致」。
//
// 三类错误：
//   ApiError      —— 可直接映射到 HTTP 状态 + 稳定 code（前端按 code 分支）
//   PackerError   —— 领域错误（打包/恢复失败），默认映射 500，code 固定
//   JobCancelled  —— 作业取消信号，只在文件边界抛出，由作业运行器捕获
// ============================================================================

/** 全部对外错误码；新增错误码必须同时补进这里，否则 release-check 会报未知码 */
export const ERROR_CODES = {
  bad_request: 400,
  bad_name: 400,
  bad_mode: 400,
  bad_modules: 400,
  bad_strategy: 400,
  bad_dir: 400,
  bad_password: 400,
  weak_password: 400,
  share_scope: 400,
  unauthorized: 401,
  forbidden: 403,
  pack_not_found: 404,
  job_not_found: 404,
  not_found: 404,
  pack_exists: 409,
  payload_too_large: 413,
  rate_limited: 429,
  internal: 500,
}

/** 带 HTTP 状态与稳定错误码的拒绝原因 */
export class ApiError extends Error {
  /**
   * @param {number} status HTTP 状态码
   * @param {keyof typeof ERROR_CODES} code 稳定错误码
   * @param {string} message 面向用户的中文说明
   */
  constructor(status, code, message) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

/** 按错误码构造（状态由码表推导，避免 status 与 code 写反） */
export function apiError(code, message) {
  return new ApiError(ERROR_CODES[code] ?? 500, code, message)
}

/** 领域错误：打包 / 恢复过程中的业务失败 */
export class PackerError extends Error {
  /**
   * @param {string} message 面向用户的中文说明
   * @param {{ code?: string, cause?: unknown }} [options]
   */
  constructor(message, options = {}) {
    super(message)
    this.name = 'PackerError'
    this.code = options.code ?? 'internal'
    this.cause = options.cause
  }
}

/** 作业取消：只在文件边界抛出，由 createPack / applyRestore 捕获后清理半成品 */
export class JobCancelled extends Error {
  constructor(message = '任务已取消') {
    super(message)
    this.name = 'JobCancelled'
    this.code = 'cancelled'
  }
}

/** 判定是否 ApiError（不用 instanceof，避免多份模块实例导致 instanceof 失效） */
export function isApiError(err) {
  return Boolean(err) && typeof err.status === 'number' && typeof err.code === 'string'
}

/** 判定是否取消信号 */
export function isCancelled(err) {
  return Boolean(err) && err.code === 'cancelled'
}
