
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
