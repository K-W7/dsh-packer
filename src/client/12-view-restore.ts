
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
