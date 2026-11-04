window.__ModuleLoader__.load({
	id: "dsh-packer",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");

"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.ts
var index_exports = {};
__export(index_exports, {
  PackerSettingsPage: () => PackerSettingsPage,
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);

// src/client/copy.ts
var GROUPS = [
  { id: "skills", label: "技能库", desc: "自定义技能与记忆机制 skill", modules: ["skills"] },
  { id: "plugins", label: "已安装插件", desc: "插件本体与依赖，换机器必须带上", modules: ["plugins"] },
  { id: "memory", label: "记忆数据库", desc: "记忆条目与审计记录，恢复前须退出 DSH", modules: ["memoryDb", "memory"] },
  { id: "sessions", label: "会话记录", desc: "历史对话与其中的图片、附件（附件通常最大）", modules: ["sessions", "attachments"] },
  { id: "config", label: "配置与预设", desc: "全局设置、档案与 Agent 预设", modules: ["profiles", "settings", "presets"] }
];
var PRIVACY_KINDS = { path: "路径", userpath: "用户路径", unc: "网络路径", unix: "Unix 路径", credential: "凭据", key: "密钥", personal: "个人信息" };
var copy = {
  title: "配置打包器",
  subtitle: "把本机的 DSH 配置打包备份，换机器或换平台时恢复。",
  loading: "正在读取本机配置…",
  unavailable: "暂时无法读取打包器状态",
  retry: "重试",
  empty: "—",
  fieldMissing: "接口未返回",
  unknown: "未知",
  otherContent: "其他内容",
  packsDir: "包目录",
  usage: "占用",
  copied: "已复制",
  copyFailed: "无法写入剪贴板，请手动复制",
  copyAction: "复制",
  close: "关闭",
  cancel: "取消",
  save: "保存",
  working: "处理中…",
  secPacks: "已有的配置包",
  colName: "包名",
  colTime: "时间",
  colContent: "内容",
  colSize: "大小",
  colEncrypted: "是否加密",
  colActions: "操作",
  packsEmptyStrong: "还没有配置包",
  packsEmptyBody: "点下方「开始打包」生成第一个（约 37 MB）。",
  packsHint: "按生成时间倒序排列；已加密的包在恢复与查看时都需要口令。",
  packItemsMore: " 等 {n} 项",
  packFiles: "{n} 文件",
  encryptedYes: "已加密",
  encryptedNo: "未加密",
  actionRestore: "恢复",
  actionInfo: "包信息",
  actionDelete: "删除",
  actionRename: "改名",
  secContents: "打包内容",
  contentsHint: "勾选这次要带走的内容；「已安装插件」体积最大。",
  colContentName: "内容",
  colContentDesc: "说明",
  colContentSize: "体积",
  colContentTake: "是否带上",
  takenOn: "已带上",
  takenOff: "不带",
  contentsEmptyStrong: "没有读到可打包的内容",
  contentsEmptyBody: "DSH 配置目录里还没有内容，或服务端没有返回清单。可以点下方「重试」刷新状态。",
  total: "合计",
  totalMeta: "{n} 组内容 · {f} 个文件",
  contentsReminder: "换机器必须带已安装插件；只给别人时去掉会话记录、已安装插件、记忆数据库和配置与预设。",
  secOptions: "打包选项",
  packMethod: "打包方式",
  optKeep: "原样打包",
  optKeepHint: "内容保真，适合换机器迁移；包内可能带本机路径。",
  optSanitize: "清理后打包（脱敏）",
  optSanitizeHint: "只改包内副本：路径换成占位符、密钥移除；本机源文件不动。",
  optEncrypt: "加密（设置口令）",
  optPassword: "口令",
  optPasswordHint: "至少 8 位；恢复这个包时需要同一口令。",
  passwordPlaceholder: "至少 8 位",
  weakPassword: "口令至少 8 位",
  noteLabel: "备注",
  notePlaceholder: "给这个包加一句说明（可选）",
  noteHint: "备注会写进包内清单，方便以后认出这个包。",
  btnCreate: "开始打包",
  creating: "打包中…",
  btnPreview: "先预览",
  previewing: "预览中…",
  previewFailed: "预览失败",
  createFailed: "打包失败",
  cancelled: "已取消，没有留下半成品包。",
  cancelFailed: "取消失败",
  noSelection: "还没有勾选任何内容，至少选一项才能打包。",
  previewSummary: "预览：{n} 个文件 · 合计 {size}",
  scanClean: "扫描结论：未发现隐私敏感内容。",
  scanFoundKeep: "扫描结论：发现 {n} 处隐私内容（{kinds}），原样打包会保留这些内容；建议改选「清理后打包（脱敏）」或加密。",
  scanFoundSanitize: "扫描结论：发现 {n} 处隐私内容（{kinds}），打包时会替换成占位符。",
  unreadable: "{n} 个文件读不出内容，已排除在包外。",
  progress: "已完成 {done} / {total}",
  progressUnknown: "进度未知",
  phaseCollect: "收集文件",
  phaseHash: "计算指纹",
  phaseScan: "隐私扫描",
  phaseZip: "压缩",
  phaseWrite: "写入磁盘",
  phasePrepare: "准备恢复",
  phaseApply: "写入文件",
  phaseRollback: "撤回",
  phaseDone: "完成",
  packResultTitle: "打包结果",
  resultColItem: "结果项",
  resultColCount: "数量",
  resultColNote: "说明",
  resultFiles: "文件",
  resultFilesNote: "写进配置包的内容文件数",
  resultSize: "合计",
  resultSizeNote: "配置包体积",
  resultSanitize: "脱敏",
  resultSanitizeNote: "包内副本已替换的隐私命中",
  resultNoSanitize: "未脱敏",
  resultNoSanitizeNote: "包内保留原样内容",
  resultEncrypt: "加密",
  resultEncryptNote: "恢复时需要口令",
  resultNoEncryptNote: "没有口令保护",
  redactions: "{n} 处",
  savedPath: "保存路径",
  fingerprint: "SHA-256 指纹",
  secRestore: "恢复",
  restoreHint: "选一个已有的配置包，或直接填包文件路径，先做导入检查再恢复。",
  restoreSource: "配置包",
  restorePlaceholder: "请选择配置包…",
  restoreNoPack: "还没有配置包",
  pathLabel: "或填包路径",
  pathPlaceholder: "例如 C:\\Users\\…\\dsh-packer-…-migrate.zip",
  pathPlaceholderMac: "例如 /Users/…/dsh-packer-…-migrate.zip",
  pathPlaceholderLinux: "例如 /home/…/dsh-packer-…-migrate.zip",
  pathPlaceholderHarmony: "例如 /storage/Users/currentUser/DSH/dsh-packer-…-migrate.zip",
  pathHint: "支持 .zip 与 .pkenc；选择下拉里的包时这里留空即可。",
  pathPrimaryHint: "当前平台请直接填写包路径（本机不提供文件选择框）。",
  importCheck: "导入检查",
  importing: "检查中…",
  importFailed: "导入检查失败",
  importNoPack: "请先选择配置包或填写路径",
  importHint: "还没有做导入检查。检查后会列出包内内容与本机的差异。",
  diffTitle: "差异对比",
  diffColContent: "内容",
  diffColPack: "包内",
  diffColLocal: "本机",
  diffColAction: "处理方式",
  diffAdded: "新增",
  diffChanged: "变更",
  diffSame: "相同",
  diffSkipped: "跳过",
  fileCount: "{n} 个文件",
  localNone: "本机没有",
  diffActionOff: "跳过（未勾选）",
  diffActionOverwrite: "覆盖变更 {c} 个 · 新增 {a} 个",
  diffActionSkip: "跳过变更 {c} 个 · 新增 {a} 个",
  diffActionMerge: "合并写入 {n} 个",
  restoreScope: "恢复范围",
  includeDb: "连记忆数据库一起恢复（需先退出 DSH）",
  includeDbWarn: "会用包内的记忆数据库覆盖本机的，最近的记忆可能丢失；恢复前会自动备份，可一键撤回。",
  strategy: "冲突处理方式",
  strategyOverwrite: "覆盖",
  strategyOverwriteHint: "用包内文件替换本机同名文件",
  strategySkip: "跳过",
  strategySkipHint: "保留本机文件，只写入本机没有的",
  strategyMerge: "合并",
  strategyMergeHint: "按目录合并，保留本机独有的文件",
  btnApply: "开始恢复",
  applying: "恢复中…",
  applyFailed: "恢复失败",
  applyNoImport: "先做导入检查，再开始恢复。",
  noModules: "包内没有可恢复的内容",
  restoreResultTitle: "恢复结果",
  statOverwritten: "覆盖",
  statAdded: "新增",
  statSkipped: "跳过",
  statPending: "待确认项",
  statFailed: "失败",
  noteOverwritten: "被包内文件替换",
  noteAdded: "本机原来没有",
  noteSkipped: "已存在且按所选方式保留",
  notePending: "默认没恢复的项与没自动回填的占位符",
  noteFailed: "逐条原因见下方",
  aborted: "恢复被取消：本次已写入的文件已按备份撤回。",
  excludedTitle: "默认没有恢复的项",
  placeholderTitle: "需要人工确认的占位符",
  failuresTitle: "失败明细",
  backupDir: "恢复前备份",
  backupDirMissing: "本次没有返回备份目录，无法撤回",
  rollback: "一键撤回",
  rollbackTitle: "撤回本次恢复",
  rollbackMessage: "按恢复前的备份把文件还原到恢复前的状态？",
  rollbackFailed: "撤回失败",
  rollbackDone: "已撤回：{restored} 个文件还原成功，{failed} 个失败",
  infoTitle: "包信息",
  infoLoading: "正在读取包信息…",
  infoFailed: "读取包信息失败",
  infoFiles: "包内文件",
  infoVerifyOk: "完整性校验通过：{n} 个文件指纹一致",
  infoVerifyFail: "完整性校验失败：{n} 个文件不一致",
  infoVerifyMissing: "接口未返回完整性校验结果",
  infoSanitize: "已脱敏 {n} 处",
  infoNote: "备注：{note}",
  passwordDialogTitle: "加密包口令",
  passwordDialogHint: "该包已加密，需要口令才能读取内容。",
  passwordWrong: "口令不正确",
  passwordFailed: "口令校验失败",
  passwordSubmit: "解锁",
  renameTitle: "重命名配置包",
  renameLabel: "新名称（含扩展名）",
  passwordEmpty: "请输入口令",
  renameInvalid: "名称不能包含路径分隔符或 ..",
  renameDone: "已改名",
  renameFailed: "改名失败",
  deleteTitle: "删除配置包",
  deleteMessage: "删除「{name}」？包会进入{trash}，可在{trash}找回。",
  deleteMessageNoTrash: "删除「{name}」？当前平台没有系统回收站，删除后不可恢复。",
  deleteSubmit: "删除",
  deleteDone: "已删除",
  deleteDoneRecycle: "已移入{trash}",
  deleteFailed: "删除失败",
  more: "另有 {n} 条"
};
var PHASE_KEY = { collect: "phaseCollect", hash: "phaseHash", scan: "phaseScan", zip: "phaseZip", write: "phaseWrite", prepare: "phasePrepare", apply: "phaseApply", rollback: "phaseRollback", done: "phaseDone" };
var phaseLabel = (phase) => copy[PHASE_KEY[phase]] || copy.unknown;
function text() {
  return copy;
}

// src/client/styles.ts
var styles = `
.pk-page{
  --pk-primary:#F59E0B;--pk-on-primary:#1A1D23;--pk-bg:#FFFFFF;--pk-surface:#F7F8FA;--pk-surface-2:#EDEFF3;--pk-text:#1A1A1A;--pk-muted:#6B7280;--pk-border:#E3E6EB;
  --pk-success:#2E7D32;--pk-warning:#ED6C02;--pk-error:#C62828;--pk-s1:4px;--pk-s2:8px;--pk-s3:12px;--pk-s4:16px;--pk-s6:24px;--pk-s8:32px;
  --pk-r1:4px;--pk-r2:8px;--pk-r3:12px;--pk-r4:16px;--pk-font:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',Roboto,sans-serif;
  --pk-mono:ui-monospace,SFMono-Regular,Consolas,'Courier New',monospace;--pk-shadow:0 1px 2px rgba(16,18,22,.06);--pk-shadow-lg:0 16px 40px rgba(16,18,22,.20);--pk-scrim:rgba(15,17,21,.45);
  display:flex;flex-direction:column;gap:var(--pk-s4);padding:var(--pk-s6);border:1px solid var(--dsw-alias-border-l2,var(--pk-border));border-radius:var(--pk-r4);
  background:var(--dsw-alias-bg-layer-1,var(--pk-bg));color:var(--dsw-alias-label-primary,var(--pk-text));font-family:var(--pk-font);font-size:14px;line-height:1.7;
}
.pk-page[data-dsh-theme="dark"]{
  --pk-primary:#FBBF24;--pk-on-primary:#1A1D23;--pk-bg:#0F1115;--pk-surface:#1A1D23;--pk-surface-2:#22262E;--pk-text:#E8EAED;--pk-muted:#9AA0A6;--pk-border:#2A2E37;
  --pk-success:#4ADE80;--pk-warning:#FB923C;--pk-error:#F87171;--pk-shadow:0 1px 2px rgba(0,0,0,.5);--pk-shadow-lg:0 16px 40px rgba(0,0,0,.6);--pk-scrim:rgba(0,0,0,.6);
}
.pk-page h1,.pk-page h2,.pk-page h3,.pk-page h4{margin:0;color:var(--pk-text);line-height:1.6}
.pk-page button{font-family:var(--pk-font)}
.pk-page :focus-visible{outline:2px solid var(--pk-primary);outline-offset:2px}
.pk-head{display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:var(--pk-s3)}
.pk-head-text{min-width:0}
.pk-title{font-size:20px;font-weight:600}
.pk-sub{margin:var(--pk-s1) 0 0;font-size:12px;color:var(--dsw-alias-label-secondary,var(--pk-muted))}
.pk-status{display:flex;flex-wrap:wrap;align-items:center;gap:var(--pk-s2);font-size:12px;color:var(--dsw-alias-label-secondary,var(--pk-muted));min-width:0}
.pk-status-path{display:inline-flex;align-items:center;gap:var(--pk-s2);max-width:100%;min-height:24px;margin-left:calc(-1 * var(--pk-s2));padding:0 var(--pk-s2);border:1px solid transparent;border-radius:var(--pk-r1);background:transparent;color:inherit;font-size:12px;cursor:pointer;transition:background-color 120ms ease,color 120ms ease}
.pk-status-path:hover:not(:disabled){background:var(--pk-surface);color:var(--pk-text)}
.pk-status-path:disabled{cursor:default}
.pk-status-label{white-space:nowrap}
.pk-status-path .pk-mono{color:var(--pk-text);font-weight:500}
.pk-copied{color:var(--pk-success);white-space:nowrap}
.pk-sep{opacity:.5}
.pk-body{display:flex;flex-direction:column;gap:var(--pk-s4);min-width:0}
.pk-section{display:flex;flex-direction:column;gap:var(--pk-s3);padding:var(--pk-s4);border:1px solid var(--pk-border);border-radius:var(--pk-r3);background:var(--dsw-alias-bg-layer-1,var(--pk-bg));box-shadow:var(--pk-shadow);min-width:0}
.pk-section-title{display:flex;align-items:center;gap:var(--pk-s2);font-size:16px;font-weight:600}
.pk-section-title::before{content:"";width:3px;height:14px;flex:none;border-radius:var(--pk-r1);background:color-mix(in srgb,var(--pk-text) 26%,var(--pk-border))}
.pk-hint{margin:0;font-size:12px;line-height:1.7;color:var(--dsw-alias-label-secondary,var(--pk-muted))}
.pk-hint.warn{color:var(--pk-warning)}
.pk-label{font-size:12px;font-weight:600;color:var(--pk-text)}
.pk-line{margin:0;font-size:12px;line-height:1.7;color:var(--dsw-alias-label-secondary,var(--pk-muted))}
.pk-line.ok{color:var(--pk-success)}
.pk-line.warn{color:var(--pk-warning)}
.pk-line.err{color:var(--pk-error);font-weight:600}
.pk-table-wrap{overflow-x:auto;min-width:0}
.pk-table{width:100%;border-collapse:collapse;font-size:14px}
.pk-table th{font-size:12px;font-weight:600;text-align:left;padding:var(--pk-s1) var(--pk-s2);border-bottom:1px solid var(--pk-border);color:var(--dsw-alias-label-secondary,var(--pk-muted));white-space:nowrap}
.pk-table td{padding:var(--pk-s2);border-bottom:1px solid var(--pk-border);vertical-align:top;line-height:1.6}
.pk-table tbody tr:last-child td{border-bottom:0}
.pk-table tbody tr:hover{background:var(--pk-surface)}
.pk-table .num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.pk-desc{font-size:12px;color:var(--dsw-alias-label-secondary,var(--pk-muted))}
.pk-row-inline{display:flex;flex-wrap:wrap;align-items:center;gap:var(--pk-s1)}
.pk-total{display:flex;flex-wrap:wrap;align-items:baseline;gap:var(--pk-s2);padding:var(--pk-s2) var(--pk-s3);border-radius:var(--pk-r1);background:var(--pk-surface)}
.pk-total strong{font-size:16px;font-variant-numeric:tabular-nums}
.pk-total-meta{font-size:12px;color:var(--dsw-alias-label-secondary,var(--pk-muted))}
.pk-row{display:flex;flex-wrap:wrap;align-items:center;gap:var(--pk-s2)}
.pk-grow{flex:1 1 220px;width:auto}
.pk-field{display:flex;flex-direction:column;gap:var(--pk-s2);min-width:0}
.pk-field>label,.pk-field>.pk-label{font-size:12px;font-weight:600;color:var(--pk-text)}
.pk-input,.pk-select{width:100%;height:40px;box-sizing:border-box;padding:0 var(--pk-s3);border:1px solid var(--pk-border);border-radius:var(--pk-r2);background:var(--dsw-alias-bg-layer-1,var(--pk-bg));color:var(--pk-text);font-family:var(--pk-font);font-size:14px;min-width:0}
.pk-input::placeholder{color:var(--dsw-alias-label-secondary,var(--pk-muted))}
.pk-input:focus,.pk-select:focus{border-color:var(--pk-primary)}
.pk-checks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--pk-s1)}
.pk-check{display:flex;align-items:center;gap:var(--pk-s2);padding:var(--pk-s1) var(--pk-s2);border-radius:var(--pk-r1);font-size:14px;cursor:pointer;min-width:0}
.pk-check:hover{background:var(--pk-surface)}
.pk-check input{width:16px;height:16px;flex:none;margin:0;accent-color:var(--pk-primary)}
.pk-choices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--pk-s2)}
.pk-choices.two{grid-template-columns:repeat(2,minmax(0,1fr))}
.pk-choice{display:flex;align-items:flex-start;gap:var(--pk-s2);padding:var(--pk-s2) var(--pk-s3);border:1px solid var(--pk-border);border-radius:var(--pk-r2);background:var(--pk-surface);font-size:14px;cursor:pointer;transition:background-color 120ms ease,border-color 120ms ease}
.pk-choice:hover{border-color:color-mix(in srgb,var(--pk-text) 18%,var(--pk-border))}
.pk-choice.chosen{border-color:var(--pk-primary);background:color-mix(in srgb,var(--pk-primary) 10%,var(--pk-surface))}
.pk-choice input{width:16px;height:16px;flex:none;margin:2px 0 0;accent-color:var(--pk-primary)}
.pk-choice-hint{display:block;font-size:12px;line-height:1.7;color:var(--dsw-alias-label-secondary,var(--pk-muted))}
.pk-btn{display:inline-flex;align-items:center;justify-content:center;gap:var(--pk-s1);min-height:36px;padding:0 var(--pk-s4);border:1px solid var(--pk-border);border-radius:var(--pk-r2);background:var(--dsw-alias-bg-layer-1,var(--pk-bg));color:var(--pk-text);font-size:14px;font-weight:600;cursor:pointer;transition:background-color 120ms ease,border-color 120ms ease,filter 120ms ease}
.pk-btn:hover:not(:disabled){background:var(--pk-surface)}
.pk-btn:disabled{opacity:.5;cursor:not-allowed}
.pk-btn.primary{background:var(--pk-primary);border-color:var(--pk-primary);color:var(--pk-on-primary)}
.pk-btn.primary:hover:not(:disabled){background:var(--pk-primary);filter:brightness(1.05)}
.pk-btn.danger{color:var(--pk-error);border-color:color-mix(in srgb,var(--pk-error) 40%,var(--pk-border))}
.pk-btn.danger:hover:not(:disabled){background:color-mix(in srgb,var(--pk-error) 8%,transparent)}
.pk-btn.tiny{min-height:28px;padding:0 var(--pk-s2);font-size:12px;font-weight:500}
.pk-copy{display:inline-flex;align-items:center;gap:var(--pk-s1)}
/* 只给读屏的文本：视觉上不可见，但仍会被播报（复制成功的确认就靠它） */
.pk-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
.pk-actions{display:flex;flex-wrap:wrap;align-items:center;gap:var(--pk-s2)}
.pk-msg{margin:0;padding:var(--pk-s2) var(--pk-s3);border:1px solid var(--pk-border);border-radius:var(--pk-r1);background:var(--pk-surface);font-size:12px;line-height:1.7;word-break:break-word}
.pk-msg.ok{color:var(--pk-success);border-color:color-mix(in srgb,var(--pk-success) 35%,var(--pk-border))}
.pk-msg.warn{color:var(--pk-warning);border-color:color-mix(in srgb,var(--pk-warning) 35%,var(--pk-border))}
.pk-msg.err{color:var(--pk-error);border-color:color-mix(in srgb,var(--pk-error) 35%,var(--pk-border))}
.pk-empty{padding:var(--pk-s6) var(--pk-s4);border:1px dashed var(--pk-border);border-radius:var(--pk-r2);text-align:center;font-size:12px;line-height:1.7;color:var(--dsw-alias-label-secondary,var(--pk-muted))}
.pk-empty strong{display:block;margin-bottom:var(--pk-s1);font-size:14px;color:var(--pk-text)}
.pk-progress{margin-top:var(--pk-s3);padding:var(--pk-s3);border:1px solid var(--pk-border);border-radius:var(--pk-r2);background:var(--pk-surface)}
.pk-progress-head{display:flex;flex-wrap:wrap;align-items:center;gap:var(--pk-s2);margin-bottom:var(--pk-s2);font-size:12px}
.pk-progress-phase{font-size:14px;font-weight:600;color:var(--pk-text)}
.pk-progress-pct{font-weight:700;color:var(--pk-primary)}
.pk-progress-count{color:var(--dsw-alias-label-secondary,var(--pk-muted))}
.pk-progress-track{height:8px;border-radius:var(--pk-r1);background:var(--pk-surface-2);overflow:hidden}
.pk-progress-fill{height:100%;border-radius:var(--pk-r1);background:var(--pk-primary);transition:width 120ms ease}
.pk-progress-fill.indeterminate{width:40%;animation:pk-slide 1.2s ease-in-out infinite}
.pk-result{display:flex;flex-direction:column;gap:var(--pk-s2);margin-top:var(--pk-s3);padding:var(--pk-s4);border:1px solid color-mix(in srgb,var(--pk-success) 32%,var(--pk-border));border-radius:var(--pk-r2);background:color-mix(in srgb,var(--pk-success) 6%,transparent)}
.pk-result-title{font-size:16px;font-weight:600}
.pk-result-foot{display:flex;flex-direction:column;gap:var(--pk-s1);padding-top:var(--pk-s2);border-top:1px dashed var(--pk-border)}
.pk-foot-row{display:flex;flex-wrap:wrap;align-items:center;gap:var(--pk-s2);font-size:12px;min-width:0}
.pk-foot-label{flex:none;font-weight:600;color:var(--pk-text)}
.pk-foot-value{flex:1 1 200px;min-width:0;color:var(--dsw-alias-label-secondary,var(--pk-muted));word-break:break-all}
.pk-diff-sum{display:flex;flex-wrap:wrap;align-items:center;gap:var(--pk-s2)}
.pk-diff-tag{display:inline-flex;align-items:center;gap:var(--pk-s1);height:24px;padding:0 var(--pk-s2);border:1px solid var(--pk-border);border-radius:var(--pk-r1);font-size:12px}
.pk-dot{display:inline-block;width:8px;height:8px;flex:none;border-radius:var(--pk-r1)}
.pk-dot.added{background:var(--pk-success)}
.pk-dot.changed{background:var(--pk-warning)}
.pk-dot.same{background:var(--pk-muted)}
.pk-dot.skipped{border:1px solid var(--pk-muted)}
.pk-filelist{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:var(--pk-s1);max-height:320px;overflow:auto}
.pk-filelist li{display:flex;align-items:center;gap:var(--pk-s2);padding:var(--pk-s1) var(--pk-s2);border-radius:var(--pk-r1);font-family:var(--pk-mono);font-size:12px;word-break:break-all}
.pk-filelist li:nth-child(odd){background:var(--pk-surface)}
.pk-path{flex:1;min-width:0}
.pk-size{flex:none;color:var(--dsw-alias-label-secondary,var(--pk-muted))}
.pk-tag{display:inline-flex;align-items:center;height:20px;padding:0 var(--pk-s2);border:1px solid var(--pk-border);border-radius:var(--pk-r1);font-size:12px;color:var(--dsw-alias-label-secondary,var(--pk-muted));white-space:nowrap;vertical-align:1px}
.pk-tag.ok{color:var(--pk-success);border-color:color-mix(in srgb,var(--pk-success) 40%,var(--pk-border))}
.pk-tag.warn{color:var(--pk-warning);border-color:color-mix(in srgb,var(--pk-warning) 40%,var(--pk-border))}
.pk-mono{font-family:var(--pk-mono);font-size:12px;word-break:break-all}
.pk-spin{display:inline-block;width:12px;height:12px;margin-right:var(--pk-s1);border-radius:50%;border:2px solid var(--pk-border);border-top-color:var(--pk-primary);animation:pk-rot .8s linear infinite;vertical-align:-1px}
.pk-overlay{position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;padding:var(--pk-s4);background:var(--pk-scrim)}
.pk-modal{display:flex;flex-direction:column;gap:var(--pk-s3);width:100%;max-width:520px;max-height:86vh;overflow:auto;padding:var(--pk-s4);border:1px solid var(--pk-border);border-radius:var(--pk-r4);background:var(--dsw-alias-bg-layer-2,var(--pk-bg));box-shadow:var(--pk-shadow-lg)}
.pk-modal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:var(--pk-s2)}
.pk-modal-head h4{font-size:16px;font-weight:600;word-break:break-all}
.pk-modal-body{display:flex;flex-direction:column;gap:var(--pk-s3);min-width:0}
.pk-modal-foot{display:flex;justify-content:flex-end;gap:var(--pk-s2)}
@keyframes pk-rot{to{transform:rotate(360deg)}}
@keyframes pk-slide{0%{transform:translateX(-105%)}100%{transform:translateX(255%)}}
@media (max-width:560px){.pk-checks,.pk-choices,.pk-choices.two{grid-template-columns:1fr}}
@media (prefers-reduced-motion:reduce){.pk-page *{transition:none!important;animation:none!important}.pk-progress-fill.indeterminate{width:100%;opacity:.6}}
`;

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

// src/client/hooks.ts
function useAlive() {
  const alive = react.useRef(true);
  react.useEffect(
    () => () => {
      alive.current = false;
    },
    []
  );
  return alive;
}
function useTheme() {
  const [dark, setDark] = react.useState(detectDark);
  react.useEffect(() => {
    const sync = () => setDark(detectDark());
    const mq = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    if (mq && mq.addEventListener) mq.addEventListener("change", sync);
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-ds-dark-theme"] });
    if (document.body) observer.observe(document.body, { attributes: true, attributeFilter: ["data-ds-dark-theme"] });
    return () => {
      if (mq && mq.removeEventListener) mq.removeEventListener("change", sync);
      observer.disconnect();
    };
  }, []);
  return dark;
}
var JOB_FIRST_TICK_MS = 250;
var JOB_TICK_MS = 500;
function useJob() {
  const [job, setJob] = react.useState(null);
  const ref = react.useRef({
    timer: null,
    alive: true,
    finish: null,
    tick: null,
    retries: 0
  });
  react.useEffect(() => {
    ref.current.alive = true;
    return () => {
      ref.current.alive = false;
      if (ref.current.timer) clearTimeout(ref.current.timer);
    };
  }, []);
  const stop = () => {
    if (ref.current.timer) {
      clearTimeout(ref.current.timer);
      ref.current.timer = null;
    }
  };
  ref.current.tick = (id) => {
    apiFetch("/jobs/" + encodeURIComponent(id)).then((data) => {
      if (!ref.current.alive) return;
      ref.current.retries = 0;
      const value = data.job || {};
      const terminal = !!(value.error || value.cancelled || value.phase === "done");
      setJob({
        id,
        phase: value.phase || "collect",
        done: value.done,
        total: value.total,
        cancelled: !!value.cancelled,
        error: value.error || null,
        code: value.code,
        result: value.result === void 0 ? null : value.result,
        running: !terminal
      });
      if (terminal) {
        stop();
        const callback = ref.current.finish;
        ref.current.finish = null;
        if (callback) callback(value);
      } else {
        ref.current.timer = setTimeout(() => ref.current.tick && ref.current.tick(id), JOB_TICK_MS);
      }
    }).catch((error) => {
      if (!ref.current.alive) return;
      // 轮询是幂等 GET：一次网络抖动不该让整次打包显示失败（此前 0.7.1 就是这样，
      // 服务端其实已经写完包，UI 却弹 `network · Failed to fetch`）。
      // 只对网络层错误（fetch 抛错 / 5xx）重试，业务错误照旧立刻上报。
      const transient = error && (error.code === "network" || Number(error.status) >= 500);
      const tries = (ref.current.retries || 0) + 1;
      ref.current.retries = tries;
      if (transient && tries <= 10) {
        ref.current.timer = setTimeout(() => ref.current.tick && ref.current.tick(id), Math.min(5000, 500 * tries));
        return;
      }
      stop();
      setJob({ id, phase: "error", done: 0, total: 0, cancelled: false, error: error.message || String(error), code: error.code, result: null, running: false });
      const callback = ref.current.finish;
      ref.current.finish = null;
      if (callback) callback(null, error);
    });
  };
  const track = (id, onFinish) => {
    stop();
    ref.current.retries = 0;
    ref.current.finish = typeof onFinish === "function" ? onFinish : null;
    setJob({ id, phase: "collect", done: 0, total: 0, cancelled: false, error: null, result: null, running: true });
    ref.current.timer = setTimeout(() => ref.current.tick && ref.current.tick(id), JOB_FIRST_TICK_MS);
  };
  return { job, track };
}
function useEscape(active, onEscape) {
  react.useEffect(() => {
    if (!active) return;
    const onKey = (event) => {
      if (event.key === "Escape") onEscape();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, onEscape]);
}

// src/client/model.ts
var NOTIFY_AUTO_DISMISS_MS = 4e3;
var COPIED_FEEDBACK_MS = 1600;
function usePacker() {
  const alive = useAlive();
  const [status, setStatus] = react.useState({ kind: "loading" });
  const [packs, setPacks] = react.useState([]);
  const [notify, setNotify] = react.useState(null);
  const [copied, setCopied] = react.useState(null);
  const [selected, setSelected] = react.useState({});
  const [privacy, setPrivacy] = react.useState("keep");
  const [note, setNote] = react.useState("");
  const [encrypt, setEncrypt] = react.useState(false);
  const [password, setPassword] = react.useState("");
  const [preview, setPreview] = react.useState(null);
  const [created, setCreated] = react.useState(null);
  const [packName, setPackName] = react.useState("");
  const [zipPath, setZipPath] = react.useState("");
  const [imp, setImp] = react.useState(null);
  const [restoreSel, setRestoreSel] = react.useState({});
  const [includeDb, setIncludeDb] = react.useState(false);
  const [strategy, setStrategy] = react.useState("overwrite");
  const [applied, setApplied] = react.useState(null);
  const [info, setInfo] = react.useState(null);
  const [pwDialog, setPwDialog] = react.useState(null);
  const [renameDialog, setRenameDialog] = react.useState(null);
  const [confirmDialog, setConfirmDialog] = react.useState(null);
  const packJob = useJob();
  const restoreJob = useJob();
  const restoreRef = react.useRef(null);
  const initRef = react.useRef(false);
  const notifyTimer = react.useRef(null);
  const say = (kind, message) => {
    if (!alive.current) return;
    if (notifyTimer.current) clearTimeout(notifyTimer.current);
    setNotify({ kind, text: message });
    if (kind !== "err") {
      notifyTimer.current = setTimeout(() => {
        if (alive.current) setNotify(null);
      }, NOTIFY_AUTO_DISMISS_MS);
    }
  };
  react.useEffect(
    () => () => {
      if (notifyTimer.current) clearTimeout(notifyTimer.current);
    },
    []
  );
  const copyText = (value, flag) => {
    if (!value) {
      say("warn", copy.copyFailed + "：" + copy.empty);
      return;
    }
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      say("warn", copy.copyFailed + "：" + value);
      return;
    }
    navigator.clipboard.writeText(value).then(
      () => {
        if (!alive.current) return;
        setCopied(flag);
        window.setTimeout(() => {
          if (alive.current) setCopied(null);
        }, COPIED_FEEDBACK_MS);
      },
      () => {
        if (alive.current) say("warn", copy.copyFailed + "：" + value);
      }
    );
  };
  const loadStatus = react.useCallback(
    () => apiFetch("/status").then((data) => {
      if (!alive.current) return null;
      setStatus({ kind: "ready", value: data });
      if (Array.isArray(data.packs)) setPacks(data.packs);
      return data;
    }),
    // 失败时保留上一次成功的状态（页面已经在用旧数据渲染，别把它打回错误页）
    []
  );
  const loadStatusSafe = react.useCallback(() => {
    return loadStatus().catch((error) => {
      if (!alive.current || error && error.name === "AbortError") return null;
      setStatus((prev) => prev && prev.kind === "ready" ? prev : { kind: "error", code: error.code, message: error.message });
      setNotify({ kind: "err", text: withDetail(copy.unavailable, errText(error)) });
      return null;
    });
  }, []);
  react.useEffect(() => {
    loadStatusSafe();
  }, [loadStatusSafe]);
  react.useEffect(() => {
    if (status.kind !== "ready" || initRef.current) return;
    initRef.current = true;
    const mods2 = status.value.modules || {};
    const next = {};
    for (const group of GROUPS) {
      const present = group.modules.filter((name) => mods2[name]);
      next[group.id] = present.length > 0 && present.every((name) => mods2[name]?.default !== false);
    }
    setSelected(next);
  }, [status]);
  const cancelJob = (job) => {
    if (!job || !job.id) return;
    apiFetch("/jobs/" + encodeURIComponent(job.id) + "/cancel", { method: "POST", body: {} }).catch(
      (error) => {
        say("err", withDetail(copy.cancelFailed, errText(error)));
      }
    );
  };
  const ready = status.kind === "ready";
  const st = ready ? status.value : {};
  const mods = st.modules || {};
  const packsDir = typeof st.packsDir === "string" && st.packsDir ? st.packsDir : null;
  const packsBytes = st.disk && typeof st.disk.packsBytes === "number" ? st.disk.packsBytes : null;
  const platform = typeof st.platform === "string" ? st.platform : "other";
  const trashSupported = st.trash === true;
  const filePicker = st.filePicker === true;
  const trashName = platform === "darwin" ? "macOS 废纸篓" : platform === "win32" ? "Windows 回收站" : "系统回收站";
  const pathPlaceholder = platform === "win32" ? copy.pathPlaceholder : platform === "darwin" ? copy.pathPlaceholderMac : platform === "harmony" ? copy.pathPlaceholderHarmony : copy.pathPlaceholderLinux;
  const groups = GROUPS.map((group) => {
    const present = group.modules.filter((name) => mods[name]);
    const bytes = present.reduce((sum, name) => sum + numOr(mods[name]?.bytes, 0), 0);
    const count = present.reduce((sum, name) => sum + numOr(mods[name]?.count, 0), 0);
    return { id: group.id, label: group.label, desc: group.desc, present, bytes, count };
  }).filter((group) => group.present.length > 0);
  const chosenGroups = groups.filter((group) => !!selected[group.id]);
  const chosenModules = chosenGroups.flatMap((group) => group.present);
  const chosenBytes = chosenGroups.reduce((sum, group) => sum + group.bytes, 0);
  const chosenFiles = chosenGroups.reduce((sum, group) => sum + group.count, 0);
  const sortedPacks = packs.slice().sort((a, b) => String(b?.createdAt || "").localeCompare(String(a?.createdAt || "")));
  const zipValue = zipPath.trim() || packName;
  const busyCreating = !!(created && created.kind === "running");
  const busyPreviewing = !!(preview && preview.kind === "running");
  const busyImporting = !!(imp && imp.kind === "running");
  const busyRestoring = !!(applied && applied.kind === "running");
  const passwordOk = !encrypt || password.trim().length >= 8;
  const resetRestore = () => {
    setImp(null);
    setApplied(null);
  };
  const createBody = (dryRun) => ({
    modules: chosenModules,
    mode: "migrate",
    note: note.trim(),
    dryRun,
    sanitize: privacy === "sanitize",
    encrypt: !!encrypt,
    password: encrypt ? password : void 0
  });
  const runPreview = () => {
    if (chosenModules.length === 0) {
      setPreview({ kind: "error", code: "no_modules", message: copy.noSelection });
      return;
    }
    if (!passwordOk) {
      setPreview({ kind: "error", code: "weak_password", message: copy.weakPassword });
      return;
    }
    setPreview({ kind: "running" });
    apiFetch("/create", { method: "POST", body: createBody(true) }).then(
      (data) => {
        if (!alive.current) return;
        setPreview({
          kind: "done",
          files: Array.isArray(data.manifest?.files) ? data.manifest.files : [],
          totalBytes: data.totalBytes,
          privacy: Array.isArray(data.privacy) ? data.privacy : [],
          unreadable: Array.isArray(data.unreadable) ? data.unreadable : [],
          warnings: Array.isArray(data.warnings) ? data.warnings : [],
          sanitized: data.sanitized === true,
          redactions: typeof data.redactions === "number" ? data.redactions : null
        });
      },
      (error) => {
        if (alive.current) setPreview({ kind: "error", code: error.code, message: error.message });
      }
    );
  };
  const runCreate = () => {
    if (chosenModules.length === 0) {
      setCreated({ kind: "error", code: "no_modules", message: copy.noSelection });
      return;
    }
    if (!passwordOk) {
      setCreated({ kind: "error", code: "weak_password", message: copy.weakPassword });
      return;
    }
    setCreated({ kind: "running" });
    setPreview(null);
    apiFetch("/create", {
      method: "POST",
      body: createBody(false)
    }).then(
      (data) => {
        if (!alive.current) return;
        if (!data.jobId) {
          setCreated({ kind: "done", pack: data.pack || {}, warnings: Array.isArray(data.warnings) ? data.warnings : [] });
          loadStatusSafe();
          return;
        }
        packJob.track(data.jobId, (job, error) => {
          if (!alive.current) return;
          if (error) return setCreated({ kind: "error", code: error.code, message: error.message });
          if (job && job.cancelled) return setCreated({ kind: "cancelled" });
          if (job && job.error) return setCreated({ kind: "error", code: job.code, message: job.error });
          const result = job && job.result || {};
          setCreated({ kind: "done", pack: result.pack || {}, warnings: Array.isArray(result.warnings) ? result.warnings : [] });
          loadStatusSafe();
        });
      },
      (error) => {
        if (alive.current) setCreated({ kind: "error", code: error.code, message: error.message });
      }
    );
  };
  const applyInfo = (name, data) => setInfo({
    kind: "done",
    name,
    files: Array.isArray(data.files) ? data.files : [],
    manifest: data.manifest || {},
    encrypted: !!data.encrypted,
    verify: data.verify && typeof data.verify === "object" ? data.verify : null
  });
  const askPassword = (submit) => setPwDialog({ submit, value: "", busy: false, error: null });
  const submitPassword = () => {
    const dialog = pwDialog;
    if (!dialog || dialog.busy) return;
    const value = String(dialog.value || "");
    if (!value) return setPwDialog({ ...dialog, error: copy.passwordEmpty });
    setPwDialog({ ...dialog, busy: true, error: null });
    Promise.resolve().then(() => dialog.submit(value)).then(() => {
      if (alive.current) setPwDialog(null);
    }).catch((error) => {
      if (!alive.current) return;
      const prefix = error && error.code === "bad_password" ? copy.passwordWrong : copy.passwordFailed;
      setPwDialog({ ...dialog, busy: false, value: "", error: withDetail(prefix, errText(error)) });
    });
  };
  const openInfo = (pack) => {
    if (!pack) return;
    const name = pack.name || "";
    if (pack.encrypted === true) {
      askPassword(
        (value) => apiFetch(infoPath(name, value)).then((data) => {
          if (alive.current) applyInfo(name, data);
        })
      );
      return;
    }
    setInfo({ kind: "loading", name });
    apiFetch(infoPath(name)).then(
      (data) => {
        if (alive.current) applyInfo(name, data);
      },
      (error) => {
        if (alive.current) setInfo({ kind: "error", name, code: error.code, message: error.message });
      }
    );
  };
  const submitRename = () => {
    const dialog = renameDialog;
    if (!dialog || dialog.busy) return;
    const to = String(dialog.value || "").trim();
    if (!to || to === dialog.from || /[\\/]/.test(to) || to.includes("..")) return setRenameDialog({ ...dialog, error: copy.renameInvalid });
    setRenameDialog({ ...dialog, busy: true, error: null });
    apiFetch("/packs/rename", { method: "POST", body: { from: dialog.from, to } }).then(
      () => {
        if (!alive.current) return;
        setRenameDialog(null);
        setInfo((prev) => prev && prev.name === dialog.from ? { ...prev, name: to } : prev);
        setPackName((prev) => prev === dialog.from ? to : prev);
        resetRestore();
        say("ok", copy.renameDone);
        loadStatusSafe();
      },
      (error) => {
        if (!alive.current) return;
        setRenameDialog({ ...dialog, busy: false, error: withDetail(copy.renameFailed, errText(error)) });
      }
    );
  };
  const askDelete = (pack) => {
    if (!pack) return;
    const name = pack.name || "";
    setConfirmDialog({
      title: copy.deleteTitle,
      message: trashSupported ? fill(copy.deleteMessage, { name, trash: trashName }) : fill(copy.deleteMessageNoTrash, { name }),
      confirmLabel: copy.deleteSubmit,
      errorPrefix: copy.deleteFailed,
      danger: true,
      busy: false,
      error: null,
      run: () => apiFetch("/packs/" + encodeURIComponent(name), { method: "DELETE" }).then((data) => {
        if (!alive.current) return;
        const recycled = data && data.recycled === true;
        say(recycled ? "ok" : "warn", recycled ? fill(copy.deleteDoneRecycle, { trash: trashName }) : data?.warning || copy.deleteDone);
        setPackName((prev) => prev === name ? "" : prev);
        setInfo((prev) => prev && prev.name === name ? null : prev);
        resetRestore();
        loadStatusSafe();
      })
    });
  };
  const submitConfirm = () => {
    const dialog = confirmDialog;
    if (!dialog || dialog.busy) return;
    setConfirmDialog({ ...dialog, busy: true, error: null });
    Promise.resolve().then(() => dialog.run()).then(() => {
      if (alive.current) setConfirmDialog(null);
    }).catch((error) => {
      if (!alive.current) return;
      setConfirmDialog({ ...dialog, busy: false, error: errText(error) });
    });
  };
  const runImportWith = (pwd) => {
    const zip = zipValue;
    const body = { zip };
    if (pwd) body.password = pwd;
    return apiFetch("/restore/import", { method: "POST", body }).then((data) => {
      if (!alive.current) return data;
      const files = Array.isArray(data.files) ? data.files : [];
      const manifest = data.manifest || {};
      const names = [];
      const fromManifest = Array.isArray(manifest.modules) ? manifest.modules.filter((name) => typeof name === "string") : [];
      for (const name of fromManifest) if (!names.includes(name)) names.push(name);
      for (const file of files) if (file && typeof file.module === "string" && !names.includes(file.module)) names.push(file.module);
      const sel = {};
      for (const group of GROUPS) {
        if (group.modules.some((name) => names.includes(name))) sel[group.id] = true;
      }
      setImp({ kind: "done", files, manifest, diff: data.diff || {}, modules: names, encrypted: !!data.encrypted });
      setRestoreSel(sel);
      setApplied(null);
      return data;
    });
  };
  const runImport = () => {
    if (!zipValue) return setImp({ kind: "error", code: "no_zip", message: copy.importNoPack });
    setImp({ kind: "running" });
    setApplied(null);
    runImportWith(void 0).catch((error) => {
      if (!alive.current) return;
      setImp({ kind: "error", code: error.code, message: error.message });
      if (error && error.code === "bad_password") {
        askPassword(
          (value) => runImportWith(value).catch((inner) => {
            if (alive.current) setImp({ kind: "error", code: inner.code, message: inner.message });
            throw inner;
          })
        );
      }
    });
  };
  const impGroups = react.useMemo(() => {
    if (!imp || imp.kind !== "done") return [];
    const map = /* @__PURE__ */ new Map();
    for (const file of imp.files) {
      if (!file) continue;
      const group = GROUPS.find((item) => item.modules.includes(String(file.module)));
      const id = group ? group.id : String(file.module);
      let row = map.get(id);
      if (!row) {
        row = { id, label: group ? group.label : copy.otherContent, count: 0, bytes: 0, added: 0, changed: 0, same: 0, skipped: 0 };
        map.set(id, row);
      }
      row.count++;
      row.bytes += numOr(file.size, 0);
      if (file.status === "added") row.added++;
      else if (file.status === "changed") row.changed++;
      else if (file.status === "same") row.same++;
      else row.skipped++;
    }
    return [...map.values()];
  }, [imp]);
  const impModules = imp && imp.kind === "done" ? imp.modules : [];
  const chosenRestoreModules = impGroups.filter((row) => !!restoreSel[row.id]).flatMap((row) => {
    const group = GROUPS.find((item) => item.id === row.id);
    if (!group) return [row.id];
    const present = group.modules.filter((name) => impModules.includes(name));
    return present.length ? present : group.modules.filter((name) => impModules.includes(name));
  });
  const runApply = () => {
    const zip = zipValue;
    if (!zip) return setApplied({ kind: "error", code: "no_zip", message: copy.importNoPack });
    if (impGroups.length === 0) return setApplied({ kind: "error", code: "no_modules", message: copy.noModules });
    if (chosenRestoreModules.length === 0) return setApplied({ kind: "error", code: "bad_modules", message: copy.noModules });
    setApplied({ kind: "running" });
    apiFetch("/restore/apply", {
      method: "POST",
      body: { zip, strategy, async: true, includeDb: !!includeDb, modules: chosenRestoreModules }
    }).then(
      (data) => {
        if (!alive.current) return;
        if (!data.jobId) {
          setApplied({ kind: "done", stats: data.stats || {} });
          loadStatusSafe();
          return;
        }
        restoreJob.track(data.jobId, (job, error) => {
          if (!alive.current) return;
          if (error) return setApplied({ kind: "error", code: error.code, message: error.message });
          if (job && job.cancelled) return setApplied({ kind: "cancelled" });
          if (job && job.error) return setApplied({ kind: "error", code: job.code, message: job.error });
          const result = job && job.result || {};
          setApplied({ kind: "done", stats: result.stats || {} });
          loadStatusSafe();
        });
      },
      (error) => {
        if (alive.current) setApplied({ kind: "error", code: error.code, message: error.message });
      }
    );
  };
  const askRollback = (dir) => setConfirmDialog({
    title: copy.rollbackTitle,
    message: copy.rollbackMessage,
    confirmLabel: copy.rollback,
    errorPrefix: copy.rollbackFailed,
    danger: true,
    busy: false,
    error: null,
    run: () => apiFetch("/restore/rollback", { method: "POST", body: { dir } }).then((data) => {
      if (!alive.current) return;
      setApplied((prev) => prev && prev.kind === "done" ? { ...prev, rollback: { restored: data.restored, failed: data.failed } } : prev);
    })
  });
  const restoreFromPack = (pack) => {
    if (!pack) return;
    setPackName(pack.name || "");
    setZipPath("");
    resetRestore();
    const node = restoreRef.current;
    if (!node) return;
    if (node.scrollIntoView) node.scrollIntoView({ block: "start", behavior: reduceMotion() ? "auto" : "smooth" });
    const select = node.querySelector("select");
    if (select && select.focus) select.focus({ preventScroll: true });
  };
  return {
    // 状态
    status,
    packs,
    notify,
    copied,
    selected,
    privacy,
    note,
    encrypt,
    password,
    preview,
    created,
    packName,
    zipPath,
    imp,
    restoreSel,
    includeDb,
    strategy,
    applied,
    info,
    pwDialog,
    renameDialog,
    confirmDialog,
    // 派生
    ready,
    st,
    mods,
    packsDir,
    packsBytes,
    platform,
    trashSupported,
    filePicker,
    trashName,
    pathPlaceholder,
    groups,
    chosenGroups,
    chosenModules,
    chosenBytes,
    chosenFiles,
    sortedPacks,
    zipValue,
    busyCreating,
    busyPreviewing,
    busyImporting,
    busyRestoring,
    passwordOk,
    impGroups,
    impModules,
    chosenRestoreModules,
    // 作业
    packJob: packJob.job,
    restoreJob: restoreJob.job,
    // 引用
    restoreRef,
    // 动作
    say,
    loadStatus: loadStatusSafe,
    copyText,
    cancelJob,
    runPreview,
    runCreate,
    openInfo,
    askPassword: (submit) => askPassword(submit),
    submitPassword,
    submitRename,
    askDelete,
    submitConfirm,
    runImport,
    runApply,
    askRollback,
    restoreFromPack,
    // 设值
    setSelected,
    setPrivacy,
    setNote,
    setEncrypt,
    setPassword,
    setPackName,
    setZipPath,
    setRestoreSel,
    setIncludeDb,
    setStrategy,
    setInfo,
    setPwDialog,
    setRenameDialog,
    setConfirmDialog,
    resetRestore
  };
}

// src/client/ui.ts
var h = react.createElement;
var FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
var modalSeq = 0;
function Spinner() {
  return h("span", { className: "pk-spin", "aria-hidden": "true" });
}
function Message(props) {
  const className = "pk-msg" + (props.tone ? " " + props.tone : "");
  return h(
    "div",
    { className, role: props.tone === "err" ? "alert" : "status", "aria-live": props.tone === "err" ? void 0 : "polite", style: props.style },
    props.children
  );
}
function Tag(props) {
  return h("span", { className: "pk-tag" + (props.tone ? " " + props.tone : "") }, props.children);
}
function Empty(props) {
  return h("div", { className: "pk-empty" }, props.title ? h("strong", null, props.title) : null, props.children);
}
function Section(props) {
  return h(
    "section",
    { className: "pk-section", ref: props.innerRef },
    h("h4", { className: "pk-section-title" }, props.title),
    props.hint ? h("p", { className: "pk-hint" }, props.hint) : null,
    props.children
  );
}
function Field(props) {
  return h(
    "div",
    { className: "pk-field", style: props.style },
    props.label === void 0 ? null : props.htmlFor ? h("label", { htmlFor: props.htmlFor }, props.label) : h("span", { className: "pk-label" }, props.label),
    props.children,
    props.hint ? h("span", { className: "pk-hint" + (props.hintTone ? " " + props.hintTone : "") }, props.hint) : null
  );
}
function Check(props) {
  return h(
    "label",
    { className: "pk-check", style: props.style },
    h("input", {
      type: "checkbox",
      checked: props.checked,
      onChange: (event) => props.onChange(event.target.checked)
    }),
    h("span", null, props.children)
  );
}
function Choices(props) {
  return h(
    "div",
    { className: "pk-choices" + (props.columns === 2 ? " two" : ""), role: "radiogroup" },
    ...props.options.map(
      (option) => h(
        "label",
        { key: option.value, className: "pk-choice" + (props.value === option.value ? " chosen" : "") },
        h("input", {
          type: "radio",
          name: props.name,
          checked: props.value === option.value,
          onChange: () => props.onSelect(option.value)
        }),
        h("span", null, h("strong", null, option.label), option.hint ? h("span", { className: "pk-choice-hint" }, option.hint) : null)
      )
    )
  );
}
function Button(props) {
  const className = "pk-btn" + (props.variant ? " " + props.variant : "") + (props.size ? " " + props.size : "");
  return h(
    "button",
    {
      type: "button",
      className,
      disabled: !!props.disabled,
      "aria-busy": props.busy ? true : void 0,
      "aria-disabled": props.disabled ? true : void 0,
      onClick: props.onClick,
      style: props.style
    },
    props.busy ? Spinner() : null,
    props.children
  );
}
function CopyButton(props) {
  return h(
    "span",
    { className: "pk-copy" },
    h(Button, { size: "tiny", disabled: !props.value, onClick: props.onCopy }, props.active ? copy.copied : props.label || copy.copyAction),
    h("span", { className: "pk-sr", role: "status", "aria-live": "polite" }, props.active ? copy.copied : "")
  );
}
function Progress(props) {
  const job = props.job;
  if (!job) return null;
  const total = Number(job.total);
  const done = Number(job.done);
  const doneSafe = Number.isFinite(done) && done >= 0 ? done : 0;
  const hasTotal = Number.isFinite(total) && total > 0;
  const percent = hasTotal ? Math.min(100, Math.round(doneSafe / total * 100)) : null;
  return h(
    "div",
    { className: "pk-progress", "aria-busy": job.running ? true : void 0 },
    h(
      "div",
      { className: "pk-progress-head" },
      h("span", { className: "pk-progress-phase", "aria-live": "polite" }, props.label),
      h("span", { className: "pk-progress-pct" }, percent === null ? copy.progressUnknown : percent + "%"),
      hasTotal ? h("span", { className: "pk-progress-count" }, fill(copy.progress, { done: doneSafe, total })) : null,
      props.onCancel ? h(Button, { size: "tiny", onClick: props.onCancel, style: { marginLeft: "auto" } }, copy.cancel) : null
    ),
    h(
      "div",
      {
        className: "pk-progress-track",
        role: "progressbar",
        "aria-valuemin": 0,
        "aria-valuemax": 100,
        "aria-valuenow": percent === null ? void 0 : percent,
        "aria-label": props.label
      },
      h("div", {
        className: percent === null ? "pk-progress-fill indeterminate" : "pk-progress-fill",
        style: percent === null ? void 0 : { width: percent + "%" }
      })
    )
  );
}
function FootRow(props) {
  return h(
    "div",
    { className: "pk-foot-row" },
    h("span", { className: "pk-foot-label" }, props.label),
    h("span", { className: "pk-foot-value" + (props.mono === false ? "" : " pk-mono") }, props.value ? props.value : copy.empty),
    props.value ? null : h("span", { className: "pk-tag" }, copy.fieldMissing),
    props.actions || null
  );
}
function ResultCard(props) {
  return h(
    "div",
    { className: "pk-result" },
    h("h4", { className: "pk-result-title" }, props.title),
    h(
      "div",
      { className: "pk-table-wrap" },
      h(
        "table",
        { className: "pk-table" },
        h(
          "thead",
          null,
          h(
            "tr",
            null,
            h("th", { scope: "col" }, copy.resultColItem),
            h("th", { className: "num", scope: "col" }, copy.resultColCount),
            h("th", { scope: "col" }, copy.resultColNote)
          )
        ),
        h(
          "tbody",
          null,
          ...props.rows.map(
            (row) => h("tr", { key: row.key }, h("td", null, row.item), h("td", { className: "num pk-mono" }, row.count), h("td", { className: "pk-desc" }, row.note))
          )
        )
      )
    ),
    h("div", { className: "pk-result-foot" }, ...props.footer)
  );
}
function Modal(props) {
  const boxRef = react.useRef(null);
  const titleIdRef = react.useRef("");
  if (!titleIdRef.current) titleIdRef.current = "pk-modal-" + (modalSeq += 1);
  useEscape(true, () => {
    if (!props.busy) props.onClose();
  });
  react.useEffect(() => {
    const previous = document.activeElement;
    const box = boxRef.current;
    if (box) {
      const first = box.querySelector(FOCUSABLE);
      (first || box).focus({ preventScroll: true });
    }
    return () => {
      if (previous && typeof previous.focus === "function") previous.focus({ preventScroll: true });
    };
  }, []);
  const onKeyDown = (event) => {
    if (event.key !== "Tab") return;
    const box = boxRef.current;
    if (!box) return;
    const items = Array.from(box.querySelectorAll(FOCUSABLE));
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
  return h(
    "div",
    {
      className: "pk-overlay",
      onClick: (event) => {
        if (event.target === event.currentTarget && !props.busy) props.onClose();
      }
    },
    h(
      "div",
      {
        className: "pk-modal",
        ref: boxRef,
        role: "dialog",
        "aria-modal": "true",
        "aria-labelledby": titleIdRef.current,
        tabIndex: -1,
        onKeyDown
      },
      h(
        "div",
        { className: "pk-modal-head" },
        h("h4", { id: titleIdRef.current }, props.title),
        h(
          "button",
          { type: "button", className: "pk-btn tiny", disabled: !!props.busy, onClick: props.onClose, "aria-label": copy.close },
          copy.close
        )
      ),
      h("div", { className: "pk-modal-body" }, props.children),
      props.footer ? h("div", { className: "pk-modal-foot" }, ...props.footer) : null
    )
  );
}

// src/client/view/packs.ts
var h2 = react.createElement;
function packContent(pack) {
  const ids = Array.isArray(pack.modules) ? pack.modules : [];
  const labels = [];
  for (const id of ids) {
    const label = moduleLabel(id);
    if (!labels.includes(label)) labels.push(label);
  }
  if (labels.length === 0) return h2("span", null, copy.empty, " ", h2(Tag, null, copy.fieldMissing));
  const head = labels.slice(0, 3).join("、");
  const more = labels.length > 3 ? fill(copy.packItemsMore, { n: labels.length }) : "";
  return head + more + " · " + fill(copy.packFiles, { n: numOr(pack.fileCount, 0) });
}
function PacksSection({ model }) {
  const { sortedPacks, restoreFromPack, openInfo, askDelete } = model;
  return h2(
    Section,
    { title: copy.secPacks },
    sortedPacks.length === 0 ? h2(Empty, { title: copy.packsEmptyStrong }, copy.packsEmptyBody) : h2(
      "div",
      { className: "pk-table-wrap" },
      h2(
        "table",
        { className: "pk-table" },
        h2(
          "thead",
          null,
          h2(
            "tr",
            null,
            h2("th", { scope: "col" }, copy.colName),
            h2("th", { scope: "col" }, copy.colTime),
            h2("th", { scope: "col" }, copy.colContent),
            h2("th", { className: "num", scope: "col" }, copy.colSize),
            h2("th", { scope: "col" }, copy.colEncrypted),
            h2("th", { scope: "col" }, copy.colActions)
          )
        ),
        h2(
          "tbody",
          null,
          ...sortedPacks.map(
            (pack) => h2(
              "tr",
              { key: pack.name },
              h2("td", { className: "pk-mono" }, pack.name || copy.empty),
              h2("td", null, formatTime(pack.createdAt) || copy.empty),
              h2("td", { className: "pk-desc" }, packContent(pack)),
              h2("td", { className: "num" }, formatBytes(pack.totalBytes)),
              h2("td", null, h2(Tag, null, pack.encrypted === true ? copy.encryptedYes : copy.encryptedNo)),
              h2(
                "td",
                null,
                h2(
                  "div",
                  { className: "pk-row-inline" },
                  h2(Button, { size: "tiny", onClick: () => restoreFromPack(pack) }, copy.actionRestore),
                  h2(Button, { size: "tiny", onClick: () => openInfo(pack) }, copy.actionInfo),
                  h2(Button, { size: "tiny", variant: "danger", onClick: () => askDelete(pack) }, copy.actionDelete)
                )
              )
            )
          )
        )
      )
    ),
    h2("p", { className: "pk-hint" }, copy.packsHint)
  );
}

// src/client/view/contents.ts
var h3 = react.createElement;
function ContentsSection({ model }) {
  const { groups, selected, setSelected, chosenGroups, chosenBytes, chosenFiles } = model;
  return h3(
    Section,
    { title: copy.secContents, hint: copy.contentsHint },
    groups.length === 0 ? h3(Empty, { title: copy.contentsEmptyStrong }, copy.contentsEmptyBody) : h3(
      "div",
      { className: "pk-table-wrap" },
      h3(
        "table",
        { className: "pk-table" },
        h3(
          "thead",
          null,
          h3(
            "tr",
            null,
            h3("th", { scope: "col" }, copy.colContentName),
            h3("th", { scope: "col" }, copy.colContentDesc),
            h3("th", { className: "num", scope: "col" }, copy.colContentSize),
            h3("th", { scope: "col" }, copy.colContentTake)
          )
        ),
        h3(
          "tbody",
          null,
          ...groups.map(
            (group) => h3(
              "tr",
              { key: group.id },
              h3("td", null, h3("strong", null, group.label)),
              h3("td", { className: "pk-desc" }, group.desc),
              h3("td", { className: "num" }, formatBytes(group.bytes)),
              h3(
                "td",
                null,
                h3(
                  Check,
                  {
                    checked: !!selected[group.id],
                    onChange: () => setSelected((prev) => ({ ...prev, [group.id]: !prev[group.id] }))
                  },
                  selected[group.id] ? copy.takenOn : copy.takenOff
                )
              )
            )
          )
        )
      )
    ),
    // 合计放在分区底部，勾完立刻能看到这次要打多大
    h3(
      "div",
      { className: "pk-total" },
      h3("span", { className: "pk-total-label" }, copy.total),
      h3("strong", null, formatBytes(chosenBytes)),
      h3("span", { className: "pk-total-meta" }, fill(copy.totalMeta, { n: chosenGroups.length, f: chosenFiles }))
    ),
    h3("p", { className: "pk-hint" }, copy.contentsReminder)
  );
}

// src/client/view/options.ts
var h4 = react.createElement;
function ScanResult({ model }) {
  const { preview, privacy } = model;
  if (!preview) return null;
  if (preview.kind === "running") return h4(Message, null, Spinner(), copy.previewing);
  if (preview.kind === "error") return h4(Message, { tone: "err" }, withDetail(copy.previewFailed, errText(preview)));
  if (preview.kind !== "done") return h4(Message, { tone: "warn" }, copy.cancelled);
  const findings = Array.isArray(preview.privacy) ? preview.privacy : [];
  const total = findings.reduce((sum, item) => sum + numOr(item?.count, 1), 0);
  const byKind = {};
  for (const item of findings) {
    const kind = item?.kind || "personal";
    byKind[kind] = (byKind[kind] || 0) + numOr(item?.count, 1);
  }
  const kinds = Object.keys(byKind).map((kind) => (PRIVACY_KINDS[kind] || copy.otherContent) + " " + byKind[kind] + " 处").join("、");
  const files = Array.isArray(preview.files) ? preview.files : [];
  return h4(
    "div",
    null,
    h4(
      Message,
      { tone: total === 0 ? "ok" : "warn" },
      fill(copy.previewSummary, { n: files.length, size: formatBytes(preview.totalBytes) }) + "。" + (total === 0 ? copy.scanClean : fill(privacy === "sanitize" ? copy.scanFoundSanitize : copy.scanFoundKeep, { n: total, kinds }))
    ),
    Array.isArray(preview.unreadable) && preview.unreadable.length > 0 ? h4("div", { className: "pk-line warn" }, fill(copy.unreadable, { n: preview.unreadable.length })) : null,
    Array.isArray(preview.warnings) ? preview.warnings.map((item, index) => h4("div", { key: "w" + index, className: "pk-line warn" }, String(item))) : null
  );
}
function CreateResult({ model }) {
  const { created, copyText, copied } = model;
  if (!created) return null;
  if (created.kind === "cancelled") return h4(Message, { tone: "warn" }, copy.cancelled);
  if (created.kind === "error") return h4(Message, { tone: "err" }, withDetail(copy.createFailed, errText(created)));
  if (created.kind !== "done") return null;
  const pack = created.pack || {};
  const path = typeof pack.path === "string" && pack.path ? pack.path : null;
  const sha = typeof pack.sha256 === "string" && pack.sha256 ? pack.sha256 : null;
  const sanitized = pack.sanitized === true;
  const rows = [
    {
      key: "files",
      item: copy.resultFiles,
      count: typeof pack.fileCount === "number" ? String(pack.fileCount) : copy.empty,
      note: typeof pack.fileCount === "number" ? copy.resultFilesNote : copy.fieldMissing
    },
    { key: "size", item: copy.resultSize, count: formatBytes(pack.totalBytes), note: copy.resultSizeNote },
    {
      key: "sanitize",
      item: copy.resultSanitize,
      count: sanitized ? fill(copy.redactions, { n: numOr(pack.redactions, 0) }) : copy.resultNoSanitize,
      note: sanitized ? copy.resultSanitizeNote : copy.resultNoSanitizeNote
    },
    {
      key: "encrypt",
      item: copy.resultEncrypt,
      count: pack.encrypted === true ? copy.encryptedYes : copy.encryptedNo,
      note: pack.encrypted === true ? copy.resultEncryptNote : copy.resultNoEncryptNote
    }
  ];
  return h4(
    "div",
    null,
    h4(ResultCard, {
      title: copy.packResultTitle,
      rows,
      footer: [
        h4(FootRow, {
          key: "path",
          label: copy.savedPath,
          value: path ? maskHome(path) : null,
          actions: h4(CopyButton, { value: path, active: copied === "path", onCopy: () => copyText(path, "path") })
        }),
        h4(FootRow, {
          key: "sha",
          label: copy.fingerprint,
          value: sha,
          actions: h4(CopyButton, { value: sha, active: copied === "sha", onCopy: () => copyText(sha, "sha") })
        })
      ]
    }),
    Array.isArray(created.warnings) ? created.warnings.map((item, index) => h4("div", { key: "cw" + index, className: "pk-line warn" }, String(item))) : null
  );
}
function OptionsSection({ model }) {
  const {
    ready,
    privacy,
    setPrivacy,
    note,
    setNote,
    encrypt,
    setEncrypt,
    password,
    setPassword,
    passwordOk,
    chosenGroups,
    chosenModules,
    busyCreating,
    busyPreviewing,
    runCreate,
    runPreview,
    created,
    packJob,
    cancelJob
  } = model;
  return h4(
    Section,
    { title: copy.secOptions },
    h4(
      Field,
      { label: copy.packMethod },
      h4(Choices, {
        name: "pk-privacy",
        value: privacy,
        columns: 2,
        onSelect: setPrivacy,
        options: [
          { value: "keep", label: copy.optKeep, hint: copy.optKeepHint },
          { value: "sanitize", label: copy.optSanitize, hint: copy.optSanitizeHint }
        ]
      })
    ),
    h4(
      Field,
      { label: copy.noteLabel, htmlFor: "pk-note", hint: copy.noteHint },
      h4("input", {
        id: "pk-note",
        className: "pk-input",
        type: "text",
        value: note,
        maxLength: 200,
        placeholder: copy.notePlaceholder,
        onChange: (event) => setNote(event.target.value)
      })
    ),
    h4(Check, { checked: encrypt, onChange: setEncrypt }, copy.optEncrypt),
    encrypt ? h4(
      Field,
      {
        label: copy.optPassword,
        htmlFor: "pk-pack-password",
        hint: passwordOk ? copy.optPasswordHint : copy.weakPassword,
        hintTone: passwordOk ? void 0 : "warn"
      },
      h4("input", {
        id: "pk-pack-password",
        className: "pk-input",
        type: "password",
        value: password,
        autoComplete: "new-password",
        placeholder: copy.passwordPlaceholder,
        onChange: (event) => setPassword(event.target.value)
      })
    ) : null,
    h4(ScanResult, { model }),
    h4(
      "div",
      { className: "pk-actions" },
      h4(
        Button,
        {
          variant: "primary",
          busy: busyCreating,
          disabled: !ready || chosenModules.length === 0 || busyCreating || !passwordOk,
          onClick: runCreate
        },
        busyCreating ? copy.creating : copy.btnCreate
      ),
      h4(
        Button,
        { disabled: !ready || chosenModules.length === 0 || busyCreating || busyPreviewing, onClick: runPreview },
        busyPreviewing ? copy.previewing : copy.btnPreview
      ),
      chosenGroups.length === 0 ? h4("span", { className: "pk-hint" }, copy.noSelection) : null
    ),
    created && created.kind === "running" ? h4(Progress, { job: packJob, label: phaseLabel(packJob ? packJob.phase : "collect"), onCancel: () => cancelJob(packJob) }) : null,
    h4(CreateResult, { model })
  );
}

// src/client/view/restore.ts
var h5 = react.createElement;
function ImportStatus({ model }) {
  const { imp } = model;
  if (!imp) return h5("p", { className: "pk-hint" }, copy.importHint);
  if (imp.kind === "running") return h5(Message, null, Spinner(), copy.importing);
  if (imp.kind === "error") return h5(Message, { tone: "err" }, withDetail(copy.importFailed, errText(imp)));
  return null;
}
function DiffTable({ model }) {
  const { imp, impGroups, mods, restoreSel, strategy } = model;
  if (!imp || imp.kind !== "done") return null;
  const diff = imp.diff || {};
  const counts = [
    ["added", copy.diffAdded],
    ["changed", copy.diffChanged],
    ["same", copy.diffSame],
    ["skipped", copy.diffSkipped]
  ];
  const actionOf = (row) => !restoreSel[row.id] ? copy.diffActionOff : strategy === "overwrite" ? fill(copy.diffActionOverwrite, { c: row.changed, a: row.added }) : strategy === "skip" ? fill(copy.diffActionSkip, { c: row.changed, a: row.added }) : fill(copy.diffActionMerge, { n: row.changed + row.added });
  return h5(
    "div",
    null,
    h5("div", { className: "pk-label" }, copy.diffTitle),
    h5(
      "div",
      { className: "pk-diff-sum" },
      ...counts.map(
        ([key, label]) => h5(
          "span",
          { key, className: "pk-diff-tag" },
          h5("span", { className: "pk-dot " + key, "aria-hidden": "true" }),
          label + " " + (typeof diff[key] === "number" ? String(diff[key]) : copy.empty)
        )
      )
    ),
    impGroups.length === 0 ? h5(Message, { tone: "warn" }, copy.noModules) : h5(
      "div",
      { className: "pk-table-wrap" },
      h5(
        "table",
        { className: "pk-table" },
        h5(
          "thead",
          null,
          h5(
            "tr",
            null,
            h5("th", { scope: "col" }, copy.diffColContent),
            h5("th", { scope: "col" }, copy.diffColPack),
            h5("th", { scope: "col" }, copy.diffColLocal),
            h5("th", { scope: "col" }, copy.diffColAction)
          )
        ),
        h5(
          "tbody",
          null,
          ...impGroups.map((row) => {
            const localGroup = model.groups.find((item) => item.id === row.id);
            const localPresent = localGroup ? localGroup.present : [];
            const localCount = localPresent.reduce((sum, name) => sum + numOr(mods[name]?.count, 0), 0);
            const localBytes = localPresent.reduce((sum, name) => sum + numOr(mods[name]?.bytes, 0), 0);
            return h5(
              "tr",
              { key: row.id },
              h5("td", null, h5("strong", null, row.label)),
              h5("td", null, fill(copy.fileCount, { n: row.count }) + " · " + formatBytes(row.bytes)),
              h5("td", { className: "pk-desc" }, localCount > 0 ? fill(copy.fileCount, { n: localCount }) + " · " + formatBytes(localBytes) : copy.localNone),
              h5("td", { className: "pk-desc" }, actionOf(row))
            );
          })
        )
      )
    )
  );
}
function RestoreControls({ model }) {
  const { imp, impGroups, restoreSel, setRestoreSel, includeDb, setIncludeDb, strategy, setStrategy, zipValue, chosenRestoreModules, busyRestoring, runApply } = model;
  if (!imp || imp.kind !== "done") return h5("p", { className: "pk-hint" }, copy.applyNoImport);
  return h5(
    "div",
    null,
    h5(
      Field,
      { label: copy.restoreScope },
      h5(
        "div",
        { className: "pk-checks" },
        ...impGroups.map(
          (row) => h5(
            Check,
            {
              key: row.id,
              checked: !!restoreSel[row.id],
              onChange: () => setRestoreSel((prev) => ({ ...prev, [row.id]: !prev[row.id] }))
            },
            row.label + "（" + fill(copy.fileCount, { n: row.count }) + "）"
          )
        )
      )
    ),
    h5(Check, { checked: includeDb, onChange: setIncludeDb, style: { marginTop: "var(--pk-s2)" } }, copy.includeDb),
    includeDb ? h5("div", { className: "pk-line err" }, copy.includeDbWarn) : null,
    h5(
      Field,
      { label: copy.strategy, style: { marginTop: "var(--pk-s4)" } },
      h5(Choices, {
        name: "pk-strategy",
        value: strategy,
        onSelect: setStrategy,
        options: [
          { value: "overwrite", label: copy.strategyOverwrite, hint: copy.strategyOverwriteHint },
          { value: "skip", label: copy.strategySkip, hint: copy.strategySkipHint },
          { value: "merge", label: copy.strategyMerge, hint: copy.strategyMergeHint }
        ]
      })
    ),
    h5(
      "div",
      { className: "pk-actions" },
      h5(
        Button,
        {
          variant: "primary",
          busy: busyRestoring,
          disabled: !zipValue || impGroups.length === 0 || chosenRestoreModules.length === 0 || busyRestoring,
          onClick: runApply
        },
        busyRestoring ? copy.applying : copy.btnApply
      )
    )
  );
}
function RestoreResult({ model }) {
  const { applied, askRollback } = model;
  if (!applied) return null;
  if (applied.kind === "cancelled") return h5(Message, { tone: "warn" }, copy.cancelled);
  if (applied.kind === "error") return h5(Message, { tone: "err" }, withDetail(copy.applyFailed, errText(applied)));
  if (applied.kind !== "done") return null;
  const stats = applied.stats || {};
  const backupDir = typeof stats.backupDir === "string" && stats.backupDir ? stats.backupDir : null;
  const failures = Array.isArray(stats.failures) ? stats.failures : [];
  const excluded = Array.isArray(stats.excluded) ? stats.excluded : [];
  const warnings = Array.isArray(stats.warnings) ? stats.warnings : [];
  const pending = excluded.length + warnings.length;
  const rows = [
    { key: "overwritten", item: copy.statOverwritten, count: String(numOr(stats.overwritten, 0)), note: copy.noteOverwritten },
    { key: "added", item: copy.statAdded, count: String(numOr(stats.added, 0)), note: copy.noteAdded },
    { key: "skipped", item: copy.statSkipped, count: String(numOr(stats.skipped, 0)), note: copy.noteSkipped },
    { key: "pending", item: copy.statPending, count: String(pending), note: copy.notePending },
    { key: "failed", item: copy.statFailed, count: String(numOr(stats.failed, 0)), note: copy.noteFailed }
  ];
  return h5(
    "div",
    null,
    h5(ResultCard, {
      title: copy.restoreResultTitle,
      rows,
      footer: [
        h5(FootRow, {
          key: "backup",
          label: copy.backupDir,
          value: backupDir ? maskHome(backupDir) : null,
          actions: h5(
            Button,
            { size: "tiny", disabled: !backupDir || !!applied.rollback, onClick: () => backupDir && askRollback(backupDir) },
            copy.rollback
          )
        })
      ]
    }),
    applied.rollback ? h5(Message, { tone: numOr(applied.rollback.failed, 0) > 0 ? "warn" : "ok" }, fill(copy.rollbackDone, { restored: numOr(applied.rollback.restored, 0), failed: numOr(applied.rollback.failed, 0) })) : null,
    stats.aborted === true ? h5("div", { className: "pk-line warn" }, copy.aborted) : null,
    failures.length > 0 ? h5(
      "div",
      null,
      h5("div", { className: "pk-line err" }, copy.failuresTitle),
      h5(
        "ul",
        { className: "pk-filelist" },
        ...failures.slice(0, 10).map(
          (item, index) => h5(
            "li",
            { key: "f" + index },
            h5("span", { className: "pk-path" }, moduleLabel(item?.module) + " / " + (item?.rel ? item.rel : copy.empty)),
            h5("span", { className: "pk-size" }, item?.error ? String(item.error) : copy.unknown)
          )
        )
      ),
      failures.length > 10 ? h5("div", { className: "pk-hint" }, fill(copy.more, { n: failures.length - 10 })) : null
    ) : null,
    excluded.length > 0 ? h5(
      "div",
      null,
      h5("div", { className: "pk-line" }, copy.excludedTitle),
      h5(
        "ul",
        { className: "pk-filelist" },
        ...excluded.slice(0, 8).map(
          (item, index) => h5("li", { key: "e" + index }, h5("span", { className: "pk-path" }, (item?.rel ? item.rel : copy.empty) + "：" + (item?.reason ? item.reason : copy.unknown)))
        )
      )
    ) : null,
    warnings.length > 0 ? h5(
      "div",
      null,
      h5("div", { className: "pk-line warn" }, copy.placeholderTitle),
      ...warnings.slice(0, 8).map((item, index) => h5("div", { key: "hw" + index, className: "pk-hint" }, String(item)))
    ) : null
  );
}
function RestoreSection({ model }) {
  const {
    sortedPacks,
    packName,
    setPackName,
    zipPath,
    setZipPath,
    resetRestore,
    zipValue,
    busyImporting,
    busyRestoring,
    runImport,
    filePicker,
    pathPlaceholder,
    restoreRef,
    applied,
    restoreJob,
    cancelJob
  } = model;
  return h5(
    Section,
    // v0.6.4：没有系统文件选择框的平台（鸿蒙）把手填路径当主入口，并如实提示；
    // 本插件在网页层拿不到宿主机路径，所以任何平台都不渲染「添加文件/浏览」按钮（不留点了没反应的按钮）。
    { title: copy.secRestore, hint: copy.restoreHint, innerRef: restoreRef },
    filePicker ? null : h5("p", { className: "pk-hint" }, copy.pathPrimaryHint),
    h5(
      "div",
      { className: "pk-row" },
      h5("label", { className: "pk-label", htmlFor: "pk-pack-select" }, copy.restoreSource),
      h5(
        "select",
        {
          id: "pk-pack-select",
          className: "pk-select pk-grow",
          value: packName,
          onChange: (event) => {
            setPackName(event.target.value);
            setZipPath("");
            resetRestore();
          }
        },
        h5("option", { value: "" }, sortedPacks.length === 0 ? copy.restoreNoPack : copy.restorePlaceholder),
        ...sortedPacks.map(
          (pack) => h5(
            "option",
            { key: pack.name, value: pack.name },
            (pack.name || copy.empty) + " · " + formatBytes(pack.totalBytes) + (pack.encrypted === true ? " · " + copy.encryptedYes : "")
          )
        )
      ),
      h5(
        Button,
        { variant: "primary", busy: busyImporting, disabled: !zipValue || busyImporting || busyRestoring, onClick: runImport },
        busyImporting ? copy.importing : copy.importCheck
      )
    ),
    h5(
      Field,
      { label: copy.pathLabel, htmlFor: "pk-zip-path", hint: copy.pathHint },
      h5("input", {
        id: "pk-zip-path",
        className: "pk-input",
        value: zipPath,
        placeholder: pathPlaceholder,
        onChange: (event) => {
          setZipPath(event.target.value);
          if (event.target.value.trim()) setPackName("");
          resetRestore();
        }
      })
    ),
    h5(ImportStatus, { model }),
    h5(DiffTable, { model }),
    h5(RestoreControls, { model }),
    applied && applied.kind === "running" ? h5(Progress, { job: restoreJob, label: phaseLabel(restoreJob ? restoreJob.phase : "apply"), onCancel: () => cancelJob(restoreJob) }) : null,
    h5(RestoreResult, { model })
  );
}

// src/client/view/dialogs.ts
var h6 = react.createElement;
function InfoDialog({ model }) {
  const { info, setInfo, setRenameDialog } = model;
  if (info === null) return null;
  const verifyNode = (() => {
    const verify = info.kind === "done" ? info.verify : null;
    if (!verify || typeof verify.checked !== "number") return h6("div", { className: "pk-line" }, copy.infoVerifyMissing);
    const failures = Array.isArray(verify.failures) ? verify.failures : [];
    if (failures.length === 0) return h6("div", { className: "pk-line ok" }, fill(copy.infoVerifyOk, { n: verify.checked }));
    return h6(
      "div",
      null,
      h6("div", { className: "pk-line err" }, fill(copy.infoVerifyFail, { n: failures.length })),
      h6(
        "ul",
        { className: "pk-filelist" },
        ...failures.slice(0, 10).map(
          (item, index) => h6(
            "li",
            { key: "vf" + index },
            h6("span", { className: "pk-path" }, moduleLabel(item?.module) + " / " + (item?.rel ? item.rel : copy.empty)),
            h6("span", { className: "pk-size" }, item?.error ? String(item.error) : copy.unknown)
          )
        )
      )
    );
  })();
  return h6(
    Modal,
    {
      title: copy.infoTitle + " · " + (info.name || copy.empty),
      onClose: () => setInfo(null),
      footer: [
        h6(
          Button,
          {
            key: "rename",
            disabled: !info.name,
            onClick: () => setRenameDialog({ from: info.name, value: info.name, busy: false, error: null })
          },
          copy.actionRename
        ),
        h6(Button, { key: "close", variant: "primary", onClick: () => setInfo(null) }, copy.close)
      ]
    },
    info.kind === "loading" ? h6(Message, null, Spinner(), copy.infoLoading) : null,
    info.kind === "error" ? h6(Message, { tone: "err" }, withDetail(copy.infoFailed, errText(info))) : null,
    info.kind === "done" ? h6(
      "div",
      null,
      h6(
        "div",
        { className: "pk-diff-sum" },
        h6(Tag, null, fill(copy.infoFiles, { n: info.files.length })),
        info.encrypted ? h6(Tag, { tone: "warn" }, copy.encryptedYes) : h6(Tag, null, copy.encryptedNo),
        info.manifest.createdAt ? h6(Tag, null, formatTime(info.manifest.createdAt) || copy.empty) : null,
        info.manifest.sanitized === true ? h6(Tag, null, fill(copy.infoSanitize, { n: numOr(info.manifest.redactions, 0) })) : null
      ),
      info.manifest.note ? h6("div", { className: "pk-hint" }, fill(copy.infoNote, { note: info.manifest.note })) : null,
      verifyNode,
      info.files.length === 0 ? h6(Message, null, copy.noModules) : h6(
        "ul",
        { className: "pk-filelist" },
        ...info.files.slice(0, 200).map(
          (file, index) => h6(
            "li",
            { key: "fl" + index },
            h6("span", { className: "pk-path" }, moduleLabel(file?.module) + " / " + (file?.rel ? file.rel : copy.empty)),
            h6("span", { className: "pk-size" }, formatBytes(file?.size))
          )
        ),
        info.files.length > 200 ? h6("li", { key: "flmore" }, fill(copy.more, { n: info.files.length - 200 })) : null
      )
    ) : null
  );
}
function PasswordDialog({ model }) {
  const { pwDialog, setPwDialog, submitPassword } = model;
  if (pwDialog === null) return null;
  return h6(
    Modal,
    {
      title: copy.passwordDialogTitle,
      busy: pwDialog.busy,
      onClose: () => setPwDialog(null),
      footer: [
        h6(Button, { key: "cancel", disabled: pwDialog.busy, onClick: () => setPwDialog(null) }, copy.cancel),
        h6(Button, { key: "ok", variant: "primary", busy: pwDialog.busy, onClick: submitPassword }, pwDialog.busy ? copy.working : copy.passwordSubmit)
      ]
    },
    h6("div", { className: "pk-hint" }, copy.passwordDialogHint),
    h6(
      "div",
      { className: "pk-field" },
      h6("label", { htmlFor: "pk-password" }, copy.optPassword),
      h6("input", {
        id: "pk-password",
        className: "pk-input",
        type: "password",
        value: pwDialog.value,
        autoFocus: true,
        autoComplete: "current-password",
        placeholder: copy.passwordPlaceholder,
        onChange: (event) => setPwDialog({ ...pwDialog, value: event.target.value, error: null }),
        onKeyDown: (event) => {
          if (event.key === "Enter") submitPassword();
        }
      })
    ),
    pwDialog.error ? h6(Message, { tone: "err" }, pwDialog.error) : null
  );
}
function RenameDialog({ model }) {
  const { renameDialog, setRenameDialog, submitRename } = model;
  if (renameDialog === null) return null;
  return h6(
    Modal,
    {
      title: copy.renameTitle,
      busy: renameDialog.busy,
      onClose: () => setRenameDialog(null),
      footer: [
        h6(Button, { key: "cancel", disabled: renameDialog.busy, onClick: () => setRenameDialog(null) }, copy.cancel),
        h6(Button, { key: "ok", variant: "primary", busy: renameDialog.busy, onClick: submitRename }, copy.save)
      ]
    },
    h6(
      "div",
      { className: "pk-field" },
      h6("label", { htmlFor: "pk-rename-input" }, copy.renameLabel),
      h6("input", {
        id: "pk-rename-input",
        className: "pk-input",
        value: renameDialog.value,
        autoFocus: true,
        onChange: (event) => setRenameDialog({ ...renameDialog, value: event.target.value, error: null }),
        onKeyDown: (event) => {
          if (event.key === "Enter") submitRename();
        }
      })
    ),
    h6("div", { className: "pk-hint" }, renameDialog.from),
    renameDialog.error ? h6(Message, { tone: "err" }, renameDialog.error) : null
  );
}
function ConfirmDialog({ model }) {
  const { confirmDialog, setConfirmDialog, submitConfirm } = model;
  if (confirmDialog === null) return null;
  return h6(
    Modal,
    {
      title: confirmDialog.title,
      busy: confirmDialog.busy,
      onClose: () => setConfirmDialog(null),
      footer: [
        h6(Button, { key: "cancel", disabled: confirmDialog.busy, onClick: () => setConfirmDialog(null) }, copy.cancel),
        h6(
          Button,
          { key: "ok", variant: confirmDialog.danger ? "danger" : "primary", busy: confirmDialog.busy, onClick: submitConfirm },
          confirmDialog.busy ? copy.working : confirmDialog.confirmLabel
        )
      ]
    },
    h6("div", null, confirmDialog.message),
    confirmDialog.error ? h6(Message, { tone: "err" }, confirmDialog.errorPrefix ? withDetail(confirmDialog.errorPrefix, confirmDialog.error) : confirmDialog.error) : null
  );
}

// src/client/index.ts
var h7 = react.createElement;
var inject = ["slots"];
function StatusLine({ model }) {
  const { packsDir, packsBytes, copyText, copied } = model;
  return h7(
    "div",
    { className: "pk-status" },
    h7(
      "button",
      {
        type: "button",
        className: "pk-status-path",
        disabled: !packsDir,
        title: packsDir || copy.fieldMissing,
        onClick: () => copyText(packsDir, "dir")
      },
      h7("span", { className: "pk-status-label" }, copy.packsDir),
      h7("span", { className: "pk-mono" }, packsDir ? maskHome(packsDir) : copy.empty),
      packsDir ? null : h7(Tag, null, copy.fieldMissing),
      copied === "dir" ? h7("span", { className: "pk-copied" }, copy.copied) : null
    ),
    h7("span", { className: "pk-sep", "aria-hidden": "true" }, "·"),
    h7("span", null, copy.usage + " " + (packsBytes === null ? copy.empty : formatBytes(packsBytes))),
    packsBytes === null ? h7(Tag, null, copy.fieldMissing) : null
  );
}
function PackerSettingsPage() {
  const dark = useTheme();
  const model = usePacker();
  const { status, notify, loadStatus } = model;
  const body = status.kind === "loading" ? h7("div", { className: "pk-section" }, h7(Empty, null, Spinner(), copy.loading)) : status.kind === "error" ? h7(
    "div",
    { className: "pk-section" },
    h7(
      Empty,
      { title: copy.unavailable },
      status.message ? errText(status) : copy.empty,
      h7(
        "div",
        { className: "pk-actions", style: { justifyContent: "center", marginTop: "var(--pk-s3)" } },
        h7(Button, { variant: "primary", onClick: () => loadStatus() }, copy.retry)
      )
    )
  ) : h7("div", { className: "pk-body" }, h7(PacksSection, { model }), h7(ContentsSection, { model }), h7(OptionsSection, { model }), h7(RestoreSection, { model }));
  return h7(
    "div",
    { className: "pk-page", "data-dsh-theme": dark ? "dark" : "light" },
    h7("style", null, styles),
    h7(
      "header",
      { className: "pk-head" },
      h7(
        "div",
        { className: "pk-head-text" },
        h7("h3", { className: "pk-title" }, copy.title),
        h7("p", { className: "pk-sub" }, copy.subtitle)
      ),
      status.kind === "ready" ? h7(StatusLine, { model }) : null
    ),
    notify === null ? null : h7(Message, { tone: notify.kind === "ok" ? "ok" : notify.kind === "warn" ? "warn" : "err" }, notify.text),
    body,
    h7(InfoDialog, { model }),
    h7(PasswordDialog, { model }),
    h7(RenameDialog, { model }),
    h7(ConfirmDialog, { model })
  );
}
function apply(ctx) {
  ctx.effect(
    () => ctx.slots.inject(
      "settings.section",
      () => ctx.slots.register(
        {
          name: "settings.section",
          id: "packer-settings",
          order: 60,
          label: () => text().title
        },
        PackerSettingsPage
      )
    ),
    "packer: settings"
  );
}
		return module.exports;
	}
});

