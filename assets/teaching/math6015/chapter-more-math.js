/* Small, deterministic solvers for the textbook demonstrations. */
(function (root) {
  "use strict";
  const C = root.ChapterMath || (typeof require === "function" ? require("./chapter-math.js") : null);
  const { dot, norm, add, scale, mv, solve, rotate, clamp, clipPolygon } = C;
  const seq = (a, b, n = 121) => Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1));
  const soft = (x, t) => Math.sign(x) * Math.max(0, Math.abs(x) - t);
  const lse = (v) => {
    const m = Math.max(...v);
    return m + Math.log(v.reduce((a, x) => a + Math.exp(x - m), 0));
  };
  const eig = (A) => {
    const tr = A[0][0] + A[1][1],
      d = Math.hypot(A[0][0] - A[1][1], 2 * A[0][1]);
    return { values: [(tr + d) / 2, (tr - d) / 2], angle: (Math.atan2(2 * A[0][1], A[0][0] - A[1][1]) * 90) / Math.PI };
  };
  const golden = (f, a, b) => {
    const left = a,
      right = b,
      r = (Math.sqrt(5) - 1) / 2;
    let c = b - r * (b - a),
      d = a + r * (b - a);
    for (let i = 0; i < 75; i++) {
      if (f(c) < f(d)) {
        b = d;
        d = c;
        c = b - r * (b - a);
      } else {
        a = c;
        c = d;
        d = a + r * (b - a);
      }
    }
    return [left, (a + b) / 2, right].reduce((x, y) => (f(x) < f(y) ? x : y));
  };
  const vertices = [
    [-1.8, -1.2],
    [1.5, -1.2],
    [2, 0.3],
    [0.6, 1.6],
    [-1.8, 1],
  ];
  const objectiveQ = (x, H, c = [0, 0]) => 0.5 * dot(add(x, c, -1), mv(H, add(x, c, -1)));
  const basePoints = () => seq(-2, 2, 9).map((t, i) => [t, 0.5 * t + 0.25 + 0.3 * Math.sin(i * 1.7)]);
  function iterateQuadratic(H, x0, step, n = 60) {
    let x = x0.slice();
    const path = [x.slice()];
    for (let k = 0; k < n; k++) {
      x = step(x, k, H);
      if (!x.every(Number.isFinite) || norm(x) > 1e20) break;
      path.push(x.slice());
    }
    return path;
  }
  function smoothNewton(f, grad, hess, x0, iterations = 50) {
    let x = x0.slice();
    const path = [x.slice()];
    for (let k = 0; k < iterations; k++) {
      const g = grad(x);
      if (norm(g) < 1e-10) break;
      const d = solve(hess(x), scale(g, -1));
      if (!d) break;
      let t = 1;
      for (let j = 0; j < 60 && (!Number.isFinite(f(add(x, d, t))) || f(add(x, d, t)) > f(x) + 0.01 * t * dot(g, d)); j++) t *= 0.5;
      x = add(x, d, t);
      path.push(x.slice());
      if (norm(scale(d, t)) < 1e-12) break;
    }
    return { x, path, residual: norm(grad(x)) };
  }
  function lassoSolve(c, rho, lambda) {
    const H = [
        [1, rho],
        [rho, 1],
      ],
      b = mv(H, c);
    let x = [0, 0];
    for (let k = 0; k < 2000; k++) {
      const old = x.slice();
      x[0] = soft(b[0] - rho * x[1], lambda);
      x[1] = soft(b[1] - rho * x[0], lambda);
      if (norm(add(x, old, -1)) < 1e-12) break;
    }
    const g = mv(H, add(x, c, -1)),
      residual = Math.max(...x.map((v, i) => (Math.abs(v) > 1e-9 ? Math.abs(g[i] + lambda * Math.sign(v)) : Math.max(0, Math.abs(g[i]) - lambda))));
    return { x, H, residual };
  }
  function minimaxFit(points) {
    const rows = points.flatMap(([t, y]) => [
      [[t, 1, -1], y],
      [[-t, -1, -1], -y],
    ]);
    let best = null;
    for (let i = 0; i < rows.length; i++)
      for (let j = i + 1; j < rows.length; j++)
        for (let k = j + 1; k < rows.length; k++) {
          const z = solve([rows[i][0], rows[j][0], rows[k][0]], [rows[i][1], rows[j][1], rows[k][1]]);
          if (z && z[2] >= -1e-9 && rows.every(([a, b]) => dot(a, z) <= b + 1e-8) && (!best || z[2] < best[2])) best = z;
        }
    return best;
  }
  function tvDenoise(y, lambda) {
    const n = y.length;
    let p = Array(n - 1).fill(0),
      x = y.slice();
    const transpose = (p) => Array.from({ length: n }, (_, i) => (i ? p[i - 1] : 0) - (i < n - 1 ? p[i] : 0));
    for (let k = 0; k < 3000; k++) {
      x = add(y, transpose(p), -1);
      const q = p.map((v, i) => clamp(v + 0.249 * (x[i + 1] - x[i]), -lambda, lambda));
      if (norm(add(q, p, -1)) < 1e-11) {
        p = q;
        break;
      }
      p = q;
    }
    x = add(y, transpose(p), -1);
    const primal = 0.5 * dot(add(x, y, -1), add(x, y, -1)) + lambda * x.slice(1).reduce((a, v, i) => a + Math.abs(v - x[i]), 0),
      dual = 0.5 * dot(y, y) - 0.5 * dot(x, x);
    return { x, p, gap: Math.max(0, primal - dual), value: primal };
  }
  function entropyDistribution(mean, prior = [1 / 3, 1 / 3, 1 / 3]) {
    const t = [-1, 0, 1],
      distribution = (b) => {
        const v = t.map((v, i) => b * v + Math.log(prior[i])),
          z = lse(v);
        return v.map((x) => Math.exp(x - z));
      };
    let lo = -600,
      hi = 600;
    for (let k = 0; k < 100; k++) {
      const b = (lo + hi) / 2;
      if (dot(t, distribution(b)) < mean) lo = b;
      else hi = b;
    }
    const beta = (lo + hi) / 2,
      p = distribution(beta);
    return { p, beta, mean: dot(p, t), entropy: -p.reduce((s, x) => s + x * Math.log(x), 0) };
  }
  function analyticCenter(constraints) {
    let polygon = [
      [-2, -1.5],
      [2, -1.5],
      [2, 1.5],
      [-2, 1.5],
    ];
    for (const [a, b] of constraints) polygon = clipPolygon(polygon, a, b);
    const x0 = scale(
      polygon.reduce((a, p) => add(a, p), [0, 0]),
      1 / polygon.length
    );
    const slack = (x) => constraints.map(([a, b]) => b - dot(a, x));
    const f = (x) => {
      const v = slack(x);
      return v.every((v) => v > 0) ? -v.reduce((s, v) => s + Math.log(v), 0) : Infinity;
    };
    const grad = (x) => constraints.reduce((s, [a, b]) => add(s, a, 1 / (b - dot(a, x))), [0, 0]);
    const hess = (x) => {
      const H = [
        [0, 0],
        [0, 0],
      ];
      constraints.forEach(([a, b]) => {
        const z = (b - dot(a, x)) ** 2;
        for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) H[i][j] += (a[i] * a[j]) / z;
      });
      return H;
    };
    return { ...smoothNewton(f, grad, hess, x0), polygon, f, slack };
  }
  function normalCDF(x) {
    const z = Math.abs(x),
      t = 1 / (1 + 0.2316419 * z),
      d = Math.exp((-z * z) / 2) / Math.sqrt(2 * Math.PI),
      q = d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
    return x >= 0 ? 1 - q : q;
  }
  function quantile(p) {
    let a = -9,
      b = 9;
    for (let i = 0; i < 70; i++) {
      const m = (a + b) / 2;
      if (normalCDF(m) < p) a = m;
      else b = m;
    }
    return (a + b) / 2;
  }
  function median(points, weights) {
    let x = scale(
        points.reduce((a, p, i) => add(a, p, weights[i]), [0, 0]),
        1 / weights.reduce((a, b) => a + b)
      ),
      steps = 0;
    for (; steps < 3000; steps++) {
      let numerator = [0, 0],
        den = 0,
        R = [0, 0],
        at = 0;
      points.forEach((p, i) => {
        const d = norm(add(p, x, -1));
        if (d < 1e-10) at += weights[i];
        else {
          numerator = add(numerator, p, weights[i] / d);
          den += weights[i] / d;
          R = add(R, add(p, x, -1), weights[i] / d);
        }
      });
      if (!den || norm(R) <= at + 1e-10) break;
      const eta = at ? Math.min(1, at / norm(R)) : 0,
        next = add(scale(numerator, (1 - eta) / den), x, eta);
      if (norm(add(next, x, -1)) < 1e-10) {
        x = next;
        break;
      }
      x = next;
    }
    return { x, steps };
  }
  const models = {
    innerproduct(s) {
      const a = [s.ax, s.ay],
        b = [s.bx, s.by],
        ab = dot(a, b),
        den = dot(a, a),
        p = den ? scale(a, ab / den) : [0, 0];
      return {
        a,
        b,
        p,
        value: ab,
        bound: norm(a) * norm(b),
        angle: norm(a) * norm(b) > 1e-12 ? (Math.acos(clamp(ab / (norm(a) * norm(b)), -1, 1)) * 180) / Math.PI : null,
      };
    },
    dualnorm(s) {
      const z = [s.px, s.py],
        p = s.p,
        value = p === "1" ? Math.max(...z.map(Math.abs)) : p === "inf" ? Math.abs(z[0]) + Math.abs(z[1]) : norm(z);
      let x = [0, 0];
      if (value > 0)
        x =
          p === "1"
            ? Math.abs(z[0]) >= Math.abs(z[1])
              ? [Math.sign(z[0]), 0]
              : [0, Math.sign(z[1])]
            : p === "inf"
              ? z.map(Math.sign)
              : scale(z, 1 / norm(z));
      return { z, p, x: scale(x, s.radius), value, support: s.radius * value };
    },
    taylor(s) {
      const f = Math.exp,
        a = s.a,
        delta = s.h;
      return {
        f,
        a,
        point: a + delta,
        linear: (x) => Math.exp(a) * (1 + x - a),
        quadratic: (x) => Math.exp(a) * (1 + x - a + 0.5 * (x - a) ** 2),
        exact: f(a + delta),
      };
    },
    psd(s) {
      const H = [
          [1, s.off],
          [s.off, s.diag],
        ],
        e = eig(H);
      return {
        H,
        ...e,
        f: (x) => 0.5 * dot(x, mv(H, x)),
        kind: e.values[1] > 1e-9 ? "正定" : e.values[1] >= -1e-9 ? "半正定" : "不定",
        det: s.diag - s.off * s.off,
      };
    },
    svd(s) {
      const A = [
          [s.scale, s.shear],
          [0, 1],
        ],
        G = [
          [s.scale * s.scale + s.shear * s.shear, s.shear],
          [s.shear, 1],
        ],
        e = eig(G);
      return {
        A,
        axes: e.values.map((v) => Math.sqrt(Math.max(0, v))),
        angle: e.angle,
        det: s.scale,
        point: mv(A, [Math.cos((s.theta * Math.PI) / 180), Math.sin((s.theta * Math.PI) / 180)]),
      };
    },
    epigraph(s) {
      const f = (x) => (s.mode === "square" ? x * x : s.tau * lse([x / s.tau, -x / s.tau]));
      return { f, x: [s.px, s.py], inside: s.py >= f(s.px), gap: s.py - f(s.px) };
    },
    perspective(s) {
      const x = [s.px, s.py],
        value = (x[0] * x[0]) / x[1];
      return { x, value, inside: value <= s.level, f: (q) => (q[1] > 0 ? (q[0] * q[0]) / q[1] : Infinity) };
    },
    conjugate(s) {
      const exp = s.mode === "exp",
        y = s.y,
        f = exp ? Math.exp : (x) => (x * x) / 2;
      const xstar = exp ? (y > 0 ? Math.log(y) : null) : y;
      const conjugate = exp ? (y > 0 ? y * Math.log(y) - y : y === 0 ? 0 : Infinity) : (y * y) / 2;
      const tangent = Number.isFinite(conjugate) ? (x) => y * x - conjugate : null;
      return { y, xstar, f, conjugate, gap: f(s.x) + conjugate - s.x * y, tangent };
    },
    lp(s) {
      const c = rotate([1, 0], s.angle);
      if (s.domain === "orthant") {
        const unbounded = c.some((v) => v < -1e-10);
        return {
          polygon: [
            [0, 0],
            [4, 0],
            [4, 3],
            [0, 3],
          ],
          c,
          x: [0, 0],
          value: unbounded ? -Infinity : 0,
          optimal: unbounded ? [] : [[0, 0]],
          status: unbounded ? "无界" : "有限最优",
        };
      }
      const polygon = clipPolygon(vertices, [1, 1], s.cut),
        scores = polygon.map((x) => dot(c, x)),
        best = Math.min(...scores),
        optimal = polygon.filter((x, i) => scores[i] < best + 1e-8),
        x = optimal[0];
      return { polygon, c, x, value: best, optimal, status: polygon.length ? "有限最优" : "不可行" };
    },
    qp(s) {
      const c = [s.px, s.py],
        H = [
          [1, 0],
          [0, s.kappa],
        ],
        f = (x) => objectiveQ(x, H, c),
        polygon = [
          [0, 0],
          [2, 0],
          [0, 2],
        ],
        candidates = polygon.slice();
      if (c[0] >= 0 && c[1] >= 0 && c[0] + c[1] <= 2) candidates.push(c);
      for (let i = 0; i < 3; i++) {
        const a = polygon[i],
          d = add(polygon[(i + 1) % 3], a, -1),
          t = clamp(-dot(d, mv(H, add(a, c, -1))) / dot(d, mv(H, d)), 0, 1);
        candidates.push(add(a, d, t));
      }
      const x = candidates.reduce((a, b) => (f(a) < f(b) ? a : b));
      return { c, H, f, x, polygon, value: f(x) };
    },
    gp(s) {
      const a = s.a,
        b = s.b,
        x = [Math.sqrt((b * s.product) / a), Math.sqrt((a * s.product) / b)],
        u = x.map(Math.log);
      return { x, u, value: 2 * Math.sqrt(a * b * s.product), f: (q) => Math.log(a * Math.exp(q[0]) + b * Math.exp(q[1])), c: Math.log(s.product) };
    },
    sdp(s) {
      const r = s.r,
        c = rotate([1, 0], s.angle),
        G = [
          [1, r],
          [r, 1],
        ],
        gc = mv(G, c),
        den = Math.sqrt(dot(c, gc)),
        x = scale(gc, 1 / den),
        e = eig(G);
      return { r, c, x, axes: e.values.map(Math.sqrt), angle: e.angle, value: den, det: (a, b) => 1 - r * r - a * a - b * b + 2 * r * a * b };
    },
    portfolio(s) {
      const covariance = [
          [1, 0.6 * s.rho],
          [0.6 * s.rho, 0.36],
        ],
        mean = (w) => 1 + 0.8 * w,
        variance = (w) => dot([1 - w, w], mv(covariance, [1 - w, w])),
        lower = Math.max(0, (s.target - 1) / 0.8),
        feasible = lower <= 1 + 1e-12,
        free = (1 - 0.6 * s.rho) / (1.36 - 1.2 * s.rho),
        w = feasible ? clamp(free, lower, 1) : null;
      return { covariance, mean, variance, feasible, w, weights: feasible ? [1 - w, w] : null, value: feasible ? variance(w) : null };
    },
    lasso(s) {
      const c = [s.px, s.py],
        r = lassoSolve(c, s.rho, s.lambda);
      return {
        ...r,
        c,
        f: (x) => objectiveQ(x, r.H, c) + s.lambda * (Math.abs(x[0]) + Math.abs(x[1])),
        path: seq(0, 3, 70).map((l) => lassoSolve(c, s.rho, l).x),
      };
    },
    minimax(s) {
      const points = basePoints();
      points[6][1] += s.outlier;
      const z = minimaxFit(points);
      return { points, z, residuals: points.map(([t, y]) => z[0] * t + z[1] - y) };
    },
    basis(s) {
      const a = [1, s.a],
        b = s.b,
        l1 = Math.abs(a[1]) > 1 ? [0, b / a[1]] : [b, 0],
        l2 = scale(a, b / dot(a, a));
      return { a, b, l1, l2, value: Math.abs(b) / Math.max(...a.map(Math.abs)), multiple: Math.abs(Math.abs(s.a) - 1) < 1e-9 && Math.abs(b) > 1e-9 };
    },
    tv(s) {
      const truth = [0, 0, 0, 1, 1, 1, 1, 0.25, 0.25, 0.25, 1.5, 1.5, 1.5],
        y = truth.map((x, i) => x + s.noise * Math.sin(i * 8.4 + 1));
      return { ...tvDenoise(y, s.lambda), y, truth };
    },
    smoothing(s) {
      const truth = seq(-2, 2, 13).map((x) => 0.5 * Math.sin(1.5 * x) + 0.3 * x),
        y = truth.map((v, i) => v + s.noise * Math.sin(i * 7.8)),
        n = y.length,
        H = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
      for (let k = 0; k < n - 2; k++)
        for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) H[k + i][k + j] += s.lambda * [1, -2, 1][i] * [1, -2, 1][j];
      const x = solve(H, y),
        rough = x.slice(2).reduce((a, v, i) => a + (x[i] - 2 * x[i + 1] + v) ** 2, 0);
      return { x, y, truth, rough, residual: norm(add(mv(H, x), y, -1)) };
    },
    uncertainfit(s) {
      const b = [1, s.b],
        nominal = [1, s.b / 0.2],
        stochastic = [1 / (1 + 2 * s.sigma * s.sigma), (0.2 * s.b) / (0.04 + 2 * s.sigma * s.sigma)],
        residual = (x) => Math.hypot(x[0] - b[0], 0.2 * x[1] - b[1]),
        worstValue = (x) => residual(x) + s.rho * norm(x),
        at = (l) => [1 / (1 + l), (0.2 * s.b) / (0.04 + l)],
        score = (t) => worstValue(at(Math.exp(t))),
        grid = seq(-25, 25, 161),
        i = grid.reduce((best, t, i) => (score(t) < score(grid[best]) ? i : best), 0),
        t = golden(score, grid[Math.max(0, i - 1)], grid[Math.min(grid.length - 1, i + 1)]),
        worst = [nominal, [0, 0], at(Math.exp(t))].reduce((a, b) => (worstValue(a) < worstValue(b) ? a : b));
      return { b, nominal, stochastic, worst, residual, worstValue };
    },
    armijo(s) {
      const f = (x) => Math.expm1(x) - x,
        g = Math.expm1(s.x),
        d = -g,
        phi = (t) => f(s.x + t * d),
        bound = (t) => f(s.x) + s.c * t * g * d;
      let t = 1,
        trials = [1];
      for (let j = 0; j < 70 && phi(t) > bound(t); j++) {
        t *= s.beta;
        trials.push(t);
      }
      return { f, g, d, phi, bound, t, trials, x: s.x + t * d };
    },
    steepest(s) {
      const H = [
          [1, 0.7 * Math.sqrt(s.kappa)],
          [0.7 * Math.sqrt(s.kappa), s.kappa],
        ],
        f = (x) => objectiveQ(x, H),
        paths = {};
      for (const kind of ["l2", "l1", "linf"])
        paths[kind] = iterateQuadratic(
          H,
          [-2, 1.5],
          (x) => {
            const g = mv(H, x);
            if (norm(g) < 1e-12) return x;
            const d =
                kind === "l2"
                  ? scale(g, -1)
                  : kind === "linf"
                    ? g.map((v) => -Math.sign(v))
                    : Math.abs(g[0]) >= Math.abs(g[1])
                      ? [-g[0], 0]
                      : [0, -g[1]],
              a = -dot(g, d) / dot(d, mv(H, d));
            return add(x, d, a);
          },
          40
        );
      return { H, f, paths };
    },
    cg(s) {
      const q = C.quadratic({ angle: 30, kappa: s.kappa, px: -2, py: 1.5 }),
        H = q.Q,
        f = (x) => objectiveQ(x, H);
      let x = [-2, 1.5],
        r = scale(mv(H, x), -1),
        d = r.slice();
      const path = [x.slice()],
        directions = [];
      for (let k = 0; k < 2 && dot(r, r) > 1e-24; k++) {
        directions.push(d.slice());
        const Hd = mv(H, d),
          rr = dot(r, r),
          alpha = rr / dot(d, Hd);
        x = add(x, d, alpha);
        const next = add(r, Hd, -alpha),
          beta = dot(next, next) / rr;
        d = add(next, d, beta);
        r = next;
        path.push(x.slice());
      }
      return { H, f, path, directions, orthogonality: directions.length > 1 ? dot(directions[0], mv(H, directions[1])) : 0 };
    },
    decrement(s) {
      const f = (x) => (x > 0 ? x - Math.log(x) - 1 : Infinity),
        x = s.x,
        g = 1 - 1 / x,
        h = 1 / (x * x),
        d = -g / h,
        lambda = Math.abs(x - 1),
        t = 1 / (1 + lambda);
      return { f, x, d, lambda, t, next: x + t * d, full: x + d, model: (z) => f(x) + g * (z - x) + 0.5 * h * (z - x) ** 2 };
    },
    precondition(s) {
      const r = 0.7,
        H = [
          [1, r * Math.sqrt(s.kappa)],
          [r * Math.sqrt(s.kappa), s.kappa],
        ],
        f = (x) => objectiveQ(x, H),
        e = eig(H),
        paths = {};
      paths.plain = iterateQuadratic(H, [-2, 1.5], (x) => add(x, mv(H, x), -1 / e.values[0]), 80);
      paths.scaled = iterateQuadratic(
        H,
        [-2, 1.5],
        (x) => {
          const g = mv(H, x);
          return add(x, [g[0], g[1] / s.kappa], -1 / (1 + r));
        },
        80
      );
      return { H, f, paths, condition: e.values[0] / e.values[1], transformed: (1 + r) / (1 - r) };
    },
    elimination(s) {
      const a = rotate([1, 0], s.angle),
        n = [-a[1], a[0]],
        base = scale(a, s.b),
        H = [
          [1, 0],
          [0, s.kappa],
        ],
        c = [-1, 1.2],
        f = (x) => objectiveQ(x, H, c),
        curvature = dot(n, mv(H, n)),
        z = -dot(n, mv(H, add(base, c, -1))) / curvature,
        x = add(base, n, z);
      return { a, n, base, H, c, f, z, x, curvature, phi: (v) => f(add(base, n, v)), trial: add(base, n, s.z) };
    },
    duality(s) {
      const b = s.b,
        x = Math.max(0, b),
        lambda = 2 * x,
        q = (l) => l * b - (l * l) / 4;
      return {
        b,
        x,
        lambda,
        q,
        value: x * x,
        current: q(s.lambda),
        gap: x * x - q(s.lambda),
        lagrangian: (z) => z * z + s.lambda * (b - z),
        argmin: s.lambda / 2,
      };
    },
    supportingDuality({ lambda, mode }) {
      const nonconvex = mode === "nonconvex",
        lambdaStar = 2;
      const objective = nonconvex ? (x) => 1.5 - 2 * x - x * x : (x) => 0.5 + (x - 1) ** 2;
      const p = (u) => (nonconvex && u < -1 ? Infinity : objective(Math.min(u, 1)));
      const pstar = p(0),
        dstar = nonconvex ? 0.5 : pstar;
      const dualLoss = nonconvex ? (l) => Math.abs(l - lambdaStar) : (l) => (1 - l / 2) ** 2;
      const g = (l) => dstar - dualLoss(l),
        current = g(lambda);
      let contacts = [1 - lambda / 2];
      if (nonconvex) {
        const delta = lambdaStar - lambda;
        contacts = Math.abs(delta) < 1e-12 ? [-1, 1] : [Math.sign(delta)];
      }
      const dualityGap = pstar - dstar;
      return { objective, p, pstar, dstar, lambdaStar, g, contacts, uContact: contacts[0], current, dualityGap, gap: dualityGap + dualLoss(lambda) };
    },
    sensitivity(s) {
      const c = s.c,
        b = s.b,
        x = Math.min(c, b),
        lambda = Math.max(0, c - b),
        p = (v) => 0.5 * Math.max(0, c - v) ** 2;
      return { c, b, x, lambda, p, value: p(b), derivative: -lambda };
    },
    waterfilling(s) {
      const a = [s.a, 1, 2.2];
      let lo = Math.min(...a),
        hi = Math.max(...a) + s.power;
      for (let k = 0; k < 80; k++) {
        const m = (lo + hi) / 2;
        if (a.reduce((v, x) => v + Math.max(0, m - x), 0) < s.power) lo = m;
        else hi = m;
      }
      const level = (lo + hi) / 2,
        x = a.map((v) => Math.max(0, level - v));
      return {
        a,
        x,
        level,
        lambda: 1 / level,
        value: x.reduce((v, x, i) => v + Math.log(a[i] + x), 0),
        residual: Math.abs(x.reduce((a, b) => a + b) - s.power),
      };
    },
    contact(s) {
      const anchors = [s.a, s.b],
        contact = s.a > s.b,
        z = (s.k * s.a + s.b) / (s.k + 1),
        x = contact ? [z, z] : anchors.slice(),
        lambda = contact ? s.k * (s.a - z) : 0;
      return { anchors, x, lambda, slack: x[1] - x[0], value: 0.5 * s.k * (x[0] - s.a) ** 2 + 0.5 * (x[1] - s.b) ** 2 };
    },
    logbarrier(s) {
      const f = (x) => (x > 0 && x < 1 ? s.t * s.c * x - Math.log(x) - Math.log1p(-x) : Infinity),
        x = golden(f, 1e-10, 1 - 1e-10);
      return { f, x, grad: s.t * s.c - 1 / x + 1 / (1 - x), hessian: 1 / x ** 2 + 1 / (1 - x) ** 2, trial: s.x };
    },
    complementarity(s) {
      const mu = 10 ** s.logmu,
        a = s.a,
        x = a >= 0 ? (a + Math.sqrt(a * a + 4 * mu)) / 2 : (2 * mu) / (Math.sqrt(a * a + 4 * mu) - a),
        lambda = mu / x,
        optimum = Math.max(0, a),
        p = 0.5 * (x - a) ** 2,
        dual = -0.5 * lambda * lambda - a * lambda;
      return { mu, a, x, lambda, optimum, p, dual, gap: p - dual };
    },
    analytic(s) {
      const a = rotate([1, 0], s.angle),
        constraints = [
          [[1, 0], 2],
          [[-1, 0], 2],
          [[0, 1], 1.5],
          [[0, -1], 1.5],
          [a, s.cut],
        ],
        r = analyticCenter(constraints),
        cheb = C.chebyshev({ angle: s.angle, cut: s.cut });
      return { ...r, constraints, cheb };
    },
    primaldual(s) {
      const A = [
          [-1, 0],
          [0, -1],
          [1, 1],
        ],
        b = [0, 0, 1],
        c = [s.c1, s.c2],
        AT = (l) => [l[2] - l[0], l[2] - l[1]],
        res = (x, z, l, target) => [...add(add(x, c, -1), AT(l)), ...add(add(mv(A, x), z), b, -1), ...z.map((v, i) => v * l[i] - target)];
      let x = s.start === "feasible" ? [0.25, 0.25] : [-0.7, 1.7],
        z = s.start === "feasible" ? [0.25, 0.25, 0.5] : [1, 1, 1],
        lambda = [1, 1, 1],
        path = [],
        alpha = 0;
      for (let k = 0; k <= 30; k++) {
        const rd = add(add(x, c, -1), AT(lambda)),
          rp = add(add(mv(A, x), z), b, -1),
          gap = dot(z, lambda);
        path.push({ x: x.slice(), slack: z.slice(), lambda: lambda.slice(), primal: norm(rp), dual: norm(rd), gap, alpha });
        if (Math.max(norm(rp), norm(rd), gap) < 1e-9) break;
        const target = (s.sigma * gap) / 3,
          F = res(x, z, lambda, target),
          K = Array.from({ length: 8 }, () => Array(8).fill(0));
        for (let i = 0; i < 2; i++) {
          K[i][i] = 1;
          for (let j = 0; j < 3; j++) K[i][5 + j] = A[j][i];
        }
        for (let i = 0; i < 3; i++) {
          K[2 + i][0] = A[i][0];
          K[2 + i][1] = A[i][1];
          K[2 + i][2 + i] = 1;
          K[5 + i][2 + i] = lambda[i];
          K[5 + i][5 + i] = z[i];
        }
        const delta = solve(K, scale(F, -1));
        if (!delta) break;
        const dx = delta.slice(0, 2),
          dz = delta.slice(2, 5),
          dl = delta.slice(5);
        alpha = 1;
        for (let i = 0; i < 3; i++) {
          if (dz[i] < 0) alpha = Math.min(alpha, (-0.99 * z[i]) / dz[i]);
          if (dl[i] < 0) alpha = Math.min(alpha, (-0.99 * lambda[i]) / dl[i]);
        }
        for (let j = 0; j < 60 && norm(res(add(x, dx, alpha), add(z, dz, alpha), add(lambda, dl, alpha), target)) > (1 - 0.01 * alpha) * norm(F); j++)
          alpha *= 0.5;
        x = add(x, dx, alpha);
        z = add(z, dz, alpha);
        lambda = add(lambda, dl, alpha);
      }
      return { path, c, A, b };
    },
    socp(s) {
      const c = rotate([1, 0], s.angle),
        a = [1, 1],
        boundary = (theta) => {
          const v = [Math.cos(theta), Math.sin(theta)];
          return scale(v, 2 / (dot(a, v) + s.sigma));
        },
        t = golden((theta) => -dot(c, boundary(theta)), 0, Math.PI / 2),
        x = boundary(t),
        worst = add(a, scale(x, s.sigma / norm(x)));
      return {
        c,
        a,
        x,
        worst,
        boundary,
        polygon: [[0, 0], ...seq(0, Math.PI / 2, 161).map(boundary)],
        value: dot(c, x),
        violation: dot(a, x) + s.sigma * norm(x) - 2,
      };
    },
    logistic(s) {
      const points = seq(-2.5, 2.5, 12).map((t, i) => [t + (i < 6 ? -s.gap : s.gap), i < 6 ? 0 : 1]);
      if (s.flip === "yes") points[9][1] = 0;
      const lambda = 10 ** s.loglambda,
        f = (w) => points.reduce((v, [t, y]) => v + lse([0, w[0] * t + w[1]]) - y * (w[0] * t + w[1]), 0) + 0.5 * lambda * dot(w, w),
        sigmoid = (z) => (z >= 0 ? 1 / (1 + Math.exp(-z)) : Math.exp(z) / (1 + Math.exp(z)));
      const grad = (w) => points.reduce((g, [t, y]) => add(g, [t, 1], sigmoid(w[0] * t + w[1]) - y), scale(w, lambda));
      const hess = (w) => {
        const H = [
          [lambda, 0],
          [0, lambda],
        ];
        points.forEach(([t]) => {
          const p = sigmoid(w[0] * t + w[1]),
            v = p * (1 - p);
          H[0][0] += v * t * t;
          H[0][1] += v * t;
          H[1][0] += v * t;
          H[1][1] += v;
        });
        return H;
      };
      const r = smoothNewton(f, grad, hess, [0, 0]);
      return { ...r, points, lambda, f, prob: (t) => sigmoid(r.x[0] * t + r.x[1]) };
    },
    maxentropy(s) {
      return entropyDistribution(s.mean);
    },
    gaussian(s) {
      const S = [
          [1, s.rho * s.sigma],
          [s.rho * s.sigma, s.sigma ** 2],
        ],
        det = s.sigma ** 2 * (1 - s.rho ** 2),
        precision = [
          [S[1][1] / det, -S[0][1] / det],
          [-S[1][0] / det, 1 / det],
        ],
        Q = precision.map((row, i) => row.map((x, j) => s.mix * x + (1 - s.mix) * (i === j ? 1 : 0))),
        qd = Q[0][0] * Q[1][1] - Q[0][1] ** 2,
        e = eig(S),
        eq = eig(Q);
      return {
        S,
        precision,
        Q,
        axes: e.values.map(Math.sqrt),
        angle: e.angle,
        candidateAxes: eq.values.map((x) => 1 / Math.sqrt(x)),
        candidateAngle: eq.angle,
        value: -Math.log(qd) + dot(S[0], Q[0]) + dot(S[1], Q[1]),
        minimum: Math.log(det) + 2,
      };
    },
    hypothesis(s) {
      const threshold = quantile(1 - s.alpha),
        power = 1 - normalCDF(threshold - s.delta),
        density = (x, m) => Math.exp(-((x - m) ** 2) / 2) / Math.sqrt(2 * Math.PI);
      return { threshold, power, density, roc: seq(-5, 5 + s.delta).map((t) => [1 - normalCDF(t), 1 - normalCDF(t - s.delta)]) };
    },
    bounds(s) {
      const support = [-2, -1, 0, 1, 2];
      let best = null;
      for (let i = 0; i < 5; i++)
        for (let j = i + 1; j < 5; j++)
          for (let k = j + 1; k < 5; k++) {
            const ix = [i, j, k],
              v = ix.map((i) => support[i]),
              q = solve([[1, 1, 1], v, v.map((x) => x * x)], [1, 0, s.variance]);
            if (q && q.every((x) => x >= -1e-10)) {
              const p = Array(5).fill(0);
              ix.forEach((j, i) => (p[j] = Math.max(0, q[i])));
              const value = p.reduce((a, p, i) => a + (support[i] >= s.threshold ? p : 0), 0);
              if (!best || value > best.value) best = { p, value };
            }
          }
      return { ...best, support, bound: s.variance / (s.variance + s.threshold * s.threshold) };
    },
    distance(s) {
      const a = [-1.5, 0],
        b = [s.px, s.py],
        r1 = 0.8,
        r2 = s.radius,
        d = norm(add(b, a, -1)),
        v = d > 1e-12 ? scale(add(b, a, -1), 1 / d) : [1, 0],
        p = add(a, v, r1),
        q = add(b, v, -r2);
      return { a, b, r1, r2, p, q, normal: v, distance: Math.max(0, d - r1 - r2), mid: scale(add(p, q), 0.5) };
    },
    svm(s) {
      const z = [
          [s.gap, 1],
          [s.gap + 0.8, -0.5],
          [s.outlier, 0.25],
        ],
        cost = (w) => 0.5 * dot(w, w) + 2 * s.C * z.reduce((a, p) => a + Math.max(0, 1 - dot(w, p)), 0),
        candidates = [[0, 0]];
      for (let mask = 0; mask < 8; mask++) {
        const w = z.reduce((w, p, i) => (mask & (1 << i) ? add(w, p, 2 * s.C) : w), [0, 0]);
        candidates.push(w);
        for (const p of z) if (dot(p, p) > 1e-12) candidates.push(add(w, p, (1 - dot(w, p)) / dot(p, p)));
      }
      for (let i = 0; i < 3; i++)
        for (let j = i + 1; j < 3; j++) {
          const w = solve([z[i], z[j]], [1, 1]);
          if (w) candidates.push(w);
        }
      const w = candidates.reduce((a, b) => (cost(a) < cost(b) ? a : b)),
        slacks = z.map((p) => Math.max(0, 1 - dot(w, p)));
      return { z, w, slacks, value: cost(w), cost, margin: norm(w) > 1e-12 ? 2 / norm(w) : Infinity };
    },
    ellipsoids(s) {
      const points = [
          [-s.width, -1],
          [s.width, -0.8],
          [s.px, s.py],
        ],
        center = scale(
          points.reduce((a, p) => add(a, p), [0, 0]),
          1 / 3
        ),
        P = [
          [0, 0],
          [0, 0],
        ];
      points.forEach((p) => {
        const d = add(p, center, -1);
        for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) P[i][j] += (2 / 3) * d[i] * d[j];
      });
      const e = eig(P),
        axes = e.values.map(Math.sqrt),
        area = Math.PI * axes[0] * axes[1];
      return { points, center, P, axes, angle: e.angle, area, innerArea: area / 4 };
    },
    facility(s) {
      const points = [
          [-1.8, -1],
          [1.8, -0.8],
          [0.3, 1.6],
          [s.px, s.py],
        ],
        weights = [1, 1, 1, s.weight],
        r = median(points, weights),
        centroid = scale(
          points.reduce((a, p, i) => add(a, p, weights[i]), [0, 0]),
          1 / weights.reduce((a, b) => a + b)
        ),
        f = (x) => points.reduce((a, p, i) => a + weights[i] * norm(add(x, p, -1)), 0);
      return { ...r, points, weights, centroid, f, value: f(r.x) };
    },
    placement(s) {
      const anchors = [
          [-2, -1],
          [-2, 1.5],
          [s.px, s.py],
        ],
        H = [
          [2 + s.weight, -s.weight],
          [-s.weight, 1 + s.weight],
        ],
        nodes = [[], []];
      for (let i = 0; i < 2; i++) {
        const v = solve(H, [anchors[0][i] + anchors[1][i], anchors[2][i]]);
        nodes[0][i] = v[0];
        nodes[1][i] = v[1];
      }
      const energy =
        dot(add(nodes[0], anchors[0], -1), add(nodes[0], anchors[0], -1)) +
        dot(add(nodes[0], anchors[1], -1), add(nodes[0], anchors[1], -1)) +
        dot(add(nodes[1], anchors[2], -1), add(nodes[1], anchors[2], -1)) +
        s.weight * dot(add(nodes[0], nodes[1], -1), add(nodes[0], nodes[1], -1));
      return { anchors, nodes, energy };
    },
    proximal(s) {
      const x = soft(s.z, s.lambda),
        f = (v) => 0.5 * (v - s.z) ** 2 + s.lambda * Math.abs(v);
      return { x, f, value: f(x), map: (z) => soft(z, s.lambda) };
    },
    subgradient(s) {
      let x = s.x0,
        best = Math.abs(x);
      const path = [{ x, best, value: best }];
      for (let k = 0; k < 100; k++) {
        const alpha = s.step / (s.schedule === "sqrt" ? Math.sqrt(k + 1) : s.schedule === "harmonic" ? k + 1 : 1);
        x -= alpha * Math.sign(x);
        best = Math.min(best, Math.abs(x));
        path.push({ x, best, value: Math.abs(x), alpha });
      }
      return { path };
    },
    stochastic(s) {
      let seed = Math.round(s.seed),
        x = 2,
        second = 4,
        mean = 2;
      const path = [{ x, expected: 2, mean, average: x }];
      let sum = x;
      for (let k = 0; k < 120; k++) {
        seed = (1664525 * seed + 1013904223) >>> 0;
        const noise = (seed / 4294967296 < 0.5 ? -1 : 1) * s.noise,
          alpha = s.step / (s.schedule === "sqrt" ? Math.sqrt(k + 1) : 1);
        x = (1 - alpha) * x - alpha * noise;
        second = (1 - alpha) ** 2 * second + alpha ** 2 * s.noise ** 2;
        mean *= 1 - alpha;
        sum += x;
        path.push({ x, expected: second / 2, mean, average: sum / (k + 2) });
      }
      return { path, floor: (s.step * s.noise ** 2) / (2 * (2 - s.step)) };
    },
  };
  const api = {
    models,
    seq,
    soft,
    lse,
    eig,
    golden,
    lassoSolve,
    minimaxFit,
    tvDenoise,
    entropyDistribution,
    analyticCenter,
    normalCDF,
    quantile,
    median,
    objectiveQ,
    vertices,
  };
  root.ChapterMoreMath = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
