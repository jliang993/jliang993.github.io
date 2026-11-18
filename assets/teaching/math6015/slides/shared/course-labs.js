(function (root) {
  "use strict";
  const D = root.ChapterExamples,
    math = root.LectureMath,
    instances = new Map();
  const doc = document.querySelector('meta[name="review-document"]').content,
    key = "math6015." + doc + ".labs.v1";
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  let restored = {},
    active = null,
    timer = null,
    serial = 0;
  try {
    restored = JSON.parse(localStorage.getItem(key) || "{}");
  } catch {}
  try {
    const q = new URLSearchParams(location.search).get("lab");
    if (q && q.length < 20000) {
      const s = JSON.parse(q);
      if (s.stage) restored[s.stage.id] = s.stage.state;
    }
  } catch {}
  function control(c, s) {
    const value = s[c.key],
      label = esc(c.label),
      name = doc + "-choice-" + ++serial;
    if (c.type === "select")
      return `<fieldset class="lab-control lab-choice-field"><legend>${label}</legend><div class="lab-choice-list">${c.options
        .map((o) => {
          const [v, t] = o.split("|");
          return `<label class="lab-choice"><input type="radio" name="${name}" data-key="${esc(c.key)}" value="${esc(v)}"${
            String(value) === v ? " checked" : ""
          }><span>${esc(t)}</span></label>`;
        })
        .join("")}</div></fieldset>`;
    if (c.type === "checkbox")
      return `<label class="lab-choice"><input type="checkbox" data-key="${esc(c.key)}"${value ? " checked" : ""}><span>${label}</span></label>`;
    return `<label class="lab-control"><span>${label}</span><span class="input-pair"><input type="range" data-key="${esc(c.key)}" min="${
      c.min
    }" max="${c.max}" step="${c.step}" value="${value}" aria-label="${label}"><input type="number" data-key="${esc(c.key)}" min="${c.min}" max="${
      c.max
    }" step="${c.step}" value="${value}" aria-label="${label}，数值输入"></span></label>`;
  }
  function state(v) {
    return { ...v.state, __plot: v.plot };
  }
  function save() {
    for (const [id, v] of instances) restored[id] = state(v);
    try {
      localStorage.setItem(key, JSON.stringify(restored));
    } catch {}
  }
  function sync(v, scope = v.el) {
    for (const field of scope.querySelectorAll("[data-key]")) {
      const value = v.state[field.dataset.key];
      if (field.type === "radio") field.checked = field.value === String(value);
      else if (field.type === "checkbox") field.checked = !!value;
      else {
        if (field.dataset.key === v.def.animate && v.result?.progressMax != null) field.max = v.result.progressMax;
        if (field !== document.activeElement) field.value = value;
      }
    }
  }
  function namespace(html, prefix) {
    for (const id of new Set([...html.matchAll(/(?<![\w-])id="([^"]+)"/g)].map((m) => m[1]))) {
      const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      html = html.replace(new RegExp(`((?<![\\w-])id="|href="#|url\\(#)${escaped}(?=["\\)])`, "g"), `$1${prefix}-${id}`);
    }
    return html;
  }
  function selectPlot(v) {
    const graphs = [...v.el.querySelectorAll(".lab-chart svg[data-bounds]")];
    graphs.forEach((g, i) => {
      const box = g.closest("figure") || g;
      box.hidden = graphs.length > 1 && i !== v.plot;
    });
    v.el.querySelectorAll("[data-plot]").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.plot === v.plot)));
  }
  function render(v) {
    const result = D.render(v.kind, v.state);
    v.state = result.state;
    v.result = result;
    v.el.querySelector(".lab-chart").innerHTML = namespace(result.svg, v.id);
    const graphs = [...v.el.querySelectorAll(".lab-chart svg[data-bounds]")];
    v.plot = Math.max(0, Math.min(v.plot, graphs.length - 1));
    v.el.querySelector(".plot-views").innerHTML =
      graphs.length > 1
        ? graphs
            .map(
              (g, i) =>
                `<button data-plot="${i}" aria-pressed="${i === v.plot}">${esc(
                  g.closest("figure")?.querySelector("figcaption")?.textContent || g.querySelector("title")?.textContent || "图 " + (i + 1)
                )}</button>`
            )
            .join("")
        : "";
    selectPlot(v);
    v.el.querySelector(".lab-legend").innerHTML = (result.legend || [])
      .map(([label, color]) => `<span><i style="background:${color}"></i>${esc(label)}</span>`)
      .join("");
    v.el.querySelector(".lab-metrics").innerHTML = (result.metrics || [])
      .map((m) => `<div class="lab-metric"><span>${esc(m.label)}</span><strong>${esc(m.value)}</strong></div>`)
      .join("");
    v.el.querySelector(".lab-notice").textContent = result.notice || "";
    sync(v);
    math?.enhance(v.el.closest("section.lecture-slide"));
  }
  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    for (const v of instances.values()) {
      const b = v.el.querySelector("[data-action=play]");
      if (b) {
        b.textContent = "播放";
        b.setAttribute("aria-pressed", "false");
      }
    }
  }
  function update(v, patch) {
    v.state = D.normalize(v.kind, { ...v.state, ...patch });
    render(v);
    save();
  }
  function fieldInput(v, e, scope = v.el) {
    const field = e.target,
      c = field.dataset.key;
    if (!c || (field.type === "radio" && !field.checked)) return;
    stop();
    if (field.type === "number" && field.value === "") return;
    const value = field.type === "checkbox" ? field.checked : field.type === "radio" ? field.value : +field.value;
    if (typeof value === "number" && !Number.isFinite(value)) return;
    update(v, { [c]: value });
    sync(v, scope);
  }
  function details(v) {
    stop();
    const modal = document.getElementById("lab-dialog"),
      box = document.getElementById("lab-dialog-content");
    document.getElementById("lab-dialog-title").textContent = v.def.title + " · 参数与数据";
    const extra = v.def.controls.filter((c) => !v.controls.includes(c));
    const points = (v.def.points || []).flatMap((p) =>
      [p.kx, p.ky].map((key, i) => ({
        key,
        type: "range",
        label: p.label + " · " + (i ? "纵坐标" : "横坐标"),
        min: v.def.pointBounds[i * 2],
        max: v.def.pointBounds[i * 2 + 1],
        step: 0.05,
      }))
    );
    box.innerHTML = `<div class="modal-controls">${[...extra, ...points].map((c) => control(c, v.state)).join("")}</div><div class="modal-results">${
      v.result.details || `<p>${esc(v.result.notice)}</p>`
    }</div><div class="lab-tools"><button data-download>下载数值 JSON</button></div>`;
    box.oninput = (e) => {
      fieldInput(v, e, box);
      box.querySelector(".modal-results").innerHTML = v.result.details || `<p>${esc(v.result.notice)}</p>`;
      math?.enhance(box);
    };
    box.onclick = (e) => {
      const target = e.target.closest("[data-spine-target]");
      if (!target) return;
      const id = target.dataset.spineTarget,
        def = D.defs.find((d) => d.id === id);
      if (!def) return;
      const next = D.normalize(id, {
          ...def.defaults,
          ...Object.fromEntries(["angle", "cut", "px", "py"].filter((k) => k in v.state).map((k) => [k, v.state[k]])),
          k: 0,
        }),
        url = new URL(document.querySelector(".course-brand").href);
      url.hash = new URLSearchParams({ chapter: def.chapter, example: id, state: JSON.stringify(next) });
      location.href = url.href;
    };
    box.querySelector("[data-download]").onclick = () => {
      const url = URL.createObjectURL(
          new Blob([JSON.stringify({ example: v.kind, parameters: v.state, data: v.result.data }, null, 2)], { type: "application/json" })
        ),
        a = document.createElement("a");
      a.href = url;
      a.download = `${doc}-${v.kind}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    modal.showModal();
    math?.enhance(box);
  }
  function mount(el) {
    const id = el.closest("section.lecture-slide").id;
    if (instances.has(id)) return instances.get(id);
    const kind = el.dataset.lab,
      def = D.defs.find((d) => d.id === kind);
    if (!def) throw Error("Unknown course experiment: " + kind);
    const primary = def.controls.filter((c) => c.group !== "advanced" && c.group !== "methods" && c.group !== "line"),
      controls = primary.slice(0, 4);
    const animated = def.controls.find((c) => c.key === def.animate);
    if (animated && !controls.includes(animated)) {
      controls.pop();
      controls.unshift(animated);
    }
    const v = { id, el, kind, def, controls, state: D.normalize(kind, restored[id] || def.defaults), plot: restored[id]?.__plot || 0 };
    instances.set(id, v);
    el.innerHTML = `<div class="lab-grid"><div class="lab-controls">${controls.map((c) => control(c, v.state)).join("")}${
      animated
        ? '<div class="play-controls"><button data-action="play" aria-pressed="false">播放</button><button data-action="step">单步 →</button><button data-action="rewind">起点</button></div>'
        : ""
    }<div class="lab-tools"><button data-action="details">更多参数 / 数据</button><button data-action="reset">恢复默认</button></div><p class="lab-hint">${
      def.points ? "拖动图中的控制点；也可选中点后用方向键移动。" : "调整参数，图形和数值同步计算。"
    }</p></div><div class="lab-main"><div class="plot-views" role="group" aria-label="选择图形"></div><div class="lab-chart"></div><div class="lab-legend"></div><div class="lab-metrics"></div><p class="lab-notice"></p></div></div>`;
    // Keep the observation prompt beside the controls. Placing it beneath the
    // full graph and model notes can collide with the fixed slide footer.
    const question = el.parentElement.querySelector(":scope > .experiment-question");
    if (question) el.querySelector(".lab-controls").append(question);
    el.addEventListener("input", (e) => fieldInput(v, e));
    el.addEventListener("click", (e) => {
      const plot = e.target.closest("[data-plot]");
      if (plot) {
        v.plot = +plot.dataset.plot;
        selectPlot(v);
        save();
        return;
      }
      const action = e.target.closest("[data-action]")?.dataset.action;
      if (!action) return;
      if (action === "details") {
        details(v);
        return;
      }
      if (action === "reset") {
        stop();
        v.plot = 0;
        update(v, def.defaults);
        return;
      }
      if (!animated) return;
      const c = animated,
        limit = () => Math.min(c.max, v.result.progressMax ?? c.max);
      if (action === "rewind") {
        stop();
        update(v, { [c.key]: c.min });
      }
      if (action === "step") {
        stop();
        update(v, { [c.key]: Math.min(limit(), v.state[c.key] + c.step) });
      }
      if (action === "play") {
        if (timer) {
          stop();
          return;
        }
        stop();
        if (v.state[c.key] >= limit()) update(v, { [c.key]: c.min });
        const b = e.target.closest("button");
        b.textContent = "暂停";
        b.setAttribute("aria-pressed", "true");
        timer = setInterval(() => {
          const next = v.state[c.key] + c.step;
          if (next > limit() + 1e-9) {
            stop();
            return;
          }
          update(v, { [c.key]: next });
        }, 360);
      }
    });
    let drag = null;
    el.addEventListener("pointerdown", (e) => {
      const point = e.target.closest("[data-drag]");
      if (!point) return;
      stop();
      e.preventDefault();
      const svg = point.closest("svg"),
        box = svg.getBoundingClientRect();
      drag = {
        keys: point.dataset.drag.split(","),
        box,
        bounds: svg.dataset.bounds.split(",").map(Number),
        area: svg.dataset.box.split(",").map(Number),
        view: svg.viewBox.baseVal,
        release: D.Plot.freezeFrames(el.querySelectorAll("svg[data-bounds]")),
      };
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const {
          box,
          bounds: [a, b, c, d],
          area: [left, top, w, h],
          view,
        } = drag,
        px = ((e.clientX - box.left) / box.width) * view.width,
        py = ((e.clientY - box.top) / box.height) * view.height;
      const xy = [a + ((px - left) / w) * (b - a), d - ((py - top) / h) * (d - c)];
      update(v, Object.fromEntries(drag.keys.map((k, i) => [k, xy[i]])));
    });
    const endDrag = () => {
      if (!drag) return;
      const release = drag.release;
      drag = null;
      release();
      render(v);
    };
    for (const event of ["pointerup", "pointercancel", "lostpointercapture"]) el.addEventListener(event, endDrag);
    el.addEventListener("keydown", (e) => {
      const p = e.target.closest("[data-drag]");
      if (!p || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
      e.preventDefault();
      e.stopPropagation();
      stop();
      const keys = p.dataset.drag.split(","),
        i = keys.length === 1 || ["ArrowLeft", "ArrowRight"].includes(e.key) ? 0 : 1;
      update(v, { [keys[i]]: v.state[keys[i]] + (e.shiftKey ? 0.2 : 0.05) * (["ArrowRight", "ArrowUp"].includes(e.key) ? 1 : -1) });
      el.querySelector(`[data-drag="${p.dataset.drag}"]`)?.focus();
    });
    render(v);
    return v;
  }
  function activate(slide) {
    stop();
    active = slide?.id;
    slide?.querySelectorAll(".lecture-lab").forEach(mount);
  }
  function snapshot() {
    const v = instances.get(active);
    return { stage: v ? { id: v.id, state: state(v) } : undefined };
  }
  function mountAll() {
    document.querySelectorAll(".lecture-lab").forEach(mount);
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
  });
  root.LectureLabs = { activate, mount, mountAll, stop, snapshot, instances };
})(globalThis);
