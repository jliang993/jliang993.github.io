/* Boyd & Vandenberghe (9.20): one objective, shared starts, different directions. */
(function (root) {
  "use strict";
  const C = root.ChapterMath || (typeof require === "function" ? require("./chapter-math.js") : null);
  const { dot, norm, add, scale, solve } = C,
    optimum = [-Math.log(2) / 2, 0],
    minimum = 2 * Math.SQRT2 * Math.exp(-0.1);
  const methods = [
    { id: "gd", name: "梯度 · 回溯", color: "#357bc4", direction: "gradient", search: "backtracking", source: "图 9.3–9.4" },
    { id: "exact", name: "梯度 · 精确搜索", color: "#dc9038", direction: "gradient", search: "exact", source: "图 9.4–9.5" },
    { id: "p1", name: "最速下降 · P₁", color: "#9461cb", direction: "p1", search: "backtracking", source: "图 9.11–9.12" },
    { id: "p2", name: "最速下降 · P₂", color: "#d4546c", direction: "p2", search: "backtracking", source: "图 9.13–9.14" },
    { id: "newton", name: "Newton · 回溯", color: "#1a9b87", direction: "newton", search: "backtracking", source: "图 9.19–9.20" },
    {
      id: "l1",
      name: "ℓ₁ 最速下降（拓展）",
      color: "#7e8540",
      direction: "l1",
      search: "backtracking",
      source: "课程拓展，方向见 §9.4.2",
      extra: true,
    },
    {
      id: "newtonExact",
      name: "Newton · 精确搜索（拓展）",
      color: "#937059",
      direction: "newton",
      search: "exact",
      source: "课程拓展；不是图 9.21–9.22",
      extra: true,
    },
  ];
  const range = (key, label, min, max, step, value, group) => ({ key, label, min, max, step, value, group, type: "range" });
  const select = (key, label, options, value, group) => ({ key, label, options, value, group, type: "select" });
  const checkbox = (key, label, value, group, color) => ({ key, label, value, group, color, type: "checkbox" });
  const preset = (id, label, visible, inspect) => ({
    id,
    label,
    state: Object.fromEntries([...methods.map((m) => ["show_" + m.id, visible.includes(m.id)]), ["inspect", inspect], ["view", "both"], ["k", 0]]),
  });
  const def = {
    id: "nonquadratic",
    chapter: "03",
    short: "教材三项指数函数",
    title: "同一个非二次问题，比较方向、步长与收敛",
    intro: "教材式 (9.20)。拖动共同初始点，对比梯度、二次范数最速下降和 Newton；轨迹与误差同步播放，也可以展开一次线搜索。",
    question: "P₁ 与 P₂ 为什么带来相反的效果？Newton 什么时候接受全步，其误差曲线又在什么时候开始加速弯折？",
    ref: {
      label: "Boyd & Vandenberghe · 式 (9.20)，§9.3.2 / §9.4.4 / §9.5.4 · pp. 470–493",
      url: "https://web.stanford.edu/~boyd/cvxbook/bv_cvxbook.pdf#page=484",
    },
    source: "教材原函数 · 统一起点比较；另含两项明确标注的课程拓展",
    focus: true,
    details: true,
    replay: true,
    animate: "k",
    points: [{ kx: "px", ky: "py", label: "共同初始点 x₀", x: -1, y: 1 }],
    pointBounds: [-3.5, 2.5, -2, 2],
    presets: [
      preset("gradient", "梯度与线搜索", ["gd", "exact"], "gd"),
      preset("norm", "不同范数", ["gd", "p1", "p2"], "p1"),
      preset("newton", "Newton 与梯度", ["gd", "newton"], "newton"),
      preset("all", "五法同场", ["gd", "exact", "p1", "p2", "newton"], "newton"),
    ],
    controls: [
      range("k", "迭代进度 k", 0, 80, 1, 80),
      select("view", "图形视图", ["both|轨迹 + 收敛", "path|仅迭代轨迹", "error|仅收敛曲线", "line|轨迹 + 一次线搜索"], "both"),
      ...methods.map((m) => checkbox("show_" + m.id, m.name, !m.extra, "methods", m.color)),
      range("alpha", "充分下降 α", 0.01, 0.45, 0.01, 0.1, "line"),
      range("beta", "缩减比例 β", 0.1, 0.9, 0.05, 0.7, "line"),
      select(
        "inspect",
        "观察算法",
        methods.map((m) => m.id + "|" + m.name),
        "newton"
      ),
      select("metric", "收敛指标", ["gap|目标差 f(xᵏ)−p*", "gradient|梯度范数 ‖∇f‖₂"], "gap", "advanced"),
      range("zoom", "视野放大倍数", 0.5, 6, 0.1, 1, "advanced"),
      range("t0", "回溯初始步长 t₀", 0.1, 2, 0.1, 1, "advanced"),
      range("logtol", "停止阈值 ‖∇f‖₂（对数）", -14, -4, 1, -9, "advanced"),
      checkbox("geometry", "显示观察点的范数球和下降方向", false, "advanced"),
    ],
  };
  // Shift to x* before evaluating small residuals; f-p* must not suffer cancellation.
  function evaluate(x) {
    const u = x[0] - optimum[0],
      v = 3 * x[1],
      eu = Math.exp(u),
      sv = Math.sinh(v / 2);
    const gap = minimum * (2 * Math.sinh(u / 2) ** 2 + eu * sv * sv);
    const g = [minimum * (Math.sinh(u) + eu * sv * sv), 1.5 * minimum * eu * Math.sinh(v)];
    const f = minimum + gap,
      H = [
        [f, g[1]],
        [g[1], 4.5 * minimum * eu * Math.cosh(v)],
      ];
    return { f, g, H, gap };
  }
  function descent(m, e) {
    if (m.direction === "newton") return scale(solve(e.H, e.g), -1);
    if (m.direction === "p1") return [-e.g[0] / 2, -e.g[1] / 8];
    if (m.direction === "p2") return [-e.g[0] / 8, -e.g[1] / 2];
    if (m.direction === "l1") {
      const j = Math.abs(e.g[0]) >= Math.abs(e.g[1]) ? 0 : 1,
        d = [0, 0];
      d[j] = -e.g[j];
      return d;
    }
    return scale(e.g, -1);
  }
  function directional(x, d, t) {
    const z = add(x, d, t),
      g = evaluate(z).g,
      value = dot(g, d);
    if (Number.isFinite(value)) return value;
    // Only the sign is needed to bracket the root. Log scaling prevents overflow.
    const q = [z[0] + 3 * z[1] - 0.1, z[0] - 3 * z[1] - 0.1, -z[0] - 0.1],
      a = [d[0] + 3 * d[1], d[0] - 3 * d[1], -d[0]],
      top = Math.max(...q);
    return a.reduce((s, v, i) => s + v * Math.exp(q[i] - top), 0);
  }
  function lineSearch(m, x, e, d, s, cost) {
    const slope = dot(e.g, d),
      trials = [];
    if (m.search === "backtracking") {
      let t = s.t0;
      for (let j = 0; j < 300; j++, t *= s.beta) {
        const gap = evaluate(add(x, d, t)).gap;
        cost.f++;
        const accepted = Number.isFinite(gap) && gap <= e.gap + s.alpha * t * slope;
        trials.push({ t, gap, accepted });
        if (accepted) return { t, d, slope, trials, inner: trials.length, kind: m.search };
      }
      return null;
    }
    let lo = 0,
      hi = 1,
      inner = 0;
    const derivative = (t) => {
      cost.g++;
      inner++;
      return directional(x, d, t);
    };
    while (derivative(hi) < 0 && hi < 2 ** 50) hi *= 2;
    const bracket = hi;
    for (let j = 0; j < 80; j++) {
      const mid = (lo + hi) / 2;
      if (mid === lo || mid === hi) break;
      if (derivative(mid) > 0) hi = mid;
      else lo = mid;
      if (hi - lo <= 2e-14 * Math.max(1, hi)) break;
    }
    const t = (lo + hi) / 2,
      gap = evaluate(add(x, d, t)).gap;
    cost.f++;
    return Number.isFinite(gap) ? { t, d, slope, trials: [{ t, gap, accepted: true }], inner, bracket, kind: m.search } : null;
  }
  function run(m, s) {
    const cost = { f: 1, g: 1, h: 0 },
      path = [];
    let x = [s.px, s.py],
      e = evaluate(x),
      status = "达到 80 步上限";
    for (let k = 0; k <= 80; k++) {
      const record = { k, x: x.slice(), ...e, gnorm: norm(e.g), cost: { ...cost } };
      path.push(record);
      if (record.gnorm <= 10 ** s.logtol) {
        status = "达到梯度阈值";
        break;
      }
      if (k === 80) break;
      if (m.direction === "newton") cost.h++;
      const d = descent(m, e);
      if (!d || !d.every(Number.isFinite) || !(dot(e.g, d) < 0)) {
        status = "方向数值停滞";
        break;
      }
      const step = lineSearch(m, x, e, d, s, cost);
      if (!step) {
        status = "线搜索未找到可用步长";
        break;
      }
      const next = add(x, d, step.t),
        nextE = evaluate(next);
      if (next.every((v, j) => v === x[j]) || nextE.gap > e.gap * (1 + 1e-10)) {
        status = "达到数值分辨率";
        break;
      }
      record.step = step;
      x = next;
      e = nextE;
      cost.g++;
    }
    return { method: m, path, status };
  }
  const cache = new Map();
  function calculate(s) {
    const key = JSON.stringify([s.px, s.py, s.alpha, s.beta, s.t0, s.logtol]);
    if (cache.has(key)) return cache.get(key);
    const runs = methods.map((m) => run(m, s)),
      data = { runs, optimum, minimum };
    cache.set(key, data);
    if (cache.size > 8) cache.delete(cache.keys().next().value);
    return data;
  }
  function contour(level) {
    const a = level * Math.exp(0.1),
      disc = Math.sqrt(Math.max(0, a * a - 8));
    const lo = Math.log(2 / (a + disc)),
      hi = Math.log((a + disc) / 4),
      pts = [];
    for (let i = 0; i <= 180; i++) {
      const t = (i * Math.PI) / 180,
        x = (lo + hi) / 2 + ((hi - lo) / 2) * Math.cos(t);
      const v = Math.max(1, (level * Math.exp(0.1 - x) - Math.exp(-2 * x)) / 2);
      pts.push([x, Math.acosh(v) / 3]);
    }
    return [
      ...pts,
      ...pts
        .slice(1, -1)
        .reverse()
        .map(([x, y]) => [x, -y]),
      pts[0],
    ];
  }
  function localGeometry(method, record) {
    if (method.direction === "l1")
      return {
        points: [
          [1, 0],
          [0, 1],
          [-1, 0],
          [0, -1],
          [1, 0],
        ].map((p) => add(record.x, p)),
      };
    const M =
      method.direction === "newton"
        ? record.H
        : method.direction === "p1"
          ? [
              [2, 0],
              [0, 8],
            ]
          : method.direction === "p2"
            ? [
                [8, 0],
                [0, 2],
              ]
            : [
                [1, 0],
                [0, 1],
              ];
    const a = M[0][0],
      b = M[0][1],
      c = M[1][1],
      r = Math.hypot(a - c, 2 * b),
      values = [(a + c + r) / 2, (a + c - r) / 2];
    return { axes: values.map((v) => 1 / Math.sqrt(v)), angle: (0.5 * Math.atan2(2 * b, a - c) * 180) / Math.PI };
  }
  const escape = (s) => String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  function render(s, { Plot, colors, fmt }) {
    const data = calculate(s),
      visible = data.runs.filter((r) => s["show_" + r.method.id]);
    const focus = data.runs.find((r) => r.method.id === s.inspect) || data.runs[0];
    const progressMax = Math.max(...visible.map((r) => r.path.length - 1), s.view === "line" ? focus.path.length - 1 : 0);
    s.k = Math.min(s.k, progressMax);
    const current = (r) => r.path[Math.min(s.k, r.path.length - 1)],
      at = current(focus);
    const framePoints = [optimum, [s.px, s.py], ...visible.flatMap((r) => r.path.map((p) => p.x))];
    if (s.geometry)
      for (const p of focus.path) {
        const shape = localGeometry(focus.method, p);
        framePoints.push(...(shape.points || Plot.ellipseBox(p.x, shape.axes, shape.angle)));
      }
    const fitted = Plot.fitBounds(framePoints, { padding: [0.07, 0.08], minSpan: [2.2, 1.2] }),
      zoom = Math.max(0.1, s.zoom),
      frameBounds = [optimum[0] + (fitted[0] - optimum[0]) / zoom, optimum[0] + (fitted[1] - optimum[0]) / zoom, fitted[2] / zoom, fitted[3] / zoom];
    const frame = new Plot("nonquadratic-path", frameBounds, true);
    const levels = [minimum + 0.015, minimum + 0.08, minimum + 0.3, 3.5, 5, 8, 12, 20, 40, 80, 160, 400, 1000, 5000, 30000];
    for (const level of levels) frame.path(contour(level), "var(--demo-line,#9ca9b4)", 0.9);
    if (s.geometry) {
      const m = focus.method,
        shape = localGeometry(m, at);
      if (shape.points) frame.path(shape.points, m.color, 1.4, "4 4");
      else frame.ellipse(at.x, shape.axes, shape.angle, m.color);
      const d = descent(m, at);
      if (norm(d) > 0) {
        const arrow = scale(d, 0.42 / s.zoom / norm(d));
        frame.path([at.x, add(at.x, arrow)], m.color, 3);
        frame.dot(add(at.x, arrow), "d（仅示方向）", m.color);
      }
    }
    for (const r of visible) {
      const shown = r.path.slice(0, s.k + 1);
      frame.path(
        shown.map((p) => p.x),
        r.method.color,
        2.1,
        r.method.extra ? "5 3" : ""
      );
      shown.forEach((p) => {
        const [x, y] = frame.pos(p.x);
        frame.content.push('<circle cx="' + x + '" cy="' + y + '" r="2" fill="' + r.method.color + '"/>');
      });
      frame.dot(current(r).x, "", r.method.color);
    }
    frame.dot(optimum, "x*", colors.gray);
    frame.dot([s.px, s.py], "共同 x₀", colors.gray, "px,py");
    const metric = s.metric === "gradient" ? "gnorm" : "gap",
      floor = 1e-30,
      log = (v) => Math.log10(Math.max(floor, v));
    const top = Math.max(0, Math.ceil(log(visible[0]?.path[0][metric] || 1))),
      bottom = Math.max(-30, Math.min(-8, Math.floor(Math.min(...visible.flatMap((r) => r.path.map((p) => log(p[metric]))))) - 1));
    const error = new Plot(
      "nonquadratic-error",
      [0, Math.max(5, progressMax), bottom, top + 1],
      false,
      "迭代次数 k",
      s.metric === "gradient" ? "log₁₀ ‖∇f(xᵏ)‖₂" : "log₁₀ ( f(xᵏ) − p* )"
    );
    for (const r of visible) {
      error.path(
        r.path.slice(0, s.k + 1).map((p) => [p.k, log(p[metric])]),
        r.method.color,
        2.1,
        r.method.extra ? "5 3" : ""
      );
      const p = current(r);
      error.dot([p.k, log(p[metric])], "", r.method.color);
    }
    error.line([1, 0], s.k, "var(--demo-line,#9ca9b4)", "3 4");
    const panel = (heading, svg) => "<figure><figcaption>" + heading + "</figcaption>" + svg + "</figure>";
    let diagrams = [],
      lineRecord = focus.path[Math.min(s.k, Math.max(0, focus.path.length - 2))],
      lineInfo = "";
    if (s.view !== "error") diagrams.push(panel("等高线与迭代点 · 可拖动 x₀", frame.finish("三项指数函数的迭代轨迹")));
    if (s.view === "both" || s.view === "error") diagrams.push(panel("同一起点、同一迭代进度", error.finish("三项指数函数的收敛曲线")));
    if (s.view === "line") {
      const q = lineRecord,
        step = q.step;
      if (step) {
        const xmax = step.kind === "exact" ? Math.max(step.t * 1.5, 0.01) : s.t0 * 1.05,
          unit = Math.max(q.gap, 1e-30);
        const curve = Array.from({ length: 241 }, (_, i) => {
          const t = (xmax * i) / 240;
          return [t, (evaluate(add(q.x, step.d, t)).gap - q.gap) / unit];
        });
        let lineBounds = [0, xmax, -1.2, 2];
        if (step.kind === "exact") {
          const inFocus = curve.filter((p) => Number.isFinite(p[1]) && p[1] >= -1.2 && p[1] <= 2),
            fit = Plot.fitBounds([...inFocus, [0, 0]], { padding: [0, 0.08], minSpan: [xmax, 0.6] });
          lineBounds = [0, xmax, Math.max(-1.2, fit[2]), Math.min(2, fit[3])];
        }
        const line = new Plot("nonquadratic-line", lineBounds, false, "试探步长 t", "( φ(t) − φ(0) ) / ( f(xᵏ) − p* )");
        line.path(curve, focus.method.color, 2);
        if (step.kind === "backtracking")
          line.path(
            [
              [0, 0],
              [xmax, (s.alpha * xmax * step.slope) / unit],
            ],
            colors.gray,
            2,
            "5 4"
          );
        for (const trial of step.trials) {
          const v = (trial.gap - q.gap) / unit;
          if (Number.isFinite(v) && v >= lineBounds[2] && v <= lineBounds[3])
            line.dot([trial.t, v], trial.accepted ? "接受" : "", trial.accepted ? colors.green : colors.red);
        }
        line.path(
          [
            [0, 0],
            [xmax, 0],
          ],
          "var(--demo-line,#9ca9b4)",
          1,
          "3 3"
        );
        diagrams.push(panel(escape(focus.method.name) + " · 第 " + q.k + " → " + (q.k + 1) + " 步", line.finish("一步线搜索：目标曲线与充分下降界")));
        lineInfo =
          '<p class="nonquad-step-summary">观察 ' +
          escape(focus.method.name) +
          " 的第 " +
          q.k +
          " → " +
          (q.k + 1) +
          " 步：方向 d = (" +
          step.d.map((v) => fmt(v)).join(", ") +
          ")，gᵀd = " +
          fmt(step.slope) +
          "，接受 t = " +
          fmt(step.t, 6) +
          "。" +
          (step.kind === "exact"
            ? "在 t≥0 上括区，再对方向导数求根；本次调用方向导数 " + step.inner + " 次。"
            : "灰虚线为 Armijo 上界，红点为拒绝，绿点为接受。超出纵轴的试探值见完整记录。") +
          "</p>";
        if (step.kind === "backtracking")
          lineInfo +=
            '<details class="nonquad-trials"><summary>展开本次回溯的 ' +
            step.trials.length +
            ' 个试探步长</summary><div class="nonquad-table-scroll"><table><thead><tr><th>试探</th><th>t</th><th>f(x+td) − p*</th><th>Armijo</th></tr></thead><tbody>' +
            step.trials
              .map(
                (trial, j) =>
                  "<tr><td>" +
                  j +
                  "</td><td>" +
                  fmt(trial.t, 6) +
                  "</td><td>" +
                  (Number.isFinite(trial.gap) ? fmt(trial.gap, 6) : "溢出（拒绝）") +
                  "</td><td>" +
                  (trial.accepted ? "接受" : "拒绝") +
                  "</td></tr>"
              )
              .join("") +
            "</tbody></table></div></details>";
      } else lineInfo = '<p class="nonquad-step-summary">观察算法在初始点已经满足停止条件，没有需要执行的线搜索。</p>';
    }
    const details =
      lineInfo +
      '<div class="nonquad-table-scroll"><table class="nonquad-results"><caption>各方法在当前进度的状态；较早停止的方法保留其终点</caption><thead><tr><th>方法</th><th>实际 k</th><th>f(xᵏ) − p*</th><th>‖∇f(xᵏ)‖₂</th><th>到达本点的 t</th><th>f / ∇f / H 调用</th><th>状态</th></tr></thead><tbody>' +
      visible
        .map((r) => {
          const p = current(r),
            previous = r.path[p.k - 1];
          return (
            '<tr><th scope="row"><i style="background:' +
            r.method.color +
            '"></i>' +
            escape(r.method.name) +
            "</th><td>" +
            p.k +
            "</td><td>" +
            fmt(p.gap, 5) +
            "</td><td>" +
            fmt(p.gnorm, 5) +
            "</td><td>" +
            (previous?.step ? fmt(previous.step.t, 5) : "—") +
            "</td><td>" +
            [p.cost.f, p.cost.g, p.cost.h].join(" / ") +
            "</td><td>" +
            (p.k === r.path.length - 1 ? r.status : "迭代中") +
            "</td></tr>"
          );
        })
        .join("") +
      '</tbody></table></div><p class="nonquad-source-note">统一起点默认取 (−1, 1)，用于同场比较；教材没有明示所有图的数值起点。P₁=diag(2,8)，P₂=diag(8,2)。调用数是算法轨迹截至当前步的请求次数，三类请求代价不同，不代表运行时间。</p><details class="nonquad-reference"><summary>教材对应与方向公式</summary><p>梯度方向 d=−g；二次范数方向 d=−P⁻¹g；Newton 方向 d=−H⁻¹g；ℓ₁ 最速下降只更新 |gᵢ| 最大的坐标。所有回溯均使用真实方向导数 gᵀd。</p><ul>' +
      methods.map((m) => "<li>" + escape(m.name) + "：" + escape(m.source) + "</li>").join("") +
      '</ul><p><a href="https://web.stanford.edu/~boyd/cvxbook/bv_cvxbook.pdf#page=495">最速下降与缩放：pp. 481–483 ↗</a> · <a href="https://web.stanford.edu/~boyd/cvxbook/bv_cvxbook.pdf#page=506">Newton 与局部范数球：pp. 492–493 ↗</a></p></details>';
    return {
      state: s,
      progressMax,
      data,
      svg: '<div class="nonquad-charts">' + diagrams.join("") + "</div>",
      details,
      legend: visible.map((r) => [r.method.name, r.method.color]),
      metrics: [
        { label: "唯一最优点 x*", value: "(−log 2 / 2, 0)" },
        { label: "最优值 p*", value: fmt(minimum, 8) },
        { label: "共同停止阈值 ‖∇f‖₂", value: fmt(10 ** s.logtol) },
      ],
      notice:
        "实心小圆为实际迭代点，线段为两次迭代之间的步。误差用稳定恒等式计算；≤10⁻³⁰ 画在底线。精确搜索为正射线上的数值求根，内层计算也计数。二次范数球为 dᵀPd≤1（Newton 用当前 Hessian），ℓ₁ 球为 ‖d‖₁≤1；方向箭头另行缩放。",
    };
  }
  const api = { def, methods, evaluate, descent, directional, lineSearch, run, calculate, contour, render, optimum, minimum };
  root.ChapterNonquadratic = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
