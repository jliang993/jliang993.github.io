(() => {
  "use strict";

  const KEYS = ["navigation", "title", "body", "formula", "plot", "lab", "notes"];
  const LABELS = {
    navigation: "导航与页码",
    title: "页面标题",
    body: "正文内容",
    formula: "数学公式",
    plot: "图中文字",
    lab: "交互控件",
    notes: "注释与出处",
  };
  const REFLOW_KEYS = ["title", "body", "formula", "lab", "notes"];
  const LIMITS = Object.freeze({ min: 75, max: 150, step: 5 });
  const STORAGE_KEY = "math6015.font-settings.v1";
  const root = document.documentElement;
  const defaults = () => Object.fromEntries(KEYS.map((key) => [key, 100]));
  const state = defaults();
  let details;
  let summary;
  let status;

  const normalise = (value) => Math.min(LIMITS.max, Math.max(LIMITS.min, Math.round(Number(value) / LIMITS.step) * LIMITS.step));
  const validValue = (value) => value !== null && value !== undefined && String(value).trim() !== "" && Number.isFinite(Number(value));
  const copyState = () => Object.fromEntries(KEYS.map((key) => [key, state[key]]));

  function parseStored(raw) {
    if (!raw) return defaults();
    try {
      const parsed = JSON.parse(raw);
      const values = parsed && typeof parsed === "object" && (parsed.values || parsed);
      return Object.fromEntries(KEYS.map((key) => [key, validValue(values?.[key]) ? normalise(values[key]) : 100]));
    } catch {
      return defaults();
    }
  }

  function restoreStored() {
    try {
      Object.assign(state, parseStored(localStorage.getItem(STORAGE_KEY)));
    } catch {
      Object.assign(state, defaults());
    }
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(copyState()));
    } catch {}
  }

  function applyRootState() {
    KEYS.forEach((key) => root.style.setProperty(`--font-${key}-scale`, String(state[key] / 100)));
    root.classList.toggle(
      "font-adjusted",
      KEYS.some((key) => state[key] !== 100)
    );
    root.classList.toggle(
      "font-expanded",
      REFLOW_KEYS.some((key) => state[key] > 100)
    );
    root.classList.toggle("font-large-navigation", state.navigation > 100);
  }

  function syncControl(key) {
    const number = document.querySelector(`[data-font-number="${key}"]`);
    if (number) number.value = String(state[key]);
    for (const button of document.querySelectorAll(`[data-font-step="${key}"]`)) {
      button.disabled = Number(button.dataset.direction) > 0 ? state[key] >= LIMITS.max : state[key] <= LIMITS.min;
    }
  }

  function syncControls() {
    KEYS.forEach(syncControl);
  }

  function announce(key, value, reason) {
    if (!status) return;
    if (reason === "reset") status.textContent = "字体大小已恢复默认值。";
    else if (key) status.textContent = `${LABELS[key]}已调整为 ${value}%。`;
  }

  function dispatchChange(key = null, value = null, reason = "restore") {
    document.dispatchEvent(new CustomEvent("lecture:fontchange", { detail: { key, value, settings: copyState(), reason } }));
  }

  function setValue(key, value, reason = "api") {
    if (!KEYS.includes(key)) throw new TypeError(`Unknown font setting: ${key}`);
    if (!validValue(value)) throw new TypeError(`Invalid font percentage for ${key}`);
    const next = normalise(value);
    if (state[key] === next) {
      syncControl(key);
      return next;
    }
    state[key] = next;
    applyRootState();
    syncControl(key);
    persist();
    announce(key, next, reason);
    dispatchChange(key, next, reason);
    return next;
  }

  function reset(reason = "reset") {
    Object.assign(state, defaults());
    applyRootState();
    syncControls();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    announce(null, null, reason);
    dispatchChange(null, null, reason);
    return copyState();
  }

  restoreStored();
  applyRootState();

  const api = Object.freeze({
    keys: Object.freeze([...KEYS]),
    limits: LIMITS,
    storageKey: STORAGE_KEY,
    get: copyState,
    set: (key, percent) => setValue(key, percent, "api"),
    reset: () => reset("reset"),
  });
  Object.defineProperty(window, "LectureFontSettings", { value: api, configurable: true });

  details = document.getElementById("font-settings");
  summary = document.getElementById("font-settings-summary");
  status = document.getElementById("font-settings-status");
  syncControls();

  if (details && summary) {
    details.addEventListener("toggle", () => summary.setAttribute("aria-expanded", String(details.open)));
    details.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && details.open) {
        event.preventDefault();
        details.open = false;
        summary.focus();
      }
      event.stopPropagation();
    });
    document.addEventListener(
      "keydown",
      (event) => {
        if (event.key !== "Escape" || !details.open) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        details.open = false;
        summary.focus();
      },
      true
    );
    document.addEventListener("pointerdown", (event) => {
      if (details.open && !details.contains(event.target)) details.open = false;
    });
  }

  document.querySelectorAll("[data-font-step]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.fontStep;
      setValue(key, state[key] + Number(button.dataset.direction) * LIMITS.step, "button");
    });
  });
  document.querySelectorAll("[data-font-number]").forEach((input) => {
    input.addEventListener("input", () => {
      if (input.value !== "" && input.validity.valid) {
        setValue(input.dataset.fontNumber, input.value, "number");
      }
    });
    input.addEventListener("change", () => {
      const key = input.dataset.fontNumber;
      if (!validValue(input.value)) syncControl(key);
      else setValue(key, input.value, "number");
    });
  });
  document.getElementById("font-settings-reset")?.addEventListener("click", () => reset("reset"));

  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    Object.assign(state, parseStored(event.newValue));
    applyRootState();
    syncControls();
    dispatchChange(null, null, "storage");
  });

  dispatchChange(null, null, "restore");
})();
