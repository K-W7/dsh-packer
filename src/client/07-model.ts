
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
