
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
