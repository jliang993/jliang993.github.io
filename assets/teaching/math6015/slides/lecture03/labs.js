(function (root) {
  "use strict";
  const D = root.ChapterExamples,
    N = root.ChapterNonquadratic,
    M = root.LectureModels,
    Review = root.LectureReviewLabs;
  const { Plot, colors: C, fmt } = D;
  const escape = (s) => String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  const range = (key, label, min, max, step, value) => ({ key, label, min, max, step, value, type: "range" });
  const select = (key, label, options, value) => ({ key, label, options, value, type: "select" });
  const custom = {
    lmi: { controls: [range("px", "x₁", -2.4, 2.4, 0.05, 1), range("py", "x₂", -2.4, 2.4, 0.05, 1)], points: true },
    ridge: { controls: [range("lambda", "正则化参数 λ", 0, 1, 0.01, 0.1)] },
    quadratic: { controls: [range("gamma", "曲率参数 γ", 0.2, 20, 0.2, 10), range("k", "迭代进度 k", 0, 60, 1, 0)], animate: "k" },
    smoothing: { controls: [range("lambda", "平滑权重 λ", 0, 1, 0.05, 0.25), range("t", "梯度步长 t", 0, 1.5, 0.02, 0.4)] },
    capacity: { controls: [range("alpha", "充分下降 α", 0.01, 0.45, 0.01, 0.1), range("beta", "缩减比例 β", 0.1, 0.9, 0.05, 0.5)] },
    logistic: {
      controls: [
        range("w0", "展开点 / 重启点 w", -3, 3, 0.05, 0),
        range("lambda", "正则化参数 λ", 0.1, 2, 0.1, 0.5),
        range("k", "迭代进度 k", 0, 15, 1, 0),
      ],
      animate: "k",
    },
    selfconcordance: {
      controls: [
        select("kind", "基函数", ["log|−log x", "entropylog|x log x − log x", "exp|exp(x)：反例"], "log"),
        range("c", "正比例因子 c", 0.25, 4, 0.05, 1),
        range("x", "观察位置 x", -4, 4, 0.05, 1),
      ],
    },
    production: { controls: [range("logt", "log₁₀ t", -1, 2.5, 0.05, 0)], animate: "logt" },
    cost: { controls: [range("logn", "log₁₀ n（取 m=n）", 1, 4, 1, 3), range("trials", "试探步数 q", 1, 30, 1, 10)] },
    ...Review.defs,
  };
  for (const d of Object.values(custom)) d.defaults = Object.fromEntries(d.controls.map((c) => [c.key, c.value]));
  const defs = (id) => custom[id] || D.defs.find((d) => d.id === id);
  function normalize(id, input) {
    if (!custom[id]) return D.normalize(id, input);
    const s = { ...custom[id].defaults };
    for (const c of custom[id].controls) {
      if (c.type === "select") {
        if (c.options.some((o) => o.split("|")[0] === input[c.key])) s[c.key] = input[c.key];
      } else if (Number.isFinite(+input[c.key])) s[c.key] = Math.min(c.max, Math.max(c.min, +input[c.key]));
    }
    if ("k" in s) s.k = Math.round(s.k);
    if ("trials" in s) s.trials = Math.round(s.trials);
    return s;
  }
  const coreKeys = ["px", "py", "alpha", "beta", "t0", "logtol", "k", "zoom", "metric"];
  const sharesExample = (kind) => kind === "nonquadratic" || kind === "precondition";
  const nonquadBase = { ...defs("nonquadratic").defaults, k: 0 };
  const presets = {
    gradient: { show_gd: true, show_exact: true, inspect: "gd", view: "path" },
    error: { show_gd: true, show_exact: true, inspect: "gd", view: "error" },
    line: { show_gd: true, inspect: "gd", view: "line" },
    norm: { show_gd: true, show_p1: true, show_p2: true, inspect: "p1", geometry: true, view: "path" },
    newton: { show_gd: true, show_newton: true, inspect: "newton", view: "path" },
    all: { show_gd: true, show_exact: true, show_p1: true, show_p2: true, show_newton: true, inspect: "newton", view: "path" },
    geometry: { show_p1: true, show_p2: true, inspect: "p1", view: "path" },
  };
  function preset(stage) {
    return { ...nonquadBase, ...Object.fromEntries(N.methods.map((m) => ["show_" + m.id, false])), ...presets[stage] };
  }
  let restored = {};
  try {
    restored = JSON.parse(localStorage.getItem("math6015-lecture03-v1") || "{}");
  } catch {}
  try {
    const q = new URLSearchParams(location.search).get("lab");
    if (q && q.length < 20000) {
      const v = JSON.parse(q);
      restored = { ...restored, ...v, locals: v.stage ? { ...restored.locals, [v.stage.id]: v.stage.state } : restored.locals };
    }
  } catch {}
  let shared = Object.fromEntries(coreKeys.map((k) => [k, normalize("nonquadratic", { ...nonquadBase, ...restored.shared })[k]]));
  const instances = new Map();
  let active = null,
    animation = null;
  function save() {
    try {
      localStorage.setItem(
        "math6015-lecture03-v1",
        JSON.stringify({ shared, locals: Object.fromEntries([...instances].map(([id, v]) => [id, v.state])) })
      );
    } catch {}
  }
  const svgIds = (html, prefix) => {
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
    for (const id of new Set(ids)) {
      const q = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      html = html.replace(new RegExp(`(id="|href="#|url\\(#|aria-labelledby=")${q}(?=["\\)])`, "g"), `$1${prefix}-${id}`);
    }
    return html;
  };
  let choiceGroupId = 0;
  const choiceOptions = (c) =>
    c.options.map((o) => {
      const [value, text] = o.split("|");
      return { value, text };
    });
  const hasFormulaOptions = (c) => choiceOptions(c).some((o) => root.LectureMath.segments(o.text).some((p) => p.tex));
  // Keep the seven algorithm names compact in the parameter column. These are
  // prose names; the corresponding P_1/P_2/l_1 notation is typeset in the legend
  // and diagnostics. Native select options cannot display mathematical SVG.
  const algorithmOptionNames = { p1: "最速下降 · 矩阵一", p2: "最速下降 · 矩阵二", l1: "一范数最速下降（拓展）" };
  function control(c, s) {
    const key = escape(c.key),
      label = escape(c.label),
      v = s[c.key];
    if (c.type === "select" && c.key !== "inspect" && hasFormulaOptions(c)) {
      // Native option elements cannot contain MathJax SVG. Radio labels can, and
      // keep the mathematical alternatives visible and keyboard selectable.
      const name = "lab-choice-" + ++choiceGroupId;
      return `<fieldset class="lab-control lab-choice-field" data-choice-control="${key}"><legend>${label}</legend><div class="lab-choice-list">${choiceOptions(
        c
      )
        .map(
          ({ value, text }) =>
            `<label class="lab-choice"><input type="radio" name="${name}" data-key="${key}" value="${escape(value)}"${
              value === String(v) ? " checked" : ""
            }><span>${escape(text)}</span></label>`
        )
        .join("")}</div></fieldset>`;
    }
    if (c.type === "select")
      return `<label class="lab-control"><span>${label}</span><select data-key="${key}" aria-label="${label}">${choiceOptions(c)
        .map(
          ({ value, text }) =>
            `<option value="${escape(value)}"${value === v ? " selected" : ""}>${escape(
              c.key === "inspect" ? algorithmOptionNames[value] || text : text
            )}</option>`
        )
        .join("")}</select></label>`;
    if (c.type === "checkbox") return `<label class="lab-control"><input type="checkbox" data-key="${key}"${v ? " checked" : ""}> ${label}</label>`;
    return `<label class="lab-control"><span>${label}</span><span class="input-pair"><input type="range" data-key="${key}" min="${c.min}" max="${c.max}" step="${c.step}" value="${v}" aria-label="${label}"><input type="number" data-key="${key}" min="${c.min}" max="${c.max}" step="${c.step}" value="${v}" aria-label="${label}，数值输入"></span></label>`;
  }
  const metric = (label, value) => ({ label, value: typeof value === "number" ? fmt(value, 5) : value });
  const plots = (...figures) =>
    `<div class="lab-plots">${figures.map(([label, svg]) => `<figure><figcaption>${label}</figcaption>${svg}</figure>`).join("")}</div>`;
  function customRender(id, s) {
    if (Review.defs[id]) return Review.render(id, s);
    let g,
      svg = "",
      metrics = [],
      notice = "",
      legend = [],
      data,
      progressMax = 60;
    if (id === "lmi") {
      data = M.lmi(s.px, s.py);
      g = new Plot("lmi", [-2.7, 2.7, -2.4, 2.4]);
      g.ellipse([0, 0], [2, 2], 0, C.green, true);
      for (const r of [0.5, 1, 1.5, 1.8]) g.ellipse([0, 0], [r, r], 0, "#b5c8bd");
      g.dot([0, 0], "解析中心", C.green);
      g.dot([s.px, s.py], "x", data.feasible ? C.blue : C.red, "px,py");
      svg = g.finish("正定矩阵的定义域与观察点");
      metrics = [metric("最小特征值", data.eigenvalues[0]), metric("det F", data.det), metric("−log det F", data.feasible ? fmt(data.f) : "未定义")];
      notice = "拖动点或使用方向键。圆内 F≻0；在边界上最小特征值为零，障碍值趋于 +∞。域外不计算对数。";
    } else if (id === "ridge") {
      data = M.ridge(s.lambda);
      // Fix the camera for the entire lambda range. Extra vertical plot space
      // accommodates the rounder regularized ellipse without shrinking either plot.
      const frame = [-2.6, 2.6, -1.6, 1.6];
      const draw = (lambda, label, color) => {
        const r = M.ridge(lambda),
          p = new Plot("ridge-" + label, frame, true, "x₁", "x₂", { height: 360 });
        for (const a of [0.625, 1.25, 2]) p.ellipse([0, 0], [a, a / Math.sqrt(r.condition)], 0, color);
        return p.finish(label);
      };
      svg = plots(
        ["λ = 0 · κ = 100", draw(0, "baseline", C.blue)],
        [`λ = ${fmt(s.lambda)} · κ = ${fmt(data.condition)}`, draw(s.lambda, "regularized", C.green)]
      );
      metrics = [metric("最小曲率", data.eigen[0]), metric("最大曲率", data.eigen[1]), metric("条件数 κ", data.condition)];
      notice =
        "将低曲率方向取为横轴。椭圆以各自最优点为中心，最长半轴统一为 2，只比较形状；两图使用固定的共同坐标窗口，调 λ 时左图不变。λ=0.1 时 κ 从 100 降到 10；正则化也会改变估计偏差。";
    } else if (id === "quadratic") {
      data = M.quadratic(s.gamma, s.k);
      const all = M.quadratic(s.gamma, 60),
        R = Math.max(s.gamma, 1) * 1.25,
        p = new Plot("quad-path", Plot.fitBounds([...all.path.map((v) => v.x), [0, 0]], { padding: 0.12, minSpan: 0.4 }));
      for (const a of [0.1, 0.3, 0.6, 1]) p.ellipse([0, 0], [R * a, (R * a) / Math.sqrt(s.gamma)], 0, "#b8c8bd");
      p.path(
        data.path.map((v) => v.x),
        C.blue
      );
      for (const v of data.path) p.dot(v.x, "", C.blue);
      p.dot([0, 0], "x*", C.green);
      p.dot(data.path.at(-1).x, "xᵏ", C.red);
      const e = new Plot("quad-error", [0, 60, -16, Math.max(2, Math.log10(all.path[0].f) + 0.3)], false, "k", "log₁₀ f(xᵏ)");
      e.path(
        data.path.map((v) => [v.k, Math.max(-16, Math.log10(v.f))]),
        C.blue
      );
      svg = plots(["实际坐标中的迭代轨迹", p.finish("精确线搜索的梯度轨迹")], ["目标误差 · 对数坐标", e.finish("二次问题目标误差")]);
      metrics = [metric("κ = max(γ,1/γ)", data.condition), metric("每步目标差的比率", data.ratio), metric("当前 f(xᵏ)", data.path.at(-1).f)];
      notice = "每步取精确线搜索步长。γ=1 时一步到解；γ<1 时条件数是 1/γ。对数图的显示下限为 10⁻¹⁶，数值继续按解析公式计算。";
    } else if (id === "smoothing") {
      data = M.smoothing(s.lambda, s.t);
      g = new Plot(
        "smooth",
        Plot.fitBounds([...data.y.map((v, i) => [i, v]), ...data.x.map((v, i) => [i, v])], { padding: [0.08, 0.12], minSpan: [2.2, 0.6] }),
        false,
        "样本位置 i",
        "信号值"
      );
      g.path(
        data.y.map((v, i) => [i, v]),
        C.gray,
        2,
        "5 4"
      );
      g.path(
        data.x.map((v, i) => [i, v]),
        C.green,
        3
      );
      data.x.forEach((v, i) => g.dot([i, v], `x${i + 1}`, C.green));
      svg = g.finish("原信号与一次梯度更新");
      metrics = [metric("更新前 f(y)", data.before), metric("更新后 f(x⁺)", data.after), metric("L = 1+6λ", data.L)];
      notice = `λ=0.25、t=0.4 恢复讲义的一步更新 (0.2,0.6,0.2)。当前梯度为 (${data.g.map((v) => fmt(v)).join(", ")})；过大的步长可能使目标上升。`;
      legend = [
        ["原信号 y", C.gray],
        ["更新后的 x", C.green],
      ];
    } else if (id === "capacity") {
      data = M.capacity(s.alpha, s.beta);
      const shown = data.trials.length > 9 ? [...data.trials.slice(0, 8), data.trials.at(-1)] : data.trials;
      svg = `<table class="lab-table"><caption>起点 x=2.3，方向 d=−1；依次测试 t=βʲ</caption><thead><tr><th>t</th><th>x+td</th><th>f(x+td)</th><th>结果</th></tr></thead><tbody>${shown
        .map(
          (r) =>
            `<tr class="${r.accepted ? "accepted" : "rejected"}"><td>${fmt(r.t, 6)}</td><td>${fmt(r.x, 6)}</td><td>${
              r.feasible ? fmt(r.f, 6) : "域外"
            }</td><td>${r.accepted ? "接受" : r.feasible ? "未充分下降" : "不满足 2<x<8"}</td></tr>`
        )
        .join("")}</tbody></table>${
        data.trials.length > 9 ? `<p class="source-note">省略中间试探；共 ${data.trials.length} 次，最后一次接受。完整记录可在“数据”中导出。</p>` : ""
      }`;
      const last = data.trials.at(-1);
      metrics = [metric("接受步长", last.t), metric("回溯次数", data.trials.length - 1), metric("实际目标下降", data.initial - last.f)];
      notice = "先检查定义域，再判断 Armijo 条件。α=0.1、β=0.5 时最终接受 t=1/32；不是只要留在定义域内就接受。";
    } else if (id === "logistic") {
      data = M.logisticRun(s.w0, s.lambda);
      progressMax = data.length - 1;
      const r = data[Math.min(s.k, progressMax)],
        lo = -3.5,
        hi = 3.5,
        p = new Plot("logistic-model", [lo, hi, 0, Math.max(4, M.logistic(lo, s.lambda).f) * 1.1], false, "w", "f(w)");
      p.curve((w) => M.logistic(w, s.lambda).f, lo, hi, C.blue);
      p.curve((w) => r.f + r.g * (w - r.w) + (r.H * (w - r.w) ** 2) / 2, lo, hi, C.orange, "5 4");
      p.dot([r.w, r.f], "wᵏ", C.red, "w0");
      p.dot([r.w + r.d, r.f - r.decrement / 2], "模型极小点", C.green);
      svg = p.finish("逻辑损失与可拖动展开点的局部二次模型");
      metrics = [metric("当前 wᵏ", r.w), metric("Newton 方向 Δw", r.d), metric("二次模型预测下降量", r.decrement / 2)];
      notice = `拖动红点或修改 w，模型立即在该点重新展开，迭代进度归零；再按“单步”沿 Newton 路径前进。当前实际步数 ${r.k}；预测下降为 (f′)²/(2f″)。回溯使用 α=0.1、β=0.5。`;
      legend = [
        ["真实目标", C.blue],
        ["局部二次模型", C.orange],
      ];
    } else if (id === "selfconcordance") {
      data = M.selfConcordance(s.kind, s.x, s.c);
      const lo = s.kind === "exp" ? -4 : 0.05,
        hi = 4,
        peak = Math.max(1, ...Array.from({ length: 161 }, (_, i) => M.selfConcordance(s.kind, lo + ((hi - lo) * i) / 160, s.c).ratio));
      g = new Plot("selfcoord", [lo, hi, -0.06 * peak, 1.12 * peak], false, "x", "ρf(x)");
      g.path(
        [
          [lo, 1],
          [hi, 1],
        ],
        C.red,
        2,
        "5 4"
      );
      g.curve((x) => M.selfConcordance(s.kind, x, s.c).ratio, lo, hi, C.blue);
      if (data.valid) g.dot([s.x, data.ratio], "当前点", C.green);
      svg = g.finish("自协调不等式两侧的比值");
      metrics = [
        metric("当前点的比值 ρ", data.valid ? fmt(data.ratio) : "域外"),
        metric("当前点满足不等式", data.valid ? (data.passesHere ? "是" : "否") : "不可检验"),
        metric("基函数缩放因子 c", s.c),
      ];
      notice = "ρ≤1 才满足该点的不等式；单点通过不能证明全域自协调。−log x 与 x log x−log x 在 c≥1 时保持自协调；exp(x) 在整个实轴上不是自协调函数。";
      legend = [
        ["ρf(x)", C.blue],
        ["阈值 1", C.red],
      ];
    } else if (id === "production") {
      data = M.production(10 ** s.logt);
      const p = new Plot("production", [0, 4.4, 0, 4.4], true, "u", "v");
      p.polygon(
        [
          [0, 0],
          [4, 0],
          [8 / 3, 8 / 3],
          [0, 4],
        ],
        C.green,
        0.1
      );
      const centers = Array.from({ length: 51 }, (_, j) => M.production(10 ** (-1 + (j * 3.5) / 50)).x);
      p.path(centers, C.blue, 3);
      p.dot([8 / 3, 8 / 3], "LP 最优解", C.orange);
      p.dot(data.x, "xₜ", C.green);
      p.path(
        data.path.map((r) => r.x),
        C.gray,
        1.3,
        "4 4"
      );
      svg = p.finish("生产计划的可行域、中心路径和内层 Newton 轨迹");
      metrics = [metric("t", data.t), metric("中心点 (u,v)", data.x.map((v) => fmt(v, 5)).join(", ")), metric("收益与最优收益的差", data.gap)];
      notice = `蓝线是中心路径；灰虚线是本次从 (2,2) 开始的 Newton 内层迭代。当前收益差 ${fmt(data.gap)}，精确中心点的上界 4/t=${fmt(
        data.bound
      )}；本次数值求解的梯度残差 ${fmt(data.residual)}。`;
    } else if (id === "cost") {
      const n = 10 ** Math.round(s.logn),
        q = s.trials,
        naive = 2 * q * n * n,
        cached = 4 * n * n + q * n;
      data = { n, m: n, q, naive, cached, speedup: naive / cached };
      const max = Math.max(naive, cached);
      svg = `<div class="cost-bars"><div class="cost-row"><span>逐次做矩阵乘法</span><div class="cost-bar" style="width:${
        (100 * naive) / max
      }%"></div><strong>${fmt(naive)}</strong></div><div class="cost-row"><span>预计算 u、v</span><div class="cost-bar" style="width:${
        (100 * cached) / max
      }%"></div><strong>${fmt(
        cached
      )}</strong></div></div><p class="lab-question">矩阵乘法是否比计算 h 的每个分量更昂贵？试探次数很少时，预计算还合算吗？</p>`;
      metrics = [metric("问题规模 m=n", n), metric("试探次数 q", q), metric("此操作模型的比值", data.speedup.toFixed(2) + "×")];
      notice = String.raw`只比较构造 \(h\) 的输入：朴素约 \(2qmn\)，预计算约 \(4mn+qm\) 次算术运算；不计 \(h\) 自身的计算，不代表实测耗时。若当前 \(Ax+b\) 已缓存，预计算还可进一步节省。`;
    }
    return { state: s, svg, metrics, notice, legend, data, progressMax };
  }
  function geometry(s) {
    const data = N.calculate(s),
      H = N.evaluate(N.optimum).H;
    const matrices = [
      [2, 8, "p1", "P₁", C.purple],
      [8, 2, "p2", "P₂", C.red],
    ];
    const envelope = matrices.flatMap(([a, b, key]) =>
      [...data.runs.find((r) => r.method.id === key).path.map((r) => r.x), ...N.contour(3)].map((x) => [x[0] * Math.sqrt(a), x[1] * Math.sqrt(b)])
    );
    const sharedBounds = Plot.fitBounds(envelope, { padding: 0.12, minSpan: 0.5 }),
      center = [(sharedBounds[0] + sharedBounds[1]) / 2, (sharedBounds[2] + sharedBounds[3]) / 2];
    const view = sharedBounds.map((v, i) => center[i < 2 ? 0 : 1] + (v - center[i < 2 ? 0 : 1]) / s.zoom);
    const figures = matrices.map(([a, b, key, label, color]) => {
      const scale = [Math.sqrt(a), Math.sqrt(b)],
        run = data.runs.find((r) => r.method.id === key);
      const p = new Plot("transformed-" + key, view, true, "z₁", "z₂");
      for (const level of [2.7, 3, 4, 6, 10, 20])
        p.path(
          N.contour(level).map((x) => [x[0] * scale[0], x[1] * scale[1]]),
          "#b6c3c2",
          1.2
        );
      const points = run.path.slice(0, s.k + 1).map((r) => [r.x[0] * scale[0], r.x[1] * scale[1]]);
      p.path(points, color, 2.5);
      points.forEach((v) => p.dot(v, "", color));
      p.dot([N.optimum[0] * scale[0], 0], "z*", C.green);
      return [label + " 坐标", p.finish(label + " 变换后的轨迹")];
    });
    return {
      svg: plots(...figures),
      metrics: [metric("原坐标 κ(H*)", H[1][1] / H[0][0]), metric("P₁ 变换后 κ(H*)", 1.125), metric("P₂ 变换后 κ(H*)", 18)],
      legend: [],
      data,
      progressMax: 80,
      notice: "这里比较最优点处的 Hessian 条件数，不是整个次水平集的 M/m。坐标 z=P¹ᐟ²x；使用与前页完全相同的起点、回溯参数及迭代进度。",
    };
  }
  function currentState(v) {
    return normalize(v.kind, sharesExample(v.kind) ? { ...v.state, ...shared } : v.state);
  }
  function render(v) {
    const s = currentState(v);
    v.state = s;
    let result;
    try {
      result = v.kind === "nonquadratic" && v.stage === "geometry" ? geometry(s) : custom[v.kind] ? customRender(v.kind, s) : D.render(v.kind, s);
    } catch (error) {
      v.el.querySelector(".lab-chart").textContent = "计算未完成，请重置参数。";
      console.error(error);
      return;
    }
    v.result = result;
    v.el.querySelector(".lab-chart").innerHTML = svgIds(result.svg, v.id);
    const metrics = result.metrics || [];
    if (v.kind === "nonquadratic" && v.stage !== "geometry") {
      const r = result.data.runs.find((r) => r.method.id === s.inspect),
        point = r?.path[Math.min(s.k, r.path.length - 1)];
      if (point) {
        metrics.splice(
          0,
          metrics.length,
          metric(
            "观察算法 · 实际 k",
            `${N.methods.find((m) => m.id === s.inspect)?.name || s.inspect} · ${point.k ?? Math.min(s.k, r.path.length - 1)}`
          ),
          metric("f(xᵏ) − p*", point.gap),
          metric("‖∇f(xᵏ)‖₂", point.gnorm)
        );
      }
    }
    v.el.querySelector(".lab-metrics").innerHTML = metrics
      .slice(0, 3)
      .map((m) => `<div class="lab-metric">${escape(m.label)}<strong>${escape(m.value)}</strong></div>`)
      .join("");
    v.el.querySelector(".lab-legend").innerHTML = (v.kind === "nonquadratic" && v.stage !== "geometry" ? [] : result.legend || [])
      .map(([name, color]) => `<span><i style="--legend-color:${color}"></i>${escape(name)}</span>`)
      .join("");
    let notice = result.notice || "";
    if (v.kind === "nonquadratic" && v.stage !== "geometry")
      notice =
        {
          line: "所示线搜索从当前点发起；“详情”列出逐次试探。拖动 x₀ 或修改 α、β，所有 (9.20) 页面同步。",
          gradient: "拖动共同起点；按“播放”观察实际迭代。精确搜索以数值求根实现，其内层计算也计入详情。",
          error: "半对数图上的直线对应几何衰减。教材报告的 20 步与 15 步是原书那组实验；本页按当前参数计算。",
          norm: "P₁=diag(2,8)，P₂=diag(8,2)。勾选方法比较路径；球的边界由 dᵀPd≤1 定义，箭头长度另行缩放。",
          newton: "观察回溯何时开始接受单位步，以及误差曲线何时弯折。该指数函数不应直接套用自协调函数的间隙保证。",
          all: "用“详情”比较迭代数及 f / ∇f / H 调用。调用次数与实际运行时间不同；更多导数信息也需要计算成本。",
        }[v.stage] || notice;
    v.el.querySelector(".lab-notice").textContent = notice;
    syncControls(v);
    root.LectureMath?.enhance(v.el);
    if (v.kind === "nonquadratic" && v.stage !== "geometry") {
      const selected = N.methods.filter((m) => s["show_" + m.id]);
      if (!selected.some((m) => m.id === s.inspect)) {
        v.state.inspect = selected[0].id;
        render(v);
        return;
      }
    }
  }
  function syncControls(v) {
    const s = currentState(v);
    for (const el of v.el.querySelectorAll("[data-key]")) {
      const key = el.dataset.key;
      if (el.type === "radio") el.checked = el.value === String(s[key]);
      else if (el.type === "checkbox") el.checked = !!s[key];
      else if (document.activeElement !== el) el.value = s[key];
    }
    const zoomOutput = v.el.querySelector("[data-zoom-value]");
    if (zoomOutput) zoomOutput.textContent = Math.round(s.zoom * 100) + "%";
    const zoomBar = v.el.querySelector(".plot-zoom");
    if (zoomBar) zoomBar.hidden = v.kind === "nonquadratic" && s.view === "error";
    for (const button of v.el.querySelectorAll("[data-plot-view]")) button.setAttribute("aria-pressed", String(button.dataset.plotView === s.view));
  }
  function stop() {
    if (animation) {
      clearInterval(animation);
      animation = null;
    }
    for (const v of instances.values()) {
      const b = v.el.querySelector("[data-action=play]");
      if (b) {
        b.textContent = "播放";
        b.setAttribute("aria-pressed", "false");
      }
    }
  }
  function update(v, key, value) {
    const next = normalize(v.kind, { ...currentState(v), [key]: value });
    if (v.kind === "logistic" && key === "w0") next.k = 0;
    if (v.kind === "nonquadratic" && key === "inspect") next["show_" + value] = true;
    if (sharesExample(v.kind)) {
      if (coreKeys.includes(key)) {
        shared = { ...shared, [key]: next[key] };
        for (const other of instances.values()) if (sharesExample(other.kind)) other.dirty = true;
      } else v.state = next;
    } else v.state = next;
    render(v);
    save();
  }
  function advanced(v) {
    const box = document.getElementById("lab-dialog-content"),
      dialog = document.getElementById("lab-dialog");
    document.getElementById("lab-dialog-title").textContent = "实验参数与数据";
    const s = currentState(v),
      all = defs(v.kind).controls,
      visible = new Set(v.controls.map((c) => c.key));
    visible.add("zoom");
    const extra = all.filter(
      (c) => !visible.has(c.key) && c.group !== "methods" && !(v.stage === "geometry" && ["view", "inspect", "metric", "geometry"].includes(c.key))
    );
    box.innerHTML = `${
      extra.length ? "<h3>更多参数</h3>" + extra.map((c) => control(c, s)).join("") : ""
    }<h3>当前实验详情</h3><div class="modal-results">${
      v.result?.details || `<p>${escape(v.result?.notice || "数值由当前参数实时计算。")}</p>`
    }</div><div class="lab-tools"><button id="download-data">下载 JSON 数据</button><button id="reset-experiment">恢复初始设置</button></div>`;
    box.oninput = (e) => {
      const el = e.target;
      if (!el.dataset.key || (el.type === "radio" && !el.checked)) return;
      const value = el.type === "checkbox" ? el.checked : el.type === "radio" || el.tagName === "SELECT" ? el.value : +el.value;
      if (el.type === "number" && (el.value === "" || !Number.isFinite(value))) return;
      update(v, el.dataset.key, value);
      const state = currentState(v);
      for (const field of box.querySelectorAll("[data-key]")) {
        if (field === el) continue;
        if (field.type === "radio") field.checked = field.value === String(state[field.dataset.key]);
        else if (field.type === "checkbox") field.checked = state[field.dataset.key];
        else field.value = state[field.dataset.key];
      }
      box.querySelector(".modal-results").innerHTML = v.result?.details || `<p>${escape(v.result?.notice || "")}</p>`;
      root.LectureMath?.enhance(box);
    };
    box.querySelector("#download-data").onclick = () => download(v);
    box.querySelector("#reset-experiment").onclick = () => {
      reset(v);
      dialog.close();
    };
    stop();
    dialog.showModal();
    root.LectureMath?.enhance(box);
  }
  function download(v) {
    const content = JSON.stringify(
      { example: v.kind, stage: v.stage || null, parameters: currentState(v), data: v.result.data },
      (_key, value) => (typeof value === "number" && !Number.isFinite(value) ? null : value),
      2
    );
    const url = URL.createObjectURL(new Blob([content], { type: "application/json" })),
      a = document.createElement("a");
    a.href = url;
    a.download = `math6015-${v.kind}-${v.stage || v.id}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function reset(v) {
    stop();
    if (sharesExample(v.kind)) {
      shared = Object.fromEntries(coreKeys.map((k) => [k, nonquadBase[k]]));
      v.state = v.kind === "nonquadratic" ? preset(v.stage) : { ...defs(v.kind).defaults };
      for (const other of instances.values()) if (sharesExample(other.kind)) other.dirty = true;
    } else v.state = { ...defs(v.kind).defaults };
    render(v);
    save();
  }
  function mount(el) {
    const id = el.closest(".lecture-slide").id;
    if (instances.has(id)) {
      const v = instances.get(id);
      if (v.dirty) {
        render(v);
        v.dirty = false;
      }
      return v;
    }
    const kind = el.dataset.lab,
      stage = el.dataset.stage,
      def = defs(kind);
    let state = kind === "nonquadratic" ? preset(stage) : { ...def.defaults };
    if (kind === "newton") state = { ...state, x0: 1, k: 0 };
    if (kind === "barrierfamily") state = { ...state, k: 0 };
    if (restored.locals?.[id]) state = normalize(kind, { ...state, ...restored.locals[id] });
    let keys =
      kind === "nonquadratic"
        ? ["k", "alpha", "beta", "inspect"]
        : kind === "precondition"
          ? ["q", "k", "alpha", "beta"]
          : kind === "barrierfamily"
            ? ["k", "scaling", "objective", "view"]
            : null;
    if (stage === "geometry") keys = ["k", "alpha", "beta"];
    const controls = keys ? keys.map((k) => def.controls.find((c) => c.key === k)).filter(Boolean) : def.controls;
    const v = { id, el, kind, stage, state, controls, result: null, dirty: false };
    instances.set(id, v);
    const pointControls = sharesExample(kind)
      ? `<div class="point-controls">${["px", "py"]
          .map(
            (key, i) =>
              `<label class="lab-control"><span>x₀,${i + 1}</span><input type="number" data-key="${key}" min="${i ? -2 : -3.5}" max="${
                i ? 2 : 2.5
              }" step="0.05" value="${shared[key]}" aria-label="初始点第 ${i + 1} 个坐标"></label>`
          )
          .join("")}</div><p class="shared-note">起点、α、β、进度跨本讲所有 (9.20) 页面同步</p>`
      : "";
    const animate = def.animate || ("k" in state ? "k" : null);
    v.animate = animate;
    const methods =
      kind === "nonquadratic" && stage !== "geometry"
        ? N.methods
            .map((m) => {
              const c = def.controls.find((c) => c.key === "show_" + m.id);
              return `<label style="--method-color:${c.color}"><input type="checkbox" data-key="show_${m.id}"${
                state["show_" + m.id] ? " checked" : ""
              }>${escape(c.label)}</label>`;
            })
            .join("")
        : "";
    const plotViews =
      kind === "nonquadratic" && stage !== "geometry"
        ? `<div class="plot-views" role="group" aria-label="选择图形视图">${[
            ["path", "轨迹大图"],
            ["error", "收敛大图"],
            ["line", "线搜索"],
            ["both", "并排对照"],
          ]
            .map(([value, label]) => `<button data-plot-view="${value}" aria-pressed="${state.view === value}">${label}</button>`)
            .join("")}</div>`
        : "";
    const zoomTools = def.controls.some((c) => c.key === "zoom")
      ? `<div class="plot-zoom" aria-label="图形缩放"><span>${
          kind === "nonquadratic" ? "轨迹缩放" : "图形缩放"
        }</span><button data-action="zoom-out" aria-label="缩小交互图">−</button><input type="range" data-key="zoom" min=".5" max="6" step=".1" value="${
          currentState(v).zoom
        }" aria-label="图形缩放比例"><output data-zoom-value>100%</output><button data-action="zoom-in" aria-label="放大交互图">＋</button><button data-action="zoom-fit">复位视图</button></div>`
      : "";
    const noticeBesideControls = ["nonquadratic", "ridge", "affineNewton"].includes(kind);
    const metricsBesideControls = kind === "ridge";
    const notice = '<p class="lab-notice"></p>';
    const metrics = '<div class="lab-metrics" aria-live="off"></div>';
    el.innerHTML = `<div class="lab-grid"><div class="lab-controls">${pointControls}${controls
      .filter((c) => c.type !== "checkbox" && c.key !== "zoom")
      .map((c) => control(c, currentState(v)))
      .join("")}${
      animate
        ? '<div class="play-controls"><button data-action="play" aria-pressed="false">播放</button><button data-action="step">单步 →</button><button data-action="rewind">从头</button></div>'
        : ""
    }<div class="lab-tools"><button data-action="details">详情 / 参数</button><button data-action="reset">重置</button></div>${
      metricsBesideControls ? metrics : ""
    }${
      noticeBesideControls ? notice : ""
    }</div><div class="lab-main">${plotViews}${zoomTools}<div class="lab-chart"></div><div class="lab-methods">${methods}</div><div class="lab-legend"></div>${
      metricsBesideControls ? "" : metrics
    }${noticeBesideControls ? "" : notice}</div></div>`;
    if (kind === "strongConvex" && el.nextElementSibling?.classList.contains("source-note"))
      el.querySelector(".lab-controls").append(el.nextElementSibling);
    el.addEventListener("input", (e) => {
      const field = e.target;
      if (!field.dataset.key || (field.type === "radio" && !field.checked)) return;
      stop();
      if (field.type === "number" && field.value === "") return;
      const textual = field.type === "radio" || field.tagName === "SELECT";
      const value = field.type === "checkbox" ? field.checked : textual ? field.value : +field.value;
      if (field.type !== "checkbox" && !textual && !Number.isFinite(value)) return;
      update(v, field.dataset.key, value);
    });
    el.addEventListener("click", (e) => {
      const plotView = e.target.closest("[data-plot-view]");
      if (plotView) {
        update(v, "view", plotView.dataset.plotView);
        return;
      }
      const action = e.target.closest("[data-action]")?.dataset.action;
      if (!action) return;
      if (action === "details") {
        advanced(v);
        return;
      }
      if (action === "reset") {
        reset(v);
        return;
      }
      if (action.startsWith("zoom-")) {
        update(v, "zoom", action === "zoom-fit" ? 1 : currentState(v).zoom * (action === "zoom-in" ? 1.25 : 0.8));
        return;
      }
      const c = def.controls.find((c) => c.key === animate),
        limit = animate === "k" ? Math.min(c.max, v.result.progressMax ?? c.max) : c.max;
      if (action === "rewind") {
        stop();
        update(v, animate, c.min);
      }
      if (action === "step") {
        stop();
        update(v, animate, Math.min(limit, currentState(v)[animate] + c.step));
      }
      if (action === "play") {
        if (animation) {
          stop();
          return;
        }
        stop();
        if (currentState(v)[animate] >= limit) update(v, animate, c.min);
        e.target.textContent = "暂停";
        e.target.setAttribute("aria-pressed", "true");
        animation = setInterval(() => {
          const next = currentState(v)[animate] + c.step;
          if (next > limit + 1e-10) {
            stop();
            return;
          }
          update(v, animate, next);
        }, 330);
      }
    });
    let drag = null;
    el.addEventListener("pointerdown", (e) => {
      const point = e.target.closest("[data-drag]");
      if (!point) return;
      e.preventDefault();
      stop();
      const svg = point.closest("svg");
      drag = { keys: point.dataset.drag.split(","), svg, release: Plot.freezeFrames(el.querySelectorAll("svg[data-bounds]")) };
      el.setPointerCapture?.(e.pointerId);
    });
    el.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const box = drag.svg.getBoundingClientRect(),
        [a, b, c, d] = drag.svg.dataset.bounds.split(",").map(Number),
        [left, top, w, h] = drag.svg.dataset.box.split(",").map(Number);
      const px = ((e.clientX - box.left) / box.width) * 640,
        py = ((e.clientY - box.top) / box.height) * 350;
      const values = [a + ((px - left) / w) * (b - a), d - ((py - top) / h) * (d - c)];
      // Capture geometry before replacing the SVG; one state update per pointer event.
      const next = normalize(kind, { ...currentState(v), ...Object.fromEntries(drag.keys.map((key, i) => [key, values[i]])) });
      if (kind === "logistic") next.k = 0;
      if (sharesExample(kind)) {
        shared = { ...shared, px: next.px, py: next.py };
        for (const other of instances.values()) if (sharesExample(other.kind)) other.dirty = true;
      } else v.state = next;
      const title = drag.svg.querySelector("title")?.textContent;
      render(v);
      drag.svg =
        [...el.querySelectorAll("svg[data-bounds]")].find((svg) => svg.querySelector("title")?.textContent === title) ||
        el.querySelector("svg[data-bounds]");
      save();
    });
    const end = () => {
      if (!drag) return;
      const release = drag.release;
      drag = null;
      release();
      render(v);
    };
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
    el.addEventListener("lostpointercapture", end);
    el.addEventListener("keydown", (e) => {
      const point = e.target.closest("[data-drag]");
      if (!point || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
      e.preventDefault();
      e.stopPropagation();
      stop();
      const keys = point.dataset.drag.split(","),
        i = keys.length === 1 || e.key === "ArrowLeft" || e.key === "ArrowRight" ? 0 : 1,
        key = keys[i],
        sign = e.key === "ArrowRight" || e.key === "ArrowUp" ? 1 : -1;
      const current = kind === "logistic" && key === "w0" ? v.result.data[Math.min(v.state.k, v.result.data.length - 1)].w : currentState(v)[key];
      update(v, key, current + sign * (e.shiftKey ? 0.2 : 0.05));
      el.querySelector(`[data-drag="${keys.join(",")}"]`)?.focus();
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
    return { shared, stage: v ? { id: v.id, state: currentState(v) } : undefined };
  }
  function mountAll() {
    document.querySelectorAll(".lecture-lab").forEach(mount);
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
  });
  root.LectureLabs = { activate, mount, mountAll, stop, snapshot, instances, normalize, customRender, preset, coreKeys };
})(globalThis);
