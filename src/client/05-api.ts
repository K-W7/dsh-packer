
// src/client/api.ts
var ApiFailure = class extends Error {
  code;
  status;
  constructor(message, code, status) {
    super(message);
    this.name = "ApiFailure";
    this.code = code;
    this.status = status;
  }
};
async function apiFetch(path, options = {}) {
  const token = typeof __DSH_PACKER_TOKEN__ === "string" ? __DSH_PACKER_TOKEN__ : "";
  const headers = token ? { "x-dsh-packer-token": token } : {};
  const init = { credentials: "same-origin", method: options.method || "GET", headers };
  if (options.body !== void 0) {
    init.body = JSON.stringify(options.body);
    headers["Content-Type"] = "application/json";
  }
  if (options.signal) init.signal = options.signal;
  let response;
  try {
    response = await fetch("/packer/api" + path, init);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiFailure(error instanceof Error ? error.message : String(error), "network");
  }
  const data = await response.json().catch(() => null);
  if (!data || data.ok !== true) {
    throw new ApiFailure(data?.error || "HTTP " + response.status, data?.code || "http_" + response.status, response.status);
  }
  return data;
}
