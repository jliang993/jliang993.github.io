/* Cross-chapter interactive laboratories, with explicitly labelled teaching instances. */
(function (root) {
  "use strict";
  const M = root.ChapterSpineMath || (typeof require === "function" ? require("./chapter-spine-math.js") : null);
  const C = root.ChapterMath || (typeof require === "function" ? require("./chapter-math.js") : null);
  const range = (key, label, min, max, step, value, group) => ({ type: "range", key, label, min, max, step, value, group });
  const select = (key, label, options, value, group) => ({ type: "select", key, label, options, value, group });
  const colors = ["#357bc4", "#dc9038", "#1a9b87", "#9461cb"];
  const barrierMethods = [
    ["gd", "梯度法"],
    ["scaled", "缩放坐标梯度法"],
    ["newton", "Newton"],
    ["newtonScaled", "缩放坐标 Newton"],
  ];
  const eqMethods = [
    ["feasible", "可行起点 Newton"],
    ["infeasible", "不可行起点 Newton"],
    ["dual", "对偶 Newton"],
  ];
  const lpMethods = [
    ["barrier", "障碍法"],
    ["pd", "原始–对偶内点法"],
  ];
  const shared = (methods, max = 100) => [
    range("k", "迭代进度 k", 0, max, 1, max),
    select("view", "显示内容", ["both|几何 + 收敛", "path|仅几何图", "error|仅收敛图", "components|分量 + 收敛"], "both"),
    ...methods.map(([id, name], i) => ({ type: "checkbox", key: "show_" + id, label: name, value: true, group: "methods", color: colors[i] })),
    select(
      "inspect",
      "逐步观察",
      methods.map(([id, name]) => id + "|" + name),
      methods[0][0],
      "advanced"
    ),
    range("alpha", "充分下降 α", 0.01, 0.4, 0.01, 0.1, "line"),
    range("beta", "缩减比例 β", 0.2, 0.8, 0.05, 0.5, "line"),
  ];
  const polygonControls = [range("angle", "目标方向 θ（度）", -180, 180, 5, -35), range("cut", "斜边位置 b₅", 0.7, 2.4, 0.05, 1.45)];
  const book = (label, page) => ({
    label: "Boyd & Vandenberghe · " + label,
    url: "https://web.stanford.edu/~boyd/cvxbook/bv_cvxbook.pdf#page=" + (page + 14),
  });
  const common = {
    advancedLabel: "更多参数与逐步观察",
    focus: true,
    details: true,
    replay: true,
    animate: "k",
    source: "教材模型 · 明确标注的小规模教学实例；数值轨迹实时计算",
  };
  const defs = [
    {
      ...common,
      id: "barrierfamily",
      chapter: "03",
      short: "主线 · 对数障碍",
      title: "从式 (9.21) 到解析中心：坐标缩放改变了什么？",
      intro: "共享同一个多边形和起点，比较原坐标、缩放坐标下的梯度法与 Newton。切换解析中心后，可将同一组约束带入内点法实验。",
      question: "把 x₁ 的尺度放大后，哪两条映回 x 空间的轨迹仍然重合？靠近边界时，为什么试探步会被拒绝？",
      ref: book("式 (9.21)；§9.3.2 / §9.5.4；§8.5.3", 472),
      methods: barrierMethods,
      points: [{ kx: "px", ky: "py", label: "请求初始点 x₀", x: 0.7, y: -0.6 }],
      pointBounds: [-2.1, 2.1, -1.6, 1.6],
      controls: [
        ...shared(barrierMethods),
        ...polygonControls,
        select("objective", "目标模型", ["tilted|线性项 + 对数障碍", "analytic|纯障碍：解析中心"], "tilted"),
        range("logt", "线性项权重 t（对数）", -1, 2, 0.1, 0),
        range("scaling", "坐标缩放 γ", 1, 20, 1, 5),
        select("metric", "收敛指标", ["residual|原坐标梯度范数", "gap|目标差（数值精度内）"], "residual", "advanced"),
      ],
      presets: [
        { id: "center", label: "解析中心", state: { objective: "analytic", k: 0 } },
        { id: "scaled", label: "放大坐标影响", state: { objective: "tilted", scaling: 15, k: 0 } },
      ],
    },
    {
      ...common,
      id: "centeringfamily",
      chapter: "05",
      short: "主线 · 等式解析中心",
      title: "同一个解析中心：从可行点、不可行点或对偶出发",
      intro: "三变量、一条资源约束。左图是 (x₁,x₂) 投影；表格保留完整三维点。三种方法分别满足各自的起点要求，最终寻找同一个解。",
      question: "一次全 Newton 步如何消除等式残差？对偶 Newton 恢复的 x 在迭代中一定可行吗？",
      ref: book("式 (10.7)、(10.25)；§10.1–10.3", 525),
      methods: eqMethods,
      points: [{ kx: "px", ky: "py", label: "请求起点的前两分量", x: 0.35, y: 1.6 }],
      pointBounds: [0.05, 3.5, 0.05, 3.5],
      controls: [
        ...shared(eqMethods, 60),
        range("weight", "资源系数 ω", 0.5, 2, 0.1, 1.2),
        range("budget", "资源总量 b", 1.5, 5, 0.1, 3),
        range("start3", "请求起点 x₃", 0.05, 3, 0.05, 0.4),
        range("nu0", "对偶起点 ν₀", 0.2, 4, 0.1, 0.6, "advanced"),
        select("metric", "收敛指标", ["residual|KKT 总残差", "primal|等式残差"], "residual", "advanced"),
      ],
      presets: [
        { id: "far", label: "较远的不可行点", state: { px: 2.5, py: 2, start3: 1.7, k: 0 } },
        { id: "close", label: "默认起点", state: { px: 0.35, py: 1.6, start3: 0.4, k: 0 } },
      ],
    },
    {
      ...common,
      id: "entropyfamily",
      chapter: "07",
      short: "主线 · 最大熵三法",
      title: "同一个最大熵分布：原始方法与对偶方法",
      intro: "取值为 −1、0、1 的三点分布，已知均值 μ。改变均值约束，观察概率分量、可行集和三种 Newton 方法；对应习题 10.15 的小规模教学实例。",
      question: "均值趋近端点时，概率怎样集中？为什么对偶方法在中途恢复的正分量，尚不能直接当作概率分布？",
      ref: book("§7.2，例 7.2；习题 10.15", 560),
      methods: eqMethods,
      points: [{ kx: "px", ky: "py", label: "请求起点 (p₁,p₃)", x: 0.2, y: 0.5 }],
      pointBounds: [0.02, 0.9, 0.02, 0.9],
      controls: [
        ...shared(eqMethods, 60),
        range("mean", "指定均值 μ", -0.7, 0.7, 0.05, 0.25),
        range("nu0", "对偶起点 ν₁", -2, 2, 0.1, 0, "advanced"),
        select("metric", "收敛指标", ["residual|KKT 总残差", "primal|归一化与均值残差"], "residual", "advanced"),
      ],
      presets: [
        { id: "symmetric", label: "对称分布", state: { mean: 0, k: 0 } },
        { id: "skew", label: "概率向右集中", state: { mean: 0.65, k: 0 } },
      ],
    },
    {
      ...common,
      id: "interiorfamily",
      chapter: "06",
      short: "主线 · LP 两种内点法",
      title: "同一个 LP：中心路径、障碍法与原始–对偶方法",
      intro: "与“对数障碍”共用六个半空间。旋转目标方向、移动斜边或拖动起点，比较两种方法的实际步、目标差、互补量和对偶残差。",
      question: "障碍法的外层参数更新为什么带来阶段变化？互补量很小时，是否还需要检查对偶可行性？",
      ref: book("§11.2、§11.3.2、§11.7.4", 563),
      methods: lpMethods,
      points: [{ kx: "px", ky: "py", label: "请求初始点 x₀", x: 0.7, y: -0.6 }],
      pointBounds: [-2.1, 2.1, -1.6, 1.6],
      controls: [
        ...shared(lpMethods, 240),
        ...polygonControls,
        range("mu", "参数倍率 μ", 2, 30, 1, 10),
        range("logt0", "障碍法初始 t（对数）", -1, 1, 0.1, 0, "advanced"),
        select("metric", "收敛指标", ["gap|实际 LP 目标差", "residual|KKT 残差", "dual|对偶可行性残差", "eta|互补量 sᵀλ"], "gap", "advanced"),
      ],
      presets: [
        { id: "gentle", label: "温和更新 μ=2", state: { mu: 2, k: 0 } },
        { id: "fast", label: "大幅更新 μ=20", state: { mu: 20, k: 0 } },
      ],
    },
  ];
  for (const d of defs)
    if (["barrierfamily", "interiorfamily"].includes(d.id))
      d.controls.find((p) => p.key === "view").options = d.controls.find((p) => p.key === "view").options.filter((o) => !o.startsWith("components"));
  const ids = new Set(defs.map((d) => d.id));
  function normalize(id, s) {
    const d = defs.find((d) => d.id === id);
    if (!d) return s;
    if (!d.methods.some(([m]) => s["show_" + m])) s["show_" + d.methods[0][0]] = true;
    if (id === "entropyfamily" && s.px + s.py > 0.96) {
      const z = 0.96 / (s.px + s.py);
      s.px *= z;
      s.py *= z;
    }
    return s;
  }
  const escape = (s) => String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  function render(id, s, { Plot, fmt, colors: palette }) {
    const d = defs.find((d) => d.id === id),
      data = M.calculate(id, s),
      visible = d.methods.map(([m, name], i) => ({ id: m, name, color: colors[i], path: data.paths[m] })).filter((r) => s["show_" + r.id]);
    const max = Math.max(...visible.map((r) => r.path.length - 1));
    s.k = Math.min(s.k, max);
    const current = (r) => r.path[Math.min(s.k, r.path.length - 1)],
      isPoly = !!data.P,
      entropy = id === "entropyfamily",
      lp = id === "interiorfamily";
    const position = (x) => (entropy ? [x[0], x[2]] : x.slice(0, 2));
    const allPoints = Object.values(data.paths).flatMap((path) => path.map((r) => position(r.x)));
    let bound = isPoly
      ? [-2.5, 2.5, -1.85, 1.85]
      : entropy
        ? [-0.05, 1.08, -0.05, 1.08]
        : [0, Math.max(3.5, data.E.b[0], ...allPoints.map((p) => p[0])), 0, Math.max(3.5, data.E.b[0] / s.weight, ...allPoints.map((p) => p[1]))];
    // Limit presentation to the main feasible geometry; off-frame recovered components are listed in the table.
    if (entropy) bound = [-0.05, 1.08, -0.05, 1.08];
    const g = new Plot(id + "-geometry", bound, true, entropy ? "p₁" : "x₁", entropy ? "p₃" : "x₂");
    if (isPoly) {
      g.polygon(data.P.vertices, palette.blue, 0.08);
      data.P.A.forEach((a, i) => g.line(a, data.P.b[i], i === 4 ? palette.orange : palette.gray, i === 4 ? "" : "5 4"));
      if (data.contours) data.contours.forEach((points) => g.path(points, "var(--demo-line,#a3adb5)", 1));
      if (data.centers) {
        g.path(
          data.centers.map((r) => r.x),
          palette.gray,
          2,
          "5 4"
        );
        g.line(data.P.c, data.pstar, palette.gray);
        if (data.P.optimalVertices.length > 1) g.path(data.P.optimalVertices, palette.green, 4);
      }
    } else if (entropy) {
      g.polygon(
        [
          [0, 0],
          [1, 0],
          [0, 1],
        ],
        palette.blue,
        0.09
      );
      g.line([-1, 1], s.mean, palette.green, "");
    } else {
      g.polygon(
        [
          [0, 0],
          [s.budget, 0],
          [0, s.budget / s.weight],
        ],
        palette.blue,
        0.09
      );
      g.label([s.budget * 0.4, 0.12], "投影内仍需检查真实 x₃ 和 Ax=b", palette.gray);
    }
    for (const r of visible) {
      const points = r.path.slice(0, s.k + 1);
      g.path(
        points.map((v) => position(v.x)),
        r.color,
        2.2,
        r.id === "newtonScaled" ? "6 4" : ""
      );
      points.forEach((v) => {
        const [x, y] = g.pos(position(v.x));
        g.content.push('<circle cx="' + x + '" cy="' + y + '" r="2" fill="' + r.color + '"/>');
      });
      g.dot(position(current(r).x), "", r.color);
    }
    if (isPoly && C.norm(C.add(data.start, [s.px, s.py], -1)) > 1e-6) g.dot(data.start, "实际 x₀", palette.orange);
    g.dot(position(data.optimum), entropy ? "p*" : "x*", palette.gray);
    g.dot([s.px, s.py], isPoly ? "请求 x₀" : "请求起点", palette.gray, "px,py");
    let metric = s.metric,
      metricLabel =
        metric === "gap"
          ? "log₁₀ 实际目标差"
          : metric === "primal"
            ? "log₁₀ 等式残差"
            : metric === "dual"
              ? "log₁₀ 对偶残差"
              : metric === "eta"
                ? "log₁₀ 互补量 sᵀλ"
                : isPoly && !lp
                  ? "log₁₀ ‖∇f(x)‖₂"
                  : "log₁₀ KKT 残差";
    const value = (r) => (metric === "gap" ? (lp ? r.gap : Math.max(0, r.f - data.pstar)) : r[metric]);
    const log = (v) => Math.log10(Math.max(1e-14, v));
    const top = Math.max(0, ...visible.flatMap((r) => r.path.map((v) => log(value(v)))));
    const error = new Plot(id + "-error", [0, Math.max(5, max), -14, Math.ceil(top) + 1], false, "实际迭代次数 k", metricLabel);
    for (const r of visible) {
      error.path(
        r.path.slice(0, s.k + 1).map((v) => [v.k, log(value(v))]),
        r.color,
        2.2,
        r.id === "newtonScaled" ? "6 4" : ""
      );
      const q = current(r);
      error.dot([q.k, log(value(q))], "", r.color);
    }
    error.line([1, 0], s.k, palette.gray, "3 4");
    const panel = (title, svg) => "<figure><figcaption>" + title + "</figcaption>" + svg + "</figure>";
    let figures = [];
    if (s.view === "components" && !isPoly) {
      const top = Math.max(...visible.flatMap((r) => current(r).x), ...data.optimum) * 1.15,
        bars = new Plot(id + "-components", [-0.5, 3.5, 0, top], false, "分量 i = 1, 2, 3", entropy ? "正分量值（未归一化时不是概率）" : "xᵢ");
      visible.forEach((r, j) =>
        current(r).x.forEach((v, i) => {
          const x = i + 1 - 0.3 + j * 0.22;
          bars.path(
            [
              [x, 0],
              [x, v],
            ],
            r.color,
            7
          );
        })
      );
      data.optimum.forEach((v, i) =>
        bars.path(
          [
            [i + 0.65, v],
            [i + 1.35, v],
          ],
          palette.gray,
          2,
          "3 3"
        )
      );
      figures.push(panel("当前分量 · 虚线为最优解", bars.finish(d.title + "分量图")));
    } else if (s.view !== "error") figures.push(panel(isPoly ? "可行域与实际迭代轨迹" : "投影图 · 所有三维分量见下表", g.finish(d.title + "几何图")));
    if (s.view !== "path") figures.push(panel("同一进度 · 已收敛方法保留终点", error.finish(d.title + "收敛图")));
    const inspect = d.methods.find(([m]) => m === s.inspect) || d.methods[0],
      path = data.paths[inspect[0]],
      rec = path[Math.min(s.k, Math.max(0, path.length - 2))],
      step = rec.step;
    let rows = visible
      .map((r) => {
        const q = current(r),
          prev = r.path[q.k - 1],
          status = q.k === r.path.length - 1 ? q.status || "已结束" : "迭代中";
        return (
          '<tr><th scope="row"><i style="background:' +
          r.color +
          '"></i>' +
          r.name +
          "</th><td>" +
          q.k +
          "</td><td>" +
          q.x.map((v) => fmt(v, 5)).join(", ") +
          "</td><td>" +
          fmt(q.f, 6) +
          "</td><td>" +
          fmt(q.residual, 4) +
          "</td><td>" +
          fmt(q.primal, 4) +
          "</td><td>" +
          fmt(id === "barrierfamily" ? Math.min(...q.slack) : q.dual, 4) +
          "</td>" +
          (lp ? "<td>" + fmt(q.eta, 4) + "</td><td>" + (r.id === "barrier" ? q.outer + 1 + " / " + fmt(q.t, 4) : "—") + "</td>" : "") +
          "<td>" +
          (prev?.step ? fmt(prev.step.t, 4) : "—") +
          "</td><td>" +
          q.trials +
          "</td><td>" +
          status +
          "</td></tr>"
        );
      })
      .join("");
    let details =
      '<div class="nonquad-table-scroll"><table class="nonquad-results"><caption>当前实际状态 · 三维实例显示全部分量；试探数累计到当前步</caption><thead><tr><th>方法</th><th>k</th><th>' +
      (entropy ? "完整 p" : "完整 x") +
      "</th><th>f(x)</th><th>" +
      (!lp && isPoly ? "梯度范数" : "KKT 残差") +
      "</th><th>原始残差</th><th>" +
      (id === "barrierfamily" ? "最小松弛" : "对偶残差") +
      "</th>" +
      (lp ? "<th>互补量</th><th>障碍外层 / t</th>" : "") +
      "<th>到达步长</th><th>试探数</th><th>状态</th></tr></thead><tbody>" +
      rows +
      "</tbody></table></div>";
    if (step)
      details +=
        '<details class="nonquad-trials"><summary>' +
        inspect[1] +
        "：第 " +
        rec.k +
        " → " +
        (rec.k + 1) +
        " 步的 " +
        step.trials.length +
        " 次试探</summary><p>当前进度已结束时，显示最后一次实际更新。" +
        (lp && inspect[0] === "barrier" ? "该步障碍参数 t=" + fmt(rec.centered ? rec.t * s.mu : rec.t, 5) + "。" : "") +
        '</p><div class="nonquad-table-scroll"><table><thead><tr><th>步长</th><th>在定义域内</th><th>试探目标值</th><th>线搜索残差</th><th>判定</th></tr></thead><tbody>' +
        step.trials
          .map(
            (v) =>
              "<tr><td>" +
              fmt(v.t, 5) +
              "</td><td>" +
              (v.domain ? "是" : "否") +
              "</td><td>" +
              (v.f == null ? "—" : fmt(v.f, 6)) +
              "</td><td>" +
              (v.residual == null ? "—" : fmt(v.residual, 5)) +
              "</td><td>" +
              (v.accepted ? "接受" : "拒绝") +
              "</td></tr>"
          )
          .join("") +
        "</tbody></table></div></details>";
    if (isPoly) {
      details +=
        '<details class="nonquad-reference"><summary>当前问题数据：A、b、c 与起点</summary><p>六个法向量依次为 (1,0)、(0,1)、(−1,0)、(0,−1)、(0.8,0.6)、(−0.6,0.8)。</p><p>b = (' +
        data.P.b.map((v) => fmt(v)).join(", ") +
        ")；c = (" +
        data.P.c.map((v) => fmt(v)).join(", ") +
        ")；实际内部起点 = (" +
        data.start.map((v) => fmt(v, 5)).join(", ") +
        ")。</p></details>";
      details +=
        '<nav class="spine-links" aria-label="共享问题的下一实验"><button type="button" data-spine-target="' +
        (lp ? "barrierfamily" : "interiorfamily") +
        '">沿用当前约束、目标方向与起点 → ' +
        (lp ? "对数障碍与坐标缩放" : "LP 两种内点法") +
        "</button></nav>";
    } else {
      details +=
        '<details class="nonquad-reference"><summary>起点要求、对偶下界与变量说明</summary><p>' +
        (entropy
          ? "变量为三个正分量 p=(p₁,p₂,p₃)。可行时其和为 1，且 p₃−p₁=μ。请求点先确保分量为正；可行方法再保持 p₂ 并满足均值。"
          : "变量为三个正分量 x=(x₁,x₂,x₃)，A=(1,ω,1.4)。可行方法将请求起点按比例缩放到 Ax=b；不可行方法保留请求起点。") +
        " 对偶方法从指定乘子出发，恢复的 x 中途不必满足 Ax=b。</p><p>可行 Newton 对原始目标做 Armijo 回溯；不可行 Newton 对 KKT 残差做回溯；对偶 Newton 对负对偶函数做 Armijo 回溯。对偶下界为 −q(ν)；只有原始点可行时，f(x)+q(ν) 才作为原始–对偶间隙；显示时以原始残差小于 10⁻⁹ 判为数值可行，舍入造成的负零截为 0。</p><ul>" +
        visible
          .map((r) => {
            const q = current(r);
            return (
              "<li>" +
              r.name +
              "：ν=(" +
              q.nu.map((v) => fmt(v, 5)).join(", ") +
              ")，对偶下界 " +
              (q.lower == null ? "乘子不在对偶域" : fmt(q.lower, 6)) +
              "；间隙 " +
              (q.primal < 1e-9 && q.lower !== null ? fmt(Math.max(0, q.f - q.lower), 5) : "尚未同时原始/对偶可行") +
              "。</li>"
            );
          })
          .join("") +
        "</ul></details>";
    }
    const note =
      id === "barrierfamily"
        ? "式 (9.21) 的二维教学实例，原书使用 100 维数据。缩放取 x=diag(γ,1)y；四法共享实际 x₀，Newton 映回 x 后应重合。请求起点若在外部，则沿原点射线收缩到严格内部。"
        : lp
          ? "二维 LP 教学实例，不冒充原书 50 维基准。灰虚线为数值中心路径。两法都从同一严格内部点开始；sᵀλ 只有在对偶可行时才等于原始–对偶间隙。障碍法的外层参数不计作额外 Newton 步。目标平行于边时，最优解可能不唯一，绿色边段表示最优面。"
          : entropy
            ? "三点分布是习题 10.15 的小规模教学实例。彩色轨迹使用 (p₁,p₃) 投影；投影落在三角形内不代表完整点已经满足概率约束。超出图框的分量仍在表格中显示。"
            : "三变量教学实例。投影位于三角形内，不代表完整点满足 Ax=b；请结合原始残差与 x₃ 判断。三法使用各自合法的起点，不声称同一初始点。";
    return {
      state: s,
      progressMax: max,
      data,
      svg: '<div class="nonquad-charts spine-charts">' + figures.join("") + "</div>",
      details,
      legend: visible.map((r) => [r.name, r.color]),
      metrics: [
        { label: lp ? "一个最优顶点" : entropy ? "最优分布 p*" : "最优解 x*", value: data.optimum.map((v) => fmt(v, 5)).join(", ") },
        { label: "最优目标值", value: fmt(data.pstar, 7) },
        {
          label: lp ? "当前 μ" : id === "barrierfamily" ? "当前 t" : "约束右端 b",
          value: lp ? fmt(s.mu) : id === "barrierfamily" ? fmt(data.t) : data.E.b.map((v) => fmt(v)).join(", "),
        },
      ],
      notice: note + " 收敛图中 ≤10⁻¹⁴ 的值显示在底线，表格保留实际值。",
    };
  }
  const api = { defs, ids, normalize, render };
  root.ChapterSpineExamples = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
