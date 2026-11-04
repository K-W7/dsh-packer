
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
