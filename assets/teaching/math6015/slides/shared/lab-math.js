/* MathJax for live plot labels, controls, legends and numerical readouts.
 * Plot geometry remains SVG. Mathematical labels become MathJax SVG paths,
 * sized in plot units rather than enlarging along with a screenshot's type.
 */
(function (root) {
  "use strict";
  const dictionary = new Map(
    Object.entries({
      "(φ(t)−φ(0))/(f(xᵏ)−p*)": String.raw`\frac{\varphi(t)-\varphi(0)}{f(x^{(k)})-p^\star}`,
      "log₁₀(f(xᵏ)−p*)": String.raw`\log_{10}\bigl(f(x^{(k)})-p^\star\bigr)`,
      "log₁₀‖∇f(xᵏ)‖₂": String.raw`\log_{10}\lVert\nabla f(x^{(k)})\rVert_2`,
      "1/√λmin(A⁻¹)": String.raw`1/\sqrt{\lambda_{\min}(A^{-1})}`,
      "1/√λmax(A⁻¹)": String.raw`1/\sqrt{\lambda_{\max}(A^{-1})}`,
      "√λ₁(A)": String.raw`\sqrt{\lambda_1(A)}`,
      "√λ₂(A)": String.raw`\sqrt{\lambda_2(A)}`,
      "√κ(A)": String.raw`\sqrt{\kappa(A)}`,
      "P¹ᐟ²x": String.raw`P^{1/2}x`,
      "(f′)²/(2f″)": String.raw`\frac{(f')^2}{2f''}`,
      "ρf(x)": String.raw`\rho_f(x)`,
      "‖x‖p": String.raw`\lVert x\rVert_p`,
      "‖z‖*": String.raw`\lVert z\rVert_*`,
      "ℓ∞": String.raw`\ell_\infty`,
    })
  );
  const subchars = "₀₁₂₃₄₅₆₇₈₉₊₋ᵢₖₜₓᵧₙ",
    subvalues = "0123456789+-iktxyn";
  const supermap = {
    "⁰": "0",
    "¹": "1",
    "²": "2",
    "³": "3",
    "⁴": "4",
    "⁵": "5",
    "⁶": "6",
    "⁷": "7",
    "⁸": "8",
    "⁹": "9",
    "⁺": "+",
    "⁻": "-",
    ᵀ: "T",
    ᵏ: "k",
    ᵐ: "m",
    ⁿ: "n",
    ʲ: "j",
    "⁽": "(",
    "⁾": ")",
    ᐟ: "/",
  };
  const symbols = {
    α: "alpha",
    β: "beta",
    γ: "gamma",
    δ: "delta",
    ε: "varepsilon",
    θ: "theta",
    λ: "lambda",
    κ: "kappa",
    μ: "mu",
    ρ: "rho",
    φ: "varphi",
    η: "eta",
    τ: "tau",
    σ: "sigma",
    Δ: "Delta",
    "∇": "nabla",
    ℓ: "ell",
    "∞": "infty",
    "≤": "le",
    "≥": "ge",
    "≠": "ne",
    "≈": "approx",
    "≻": "succ",
    "≽": "succeq",
    "∈": "in",
    "×": "times",
    "→": "to",
    "∝": "propto",
  };
  function toTex(source) {
    let s = String(source).trim();
    if (s.startsWith("\\(") && s.endsWith("\\)")) return s.slice(2, -2);
    if (s.includes("\\")) return s;
    const known = dictionary.get(s.replace(/\s/g, ""));
    if (known) return known;
    s = s
      .replace(/(\d(?:\.\d+)?)[eE]([+−-]?\d+)/g, (_, n, e) => n + "\\times10^{" + Number(e.replace("−", "-")) + "}")
      .replace(/x₀,([₁₂12])/g, (_, i) => "x^{(0)}_{" + ({ "₁": 1, "₂": 2 }[i] || i) + "}")
      .replace(/λ(min|max)/g, (_, a) => "\\lambda_{\\" + a + "}")
      .replace(/H̃/g, "\\widetilde H")
      .replace(/([xyzw])ᵏ/g, "$1^{(k)}")
      .replace(/([xyzwp])\*/g, "$1^\\star")
      .replace(/([xy])([123])\b/g, "$1_{$2}")
      .replace(/−/g, "-")
      .replace(/′/g, "'")
      .replace(/″/g, "''")
      .replace(/‴/g, "'''")
      // A parenthesized iteration index is one superscript, even if its digits
      // are ordinary characters (e.g. x⁽12⁾). Decode it before isolated runs.
      .replace(/⁽([^⁽⁾]+)⁾/g, (_, index) => "^{(" + [...index].map((c) => supermap[c] ?? c).join("") + ")}")
      .replace(/[₀₁₂₃₄₅₆₇₈₉₊₋ᵢₖₜₓᵧₙ]+/g, (m) => "_{" + [...m].map((c) => subvalues[subchars.indexOf(c)]).join("") + "}")
      .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻ᵀᵏᵐⁿʲ⁽⁾ᐟ]+/g, (m) => "^{" + [...m].map((c) => supermap[c]).join("") + "}")
      .replace(/‖([^‖]+)‖/g, "\\lVert $1\\rVert ")
      .replace(/[αβγδεθλκμρφητσΔ∇ℓ∞≤≥≠≈≻≽∈×→∝]/g, (c) => "\\" + symbols[c] + " ")
      // An underscore is a JS word character: log_{10} needs an explicit
      // boundary here, otherwise MathJax reads l, o, g as three variables.
      .replace(/(?<!\\)\b(log|exp|sin|cos|sinh|cosh|det|max|min)(?=\b|_)/g, "\\$1 ")
      .replace(/\b(diag|cond)\b/g, "\\operatorname{$1}")
      .replace(/√([^,;]+)/g, "\\sqrt{$1}");
    return s;
  }
  function isMath(s) {
    s = s.trim();
    if (!s) return false;
    if (s.startsWith("\\(")) return true;
    if (/[α-ωΑ-Ω∇ℓ∞≤≥≠≈≻≽∈√‖₀-₉ᵢₖₜₓᵧₙ¹²³⁰-⁹ᵀᵏᵐⁿʲ⁽⁾′″]/.test(s)) return true;
    if (/^[()\s−+\-\d.,eE×/]+$/.test(s) && /\d/.test(s)) return true;
    if (/^[A-Za-z]$/.test(s) || /^[A-Za-z]\*$/.test(s)) return true;
    if (/^\(\s*[A-Za-z](?:\s*,\s*[A-Za-z])+\s*\)$/.test(s)) return true;
    if (/[=<>+*/^]/.test(s) || /[a-zA-Z]\(/.test(s) || /\b(log|exp|sin|cos|sinh|cosh|det|max|min)\s/.test(s)) {
      const words = s.match(/[a-zA-Z]+/g) || [];
      return words.every((w) => w.length <= 2 || ["log", "exp", "diag", "cond", "det", "max", "min", "sin", "cos", "sinh", "cosh"].includes(w));
    }
    return false;
  }
  function segments(text) {
    return String(text)
      .split(/(\\\([^]*?\\\)|[\u3400-\u9fff，。；：、！？「」“”·（）]+)/g)
      .filter(Boolean)
      .map((value) => ({ text: value, tex: isMath(value) ? toTex(value) : null }));
  }
  const cache = new Map(),
    pending = new Set(),
    NS = "http://www.w3.org/2000/svg";
  // Plot type is independently adjustable from the surrounding lab UI.  Plain
  // SVG text can be resized directly, while MathJax labels need their path-group
  // transform recomputed so their anchor and in-view clamping remain correct.
  const plainPlotLabels = new WeakMap(),
    mathPlotLabels = new WeakMap();
  const mathJaxURL = root.document?.currentScript?.dataset.mathjax;
  let loadingMathJax;
  function ready() {
    if (root.MathJax?.startup?.promise) return root.MathJax.startup.promise;
    if (!loadingMathJax && mathJaxURL) {
      const script = document.createElement("script");
      script.src = mathJaxURL;
      loadingMathJax = new Promise((resolve, reject) => {
        script.onload = () => resolve(root.MathJax.startup.promise);
        script.onerror = () => reject(Error("Local MathJax could not be loaded"));
      }).catch((error) => {
        script.remove();
        loadingMathJax = null;
        throw error;
      });
      document.head.append(script);
    }
    return loadingMathJax;
  }
  function conversion(tex) {
    if (cache.has(tex)) return cache.get(tex);
    const work = Promise.resolve(ready())
      .then(() => {
        if (!root.MathJax?.tex2svgPromise) throw Error("Local MathJax is unavailable");
        return root.MathJax.tex2svgPromise(tex, { display: false, end: 150 });
      })
      .then((node) => {
        if (node.querySelector('[data-mml-node="merror"]')) throw Error("Invalid live TeX: " + tex);
        const all = node.querySelectorAll("svg");
        if (all.length !== 1) throw Error("Expected one unbroken MathJax SVG: " + tex);
        const svg = all[0];
        return svg;
      })
      .catch((error) => {
        cache.delete(tex);
        throw error;
      });
    cache.set(tex, work);
    if (cache.size > 1600) cache.delete(cache.keys().next().value);
    return work;
  }
  function dimensions(svg) {
    return svg.getAttribute("viewBox").split(/\s+/).map(Number);
  }
  function plotFontScale() {
    if (!root.document) return 1;
    const value = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--font-plot-scale"));
    return Number.isFinite(value) && value > 0 ? value : 1;
  }
  function isPlainPlotLabel(text) {
    // MathJax may contain fallback <text> whose coordinates are expressed in its
    // own 1000-unit glyph space.  Scaling those nodes as ordinary plot labels
    // would corrupt the formula; their enclosing group is scaled instead.
    return !text.closest(".graph-math-label,.live-math,.typeset-math,[data-mml-node]");
  }
  function resizePlainPlotLabel(text, scale) {
    if (!isPlainPlotLabel(text)) return;
    let record = plainPlotLabels.get(text);
    if (!record) {
      const style = getComputedStyle(text),
        base = Number.parseFloat(style.fontSize);
      if (!Number.isFinite(base) || base <= 0) return;
      record = { base, value: text.style.getPropertyValue("font-size"), priority: text.style.getPropertyPriority("font-size") };
      plainPlotLabels.set(text, record);
    }
    if (Math.abs(scale - 1) < 1e-6) {
      if (record.value) text.style.setProperty("font-size", record.value, record.priority);
      else text.style.removeProperty("font-size");
    } else text.style.setProperty("font-size", record.base * scale + "px", record.priority);
  }
  function positionMathPlotLabel(group, scale = plotFontScale()) {
    const layout = mathPlotLabels.get(group);
    if (!layout) return;
    const { body, vx, vy, vw, vh, mx, my, mw, mh, axis, labelSize, anchor, x, y } = layout;
    const size = (labelSize || (axis ? 17 : 19)) * scale;
    const glyphScale = axis && anchor === "end" && x - vx < vw / 4 ? Math.min(size / 1000, (x - vx - 3) / mw) : size / 1000;
    const baseline = labelSize ? Math.max(vy + 2 - my * glyphScale, Math.min(y, vy + vh - 2 - (my + mh) * glyphScale)) : y;
    let left = x - (anchor === "end" ? mw : anchor === "middle" ? mw / 2 : 0) * glyphScale;
    left = Math.max(vx + 3, Math.min(left, vx + vw - 3 - mw * glyphScale));
    body.setAttribute("transform", `translate(${left - mx * glyphScale} ${baseline}) scale(${glyphScale})`);
  }
  function resizePlotLabels(element = root.document) {
    if (!element?.querySelectorAll) return;
    const scale = plotFontScale();
    for (const text of element.querySelectorAll("svg[data-bounds] text")) resizePlainPlotLabel(text, scale);
    for (const group of element.querySelectorAll(".graph-math-label")) positionMathPlotLabel(group, scale);
  }
  async function inline(tex, label) {
    const svg = (await conversion(tex)).cloneNode(true),
      [x, y, w, h] = dimensions(svg),
      span = document.createElement("span");
    span.className = "live-math";
    span.dataset.latex = tex;
    span.setAttribute("role", "math");
    span.setAttribute("aria-label", label);
    Object.assign(svg.style, { width: w / 1000 + "em", height: h / 1000 + "em", verticalAlign: -(h + y) / 1000 + "em", maxWidth: "none" });
    svg.setAttribute("aria-hidden", "true");
    span.append(svg);
    const accessible = document.createElement("span");
    accessible.className = "math-accessible";
    accessible.textContent = label;
    span.append(accessible);
    return span;
  }
  async function graphLabel(text) {
    if (text.closest(".graph-math-label") || text.dataset.mathPending) return;
    const label = text.textContent,
      parts = segments(label);
    if (!parts.some((p) => p.tex)) return;
    // Chinese descriptions remain upright text; mathematical fragments are TeX.
    const tex = parts.map((p) => p.tex || String.raw`\text{${p.text.replace(/[{}\\]/g, "")}}`).join(String.raw`\,`);
    text.dataset.mathPending = "true";
    try {
      const rendered = await conversion(tex);
      if (!text.isConnected) return;
      const svg = text.closest("svg"),
        [vx, vy, vw, vh] = dimensions(svg),
        [mx, my, mw, mh] = dimensions(rendered);
      const axis = text.closest(".demo-axes"),
        style = getComputedStyle(text);
      const labelSize = Number.parseFloat(style.getPropertyValue("--plot-label-size"));
      const anchor = text.getAttribute("text-anchor");
      const x = +(text.getAttribute("x") || 0),
        y = +(text.getAttribute("y") || 0);
      const group = document.createElementNS(NS, "g"),
        body = document.createElementNS(NS, "g");
      group.classList.add("graph-math-label");
      group.dataset.latex = tex;
      group.setAttribute("aria-label", label);
      group.style.color = style.getPropertyValue("--plot-label-color").trim() || text.getAttribute("fill") || style.fill || "currentColor";
      group.setAttribute("fill", "currentColor");
      if (text.hasAttribute("transform")) group.setAttribute("transform", text.getAttribute("transform"));
      for (const child of rendered.childNodes) body.append(child.cloneNode(true));
      // MathJax's fallback CJK text is in 1000-unit em coordinates. Do not let the
      // plot's ordinary SVG text rule override its explicit font size.
      for (const t of body.querySelectorAll("text")) if (t.hasAttribute("font-size")) t.style.fontSize = t.getAttribute("font-size");
      group.append(body);
      mathPlotLabels.set(group, { body, vx, vy, vw, vh, mx, my, mw, mh, axis: !!axis, labelSize, anchor, x, y });
      positionMathPlotLabel(group);
      text.replaceWith(group);
    } catch (error) {
      delete text.dataset.mathPending;
      throw error;
    }
  }
  async function htmlText(node) {
    const original = node.data,
      parts = segments(original);
    if (!parts.some((p) => p.tex)) return;
    const replacements = await Promise.all(parts.map((p) => (p.tex ? inline(p.tex, p.text) : Promise.resolve(document.createTextNode(p.text)))));
    if (node.isConnected && node.data === original) node.replaceWith(...replacements);
  }
  function enhance(element) {
    if (!element) return Promise.resolve();
    resizePlotLabels(element);
    if (!root.MathJax) return Promise.resolve();
    const jobs = [...element.querySelectorAll("svg[data-bounds] text")].map(graphLabel);
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT),
      nodes = [];
    let node;
    while ((node = walker.nextNode())) {
      const parent = node.parentElement;
      if (!parent || parent.closest("svg,.live-math,.typeset-math,.math-accessible,select,option,script,style,button")) continue;
      if (node.data.trim()) nodes.push(node);
    }
    jobs.push(...nodes.map(htmlText));
    const work = Promise.all(jobs).catch((error) => {
      console.error("Live formula rendering:", error);
      element.dataset.mathError = error.message;
    });
    pending.add(work);
    work.finally(() => pending.delete(work));
    return work;
  }
  function namePlots(lab) {
    const charts = lab.querySelectorAll(".lab-chart svg:not(svg svg)");
    const title = lab.closest(".lecture-slide")?.dataset.title || "交互图";
    for (const [index, svg] of charts.entries()) {
      const label =
        svg.getAttribute("aria-label") ||
        svg.querySelector(":scope > title")?.textContent.trim() ||
        svg.closest("figure")?.querySelector("figcaption")?.textContent.trim() ||
        title + (charts.length > 1 ? " · 图 " + (index + 1) : "");
      if (!svg.hasAttribute("aria-labelledby")) svg.setAttribute("aria-label", label);
      svg.setAttribute("role", svg.querySelector("[tabindex]") ? "group" : "img");
    }
  }
  root.LectureMath = { enhance, namePlots, toTex, segments, conversion, whenIdle: () => Promise.all([...pending]) };
  root.document?.addEventListener("lecture:fontchange", (event) => {
    if (!event.detail?.key || event.detail.key === "plot") resizePlotLabels();
  });
  if (typeof module !== "undefined" && module.exports) module.exports = { toTex, segments };
})(globalThis);
