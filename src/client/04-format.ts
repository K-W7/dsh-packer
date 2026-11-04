
// src/client/format.ts
var numOr = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
var formatBytes = (value) => {
  if (value === void 0 || value === null || Number.isNaN(Number(value))) return copy.empty;
  const units = ["B", "KB", "MB", "GB"];
  let size = Number(value);
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${unit === 0 ? size : size.toFixed(1)} ${units[unit]}`;
};
var formatTime = (iso) => {
  if (!iso) return null;
  const date = new Date(String(iso));
  if (Number.isNaN(date.getTime())) return String(iso);
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
var fill = (template, values) => String(template).replace(
  /\{(\w+)\}/g,
  (match, key) => values && key in values ? String(values[key]) : match
);
var maskHome = (value) => String(value || "").replace(/^[A-Za-z]:[\\/]Users[\\/][^\\/]+/i, "~").replace(/^\/(?:home|Users)\/[^/]+/i, "~");
var reduceMotion = () => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var groupOfModule = (name) => GROUPS.find((group) => group.modules.includes(String(name))) || null;
var moduleLabel = (name) => {
  const group = groupOfModule(name);
  return group ? group.label : copy.otherContent;
};
var infoPath = (name, password) => "/packs/" + encodeURIComponent(name) + "/info" + (password ? "?password=" + encodeURIComponent(password) : "");
var errText = (error) => error ? `${error.code || "error"} · ${error.message || ""}`.trim() : "";
var withDetail = (label, detail) => detail ? `${label}（${detail}）` : label;
function detectDark() {
  if (typeof document === "undefined") return false;
  const html = document.documentElement.getAttribute("data-ds-dark-theme");
  if (html !== null) return html !== "light";
  const body = document.body && document.body.getAttribute("data-ds-dark-theme");
  if (body !== null && body !== void 0) return body !== "light";
  if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  return false;
}
