
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
