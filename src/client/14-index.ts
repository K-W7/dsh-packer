
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

