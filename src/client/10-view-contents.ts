
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
