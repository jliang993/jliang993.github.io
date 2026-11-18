/* Textbook example definitions and data-driven SVG renderers. */
(function (root) {
  "use strict";
  const C = root.ChapterMath || (typeof require === "function" ? require("./chapter-math.js") : null);
  const E = root.OptLab || (typeof require === "function" ? require("./optimization-engine.js") : null);
  const More = root.ChapterMoreExamples || (typeof require === "function" ? require("./chapter-more-experiments.js") : null);
  const Nonquadratic = root.ChapterNonquadratic || (typeof require === "function" ? require("./chapter-nonquadratic.js") : null);
  const Spine = root.ChapterSpineExamples || (typeof require === "function" ? require("./chapter-spine-experiments.js") : null);
  const esc = (s) => String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  const fmt = (v, d = 3) =>
    !Number.isFinite(v)
      ? v === Infinity
        ? "∞"
        : "—"
      : v === 0
        ? "0"
        : Math.abs(v) < 0.001 || Math.abs(v) > 1e5
          ? v.toExponential(2)
          : Number(v.toPrecision(d)).toString();
  const book = (section, page) => ({
    label: `Boyd & Vandenberghe · ${section} · p. ${page}`,
    url: `https://web.stanford.edu/~boyd/cvxbook/bv_cvxbook.pdf#page=${page + 14}`,
  });
  const supplement = (page) => ({
    label: "课程补充：一阶优化方法",
    url: `https://jliang993.github.io/assets/teaching/math6015/supplement-first-order-methods.pdf#page=${page}`,
  });
  const range = (key, label, min, max, step, value, extra = {}) => ({ key, label, min, max, step, value, type: "range", ...extra });
  const select = (key, label, options, value) => ({ key, label, options, value, type: "select" });
  const point = (kx, ky, label, x, y) => ({ kx, ky, label, x, y });
  const defs = [
    {
      id: "quadratic",
      chapter: "00",
      title: "特征值如何塑造椭圆？",
      short: "二次型与特征方向",
      ref: book("§2.2.2", 29),
      source: "教材模型 · 二维改编",
      intro: "转动特征方向、拉大特征值比，再拖动点 x。观察等高线、梯度方向与函数值。",
      question: "沿哪一个特征方向移动相同距离，函数值变化更大？",
      controls: [range("kappa", "特征值比 κ", 1, 20, 0.2, 5), range("angle", "旋转角 θ（度）", -90, 90, 1, 28)],
      points: [point("px", "py", "x", 1.3, 0.7)],
      animate: "angle",
    },
    {
      id: "norms",
      chapter: "00",
      title: "不同范数，怎样定义“单位距离”？",
      short: "范数与单位球",
      ref: book("§A.1.2–A.1.3", 634),
      source: "教材模型 · 二维改编",
      intro: "改变 p，观察单位球从菱形变为圆，再逐渐接近正方形。拖动点 x，比较它是否落在单位球内。",
      question: "同一个向量，为什么在不同范数下会有不同长度？",
      controls: [select("mode", "范数", ["finite|有限 p", "inf|p = ∞"], "finite"), range("p", "指数 p", 1, 8, 0.1, 2)],
      points: [point("px", "py", "x", 0.8, 0.6)],
      animate: "p",
    },
    {
      id: "segments",
      chapter: "01",
      title: "两点之间的线段，是否仍在集合内？",
      short: "凸集的线段判据",
      ref: book("§2.1.1；§2.1.4", 23),
      source: "教材定义 · 几何演示",
      intro: "拖动 A、B，或者切换为带缺口的集合。改变 t，追踪线段上的点 z(t)。",
      question: "发现一条越出集合的线段足以否定凸性；检查一条线段能否证明凸性？",
      controls: [
        select("shape", "集合形状", ["disk|圆盘（凸）", "box|矩形（凸）", "notch|带缺口集合（非凸）"], "disk"),
        range("t", "线段参数 t", 0, 1, 0.01, 0.5),
      ],
      points: [point("ax", "ay", "A", 1.5, 1.1), point("bx", "by", "B", 1.5, -1.1)],
      animate: "t",
    },
    {
      id: "jensen",
      chapter: "01",
      title: "函数图像在弦的哪一侧？",
      short: "凸函数与 Jensen 不等式",
      ref: book("§3.1.1，Figure 3.1", 67),
      source: "教材定义 · 函数改编",
      intro: "改变两个端点和混合比例，比较“先混合再求值”与“先求值再混合”。",
      question: "换成 log(x) 或双阱函数后，弦与图像的关系怎样改变？",
      controls: [
        select("fun", "函数", ["square|x²（凸）", "exp|exp(x)（凸）", "log|log(x)（凹）", "double|x⁴−2x²（非凸）"], "square"),
        range("a", "端点 a", -2.5, 2.5, 0.05, -1.3),
        range("b", "端点 b", -2.5, 2.5, 0.05, 1.3),
        range("t", "混合比例 t", 0, 1, 0.01, 0.5),
      ],
      animate: "t",
    },
    {
      id: "robust",
      chapter: "02",
      title: "一个异常点，能把拟合直线拉多远？",
      short: "鲁棒回归",
      ref: book("§6.1.2，Example 6.2", 299),
      source: "教材例子 · 重构数据",
      intro: "移动一个观测值，同时比较最小二乘、绝对值损失与 Huber 损失的最优拟合。",
      question: "异常点不断增大时，哪条直线最敏感？Huber 阈值控制了什么？",
      controls: [range("outlier", "异常点的竖直偏移", -6, 9, 0.1, 4), range("delta", "Huber 阈值 δ", 0.2, 2, 0.05, 0.7)],
      animate: "outlier",
    },
    {
      id: "ridge",
      chapter: "02",
      title: "稳定性与拟合误差，如何权衡？",
      short: "Tikhonov 正则化",
      ref: book("§6.3.2，式 (6.10)", 306),
      source: "教材模型 · 二维改编",
      intro: "在一个病态的线性模型中，调整观测噪声和正则化强度。轨迹展示 λ 变化时的正则化解。",
      question: "λ 增大为何压缩解的范数？压缩后的解一定更接近真值吗？",
      controls: [range("loglambda", "正则化 λ（对数调节）", -5, 1, 0.05, -2, { log: true }), range("noise", "观测噪声 ε", -0.3, 0.3, 0.005, 0.12)],
      animate: "loglambda",
    },
    {
      id: "descent",
      chapter: "03",
      title: "窄谷中的下降方向与步长",
      short: "梯度下降与 Newton",
      ref: book("§9.3；§9.5", 469),
      source: "教材方法 · 二维改编",
      intro: "固定一个正定二次型，比较固定步长梯度下降、精确线搜索与 Newton 的迭代。",
      question: "为什么梯度法可能走锯齿，而全步 Newton 在这个问题上只需一步？",
      controls: [
        range("kappa", "条件数 κ", 1, 200, 1, 40),
        range("gain", "GD 步长倍率 γ=αL", 0.1, 2.2, 0.05, 1.7),
        range("k", "迭代步 k", 0, 40, 1, 16),
        select("view", "查看", ["path|迭代轨迹", "error|收敛曲线"], "path"),
      ],
      animate: "k",
      algorithm: true,
    },
    {
      id: "newton",
      chapter: "03",
      title: "全步 Newton 为什么会过冲？",
      short: "阻尼与线搜索",
      ref: book("§9.5", 484),
      source: "教材方法 · 一维教学特例",
      intro: "从负的初始点出发，对比全步 Newton 和带 Armijo 回溯的 Newton。拖动迭代步查看两个当前位置。",
      question: "局部二次模型准确，是否意味着远离解时也能放心取全步？",
      controls: [range("x0", "初始点 x₀", -3, 2, 0.05, -2.7), range("k", "迭代步 k", 0, 24, 1, 8)],
      animate: "k",
    },
    {
      id: "affine",
      chapter: "05",
      title: "带等式约束的最短距离",
      short: "仿射投影与乘子",
      ref: book("§10.1.1", 521),
      source: "教材模型 · 单个等式特例",
      intro: "拖动点 c，旋转或平移约束直线。观察最优点、垂线与拉格朗日乘子的变化。",
      question: "约束右端 b 微小变化时，最优目标值怎样变化？",
      controls: [range("angle", "法向角 θ（度）", -90, 90, 1, 35), range("offset", "约束右端 b", -2, 2, 0.05, 0.5)],
      points: [point("px", "py", "c", -1.5, 1.4)],
      animate: "offset",
    },
    {
      id: "infeasible",
      chapter: "05",
      title: "从不可行点出发，也能走向 KKT 解",
      short: "不可行初始点 Newton",
      ref: book("§10.3，Algorithm 10.2", 535),
      source: "教材方法 · 指数目标特例",
      intro: "改变起点或约束右端，逐步观察位置、等式残差与对偶残差。回溯以 KKT 残差范数为依据。",
      question: "为什么阻尼步可能仍不满足等式？何时会落到可行直线上？",
      controls: [
        range("x1", "初始 x₁", -2, 2.5, 0.1, 2),
        range("x2", "初始 x₂", -2, 2.5, 0.1, 1),
        range("b", "约束右端 b", -1, 2, 0.1, 0.5),
        range("k", "迭代步 k", 0, 24, 1, 5),
        select("view", "查看", ["path|迭代轨迹", "error|KKT 残差"], "path"),
      ],
      animate: "k",
    },
    {
      id: "barrier",
      chapter: "06",
      title: "中心路径如何接近线性规划的解？",
      short: "对数障碍与中心路径",
      ref: book("§11.2，Figure 11.2", 566),
      source: "教材图示 · 三约束简化",
      intro: "改变障碍参数 t，观察内部点沿中心路径移动；旋转目标方向，看看最优顶点如何切换。",
      question: "为什么 t 越大，中心点越接近边界？3/t 在这里衡量什么？",
      controls: [range("logt", "障碍参数 t（对数调节）", -1, 3, 0.04, 1, { log: true }), range("angle", "目标法向角 θ（度）", -180, 180, 1, -115)],
      animate: "logt",
    },
    {
      id: "phase",
      chapter: "06",
      title: "还没优化，先判断有没有可行点",
      short: "Phase I 可行性问题",
      ref: book("§11.4.1", 579),
      source: "教材模型 · 三约束特例",
      intro: "改变原问题右端 b，再压低公共松弛 s。观察放松后的三角形何时缩成一点、何时消失。",
      question: "s*<0、s*=0 与 s*>0，分别说明原问题什么性质？",
      controls: [range("b", "原问题右端 b", -1.2, 2, 0.05, 1), range("slack", "公共松弛 s", -0.8, 1.2, 0.025, 0.2)],
      animate: "slack",
    },
    {
      id: "likelihood",
      chapter: "07",
      title: "观测与先验，怎样决定概率估计？",
      short: "最大似然与 MAP",
      ref: book("§7.1.1–7.1.2", 351),
      source: "教材理论 · Bernoulli 教学特例",
      intro: "改变样本量、成功比例与对称 Beta 先验。拖动概率 p，读取负对数似然，并比较 ML 与 MAP。",
      question: "全部观测都失败时，ML 会怎样？先验如何改变边界解？",
      controls: [
        range("n", "样本量 n", 5, 100, 1, 20),
        range("rate", "观测成功比例", 0, 1, 0.01, 0.65),
        range("prior", "先验参数 a（对称 Beta）", 1, 6, 0.1, 1),
        range("trial", "待评估概率 p", 0, 1, 0.01, 0.4),
      ],
      animate: "trial",
    },
    {
      id: "design",
      chapter: "07",
      title: "把观测预算分配到哪里？",
      short: "D-optimal 实验设计",
      ref: book("§7.5.1，式 (7.26)", 387),
      source: "教材模型 · 三个候选点",
      intro: "在 t=−1、0、1 三个观测位置间分配权重。观察信息矩阵与参数空间中单位信息椭圆的面积。",
      question: "为什么只在一个位置观测，无法同时识别直线的截距和斜率？",
      controls: [
        range("edge", "分给两端的总权重", 0, 1, 0.01, 0.75),
        range("balance", "端点预算中的左端比例", 0, 1, 0.01, 0.5),
        range("n", "总观测预算 n", 1, 40, 1, 8),
      ],
      animate: "edge",
    },
    {
      id: "projection",
      chapter: "08",
      title: "从投影点，找到一条分离直线",
      short: "投影与分离超平面",
      ref: book("§8.1.1–8.1.2", 398),
      source: "教材模型 · 二维改编",
      intro: "拖动点 y，切换闭凸集合的形状。观察最近点 x*，以及法向为 y−x* 的支撑直线。",
      question: "把 y 拖到集合内部后，投影和分离直线分别会发生什么？",
      controls: [
        select("shape", "闭凸集合", ["ellipse|椭圆", "box|矩形", "circle|圆盘"], "ellipse"),
        range("a", "第一半轴 a", 0.5, 2.2, 0.05, 1.8),
        range("b", "第二半轴 b", 0.4, 1.8, 0.05, 0.9),
        range("angle", "旋转角 θ（度）", -90, 90, 1, 25),
      ],
      points: [point("px", "py", "y", 2.5, 1.8)],
      animate: "angle",
    },
    {
      id: "chebyshev",
      chapter: "08",
      title: "在多面体里，放入最大的圆",
      short: "Chebyshev 中心",
      ref: book("§8.5.1，Figure 8.5", 417),
      source: "教材模型 · 五个半空间",
      intro: "旋转并移动一条切割约束，观察可行域、最大内切圆与圆心的变化。",
      question: "为什么“圆完全在半空间内”能够写成一个线性不等式？",
      controls: [range("angle", "切割法向角 θ（度）", -90, 90, 1, 35), range("cut", "切割约束右端 b", -2.5, 2.5, 0.05, 0.7)],
      animate: "cut",
    },
    {
      id: "momentum",
      chapter: "S",
      title: "动量与前瞻梯度改变了什么？",
      short: "Heavy-ball 与 Nesterov",
      ref: supplement(17),
      source: "课程补充 · 非 Boyd 原书例子",
      intro: "让 GD、Heavy-ball 和 Nesterov 从同一点出发。改变动量系数，逐步观察过冲和收敛。",
      question: "同样的步长与动量，为什么两种加速方法会走出不同轨迹？",
      controls: [
        range("kappa", "条件数 κ", 2, 200, 1, 60),
        range("gain", "共同步长 αL", 0.4, 1.8, 0.05, 1),
        range("beta", "共同动量 β", 0, 0.99, 0.01, 0.75),
        range("k", "迭代步 k", 0, 64, 1, 24),
        select("view", "查看", ["path|迭代轨迹", "error|收敛曲线"], "path"),
      ],
      animate: "k",
      algorithm: true,
    },
    {
      id: "silver",
      chapter: "S",
      title: "长短步交替，怎样积累净进展？",
      short: "Silver 步长节奏",
      ref: supplement(46),
      source: "课程补充 · Altschuler–Parrilo",
      intro: "点击或拖动迭代进度，观察 Silver 的长步与随后的误差变化，再与固定步长 GD 对比。",
      question: "为什么要看完整的 2ᵐ−1 步块，而不是要求每一步都下降？",
      controls: [
        range("kappa", "条件数 κ", 2, 200, 1, 80),
        range("gain", "Silver 步长倍率", 0.5, 1.3, 0.025, 1),
        range("k", "迭代步 k", 0, 127, 1, 31),
        select("view", "查看", ["steps|步长节奏", "error|收敛曲线", "path|迭代轨迹"], "steps"),
      ],
      animate: "k",
      algorithm: true,
    },
  ];
  defs.push(...More.defs);
  defs.splice(
    defs.findIndex((d) => d.chapter === "03"),
    0,
    Nonquadratic.def
  );
  for (const d of Spine.defs) defs.splice(defs.findIndex((v) => v.chapter === d.chapter) + (d.chapter === "03" ? 1 : 0), 0, d);
  defs.forEach((d) => {
    d.pointBounds = d.pointBounds || (d.id === "norms" ? [-1.6, 1.6, -1.3, 1.3] : [-3.5, 3.5, -2.3, 2.3]);
    d.defaults = Object.fromEntries(d.controls.map((p) => [p.key, p.value]));
    for (const p of d.points || []) {
      d.defaults[p.kx] = p.x;
      d.defaults[p.ky] = p.y;
    }
  });
  function normalize(id, input = {}) {
    const d = defs.find((d) => d.id === id),
      s = { ...d.defaults };
    for (const p of d.controls) {
      if (p.type === "checkbox") {
        if (typeof input[p.key] === "boolean") s[p.key] = input[p.key];
      } else if (p.type === "select") {
        if (p.options.some((o) => o.split("|")[0] === input[p.key])) s[p.key] = input[p.key];
      } else if (Number.isFinite(Number(input[p.key])) && input[p.key] !== null && input[p.key] !== "")
        s[p.key] = C.clamp(Number(input[p.key]), p.min, p.max);
    }
    for (const p of d.points || [])
      for (const [key, lo, hi] of [
        [p.kx, d.pointBounds[0], d.pointBounds[1]],
        [p.ky, d.pointBounds[2], d.pointBounds[3]],
      ])
        if (Number.isFinite(Number(input[key]))) s[key] = C.clamp(Number(input[key]), lo, hi);
    for (const key of ["k", "n"]) if (key in s && (id !== "contact" || key !== "k")) s[key] = Math.round(s[key]);
    if (id === "jensen" && s.fun === "log") {
      s.a = Math.max(0.1, s.a);
      s.b = Math.max(0.1, s.b);
    }
    if (id === "nonquadratic" && !Nonquadratic.methods.some((m) => s["show_" + m.id])) s.show_gd = true;
    if (Spine.ids.has(id)) return Spine.normalize(id, s);
    return s;
  }
  const colors = { blue: "#357bc4", purple: "#9461cb", red: "#d4546c", green: "#1a9b87", orange: "#dc9038", gray: "#7c8794" };
  class Plot {
    static frameLocks = new Map();
    static freezeFrames(svgs) {
      const previous = Plot.frameLocks,
        locked = new Map(previous);
      for (const svg of svgs) {
        const id = svg.dataset.plotId,
          b = svg.dataset.bounds?.split(",").map(Number);
        if (id && b?.length === 4 && b.every(Number.isFinite)) locked.set(id, b);
      }
      Plot.frameLocks = locked;
      return () => {
        Plot.frameLocks = previous;
      };
    }
    // Fit mathematical content with a modest margin. Equal coordinate units are
    // still enforced by the constructor, so a circle cannot become an ellipse.
    static fitBounds(points, { padding = 0.1, minSpan = 0.5, center, aspect } = {}) {
      const finite = points.filter((p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]));
      const pad = Array.isArray(padding) ? padding : [padding, padding],
        minimum = Array.isArray(minSpan) ? minSpan : [minSpan, minSpan];
      const lows = [0, 1].map((i) => (finite.length ? Math.min(...finite.map((p) => p[i])) : -0.5));
      const highs = [0, 1].map((i) => (finite.length ? Math.max(...finite.map((p) => p[i])) : 0.5));
      const c = [0, 1].map((i) => (Number.isFinite(center?.[i]) ? center[i] : (lows[i] + highs[i]) / 2));
      const spans = [0, 1].map(
        (i) =>
          Math.max(Number.isFinite(minimum[i]) && minimum[i] > 0 ? minimum[i] : 0.5, 2 * Math.max(highs[i] - c[i], c[i] - lows[i])) *
          (1 + 2 * Math.max(0, pad[i] || 0))
      );
      if (Number.isFinite(aspect) && aspect > 0) {
        if (spans[0] / spans[1] < aspect) spans[0] = spans[1] * aspect;
        else spans[1] = spans[0] / aspect;
      }
      return [c[0] - spans[0] / 2, c[0] + spans[0] / 2, c[1] - spans[1] / 2, c[1] + spans[1] / 2];
    }
    // Two opposite corners of the exact bounding box, also valid after rotation.
    static ellipseBox(center, axes, angle = 0) {
      const t = (angle * Math.PI) / 180,
        hx = Math.hypot(axes[0] * Math.cos(t), axes[1] * Math.sin(t)),
        hy = Math.hypot(axes[0] * Math.sin(t), axes[1] * Math.cos(t));
      return [
        [center[0] - hx, center[1] - hy],
        [center[0] + hx, center[1] + hy],
      ];
    }
    constructor(id, bounds = [-3.8, 3.8, -2.5, 2.5], equal = true, xlabel = "x₁", ylabel = "x₂", layout = {}) {
      this.id = id;
      this.box = { l: 48, t: 24, w: 570, h: Number.isFinite(layout.height) && layout.height > 0 ? layout.height : 290 };
      let [xmin, xmax, ymin, ymax] = bounds;
      if (equal) {
        const scale = Math.min(this.box.w / (xmax - xmin), this.box.h / (ymax - ymin)),
          cx = (xmin + xmax) / 2,
          cy = (ymin + ymax) / 2;
        xmin = cx - this.box.w / scale / 2;
        xmax = cx + this.box.w / scale / 2;
        ymin = cy - this.box.h / scale / 2;
        ymax = cy + this.box.h / scale / 2;
      }
      this.bounds = Plot.frameLocks.get(id)?.slice() || [xmin, xmax, ymin, ymax];
      this.equal = equal;
      this.content = [];
      this.labels = [];
      this.xlabel = xlabel;
      this.ylabel = ylabel;
    }
    pos([x, y]) {
      const [a, b, c, d] = this.bounds,
        z = this.box;
      return [z.l + ((x - a) / (b - a)) * z.w, z.t + ((d - y) / (d - c)) * z.h];
    }
    path(points, color = colors.blue, width = 2, dash = "", fill = "none", opacity = 1) {
      let parts = [],
        part = [];
      for (const p of points) {
        if (p.every(Number.isFinite))
          part.push(
            this.pos(p)
              .map((v) => v.toFixed(3))
              .join(",")
          );
        else {
          if (part.length) parts.push(part);
          part = [];
        }
      }
      if (part.length) parts.push(part);
      parts.forEach((points) =>
        this.content.push(
          `<polyline points="${points.join(" ")}" fill="${fill}" stroke="${color}" stroke-width="${width}"${
            dash ? ` stroke-dasharray="${dash}"` : ""
          } opacity="${opacity}" stroke-linecap="round" stroke-linejoin="round"/>`
        )
      );
    }
    polygon(points, color = colors.blue, opacity = 0.13) {
      if (points.length) this.path([...points, points[0]], color, 1.6, "", color, opacity);
    }
    dot(point, label, color = colors.red, drag = null) {
      const [x, y] = this.pos(point);
      if (!Number.isFinite(x + y)) return;
      this.content.push(
        `<circle cx="${x}" cy="${y}" r="${drag ? 7 : 4.5}" fill="${color}" stroke="var(--demo-bg,#fff)" stroke-width="2" ${
          drag
            ? `data-drag="${drag}" tabindex="0" role="button" aria-roledescription="可拖动的点" aria-label="${label}，坐标 ${fmt(point[0])}, ${fmt(
                point[1]
              )}；方向键移动"`
            : ""
        }/>`
      );
      if (label) this.label(point, label, color, 10, -10);
    }
    label(p, label, color = "var(--demo-muted,#687680)", dx = 0, dy = 0) {
      const [x, y] = this.pos(p);
      this.labels.push(
        `<text x="${C.clamp(x + dx, 50, 602)}" y="${C.clamp(y + dy, 20, this.box.t + this.box.h - 7)}" fill="${color}" font-size="12">${esc(
          label
        )}</text>`
      );
    }
    ellipse(center, axes, angle, color = colors.blue, fill = false) {
      const pts = Array.from({ length: 161 }, (_, i) =>
        C.add(center, C.rotate([axes[0] * Math.cos((i / 160) * 2 * Math.PI), axes[1] * Math.sin((i / 160) * 2 * Math.PI)], angle))
      );
      fill ? this.polygon(pts, color, 0.15) : this.path(pts, color, 1.2);
    }
    line(a, b, color = colors.gray, dash = "5 4") {
      const [xmin, xmax, ymin, ymax] = this.bounds,
        pts = [];
      if (Math.abs(a[1]) > 1e-12)
        for (const x of [xmin, xmax]) {
          const y = (b - a[0] * x) / a[1];
          if (y >= ymin - 1e-8 && y <= ymax + 1e-8) pts.push([x, y]);
        }
      if (Math.abs(a[0]) > 1e-12)
        for (const y of [ymin, ymax]) {
          const x = (b - a[1] * y) / a[0];
          if (x >= xmin - 1e-8 && x <= xmax + 1e-8) pts.push([x, y]);
        }
      if (pts.length >= 2) this.path([pts[0], pts.at(-1)], color, 1.5, dash);
    }
    curve(f, from, to, color = colors.blue, dash = "") {
      this.path(
        Array.from({ length: 241 }, (_, i) => {
          const x = from + ((to - from) * i) / 240;
          return [x, f(x)];
        }),
        color,
        2,
        dash
      );
    }
    finish(title) {
      const b = this.box,
        height = b.t + b.h + 36,
        [xmin, xmax, ymin, ymax] = this.bounds;
      let axes = "";
      for (let i = 0; i <= 4; i++) {
        const x = xmin + ((xmax - xmin) * i) / 4,
          y = ymin + ((ymax - ymin) * i) / 4,
          [px] = this.pos([x, 0]),
          [, py] = this.pos([0, y]);
        axes += `<path d="M${px} ${b.t}V${b.t + b.h}M${b.l} ${py}H${b.l + b.w}" class="demo-grid"/><text x="${px}" y="${
          b.t + b.h + 19
        }" text-anchor="middle">${fmt(x, 2)}</text><text x="${b.l - 8}" y="${py + 4}" text-anchor="end">${fmt(y, 2)}</text>`;
      }
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 ${height}" role="${
        this.content.some((s) => s.includes("data-drag")) ? "group" : "img"
      }" aria-labelledby="${this.id}-plot-title" data-plot-id="${esc(this.id)}" data-equal-units="${this.equal}" data-bounds="${this.bounds.join(
        ","
      )}" data-box="${[b.l, b.t, b.w, b.h].join(",")}"><title id="${this.id}-plot-title">${esc(title)}</title><defs><clipPath id="${
        this.id
      }-clip"><rect x="${b.l}" y="${b.t}" width="${b.w}" height="${b.h}"/></clipPath></defs><g class="demo-axes">${axes}<text x="${b.l + b.w}" y="${
        height - 3
      }" text-anchor="end">${esc(this.xlabel)}</text><text x="${b.l}" y="13">${esc(this.ylabel)}</text></g><g clip-path="url(#${
        this.id
      }-clip)">${this.content.join("")}</g><g>${this.labels.join("")}</g></svg>`;
    }
  }
  const metric = (label, value) => ({ label, value: typeof value === "number" ? fmt(value) : value });
  const errorValue = (r) => Math.log10(Math.max(1e-16, r));
  function algo(id, s) {
    const settings = {
      kappa: s.kappa,
      steps: id === "silver" ? 127 : id === "momentum" ? 64 : 40,
      stopAtTol: false,
      angle: 32,
      gdScale: s.gain,
      newtonMode: "full",
    };
    let methodIds = ["gd", "newton"];
    if (id === "momentum") {
      Object.assign(settings, {
        hbAuto: false,
        hbBeta: s.beta,
        nagAuto: false,
        nagBeta: s.beta,
        nagScale: s.gain,
        hbScale: (s.gain * (Math.sqrt(s.kappa) + 1) ** 2) / (4 * s.kappa),
      });
      methodIds = ["gd", "hb", "nag"];
    }
    if (id === "silver") {
      Object.assign(settings, { gdScale: 1, silverScale: s.gain });
      methodIds = ["gd", "nag", "silver"];
    }
    const config = E.normalize({ ...settings, enabled: methodIds }),
      problem = E.makeProblem(config),
      runs = methodIds.map((id) => ({ ...E.run(problem, config, id), ...E.METHODS.find((m) => m.id === id) }));
    if (id === "descent") {
      const exact = E.normalize({ ...config, gdMode: "exact" });
      runs.splice(1, 0, { ...E.run(problem, exact, "gd"), id: "exact", name: "GD 精确线搜索", short: "GD exact", color: colors.orange });
    }
    return { config, problem, runs };
  }
  function render(id, input) {
    const d = defs.find((d) => d.id === id),
      s = normalize(id, input);
    let g = new Plot(id),
      metrics = [],
      legend = [],
      notice = "",
      data;
    if (Spine.ids.has(id)) return Spine.render(id, s, { Plot, colors, fmt });
    if (id === "nonquadratic") return Nonquadratic.render(s, { Plot, colors, fmt });
    if (More.ids.has(id)) return More.render(id, s, { Plot, colors, fmt });
    if (id === "quadratic") {
      data = C.quadratic(s);
      const end = C.add(data.x, C.scale(data.g, 1 / Math.max(1, C.norm(data.g)))),
        axisPoints = [C.scale(data.u, -2.3), C.scale(data.u, 2.3), C.scale(data.v, -2.3), C.scale(data.v, 2.3)];
      g = new Plot(
        id,
        Plot.fitBounds([...Plot.ellipseBox([0, 0], [3, 3 / Math.sqrt(s.kappa)], s.angle), ...axisPoints, data.x, end], {
          padding: [0.09, 0.11],
          minSpan: [2.5, 2],
        })
      );
      for (const r of [0.5, 1, 1.5, 2, 3]) g.ellipse([0, 0], [r, r / Math.sqrt(s.kappa)], s.angle, "var(--demo-line,#9ca9b4)");
      g.path([C.scale(data.u, -2.3), C.scale(data.u, 2.3)], colors.blue, 1.4, "5 4");
      g.path([C.scale(data.v, -2.3), C.scale(data.v, 2.3)], colors.green, 1.4, "5 4");
      g.ellipse([0, 0], [1, 1 / Math.sqrt(s.kappa)], s.angle, colors.purple, true);
      g.dot(data.x, "x", colors.red, "px,py");
      g.path([data.x, end], colors.orange, 2);
      g.dot(end, "∇f 方向", colors.orange);
      metrics = [metric("f(x)", data.value), metric("‖∇f(x)‖₂", C.norm(data.g)), metric("半轴长度", `1，${fmt(1 / Math.sqrt(s.kappa))}`)];
      notice = "梯度箭头只表示方向，长度已缩放。主椭圆为 f(x)=1/2。";
    } else if (id === "norms") {
      data = C.normBall(s);
      let pts =
        data.p === "inf"
          ? [
              [-1, -1],
              [1, -1],
              [1, 1],
              [-1, 1],
            ]
          : Array.from({ length: 161 }, (_, i) => {
              const t = (i / 160) * Math.PI * 2;
              return [Math.sign(Math.cos(t)) * Math.abs(Math.cos(t)) ** (2 / data.p), Math.sign(Math.sin(t)) * Math.abs(Math.sin(t)) ** (2 / data.p)];
            });
      g = new Plot(
        id,
        Plot.fitBounds([...pts, ...Plot.ellipseBox([0, 0], [1, 1]), data.x, [0, 0]], { padding: 0.1, minSpan: [2.2, 2.2], center: [0, 0] })
      );
      g.polygon(pts, colors.purple, 0.17);
      g.ellipse([0, 0], [1, 1], 0, colors.gray);
      g.path([[0, 0], data.x], colors.orange);
      g.dot(data.x, "x", colors.red, "px,py");
      metrics = [metric("‖x‖p", data.value), metric("属于单位球", data.value <= 1 + 1e-10 ? "是" : "否"), metric("对偶范数指数 q", data.dual)];
      notice = "灰色圆是欧氏单位圆，作为固定参照；p=∞ 时为正方形。";
    } else if (id === "segments") {
      data = C.convexSet(s);
      const setPoints =
        s.shape === "disk"
          ? Plot.ellipseBox([0, 0], [2, 2])
          : s.shape === "box"
            ? [
                [-2, -1.4],
                [2, -1.4],
                [2, 1.4],
                [-2, 1.4],
              ]
            : [
                [-2, -1.5],
                [2, -1.5],
                [2, -0.7],
                [0.25, -0.7],
                [0.25, 0.7],
                [2, 0.7],
                [2, 1.5],
                [-2, 1.5],
              ];
      g = new Plot(id, Plot.fitBounds([...setPoints, data.a, data.b, data.mix], { padding: 0.1, minSpan: [4.4, 3.3] }));
      if (s.shape === "disk") g.ellipse([0, 0], [2, 2], 0, colors.blue, true);
      else g.polygon(setPoints, colors.blue, 0.18);
      for (let i = 0; i < 100; i++) {
        const a = C.add(C.scale(data.a, 1 - i / 100), data.b, i / 100),
          b = C.add(C.scale(data.a, 1 - (i + 1) / 100), data.b, (i + 1) / 100);
        g.path([a, b], data.inside(C.scale(C.add(a, b), 0.5)) ? colors.green : colors.red, 3);
      }
      g.dot(data.a, "A", colors.blue, "ax,ay");
      g.dot(data.b, "B", colors.purple, "bx,by");
      g.dot(data.mix, "z(t)", colors.orange);
      metrics = [
        metric("端点都在集合内", data.endpointsInside ? "是" : "否"),
        metric("z(t) 在集合内", data.inside(data.mix) ? "是" : "否"),
        metric("当前 t", s.t),
      ];
      notice = !data.endpointsInside
        ? "端点不都在集合内：这组点不能用于检验凸集定义。"
        : data.violations.length || !data.inside(data.mix)
          ? "线段已有点越出集合，构成非凸性的反例。"
          : "当前采样点均在集合内；有限次试验不能证明任意集合全局凸。";
    } else if (id === "jensen") {
      data = C.jensen(s);
      const lo = s.fun === "log" ? Math.max(0.04, Math.min(s.a, s.b) - 0.3) : Math.min(s.a, s.b) - 0.3,
        hi = Math.max(s.a, s.b) + 0.3,
        values = Array.from({ length: 101 }, (_, i) => data.f(lo + ((hi - lo) * i) / 100));
      const min = Math.min(...values, data.value, data.chord),
        max = Math.max(...values, data.value, data.chord);
      g = new Plot(id, [lo, hi, min - 0.12 * (max - min), max + 0.12 * (max - min)], false, "x", "f(x)");
      g.curve(data.f, lo, hi, colors.blue);
      g.path(
        [
          [s.a, data.f(s.a)],
          [s.b, data.f(s.b)],
        ],
        colors.orange,
        2
      );
      g.path(
        [
          [data.x, data.value],
          [data.x, data.chord],
        ],
        colors.red,
        2,
        "4 3"
      );
      g.dot([s.a, data.f(s.a)], "a", colors.blue);
      g.dot([s.b, data.f(s.b)], "b", colors.blue);
      g.dot([data.x, data.value], "f(z)", colors.purple);
      g.dot([data.x, data.chord], "弦上值", colors.orange);
      metrics = [
        metric("z=(1−t)a+tb", data.x),
        metric("弦上值 − f(z)", data.gap),
        metric("这组点的凸性不等式", data.gap >= -1e-9 ? "满足" : "不满足"),
      ];
      notice = "蓝色为函数，橙色为弦；差值的正负只反映当前端点和比例。";
    } else if (id === "robust") {
      data = C.robustFit(s);
      const ys = data.points.map((p) => p[1]);
      g = new Plot(id, [-2.5, 2.5, Math.min(-2, ...ys) - 0.5, Math.max(3, ...ys) + 0.5], false, "观测位置 t", "观测值 y");
      data.points.forEach((p, i) => g.dot(p, i === 9 ? "异常点" : "", i === 9 ? colors.red : colors.gray));
      [
        ["ls", "L₂", colors.blue],
        ["l1", "L₁", colors.green],
        ["huber", "Huber", colors.purple],
      ].forEach(([key, name, color]) => {
        g.path(
          [
            [-2.5, -2.5 * data[key][0] + data[key][1]],
            [2.5, 2.5 * data[key][0] + data[key][1]],
          ],
          color,
          2.3
        );
        legend.push([name, color]);
        metrics.push(metric(`${name} (斜率,截距)`, data[key].map((v) => fmt(v)).join(", ")));
      });
      notice = "所有直线都重新求解；Huber 使用 IRLS，当前梯度残差 " + fmt(data.residual) + "。";
    } else if (id === "ridge") {
      data = C.ridge({ ...s, lambda: 10 ** s.loglambda });
      g = new Plot(id, Plot.fitBounds([...data.path, data.at(0), data.truth, data.x], { padding: 0.12, minSpan: [1.4, 1.4] }));
      g.path(data.path, colors.purple, 2);
      g.dot(data.at(0), "λ=0", colors.orange);
      g.dot(data.truth, "真值", colors.green);
      g.dot(data.x, "当前 xλ", colors.red);
      metrics = [metric("‖Axλ−b‖₂²", data.residual), metric("‖xλ‖₂²", data.penalty), metric("到真值的距离", C.norm(C.add(data.x, data.truth, -1)))];
      notice = "曲线是 λ 从 10⁻⁵ 到 10 的解路径；正则化引入偏差，不能保证每个 λ 都更接近真值。";
    } else if (d.algorithm) {
      data = algo(id, s);
      const current = (run) => run.path[Math.min(s.k, run.path.length - 1)];
      if (id === "silver" && s.view === "steps") {
        const count = Math.max(7, s.k),
          vals = Array.from({ length: count }, (_, i) => s.gain * E.silverMultiplier(i));
        g = new Plot(id, [0, count + 1, 0, Math.max(...vals) * 1.12], false, "步编号 k+1", "αₖ L");
        vals.forEach((v, i) =>
          g.path(
            [
              [i + 1, 0],
              [i + 1, v],
            ],
            i + 1 === s.k ? colors.orange : colors.purple,
            Math.max(1, Math.min(9, 400 / count))
          )
        );
        notice = "橙色为当前步；大步出现在编号含较多因子 2 的位置。";
      } else if (s.view === "error") {
        const errorPoints = data.runs.flatMap((run) =>
            run.path.map((r) => [r.k, errorValue(r.f / run.path[0].f)]).filter((p) => p.every(Number.isFinite))
          ),
          ys = errorPoints.map((p) => p[1]),
          xmax = Math.max(4, ...errorPoints.map((p) => p[0])) * 1.04,
          ymin = Math.max(-16, Math.min(-2, Math.floor(Math.min(...ys) - 0.25))),
          ymax = Math.max(0.5, Math.ceil(Math.max(...ys) + 0.25));
        g = new Plot(id, [0, xmax, ymin, ymax], false, "迭代次数 k", "log₁₀ 相对目标差");
        data.runs.forEach((run) =>
          g.path(
            run.path.slice(0, s.k + 1).map((r) => [r.k, errorValue(r.f / run.path[0].f)]),
            run.color,
            2
          )
        );
        notice = "视窗由各方法的完整有限误差序列共同确定；仅绘制到当前迭代。≤10⁻¹⁶ 的相对目标差画在底线。";
      } else {
        const pathPoints = data.runs.flatMap((run) => run.path.map((r) => r.x).filter((p) => p.every(Number.isFinite)));
        g = new Plot(id, Plot.fitBounds([...pathPoints, data.config.x0, [0, 0]], { padding: 0.12, minSpan: [2, 2] }));
        for (const r of [1, 2, 3, 4.5, 7, 10, 16]) g.ellipse([0, 0], [r, r / Math.sqrt(s.kappa)], 32, "var(--demo-line,#a3adb5)");
        data.runs.forEach((run) => {
          g.path(
            run.path.slice(0, s.k + 1).map((r) => r.x),
            run.color,
            2
          );
          g.dot(current(run).x, "", run.color);
        });
        g.dot(data.config.x0, "x₀", colors.gray);
        g.dot([0, 0], "x*", colors.green);
        notice = "视窗由各方法的完整有限轨迹共同确定，不随当前迭代步跳动；发散/溢出的后续点不会投影回图框。";
      }
      data.runs.forEach((run) => {
        legend.push([run.short || run.name, run.color]);
        const r = current(run);
        metrics.push(metric(`${run.short || run.name} 相对目标差`, r.f / run.path[0].f));
        if (run.path.length <= s.k && ["diverged", "stalled"].includes(run.status))
          notice += ` ${run.name} 在第 ${run.path.length - 1} 步后${run.status === "diverged" ? "发散/溢出" : "搜索停滞"}。`;
      });
    } else if (id === "newton") {
      data = { full: C.scalarNewton(s.x0, false), damped: C.scalarNewton(s.x0, true) };
      const newtonErrors = Object.values(data).flatMap((path) =>
          path.map((v, k) => [k, errorValue(v.f / (path[0].f || 1))]).filter((p) => p.every(Number.isFinite))
        ),
        newtonY = newtonErrors.map((p) => p[1]),
        newtonXmax = Math.max(4, ...newtonErrors.map((p) => p[0])) * 1.04,
        newtonYmin = Math.max(-16, Math.min(-2, Math.floor(Math.min(...newtonY) - 0.25))),
        newtonYmax = Math.max(0.5, Math.ceil(Math.max(...newtonY) + 0.25));
      g = new Plot(id, [0, newtonXmax, newtonYmin, newtonYmax], false, "迭代次数 k", "log₁₀ 相对目标差");
      [
        ["full", "全步", colors.red],
        ["damped", "Armijo", colors.green],
      ].forEach(([key, name, color]) => {
        const path = data[key],
          cur = path[Math.min(s.k, path.length - 1)];
        g.path(
          path.slice(0, s.k + 1).map((r, k) => [k, errorValue(r.f / (path[0].f || 1))]),
          color,
          2.5
        );
        metrics.push(metric(`${name} 当前 x`, cur.x));
        legend.push([name, color]);
      });
      metrics.push(metric("阻尼步长 α", data.damped[Math.min(s.k, data.damped.length - 1)].alpha));
      notice = "目标值最小为 0；≤10⁻¹⁶ 的相对目标差画在底线。起点为 0 时已经最优。";
    } else if (id === "affine") {
      data = C.affineProjection(s);
      g = new Plot(id, Plot.fitBounds([...Plot.ellipseBox(data.c, [3, 3]), data.c, data.x], { padding: 0.08, minSpan: [2, 2] }));
      for (const r of [0.5, 1, 1.5, 2, 3]) g.ellipse(data.c, [r, r], 0, "var(--demo-line,#a3adb5)");
      g.line(data.a, s.offset, colors.blue, "");
      g.path([data.c, data.x], colors.orange, 2, "4 3");
      g.dot(data.c, "c", colors.red, "px,py");
      g.dot(data.x, "x*", colors.green);
      metrics = [metric("最优值", data.value), metric("λ*", data.lambda), metric("等式残差", Math.abs(data.residual))];
      notice = "圆心为 c；最小的接触圆在约束直线处相切。";
    } else if (id === "infeasible") {
      data = C.equalityNewton(s);
      const cur = data.path[Math.min(s.k, data.path.length - 1)];
      if (s.view === "error") {
        const residualPoints = data.path.flatMap((r, k) => [
            [k, Math.log10(Math.max(1e-13, r.residual))],
            [k, Math.log10(Math.max(1e-13, r.primal))],
          ]),
          residualY = residualPoints.map((p) => p[1]),
          residualXmax = Math.max(4, data.path.length - 1) * 1.04,
          residualYmin = Math.max(-13, Math.min(-2, Math.floor(Math.min(...residualY) - 0.25))),
          residualYmax = Math.max(0.5, Math.ceil(Math.max(...residualY) + 0.25));
        g = new Plot(id, [0, residualXmax, residualYmin, residualYmax], false, "迭代次数 k", "log₁₀ 残差范数");
        g.path(
          data.path.slice(0, s.k + 1).map((r, k) => [k, Math.log10(Math.max(1e-13, r.residual))]),
          colors.purple,
          2
        );
        g.path(
          data.path.slice(0, s.k + 1).map((r, k) => [k, Math.log10(Math.max(1e-13, r.primal))]),
          colors.orange,
          2,
          "5 3"
        );
        legend = [
          ["KKT 总残差", colors.purple],
          ["等式残差", colors.orange],
        ];
      } else {
        g = new Plot(id, Plot.fitBounds([...data.path.map((r) => r.x), data.optimum], { padding: 0.14, minSpan: [2.5, 2.5] }));
        for (const level of [1, 2, 4, 8, 16])
          g.curve((x) => (Math.exp(x) < level ? Math.log(level - Math.exp(x)) : NaN), g.bounds[0], g.bounds[1], "var(--demo-line,#a3adb5)");
        g.line([1, 1], s.b, colors.blue, "");
        g.path(
          data.path.slice(0, s.k + 1).map((r) => r.x),
          colors.purple,
          2.3
        );
        g.dot(data.path[0].x, "x₀", colors.gray);
        g.dot(cur.x, "xₖ", colors.red);
        g.dot(data.optimum, "x*", colors.green);
      }
      metrics = [
        metric("原始残差", cur.primal),
        metric("对偶残差", Math.hypot(Math.exp(cur.x[0]) + cur.nu, Math.exp(cur.x[1]) + cur.nu)),
        metric("乘子 ν", cur.nu),
      ];
      notice = "曲线使用残差回溯；全步可一次消除仿射等式残差，阻尼步则未必。";
    } else if (id === "barrier") {
      data = C.centralPath(s);
      const simplex = [
        [0, 0],
        [1, 0],
        [0, 1],
      ];
      g = new Plot(id, Plot.fitBounds([...simplex, ...data.path, data.x, data.optimum], { padding: 0.08, minSpan: [1.1, 1.1] }));
      g.polygon(simplex, colors.blue, 0.13);
      g.path(data.path, colors.purple, 2.5);
      g.line(data.c, data.value, colors.orange);
      g.dot([1 / 3, 1 / 3], "解析中心", colors.gray);
      g.dot(data.optimum, "LP 最优顶点", colors.green);
      g.dot(data.x, "中心点 x(t)", colors.red);
      metrics = [metric("cᵀx(t)", data.value), metric("实际目标差", data.gap), metric("上界 3/t", data.bound)];
      notice = "紫线为 t∈[0.1,1000] 的中心路径；当前点始终严格位于三角形内部。";
    } else if (id === "phase") {
      data = C.phaseOne(s);
      const originalVertices = [
        [0, 0],
        [s.b, 0],
        [0, s.b],
      ];
      g = new Plot(id, Plot.fitBounds([...originalVertices, ...data.vertices, data.optimum], { padding: 0.12, minSpan: [1.5, 1.5] }));
      g.line([-1, 0], 0, colors.gray);
      g.line([0, -1], 0, colors.gray);
      g.line([1, 1], s.b, colors.gray);
      if (data.relaxed) g.polygon(data.vertices, colors.purple, 0.2);
      g.line([-1, 0], s.slack, colors.purple);
      g.line([0, -1], s.slack, colors.purple);
      g.line([1, 1], s.b + s.slack, colors.purple);
      g.dot(data.optimum, "Phase I 最优 x", colors.red);
      metrics = [
        metric("s* = −b/3", data.sstar),
        metric("原问题", s.b > 0 ? "严格可行" : s.b === 0 ? "仅边界可行" : "不可行"),
        metric("当前放松集合", data.relaxed ? "非空" : "空"),
      ];
      notice = "灰线表示原约束；紫线表示公共松弛后的约束。s<s* 时，放松后的交集也为空。";
    } else if (id === "likelihood") {
      data = C.bernoulli(s);
      const values = Array.from({ length: 99 }, (_, i) => data.mapNll((i + 1) / 100)),
        upper = Math.min(350, Math.max(10, ...values));
      g = new Plot(id, [0, 1, 0, upper], false, "成功概率 p", "负对数目标");
      g.curve(data.nll, 0, 1, colors.blue);
      g.curve(data.mapNll, 0, 1, colors.purple, "5 3");
      g.dot([data.mle, data.nll(data.mle)], "ML", colors.blue);
      g.dot([data.map, data.mapNll(data.map)], "MAP", colors.purple);
      const trial = data.nll(s.trial);
      if (Number.isFinite(trial)) g.dot([s.trial, trial], "p", colors.orange);
      g.line([1, 0], s.trial, colors.orange);
      legend = [
        ["负 log likelihood", colors.blue],
        ["加先验后的负 log posterior（差一个常数）", colors.purple],
      ];
      metrics = [
        metric("观测成功次数 k / n", `${data.k} / ${data.n}`),
        metric("ML / MAP", `${fmt(data.mle)} / ${fmt(data.map)}`),
        metric("当前 p 的负对数似然", trial),
      ];
      notice = "不相容的边界概率给出 +∞，不画成有限值。a=1 为均匀先验；全成功/全失败时允许 ML 位于边界。";
    } else if (id === "design") {
      data = C.design(s);
      const informationAxes = data.det > 1e-12 ? data.eigen.map((v) => 1 / Math.sqrt(v)) : null,
        informationBounds = informationAxes
          ? Plot.fitBounds(Plot.ellipseBox([0, 0], informationAxes, data.angle), { padding: 0.12, minSpan: [0.6, 0.6], center: [0, 0] })
          : [-1.3, 1.3, -1.3, 1.3];
      g = new Plot(id, informationBounds, true, "截距方向 z₁", "斜率方向 z₂");
      if (informationAxes) g.ellipse([0, 0], informationAxes, data.angle, colors.purple, true);
      else {
        g.line(data.M[0], 0, colors.red);
        g.label([0, 0.6], "信息矩阵奇异：红线为不可识别方向", colors.red);
      }
      metrics = [
        metric("权重 (−1,0,1)", data.weights.map((v) => fmt(v, 2)).join(" / ")),
        metric("log det M", data.det > 1e-12 ? Math.log(data.det) : "−∞（奇异）"),
        metric("单位信息椭圆面积", data.area),
      ];
      notice = "在线性高斯噪声方差为 1 的模型下解释信息矩阵。当前三个位置中，等分两个端点最大化行列式。";
    } else if (id === "projection") {
      data = C.projection(s);
      const projectionSet =
        s.shape === "box"
          ? [
              [-data.axes[0], -data.axes[1]],
              [data.axes[0], -data.axes[1]],
              [data.axes[0], data.axes[1]],
              [-data.axes[0], data.axes[1]],
            ].map((p) => C.rotate(p, s.angle))
          : Plot.ellipseBox([0, 0], data.axes, s.angle);
      g = new Plot(id, Plot.fitBounds([...projectionSet, data.y, data.x], { padding: 0.12, minSpan: [2, 2] }));
      if (s.shape === "box") g.polygon(projectionSet, colors.blue, 0.18);
      else g.ellipse([0, 0], data.axes, s.angle, colors.blue, true);
      if (data.distance > 1e-9) {
        g.line(data.normal, C.dot(data.normal, data.x), colors.green, "");
        g.path([data.y, data.x], colors.orange, 2, "4 3");
        g.dot(data.x, "投影 x*", colors.green);
      }
      g.dot(data.y, "y", colors.red, "px,py");
      metrics = [
        metric("到集合的距离", data.distance),
        metric("投影坐标", data.x.map((v) => fmt(v)).join(", ")),
        metric("是否为外部点", data.distance > 1e-9 ? "是" : "否"),
      ];
      notice = data.distance > 1e-9 ? "绿色直线支撑集合，将外部点与集合分开。" : "点在集合内，投影就是自身；此时法向为零，不构造分离直线。";
    } else if (id === "chebyshev") {
      data = C.chebyshev(s);
      const chebyshevFrame = [
          [-2, -1.5],
          [2, -1.5],
          [2, 1.5],
          [-2, 1.5],
        ],
        chebyshevPoints = [...chebyshevFrame, ...data.polygon];
      if (data.center) chebyshevPoints.push(...Plot.ellipseBox(data.center, [data.radius, data.radius]));
      g = new Plot(id, Plot.fitBounds(chebyshevPoints, { padding: 0.08, minSpan: [4.4, 3.3], center: [0, 0] }));
      g.polygon(data.polygon, colors.blue, 0.16);
      data.constraints.forEach(([a, b], i) => g.line(a, b, i === 4 ? colors.orange : colors.gray, i === 4 ? "" : "4 3"));
      if (data.center) {
        g.ellipse(data.center, [data.radius, data.radius], 0, colors.purple, true);
        g.dot(data.center, "圆心", colors.red);
      }
      metrics = [
        metric("最大半径 r*", data.radius === null ? "无可行圆" : data.radius),
        metric("圆心", data.center ? data.center.map((v) => fmt(v)).join(", ") : "—"),
        metric("可行域", !data.center ? "空" : data.radius < 1e-9 ? "退化" : "非空"),
      ];
      notice = "每个候选圆都检查全部半空间约束；退化多面体的最大半径可能为 0。";
    }
    return { state: s, svg: g.finish(d.title), metrics, legend, notice, data };
  }
  const api = { defs, normalize, render, fmt, colors, algo, Plot };
  root.ChapterExamples = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
