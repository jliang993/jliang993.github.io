/* Interactive versions of the worked examples in the dual-methods supplement. */
(function (root) {
  "use strict";
  const C = root.ChapterMath || (typeof require === "function" ? require("./chapter-math.js") : null);
  const { clamp, dot, norm } = C;
  const optimum = { x: 0.6, z: 1.4, y: 2.4 };
  const b = [0, 2, 0];
  const counts = { dualsteps: 12, lassoadmm: 32, consensusadmm: 32, dualscalar: 40, tvpdhg: 40 };
  const range = (key, label, min, max, step, value) => ({ key, label, min, max, step, value, type: "range" });
  const progress = (max, value) => range("k", String.raw`迭代步 \(k\)`, 0, max, 1, value);
  const ascentStep = range("alpha", String.raw`对偶上升步长 \(t\)`, 0.05, 1.75, 0.05, 0.4);
  const rho = range("rho", String.raw`罚参数 \(\rho\)`, 0.25, 8, 0.25, 1);
  const definition = (id, title, question, source, controls) => ({
    id,
    title,
    question,
    source,
    controls,
    animate: "k",
    hint: "迭代曲线中，实点标出当前步，浅色线显示后续迭代。",
  });
  const defs = [
    definition(
      "dualsteps",
      "对偶上升的步长与振荡",
      String.raw`依次输入 \(t=0.4,0.8,1.4,1.6,1.7\)，比较乘子误差的符号和幅度。`,
      "补充讲义 · 二次资源分配例 (E)",
      [ascentStep, range("y0", String.raw`初始乘子 \(\nu^{(0)}\)`, -1, 4, 0.1, 0), progress(counts.dualsteps, 8)]
    ),
    definition(
      "lassoadmm",
      "Lasso 的 ADMM 迭代",
      String.raw`保持 \(\lambda=\rho=1\)，查看第 2 步的可行性残差。继续迭代时，\(z^{(k)}\) 还会怎样变化？`,
      "补充讲义 · 标量 Lasso 例",
      [range("lambda", String.raw`正则化 \(\lambda\)`, 0, 8, 0.25, 1), rho, progress(counts.lassoadmm, 2)]
    ),
    definition(
      "consensusadmm",
      "三节点共识 ADMM",
      String.raw`修改第三个节点的目标 \(b_3\)，观察共识值 \(z^\star\) 与三个局部估计如何变化。`,
      "补充讲义 · 三节点加权共识例",
      [range("b3", String.raw`节点目标 \(b_3\)`, -4, 7, 0.25, 4), rho, progress(counts.consensusadmm, 3)]
    ),
    definition(
      "dualscalar",
      "同一二次例的四种算法",
      String.raw`选择「可行性残差」和「KKT 残差」比较同一步的表现。提高 \(\rho\) 时，两条曲线怎样变化？`,
      "补充讲义 · 二次资源分配例 (E)",
      [ascentStep, rho, progress(counts.dualscalar, 8)]
    ),
    definition(
      "tvpdhg",
      "逐步查看 TV 去噪",
      String.raw`从 \(k=0\) 单步前进，观察对偶投影和相邻样本的更新。调大 \(\lambda\) 时，峰值会怎样变化？`,
      "补充讲义 · 三点信号的 PDHG 例",
      [
        range("lambda", String.raw`正则化 \(\lambda\)`, 0, 1.5, 0.05, 0.5),
        range("tau", String.raw`原始步长 \(\tau\)`, 0.05, 0.5, 0.05, 0.25),
        range("sigma", String.raw`对偶步长 \(\sigma\)`, 0.05, 0.6, 0.05, 0.5),
        progress(counts.tvpdhg, 1),
      ]
    ),
  ];
  const ids = new Set(defs.map((def) => def.id));
  const logResidual = (value) => Math.log10(Math.max(1e-12, value));
  const soft = (x, threshold) => Math.sign(x) * Math.max(0, Math.abs(x) - threshold);
  const dualValue = (y) => 3.6 - 0.625 * (y - optimum.y) ** 2;
  const residual = (x, z) => x + z - 2;
  const measurements = ({ x, z, y }) => ({
    x,
    z,
    y,
    feasibility: Math.abs(residual(x, z)),
    kkt: Math.hypot(residual(x, z), x - 3 + y, 4 * (z - 2) + y),
  });

  function dualAscent({ y }, alpha) {
    const x = 3 - y,
      z = 2 - y / 4;
    return { x, z, y: y + alpha * residual(x, z) };
  }

  function multipliers({ y }, rho) {
    const nextY = (y + 3 * rho) / (1 + 1.25 * rho);
    return { x: 3 - nextY, z: 2 - nextY / 4, y: nextY };
  }

  function quadraticAdmm({ y, z }, rho) {
    const nextX = (3 - y + rho * (2 - z)) / (1 + rho);
    const nextZ = (8 - y + rho * (2 - nextX)) / (4 + rho);
    return { x: nextX, z: nextZ, y: y + rho * residual(nextX, nextZ) };
  }

  function quadraticPdhg({ x, z, y, barX, barZ }) {
    const tau = 0.25,
      sigma = 0.5;
    const nextY = y + sigma * residual(barX, barZ);
    const nextX = (x + tau * (3 - nextY)) / (1 + tau);
    const nextZ = (z + tau * (8 - nextY)) / (1 + 4 * tau);
    return { x: nextX, z: nextZ, y: nextY, barX: 2 * nextX - x, barZ: 2 * nextZ - z };
  }

  function dualSteps({ alpha, y0 }) {
    const factor = 1 - 1.25 * alpha;
    const path = Array.from({ length: counts.dualsteps + 1 }, (_, k) => {
      const error = factor ** k * (y0 - optimum.y);
      const y = optimum.y + error;
      return { y, error, value: dualValue(y) };
    });
    return { path, factor };
  }

  function lassoAdmm({ lambda, rho }) {
    const solution = Math.max(0, 6 - lambda) / 4;
    const path = [{ x: 0, z: 0, u: 0, primal: 0, dual: 0 }];
    for (let k = 0; k < counts.lassoadmm; k++) {
      const old = path[k];
      const x = (6 + rho * (old.z - old.u)) / (4 + rho);
      const z = soft(x + old.u, lambda / rho);
      const u = old.u + x - z;
      path.push({ x, z, u, primal: Math.abs(x - z), dual: rho * Math.abs(z - old.z) });
    }
    return { path, solution };
  }

  function consensusAdmm({ b3, rho }) {
    const a = [1, 2, 4],
      goals = [-1, 2, b3];
    const solution = dot(a, goals) / 7;
    const path = [{ x: [0, 0, 0], z: 0, u: [0, 0, 0], spread: 0 }];
    for (let k = 0; k < counts.consensusadmm; k++) {
      const old = path[k];
      const x = a.map((weight, i) => (weight * goals[i] + rho * (old.z - old.u[i])) / (weight + rho));
      const z = x.reduce((sum, value, i) => sum + value + old.u[i], 0) / 3;
      const u = old.u.map((value, i) => value + x[i] - z);
      path.push({ x, z, u, spread: Math.max(...x) - Math.min(...x) });
    }
    return { path, solution, goals };
  }

  function scalarComparison({ alpha, rho }) {
    const start = { x: 0, z: 0, y: 0, barX: 0, barZ: 0 };
    const methods = [
      { name: "对偶上升", color: "blue", step: (old) => dualAscent(old, alpha) },
      { name: "乘子法", color: "green", step: (old) => multipliers(old, rho) },
      { name: "ADMM", color: "red", step: (old) => quadraticAdmm(old, rho) },
      { name: "PDHG", color: "purple", step: quadraticPdhg },
    ];
    return methods.map(({ name, color, step }) => {
      let state = start;
      const path = [measurements(state)];
      for (let k = 0; k < counts.dualscalar; k++) {
        state = step(state);
        path.push(measurements(state));
      }
      return { name, color, path };
    });
  }

  const difference = (x) => [x[1] - x[0], x[2] - x[1]];
  const transpose = (y) => [-y[0], y[0] - y[1], y[1]];
  function tvPdhg({ lambda, tau, sigma }) {
    function readout(x, y) {
      const dty = transpose(y),
        dx = difference(x);
      const objective = 0.5 * norm(x.map((v, i) => v - b[i])) ** 2 + lambda * dx.reduce((sum, v) => sum + Math.abs(v), 0);
      const lowerBound = dot(dty, b) - 0.5 * norm(dty) ** 2;
      return { x, y, objective, lowerBound, gap: Math.max(0, objective - lowerBound) };
    }
    const path = [readout(b, [0, 0])];
    let extrapolated = b;
    for (let k = 0; k < counts.tvpdhg; k++) {
      const old = path[k],
        dx = difference(extrapolated);
      const y = old.y.map((v, i) => clamp(v + sigma * dx[i], -lambda, lambda));
      const dty = transpose(y);
      const x = old.x.map((v, i) => (v - tau * dty[i] + tau * b[i]) / (1 + tau));
      extrapolated = x.map((v, i) => 2 * v - old.x[i]);
      path.push(readout(x, y));
    }
    return { path, condition: 3 * tau * sigma };
  }

  function render(id, s, { Plot, colors, fmt }) {
    const metric = (label, value) => ({ label, value: fmt(value) });
    const legend = (series) => series.map(({ name, color }) => [name, color]);
    const series = (name, color, path, value, start = 0) => ({ name, color, points: path.slice(start).map((row, k) => [k + start, value(row)]) });
    const figure = (plot, title) => `<figure>${plot.finish(title)}<figcaption>${title}</figcaption></figure>`;
    function history(name, title, curves, ylabel, { reference, log = false } = {}) {
      const points = curves.flatMap(({ points }) => points);
      const extent = reference === undefined ? points : [...points, [0, reference]];
      const [, , low, high] = Plot.fitBounds(extent, { padding: 0.09, minSpan: [1, log ? 1 : 0.6] });
      const plot = new Plot(id + "-" + name, [0, counts[id], low, high], false, String.raw`\(k\)`, ylabel, { height: 240 });
      if (reference !== undefined) plot.line([0, 1], reference, colors.gray, "5 4");
      for (const { points, color } of curves) plot.path(points, color, 1.5, "", "none", 0.3);
      for (const { points, color } of curves) {
        const shown = points.filter(([k]) => k <= s.k);
        if (shown.length) {
          plot.path(shown, color, 2.2);
          plot.dot(shown.at(-1), "", color);
        }
      }
      return figure(plot, title);
    }
    if (id === "dualsteps") {
      const { path, factor } = dualSteps(s),
        now = path[s.k];
      const curves = [series(String.raw`乘子误差 \(\nu^{(k)}-\nu^\star\)`, colors.blue, path, (p) => p.error)];
      const svg = history("error", "乘子误差", curves, String.raw`\(\nu^{(k)}-\nu^\star\)`, { reference: 0 });
      const notice = String.raw`误差每步乘以 \(1-\tfrac54t\)。因子为负时误差变号，绝对值大于 \(1\) 时误差放大。`;
      return {
        state: s,
        svg,
        notice,
        data: { path, factor },
        metrics: [
          metric(String.raw`当前乘子 \(\nu^{(k)}\)`, now.y),
          metric(String.raw`误差乘数 \(1-\tfrac54t\)`, factor),
          metric(String.raw`对偶目标 \(g(\nu^{(k)})\)`, now.value),
        ],
      };
    }
    if (id === "lassoadmm") {
      const { path, solution } = lassoAdmm(s),
        now = path[s.k];
      const variables = [
        series(String.raw`数据步 \(x^{(k)}\)`, colors.blue, path, (p) => p.x),
        series(String.raw`软阈值步 \(z^{(k)}\)`, colors.green, path, (p) => p.z),
      ];
      const primalLabel = String.raw`原始残差 \(|r_{\rm pri}|\)`,
        dualLabel = String.raw`对偶残差 \(|r_{\rm dual}|\)`;
      const errors = [
        series(primalLabel, colors.blue, path, (p) => logResidual(p.primal), 1),
        series(dualLabel, colors.green, path, (p) => logResidual(p.dual), 1),
      ];
      const svg =
        history("variables", "变量轨迹", variables, String.raw`\(x^{(k)},\,z^{(k)}\)`, { reference: solution }) +
        history("residuals", "残差曲线", errors, String.raw`\(\log_{10}|\text{残差}|\)`, { log: true });
      const notice = String.raw`变量图中的虚线是解析解。软阈值步使用 \(\lambda/\rho\)，残差从第 \(1\) 步开始比较。`;
      const details = String.raw`<p>\(x^{(k+1)}=(6+\rho(z^{(k)}-u^{(k)}))/(4+\rho)\)，\(z^{(k+1)}=S_{\lambda/\rho}(x^{(k+1)}+u^{(k)})\)。</p><p>原始残差大小为 \(|r_{\rm pri}^{(k)}|=|x^{(k)}-z^{(k)}|\)，对偶残差大小为 \(|r_{\rm dual}^{(k)}|=\rho|z^{(k)}-z^{(k-1)}|\)。对数图以 \(10^{-12}\) 为显示下限。</p>`;
      const keys = [
        [variables[0].name + " · " + primalLabel, colors.blue],
        [variables[1].name + " · " + dualLabel, colors.green],
      ];
      return {
        state: s,
        svg,
        notice,
        details,
        legend: keys,
        data: { path, solution },
        metrics: [
          metric(String.raw`数据步 \(x^{(k)}\)`, now.x),
          metric(String.raw`软阈值步 \(z^{(k)}\)`, now.z),
          metric(primalLabel, now.primal),
          metric(String.raw`解析解 \(x^\star\)`, solution),
        ],
      };
    }
    if (id === "consensusadmm") {
      const { path, solution, goals } = consensusAdmm(s),
        now = path[s.k];
      const variables = [
        ...["blue", "green", "orange"].map((color, i) => series(String.raw`\(x_{${i + 1}}^{(k)}\)`, colors[color], path, (p) => p.x[i])),
        series(String.raw`\(z^{(k)}\)`, colors.purple, path, (p) => p.z),
      ];
      const svg = history("variables", "局部估计与共识", variables, String.raw`\(x_i^{(k)},\,z^{(k)}\)`, { reference: solution });
      const notice = String.raw`虚线是加权平均 \(z^\star\)。每轮先更新三个节点，再对 \(x_i^{(k+1)}+u_i^{(k)}\) 求平均。`;
      return {
        state: s,
        svg,
        notice,
        legend: legend(variables),
        data: { path, solution, goals },
        metrics: [
          metric(String.raw`当前共识 \(z^{(k)}\)`, now.z),
          metric(String.raw`局部估计跨度 \(\max_i x_i^{(k)}-\min_i x_i^{(k)}\)`, now.spread),
          metric(String.raw`最优共识 \(z^\star\)`, solution),
        ],
      };
    }
    if (id === "dualscalar") {
      const methods = scalarComparison(s);
      const lines = (value) => methods.map(({ name, color, path }) => series(name, colors[color], path, value));
      const kkt = lines((p) => logResidual(p.kkt));
      const svg =
        history("kkt", "KKT 残差", kkt, String.raw`\(\log_{10} R_{\mathrm{KKT}}\)`, { log: true }) +
        history(
          "feasible",
          "可行性残差",
          lines((p) => logResidual(p.feasibility)),
          String.raw`\(\log_{10}|r_{\rm pri}|\)`,
          { log: true }
        ) +
        history(
          "multiplier",
          "乘子误差",
          lines((p) => p.y - optimum.y),
          String.raw`\(\nu^{(k)}-\nu^\star\)`,
          { reference: 0 }
        );
      const notice = String.raw`乘子法和 ADMM 共用 \(\rho\)。PDHG 固定 \((\tau,\sigma,\theta)=(0.25,0.5,1)\)。`;
      const details = String.raw`<p>各方法从零点开始。前三种更新口径与原讲义残差图一致。\(R_{\mathrm{KKT}}\) 同时测量可行性和两条驻点条件。\(r_{\rm pri}=x+z-2\)。对数图以 \(10^{-12}\) 为显示下限。</p><p>改变 \(t\) 只改变对偶上升，改变 \(\rho\) 只改变两种增广方法。</p>`;
      const metrics = methods.map(({ name, path }) => metric(name + String.raw` \(R_{\mathrm{KKT}}\)`, path[s.k].kkt));
      return { state: s, svg, notice, details, legend: legend(kkt), data: methods, metrics };
    }

    const { path, condition } = tvPdhg(s),
      now = path[s.k];
    const observations = b.map((v, i) => [i + 1, v]),
      signal = now.x.map((v, i) => [i + 1, v]);
    const profile = new Plot("tvpdhg-profile", [0.8, 3.2, -0.2, 2.2], false, "样本位置", String.raw`\(x_i\)`, { height: 240 });
    profile.path(observations, colors.gray, 2, "6 4");
    profile.path(signal, colors.blue, 2.8);
    signal.forEach((p) => profile.dot(p, "", colors.blue));
    const gap = [series("对偶间隙", colors.orange, path, (p) => logResidual(p.gap))];
    const svg =
      figure(profile, "信号与观测") +
      history("gap", "最优性证书", gap, String.raw`\(\log_{10}(f_0(\boldsymbol{x})-g(\boldsymbol{y}))\)`, { log: true });
    const notice = String.raw`灰色虚线为观测 \(\boldsymbol{b}=(0,2,0)^\top\)。对偶更新使用投影 \(P_{C_\lambda}\)，其中 \(C_\lambda=[-\lambda,\lambda]^2\)。`;
    const details = String.raw`<p>三点差分矩阵的 \(\|D\|_2^2=3\)。当前步长满足 \(\tau\sigma\|D\|_2^2=${fmt(
      condition
    )}<1\)。</p><p>对偶可行点给出下界 \(g(\boldsymbol{y})=\boldsymbol{b}^\top D^\top\boldsymbol{y}-\tfrac12\|D^\top\boldsymbol{y}\|_2^2\)。对数图显示 \(f_0(\boldsymbol{x})-g(\boldsymbol{y})\)，下限为 \(10^{-12}\)。</p>`;
    return {
      state: s,
      svg,
      notice,
      details,
      data: { path, condition },
      metrics: [
        metric(String.raw`中间样本 \(x_2^{(k)}\)`, now.x[1]),
        { label: String.raw`对偶投影 \(\boldsymbol{y}^{(k)}\)`, value: String.raw`\((${now.y.map((v) => fmt(v)).join(",\\,")})^\top\)` },
        metric(String.raw`间隙 \(f_0(\boldsymbol{x}^{(k)})-g(\boldsymbol{y}^{(k)})\)`, now.gap),
      ],
    };
  }

  const api = { defs, ids, render };
  root.ChapterDualExperiments = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
