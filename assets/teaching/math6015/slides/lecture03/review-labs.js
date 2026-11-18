/* Interactive illustrations added in response to the lecture review. */
(function (root) {
  "use strict";
  const { Plot, colors: C, fmt } = root.ChapterExamples,
    R = root.LectureReviewModels,
    N = root.ChapterNonquadratic;
  const range = (key, label, min, max, step, value) => ({ key, label, min, max, step, value, type: "range" });
  const zoom = () => range("zoom", "图形缩放", 0.5, 6, 0.1, 1);
  const defs = {
    tangent: { controls: [range("a", "展开点 x", -2, 2, 0.05, 0.8)] },
    strongConvex: { controls: [range("a", "展开点 x", -2, 2, 0.05, 0.8)] },
    ellipsoid: {
      controls: [
        range("a1", "特征值 λ₁(A)", 0.25, 16, 0.25, 9),
        range("a2", "特征值 λ₂(A)", 0.25, 16, 0.25, 1),
        range("angle", "旋转角 θ（度）", -90, 90, 1, 0),
      ],
      animate: "angle",
    },
    precondition: {
      controls: [
        range("q", "P = diag(2,q) 中的 q", 0.25, 32, 0.25, 8),
        range("k", "迭代进度 k", 0, 80, 1, 0),
        range("alpha", "充分下降 α", 0.01, 0.45, 0.01, 0.1),
        range("beta", "缩减比例 β", 0.1, 0.9, 0.05, 0.7),
        zoom(),
        range("px", "x₀,₁", -3.5, 2.5, 0.05, -1),
        range("py", "x₀,₂", -2, 2, 0.05, 1),
        range("t0", "初始步长 t₀", 0.1, 2, 0.1, 1),
        range("logtol", "log₁₀ 停止阈值", -12, -4, 0.5, -9),
      ],
      animate: "k",
    },
    newtonTangents: { controls: [range("x0", "初始点 x⁽⁰⁾", 0.1, 2.5, 0.05, 1.1), range("k", "展示步数 k", 0, 3, 1, 3), zoom()], animate: "k" },
    affineNewton: {
      controls: [
        range("scale", "缩放因子 s", 0.25, 4, 0.05, 2),
        range("angle", "旋转角 θ（度）", -180, 180, 1, 32),
        range("k", "迭代进度 k", 0, 30, 1, 6),
      ],
      animate: "k",
    },
  };
  const metric = (label, value) => ({ label, value: typeof value === "number" ? fmt(value, 5) : value });
  const plots = (...figures) =>
    `<div class="lab-plots">${figures.map(([label, svg]) => `<figure><figcaption>${label}</figcaption>${svg}</figure>`).join("")}</div>`;
  const levels = [2.7, 3, 4, 6, 10, 20];
  function bounds(points, zoom = 1, center) {
    const b = Plot.fitBounds(points, { padding: 0.1, minSpan: [0.5, 0.5], center });
    const c = center || [(b[0] + b[1]) / 2, (b[2] + b[3]) / 2];
    return b.map((v, i) => c[i < 2 ? 0 : 1] + (v - c[i < 2 ? 0 : 1]) / zoom);
  }
  function render(id, s) {
    let svg,
      metrics = [],
      legend = [],
      notice = "",
      data,
      progressMax = 3;
    if (id === "tangent" || id === "strongConvex") {
      data = R.convexLowerBounds(s.a);
      const p = new Plot(id, [-2.25, 2.25, -3, 9], false, "z", "f(z)");
      p.curve(data.objective, -2.25, 2.25, C.blue);
      p.curve(data.tangent, -2.25, 2.25, C.orange, "6 4");
      if (id === "strongConvex") p.curve(data.strongLower, -2.25, 2.25, C.green, "4 3");
      p.dot([s.a, data.f], "x", C.red, "a");
      p.dot([0, 0], "x*", C.gray);
      svg = p.finish("拖动展开点，观察切线" + (id === "strongConvex" ? "及强凸二次下界" : ""));
      legend = [
        ["f(z)", C.blue],
        ["切线 ℓₓ(z)", C.orange],
      ];
      if (id === "strongConvex") legend.push(["强凸下界 qₓ(z)", C.green]);
      metrics = [
        metric("当前 x", s.a),
        metric("f′(x)", data.g),
        metric(id === "strongConvex" ? "全局曲率下界 m" : "f′′(x)", id === "strongConvex" ? 1 : data.H),
      ];
      notice =
        id === "strongConvex"
          ? "拖动红点或按左右方向键。绿色二次下界与切线在 x 处相切，并且始终不超过蓝色函数；这里 f″(z)=3z²+1≥1，所以 m=1。"
          : "拖动红点或按左右方向键。切线斜率随 x 改变；到 x=0 时斜率为零，恰好达到这个严格凸函数的唯一最小值。";
    } else if (id === "ellipsoid") {
      const a = Math.sqrt(s.a1),
        b = Math.sqrt(s.a2),
        theta = (s.angle * Math.PI) / 180,
        rot = ([x, y]) => [x * Math.cos(theta) - y * Math.sin(theta), x * Math.sin(theta) + y * Math.cos(theta)];
      const p = new Plot(id, Plot.fitBounds(Plot.ellipseBox([0, 0], [a, b], s.angle), { padding: 0.13, minSpan: 0.4, center: [0, 0] }), true);
      p.ellipse([0, 0], [a, b], s.angle, C.purple, true);
      p.path([rot([-a, 0]), rot([a, 0])], C.blue, 2);
      p.path([rot([0, -b]), rot([0, b])], C.green, 2);
      p.label(rot([a, 0]), "√λ₁(A)", C.blue, 8, -9);
      p.label(rot([0, b]), "√λ₂(A)", C.green, 8, -9);
      p.dot([0, 0], "x₀", C.gray);
      const high = Math.max(s.a1, s.a2),
        low = Math.min(s.a1, s.a2);
      data = { eigenvalues: [s.a1, s.a2], inverseEigenvalues: [1 / s.a1, 1 / s.a2], semiaxes: [a, b], condition: high / low };
      svg = p.finish("椭圆主轴与矩阵及其逆的特征值");
      metrics = [
        metric("长半轴 = 1/√λmin(A⁻¹)", Math.sqrt(high)),
        metric("短半轴 = 1/√λmax(A⁻¹)", Math.sqrt(low)),
        metric("κ(A) = κ(A⁻¹)", high / low),
      ];
      notice = "两条彩色轴是 A 与 A⁻¹ 共有的特征方向。长短半轴之比为 √κ(A)，cond(E)=κ(A)。坐标窗口随当前椭圆留边，绝对长度以刻度和标注为准。";
    } else if (id === "precondition") {
      data = R.preconditionedDescent({ q: s.q, start: [s.px, s.py], alpha: s.alpha, beta: s.beta, t0: s.t0, tolerance: 10 ** s.logtol });
      progressMax = data.path.length - 1;
      const shown = data.path.slice(0, s.k + 1),
        r = shown.at(-1),
        zstar = [Math.sqrt(2) * N.optimum[0], 0];
      const contours = levels.map((level) => N.contour(level).map((x) => [data.rootP[0] * x[0], data.rootP[1] * x[1]]));
      const p = new Plot("precondition-contours", bounds([...data.path.map((r) => r.z), ...contours[2]], s.zoom, zstar), true, "z₁", "z₂");
      contours.forEach((c) => p.path(c, "#b6c3c2", 1.1));
      p.path(
        shown.map((r) => r.z),
        C.purple,
        2.5
      );
      shown.forEach((r) => {
        const [x, y] = p.pos(r.z);
        p.content.push(`<circle cx="${x}" cy="${y}" r="2.1" fill="${C.purple}"/>`);
      });
      p.dot(r.z, "zᵏ", C.purple);
      p.dot(zstar, "z*", C.green);
      const floor = -24,
        e = new Plot(
          "precondition-error",
          [0, Math.max(10, progressMax), floor, Math.max(1, Math.ceil(Math.log10(data.path[0].gap || 1)))],
          false,
          "k",
          "log₁₀ (f(xᵏ) − p*)"
        );
      e.path(
        shown.map((r) => [r.k, Math.max(floor, Math.log10(Math.max(1e-30, r.gap)))]),
        C.purple,
        2.4
      );
      e.dot([r.k, Math.max(floor, Math.log10(Math.max(1e-30, r.gap)))], "", C.purple);
      svg = plots(
        ["变换后的等高线与实际迭代", p.finish("可调预条件矩阵下的坐标与迭代序列")],
        ["同一次计算的收敛曲线", e.finish("随 q 重新计算的目标误差")]
      );
      metrics = [metric("最优点处 κ(H̃)", data.transformedHessian.condition), metric("当前 f(xᵏ) − p*", r.gap), metric("实际迭代 k", r.k)];
      notice =
        "改变 q 会同时重新计算等高线、轨迹与误差。q=8 时局部条件数为 1.125；q=9 时为 1。这里比较最优点处的 Hessian，不代表全局 M/m；每一步均使用 Armijo 回溯。";
    } else if (id === "newtonTangents") {
      data = R.newtonLinearizations({ x0: s.x0 });
      const hi = (1.08 * s.x0 + 0.02) / s.zoom,
        lo = -Math.max(0.015, 0.06 * s.x0) / s.zoom,
        yhi = Math.max(0.02, (Math.exp(hi) - 1) * 1.08);
      const p = new Plot(id, [lo, hi, -0.15 * yhi, yhi], false, "z", "f′(z)");
      p.curve((z) => Math.exp(z) - 1, lo, hi, C.blue);
      p.line([0, 1], 0, C.gray, "");
      const colors = [C.orange, C.purple, C.green];
      for (const line of data.lines.slice(0, s.k)) {
        p.path(
          [
            [line.x, line.gradient],
            [line.root, 0],
          ],
          colors[line.k],
          2.3
        );
        p.path(
          [
            [line.root, 0],
            [line.root, Math.exp(line.root) - 1],
          ],
          colors[line.k],
          1.2,
          "3 3"
        );
        p.dot([line.x, line.gradient], line.k === 0 ? "x⁽⁰⁾" : "", colors[line.k]);
        p.dot([line.root, 0], "", colors[line.k]);
      }
      svg = p.finish("从初始点连续作三条 Newton 切线");
      legend = [["f′(z)", C.blue], ...colors.map((c, k) => [`第 ${k + 1} 步切线`, c])];
      metrics = data.points.slice(1).map((x, k) => metric(String.raw`\(x^{(${k + 1})}\)`, k < s.k ? x : "尚未展示"));
      notice =
        "彩色实线是 f′ 的切线；与横轴相交得到下一迭代点，竖虚线回到 f′ 曲线上继续线性化。共三步，四个迭代点；可用“单步”逐次展示，放大后观察后两步。";
    } else if (id === "affineNewton") {
      data = R.affineNewtonDemo({ scale: s.scale, theta: (s.angle * Math.PI) / 180, b: [0, 0] });
      const [a, b] = data.A[0],
        [c, d] = data.A[1],
        det = a * d - b * c,
        toY = ([x, y]) => [(d * x - b * y) / det, (-c * x + a * y) / det];
      progressMax = Math.max(data.originalPath.length, data.transformedPath.length) - 1;
      const originals = data.originalPath.slice(0, s.k + 1),
        transformed = data.transformedPath.slice(0, s.k + 1),
        mapped = data.mappedPath.slice(0, s.k + 1);
      const contour = levels.map((level) => N.contour(level)),
        p = new Plot("affine-original", bounds([...contour[2], ...data.originalPath.map((r) => r.x)]), true, "x₁", "x₂"),
        y = new Plot("affine-transformed", bounds([...contour[2].map(toY), ...data.transformedPath.map((r) => r.y)]), true, "y₁", "y₂");
      contour.forEach((c) => {
        p.path(c, "#b6c3c2", 1.1);
        y.path(c.map(toY), "#b6c3c2", 1.1);
      });
      p.path(
        originals.map((r) => r.x),
        C.green,
        4
      );
      p.path(
        mapped.map((r) => r.x),
        C.purple,
        2,
        "5 4"
      );
      y.path(
        transformed.map((r) => r.y),
        C.purple,
        2.3
      );
      p.dot(originals.at(-1).x, "xᵏ", C.green);
      y.dot(transformed.at(-1).y, "yᵏ", C.purple);
      p.dot(N.optimum, "x*", C.gray);
      y.dot(toY(N.optimum), "y*", C.gray);
      svg = plots(
        ["原坐标：两条路径重合", p.finish("原坐标 Newton 路径和映回后的路径")],
        ["新坐标：形状随 T 改变", y.finish("变换坐标中的 Newton 路径")]
      );
      legend = [
        ["直接在 x 空间迭代", C.green],
        ["在 y 空间迭代后映回", C.purple],
      ];
      metrics = [metric("缩放 s", s.scale), metric("最大路径偏差", data.maxDiscrepancy), metric("实际迭代 k", originals.at(-1).k)];
      notice =
        "T=R(θ)diag(s,1)，使用同一个式 (9.20) 目标。两边独立计算 Newton 步并使用相同 Armijo 参数；紫色虚线映回后覆盖绿色路径。偏差来自浮点舍入。";
    }
    return { state: s, svg, metrics, legend, notice, data, progressMax };
  }
  root.LectureReviewLabs = { defs, render };
})(globalThis);
