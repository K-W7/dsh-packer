
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
