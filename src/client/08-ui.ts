
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
