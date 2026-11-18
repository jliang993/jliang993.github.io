/* Chapter tabs and experiment controls. All calculation lives in ChapterExamples. */
(() => {
  "use strict";
  const root = document.querySelector(".math6015"),
    D = window.ChapterExamples;
  if (!root || !D) return;
  const $ = (id) => document.getElementById(id),
    all = (selector, within = root) => [...within.querySelectorAll(selector)];
  const definitions = new Map(D.defs.map((d) => [d.id, d])),
    states = new Map(D.defs.map((d) => [d.id, { ...d.defaults }]));
  const selectedByChapter = new Map();
  let activeId = "quadratic",
    timer = null,
    playing = null,
    direction = 1,
    drag = null,
    saveTimer,
    toastTimer;
  const storageKey = "math6015-chapter-labs-v1";
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
    for (const d of D.defs) if (saved[d.id]) states.set(d.id, D.normalize(d.id, saved[d.id]));
  } catch {}
  const save = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(Object.fromEntries(states)));
      } catch {}
    }, 300);
  };
  function toast(message) {
    $("course-toast").textContent = message;
    $("course-toast").classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $("course-toast").classList.remove("visible"), 3200);
  }
  function pause() {
    clearInterval(timer);
    timer = null;
    if (playing) {
      const button = $("example-" + playing).querySelector('[data-action="play"]');
      button.textContent = "▶ 播放";
      button.setAttribute("aria-label", "播放" + definitions.get(playing).title);
      button.setAttribute("aria-pressed", "false");
    }
    playing = null;
  }
  function draw(id, restoreFocus = null) {
    const d = definitions.get(id),
      panel = $("example-" + id),
      s = D.normalize(id, states.get(id));
    states.set(id, s);
    const result = D.render(id, s);
    if (result.progressMax !== undefined) {
      s.k = result.state.k;
      panel.dataset.progressMax = result.progressMax;
    }
    panel.querySelector(".demo-plot").innerHTML = result.svg;
    const details = panel.querySelector(".demo-details");
    if (details) details.innerHTML = result.details || "";
    panel.querySelector(".demo-legend").replaceChildren(
      ...result.legend.map(([name, color]) => {
        const span = document.createElement("span"),
          dot = document.createElement("i");
        dot.style.background = color;
        span.append(dot, document.createTextNode(name));
        return span;
      })
    );
    panel.querySelector(".demo-metrics").replaceChildren(
      ...result.metrics.map((m) => {
        const block = document.createElement("div"),
          label = document.createElement("span"),
          output = document.createElement("output");
        label.textContent = m.label;
        output.textContent = m.value;
        block.append(label, output);
        return block;
      })
    );
    panel.querySelector(".demo-notice").textContent = result.notice;
    all("[data-param]", panel).forEach((input) => {
      const key = input.dataset.param,
        p = d.controls.find((p) => p.key === key);
      if (result.progressMax !== undefined && key === d.animate) input.max = result.progressMax;
      if (p?.type === "checkbox") input.checked = s[key];
      else if (!(document.activeElement === input && input.type === "number")) input.value = s[key];
      if (p?.type === "range") {
        const output = $(id + "-" + key + "-value"),
          v = p.log ? 10 ** s[key] : s[key];
        output.value = D.fmt(v);
        input.setAttribute("aria-valuetext", D.fmt(v));
      }
      input.disabled = (id === "norms" && s.mode === "inf" && key === "p") || (id === "projection" && s.shape === "circle" && key === "b");
      if (result.progressMax !== undefined && key === d.animate) input.disabled = result.progressMax === 0;
      if (p?.group === "methods") input.disabled = s[key] && d.controls.filter((q) => q.group === "methods" && s[q.key]).length === 1;
      if (id === "jensen" && (key === "a" || key === "b")) input.min = s.fun === "log" ? 0.1 : -2.5;
    });
    all('[data-action="play"],[data-action="step"],[data-action="rewind"],[data-action="replay"]', panel).forEach((button) => {
      button.disabled = (id === "norms" && s.mode === "inf") || result.progressMax === 0;
    });
    const full = panel.querySelector(".demo-full-lab");
    if (full && result.data.config)
      full.href =
        full.getAttribute("href").split("#")[0] +
        "#config=" +
        encodeURIComponent(JSON.stringify({ ...result.data.config, enabled: window.OptLab.METHODS.map((m) => m.id) }));
    if (restoreFocus) panel.querySelector(`[data-drag="${restoreFocus}"]`)?.focus({ preventScroll: true });
  }
  function activate(chapter, id, updateHash = true) {
    root.querySelector("dialog[open]")?.close();
    pause();
    let d = definitions.get(id);
    if (!d || d.chapter !== chapter) d = D.defs.find((d) => d.chapter === chapter);
    if (!d) return;
    activeId = d.id;
    selectedByChapter.set(chapter, d.id);
    all("[data-chapter]").forEach((tab) => {
      const active = tab.dataset.chapter === chapter;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      $("chapter-" + tab.dataset.chapter).hidden = !active;
    });
    const panel = $("chapter-" + chapter);
    all("[data-example-tab]", panel).forEach((tab) => {
      const active = tab.dataset.exampleTab === d.id;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      $("example-" + tab.dataset.exampleTab).hidden = !active;
    });
    draw(d.id);
    if (updateHash) {
      const params = new URLSearchParams({ chapter, example: d.id });
      history.replaceState(null, "", "#" + params.toString());
    }
    const tab = $("chapter-tab-" + chapter);
    if (tab.parentElement.scrollWidth > tab.parentElement.clientWidth) tab.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
  function loadHash() {
    const params = new URLSearchParams(location.hash.slice(1)),
      id = params.get("example"),
      requested = definitions.get(id),
      chapter = params.get("chapter") || requested?.chapter || "00";
    let found = requested?.chapter === chapter ? requested : D.defs.find((d) => d.chapter === chapter);
    if (!found) found = D.defs[0];
    if (params.has("state")) {
      try {
        states.set(found.id, D.normalize(found.id, JSON.parse(params.get("state"))));
      } catch {
        toast("参数链接无法读取，已使用当前参数。");
      }
    }
    activate(found.chapter, found.id, false);
  }
  all("[data-chapter]").forEach((tab) =>
    tab.addEventListener("click", () => activate(tab.dataset.chapter, selectedByChapter.get(tab.dataset.chapter)))
  );
  const search = $("example-search"),
    results = $("library-results"),
    resultCount = $("library-result-count");
  const openExample = (id) => {
    const d = definitions.get(id);
    if (!d) return;
    activate(d.chapter, id);
    if (search) {
      search.value = "";
      results.hidden = true;
      resultCount.textContent = D.defs.length + " 个例子";
    }
    $("example-tab-" + id).focus({ preventScroll: true });
    $("example-tab-" + id).scrollIntoView({ block: "nearest", inline: "nearest" });
  };
  if (search) {
    search.addEventListener("input", () => {
      const query = search.value.trim().toLocaleLowerCase(),
        tokens = query.split(/\s+/);
      results.replaceChildren();
      results.hidden = !query;
      if (!query) {
        resultCount.textContent = D.defs.length + " 个例子";
        return;
      }
      const matched = D.defs.filter((d) =>
        tokens.every((token) => [d.id, d.short, d.title, d.intro, d.question, d.ref.label].join(" ").toLocaleLowerCase().includes(token))
      );
      resultCount.textContent = matched.length + " 个匹配";
      for (const d of matched) {
        const button = document.createElement("button"),
          title = document.createElement("strong"),
          info = document.createElement("span");
        button.type = "button";
        button.dataset.openExample = d.id;
        title.textContent = d.short;
        info.textContent = (d.chapter === "S" ? "补充章" : "第 " + d.chapter + " 章") + " · " + d.ref.label;
        button.append(title, info);
        results.append(button);
      }
      if (!matched.length) {
        const p = document.createElement("p");
        p.textContent = "没有找到匹配的例子。可尝试中文名称、英文模型名或教材小节编号。";
        results.append(p);
      }
    });
    search.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown") {
        const first = results.querySelector("button");
        if (first) {
          event.preventDefault();
          first.focus();
        }
      }
      if (event.key === "Escape") {
        search.value = "";
        search.dispatchEvent(new Event("input"));
      }
    });
    results.addEventListener("keydown", (event) => {
      const buttons = [...results.querySelectorAll("button")],
        i = buttons.indexOf(event.target);
      if (event.key === "Escape") {
        results.hidden = true;
        search.focus();
      } else if (i >= 0 && ["ArrowDown", "ArrowUp"].includes(event.key)) {
        event.preventDefault();
        buttons[(i + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length].focus();
      }
    });
  }
  root.addEventListener("click", (event) => {
    const button = event.target.closest("[data-spine-target]");
    if (!button) return;
    const source = states.get(button.closest("[data-example]").dataset.example),
      id = button.dataset.spineTarget;
    states.set(id, D.normalize(id, { ...states.get(id), angle: source.angle, cut: source.cut, px: source.px, py: source.py, k: 0 }));
    openExample(id);
    save();
  });
  root.addEventListener("click", (event) => {
    const button = event.target.closest("[data-open-example]");
    if (button) {
      const index = button.closest(".textbook-index");
      if (index) index.open = false;
      openExample(button.dataset.openExample);
    }
  });
  all("[data-example-tab]").forEach((tab) =>
    tab.addEventListener("click", () => {
      const d = definitions.get(tab.dataset.exampleTab);
      activate(d.chapter, d.id);
    })
  );
  all("[data-jump]").forEach((button) =>
    button.addEventListener("click", () => {
      activate(button.dataset.jump, selectedByChapter.get(button.dataset.jump));
      $("chapter-tab-" + button.dataset.jump).focus();
      $("chapter-tab-" + button.dataset.jump).scrollIntoView({ block: "nearest" });
    })
  );
  all('[role="tablist"]').forEach((tablist) =>
    tablist.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      const tabs = [...tablist.querySelectorAll('[role="tab"]')],
        i = tabs.indexOf(event.target);
      if (i < 0) return;
      event.preventDefault();
      const j =
        event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (i + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
      tabs[j].click();
      tabs[j].focus();
    })
  );
  root.addEventListener("input", (event) => {
    const input = event.target.closest("[data-param]");
    if (!input || input.value === "") return;
    const panel = input.closest("[data-example]"),
      id = panel.dataset.example,
      d = definitions.get(id),
      s = { ...states.get(id) },
      p = d.controls.find((p) => p.key === input.dataset.param);
    pause();
    s[input.dataset.param] = p?.type === "checkbox" ? input.checked : p?.type === "select" ? input.value : Number(input.value);
    if (id === "jensen" && input.dataset.param === "fun" && s.fun === "log") {
      s.a = 0.3;
      s.b = 2.3;
    }
    states.set(id, D.normalize(id, s));
    draw(id);
    save();
  });
  root.addEventListener("change", (event) => {
    if (event.target.matches('input[type="number"][data-param]')) {
      const input = event.target,
        id = input.closest("[data-example]").dataset.example;
      input.value = states.get(id)[input.dataset.param];
    }
  });
  root.addEventListener("click", (event) => {
    const button = event.target.closest("[data-preset]");
    if (!button) return;
    const id = button.closest("[data-example]").dataset.example,
      d = definitions.get(id),
      preset = d.presets?.find((p) => p.id === button.dataset.preset);
    if (!preset) return;
    pause();
    states.set(id, D.normalize(id, { ...states.get(id), ...preset.state }));
    draw(id);
    save();
  });
  root.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const panel = button.closest("[data-example]"),
      id = panel.dataset.example,
      d = definitions.get(id),
      key = d.animate,
      p = d.controls.find((p) => p.key === key),
      limit = () => (panel.dataset.progressMax === undefined ? p.max : Number(panel.dataset.progressMax));
    if (button.dataset.action === "focus") {
      pause();
      const parent = panel.closest("dialog");
      if (parent) {
        parent.close();
        return;
      }
      const placeholder = document.createComment("experiment location"),
        dialog = document.createElement("dialog"),
        overflow = document.body.style.overflow;
      panel.before(placeholder);
      dialog.className = "demo-focus";
      dialog.setAttribute("aria-label", d.title);
      root.append(dialog);
      dialog.append(panel);
      button.textContent = "收起实验";
      dialog.addEventListener(
        "close",
        () => {
          pause();
          placeholder.replaceWith(panel);
          dialog.remove();
          document.body.style.overflow = overflow;
          button.textContent = "展开实验";
          if (activeId === id) button.focus({ preventScroll: true });
        },
        { once: true }
      );
      document.body.style.overflow = "hidden";
      dialog.showModal();
      return;
    }
    if (button.dataset.action === "replay") {
      pause();
      states.get(id)[key] = p.min;
      draw(id);
      panel.querySelector('[data-action="play"]').click();
      return;
    }
    if (button.dataset.action === "copy") {
      const params = new URLSearchParams({ chapter: d.chapter, example: id, state: JSON.stringify(states.get(id)) }),
        url = location.href.split("#")[0] + "#" + params.toString();
      try {
        await navigator.clipboard.writeText(url);
        toast(location.protocol === "file:" ? "已复制本机实验参数链接。" : "已复制含当前参数的实验链接。");
      } catch {
        history.replaceState(null, "", "#" + params.toString());
        toast("参数已写入地址栏，可以直接复制。");
      }
      return;
    }
    if (button.dataset.action === "reset") {
      pause();
      states.set(id, { ...d.defaults });
      draw(id);
      save();
      return;
    }
    if (button.dataset.action === "rewind") {
      pause();
      states.get(id)[key] = p.min;
      draw(id);
      save();
      return;
    }
    if (button.dataset.action === "step") {
      pause();
      states.get(id)[key] = Math.min(limit(), states.get(id)[key] + p.step);
      draw(id);
      save();
      return;
    }
    if (button.dataset.action === "play") {
      if (playing === id) {
        pause();
        save();
        return;
      }
      pause();
      playing = id;
      direction = 1;
      if (states.get(id)[key] >= limit()) states.get(id)[key] = p.min;
      button.textContent = "Ⅱ 暂停";
      button.setAttribute("aria-label", "暂停" + d.title);
      button.setAttribute("aria-pressed", "true");
      draw(id);
      timer = setInterval(
        () => {
          const s = states.get(id),
            step = key === "k" ? 1 : Math.max(p.step, (p.max - p.min) / 90);
          s[key] = Math.max(p.min, Math.min(limit(), Math.round((s[key] + direction * step - p.min) / p.step) * p.step + p.min));
          draw(id);
          if (s[key] >= limit()) {
            if (key === "k") {
              pause();
              save();
            } else direction = -1;
          } else if (s[key] <= p.min) direction = 1;
        },
        key === "k" ? 190 : 85
      );
    }
  });
  function coordinates(event, plot) {
    const svg = plot.querySelector("svg"),
      p = svg.createSVGPoint();
    p.x = event.clientX;
    p.y = event.clientY;
    const local = p.matrixTransform(svg.getScreenCTM().inverse()),
      [xmin, xmax, ymin, ymax] = svg.dataset.bounds.split(",").map(Number),
      [left, top, width, height] = svg.dataset.box.split(",").map(Number);
    return [xmin + ((local.x - left) / width) * (xmax - xmin), ymax - ((local.y - top) / height) * (ymax - ymin)];
  }
  all(".demo-plot").forEach((plot) => {
    plot.addEventListener("pointerdown", (event) => {
      const id = plot.closest("[data-example]").dataset.example,
        handle = event.target.closest("[data-drag]");
      if (handle) {
        pause();
        event.preventDefault();
        handle.focus({ preventScroll: true });
        drag = {
          id,
          keys: handle.dataset.drag.split(","),
          plot,
          pointer: event.pointerId,
          release: D.Plot.freezeFrames(plot.querySelectorAll("svg[data-bounds]")),
        };
        plot.setPointerCapture(event.pointerId);
      } else if (id === "silver" && states.get(id).view === "steps") {
        pause();
        states.get(id).k = Math.max(0, Math.min(127, Math.round(coordinates(event, plot)[0])));
        draw(id);
        save();
      } else if (id === "likelihood") {
        pause();
        states.get(id).trial = Math.max(0, Math.min(1, coordinates(event, plot)[0]));
        draw(id);
        save();
      }
    });
    plot.addEventListener("pointermove", (event) => {
      if (!drag || drag.plot !== plot) return;
      const [x, y] = coordinates(event, plot),
        s = { ...states.get(drag.id), [drag.keys[0]]: x, [drag.keys[1]]: y };
      states.set(drag.id, D.normalize(drag.id, s));
      draw(drag.id, drag.keys.join(","));
    });
    const stop = () => {
      if (drag?.plot === plot) {
        const { id, release } = drag;
        drag = null;
        release();
        draw(id);
        save();
      }
    };
    plot.addEventListener("pointerup", stop);
    plot.addEventListener("pointercancel", stop);
    plot.addEventListener("lostpointercapture", stop);
    plot.addEventListener("keydown", (event) => {
      const handle = event.target.closest("[data-drag]");
      if (!handle || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
      event.preventDefault();
      pause();
      const id = plot.closest("[data-example]").dataset.example,
        [kx, ky] = handle.dataset.drag.split(","),
        s = { ...states.get(id) },
        step = event.shiftKey ? 0.25 : 0.05;
      if (event.key === "ArrowLeft") s[kx] -= step;
      if (event.key === "ArrowRight") s[kx] += step;
      if (event.key === "ArrowUp") s[ky] += step;
      if (event.key === "ArrowDown") s[ky] -= step;
      states.set(id, D.normalize(id, s));
      draw(id, handle.dataset.drag);
      save();
    });
  });
  const theme = $("course-preview-theme");
  if (theme) {
    const apply = (dark) => {
      document.documentElement.dataset.theme = dark ? "dark" : "light";
      theme.setAttribute("aria-label", dark ? "切换为浅色主题" : "切换为深色主题");
    };
    let stored;
    try {
      stored = localStorage.getItem("math6015-preview-theme");
    } catch {}
    apply(stored ? stored === "dark" : matchMedia("(prefers-color-scheme: dark)").matches);
    theme.hidden = false;
    theme.addEventListener("click", () => {
      const dark = document.documentElement.dataset.theme !== "dark";
      apply(dark);
      try {
        localStorage.setItem("math6015-preview-theme", dark ? "dark" : "light");
      } catch {}
    });
  }
  window.addEventListener("hashchange", () => {
    const params = new URLSearchParams(location.hash.slice(1));
    if (params.has("chapter") || params.has("example")) loadHash();
  });
  window.addEventListener("pagehide", () => {
    pause();
    clearTimeout(saveTimer);
    try {
      localStorage.setItem(storageKey, JSON.stringify(Object.fromEntries(states)));
    } catch {}
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      pause();
      save();
    }
  });
  loadHash();
})();
