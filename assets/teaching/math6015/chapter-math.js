/* Numerical kernels for textbook demonstrations. No DOM or external dependencies. */
(function (root) {
  "use strict";
  const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0),
    norm = (a) => Math.hypot(...a),
    add = (a, b, t = 1) => a.map((v, i) => v + t * b[i]),
    scale = (a, t) => a.map((v) => v * t);
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const rotate = (x, deg) => {
    const t = (deg * Math.PI) / 180,
      c = Math.cos(t),
      s = Math.sin(t);
    return [c * x[0] - s * x[1], s * x[0] + c * x[1]];
  };
  const mv = (A, x) => A.map((row) => dot(row, x));
  function solve(A, b) {
    const n = b.length,
      m = A.map((row, i) => [...row, b[i]]);
    for (let k = 0; k < n; k++) {
      let p = k;
      for (let i = k + 1; i < n; i++) if (Math.abs(m[i][k]) > Math.abs(m[p][k])) p = i;
      if (Math.abs(m[p][k]) < 1e-14) return null;
      [m[k], m[p]] = [m[p], m[k]];
      const d = m[k][k];
      for (let j = k; j <= n; j++) m[k][j] /= d;
      for (let i = 0; i < n; i++)
        if (i !== k) {
          const t = m[i][k];
          for (let j = k; j <= n; j++) m[i][j] -= t * m[k][j];
        }
    }
    return m.map((row) => row[n]);
  }
  function quadratic(s) {
    const u = rotate([1, 0], s.angle),
      v = rotate([0, 1], s.angle),
      Q = [
        [u[0] ** 2 + s.kappa * v[0] ** 2, u[0] * u[1] + s.kappa * v[0] * v[1]],
        [u[0] * u[1] + s.kappa * v[0] * v[1], u[1] ** 2 + s.kappa * v[1] ** 2],
      ];
    const x = [s.px, s.py],
      g = mv(Q, x);
    return { Q, x, g, value: 0.5 * dot(x, g), u, v };
  }
  function pnorm(x, p) {
    return p === "inf" ? Math.max(...x.map(Math.abs)) : x.reduce((v, t) => v + Math.abs(t) ** p, 0) ** (1 / p);
  }
  function normBall(s) {
    const p = s.mode === "inf" ? "inf" : s.p,
      x = [s.px, s.py];
    return { p, x, value: pnorm(x, p), dual: p === "inf" ? 1 : p === 1 ? "∞" : p / (p - 1) };
  }
  function convexSet(s) {
    const a = [s.ax, s.ay],
      b = [s.bx, s.by],
      mix = add(scale(a, 1 - s.t), b, s.t);
    const inside = (x) =>
      s.shape === "disk"
        ? dot(x, x) <= 4 + 1e-10
        : s.shape === "box"
          ? Math.abs(x[0]) <= 2 + 1e-10 && Math.abs(x[1]) <= 1.4 + 1e-10
          : Math.abs(x[0]) <= 2 && Math.abs(x[1]) <= 1.5 && !(x[0] > 0.25 && Math.abs(x[1]) < 0.7);
    const violations = Array.from({ length: 101 }, (_, i) => i / 100).filter((t) => !inside(add(scale(a, 1 - t), b, t)));
    return { a, b, mix, inside, endpointsInside: inside(a) && inside(b), violations };
  }
  function jensen(s) {
    const f = s.fun === "square" ? (x) => x * x : s.fun === "exp" ? Math.exp : s.fun === "log" ? Math.log : (x) => x ** 4 - 2 * x * x;
    const t = s.t,
      x = (1 - t) * s.a + t * s.b,
      chord = (1 - t) * f(s.a) + t * f(s.b);
    return { f, x, chord, value: f(x), gap: chord - f(x) };
  }
  function robustFit(s) {
    const points = Array.from({ length: 11 }, (_, i) => {
      const t = -2 + i * 0.4;
      return [t, 0.7 * t + 0.4 + 0.23 * Math.sin(i * 2.1)];
    });
    points[9][1] += s.outlier;
    const fit = (weights) => {
      let aa = 0,
        ab = 0,
        bb = 0,
        ay = 0,
        by = 0;
      points.forEach(([t, y], i) => {
        const w = weights[i];
        aa += w * t * t;
        ab += w * t;
        bb += w;
        ay += w * t * y;
        by += w * y;
      });
      return solve(
        [
          [aa, ab],
          [ab, bb],
        ],
        [ay, by]
      );
    };
    const objective = (x, kind) =>
      points.reduce((sum, [t, y]) => {
        const r = x[0] * t + x[1] - y,
          a = Math.abs(r);
        return sum + (kind === "l1" ? a : kind === "huber" ? (a <= s.delta ? 0.5 * r * r : s.delta * (a - 0.5 * s.delta)) : 0.5 * r * r);
      }, 0);
    const ls = fit(points.map(() => 1));
    let l1 = null,
      best = Infinity;
    for (let i = 0; i < points.length; i++)
      for (let j = i + 1; j < points.length; j++) {
        const a = (points[j][1] - points[i][1]) / (points[j][0] - points[i][0]),
          x = [a, points[i][1] - a * points[i][0]],
          v = objective(x, "l1");
        if (v < best) {
          l1 = x;
          best = v;
        }
      }
    let huber = ls.slice(),
      iterations = 0;
    for (; iterations < 500; iterations++) {
      const weights = points.map(([t, y]) => Math.min(1, s.delta / Math.max(1e-14, Math.abs(huber[0] * t + huber[1] - y)))),
        next = fit(weights);
      if (norm(add(next, huber, -1)) < 1e-11) {
        huber = next;
        break;
      }
      huber = next;
    }
    const gradient = points.reduce(
      (g, [t, y]) => {
        const r = clamp(huber[0] * t + huber[1] - y, -s.delta, s.delta);
        return add(g, [r * t, r]);
      },
      [0, 0]
    );
    return { points, ls, l1, huber, iterations, residual: norm(gradient), objective };
  }
  function ridge(s) {
    const truth = [1, 1],
      b = [1 + s.noise, 0.12 - s.noise],
      x = [b[0] / (1 + s.lambda), (0.12 * b[1]) / (0.12 ** 2 + s.lambda)];
    const residual = (x[0] - b[0]) ** 2 + (0.12 * x[1] - b[1]) ** 2;
    const at = (l) => [b[0] / (1 + l), (0.12 * b[1]) / (0.12 ** 2 + l)];
    return { truth, b, x, residual, penalty: dot(x, x), at, path: Array.from({ length: 100 }, (_, i) => at(10 ** (-5 + (i / 99) * 6))) };
  }
  function scalarNewton(x0, backtracking) {
    const f = (x) => Math.expm1(x) - x,
      path = [{ x: x0, f: f(x0), alpha: 0 }];
    let x = x0;
    for (let i = 0; i < 24; i++) {
      const g = Math.expm1(x);
      if (Math.abs(g) < 1e-11) break;
      const d = -g / Math.exp(x);
      let alpha = 1;
      if (backtracking)
        for (let j = 0; j < 60 && (!Number.isFinite(f(x + alpha * d)) || f(x + alpha * d) > f(x) + 0.01 * alpha * g * d); j++) alpha *= 0.5;
      x += alpha * d;
      if (!Number.isFinite(f(x))) break;
      path.push({ x, f: Math.max(0, f(x)), alpha });
    }
    return path;
  }
  function affineProjection(s) {
    const a = rotate([1, 0], s.angle),
      c = [s.px, s.py],
      lambda = dot(a, c) - s.offset,
      x = add(c, a, -lambda);
    return { a, c, x, lambda, value: 0.5 * lambda * lambda, residual: dot(a, x) - s.offset };
  }
  function equalityNewton(s) {
    let x = [s.x1, s.x2],
      nu = 0;
    const path = [];
    const F = (x, nu) => [Math.exp(x[0]) + nu, Math.exp(x[1]) + nu, x[0] + x[1] - s.b];
    for (let k = 0; k <= 24; k++) {
      const r = F(x, nu);
      path.push({ x: x.slice(), nu, residual: norm(r), primal: Math.abs(r[2]) });
      if (norm(r) < 1e-10) break;
      const h = x.map(Math.exp),
        g = r.slice(0, 2),
        dnu = (r[2] - g[0] / h[0] - g[1] / h[1]) / (1 / h[0] + 1 / h[1]);
      const dx = g.map((gi, i) => -(gi + dnu) / h[i]);
      let t = 1;
      for (let j = 0; j < 60 && norm(F(add(x, dx, t), nu + t * dnu)) > (1 - 0.01 * t) * norm(r); j++) t *= 0.5;
      x = add(x, dx, t);
      nu += t * dnu;
    }
    return { path, optimum: [s.b / 2, s.b / 2] };
  }
  function barrierPoint(c, t) {
    let x = [1 / 3, 1 / 3];
    const value = (x) => t * dot(c, x) - Math.log(x[0]) - Math.log(x[1]) - Math.log(1 - x[0] - x[1]);
    for (let k = 0; k < 100; k++) {
      const z = 1 - x[0] - x[1],
        g = [t * c[0] - 1 / x[0] + 1 / z, t * c[1] - 1 / x[1] + 1 / z],
        H = [
          [1 / x[0] ** 2 + 1 / z ** 2, 1 / z ** 2],
          [1 / z ** 2, 1 / x[1] ** 2 + 1 / z ** 2],
        ],
        d = solve(H, scale(g, -1));
      if (!d || -dot(g, d) < 1e-17) break;
      let alpha = 1;
      for (let j = 0; j < 70; j++) {
        const y = add(x, d, alpha);
        if (y[0] > 0 && y[1] > 0 && y[0] + y[1] < 1 && value(y) <= value(x) + 0.01 * alpha * dot(g, d)) break;
        alpha *= 0.5;
      }
      x = add(x, d, alpha);
    }
    return x;
  }
  function centralPath(s) {
    const c = rotate([1, 0], s.angle),
      t = 10 ** s.logt,
      x = barrierPoint(c, t),
      vertices = [
        [0, 0],
        [1, 0],
        [0, 1],
      ],
      optimum = vertices.reduce((a, b) => (dot(c, a) < dot(c, b) ? a : b)),
      path = Array.from({ length: 65 }, (_, i) => barrierPoint(c, 10 ** (-1 + (i / 64) * 4)));
    return { c, t, x, path, optimum, value: dot(c, x), gap: dot(c, add(x, optimum, -1)), bound: 3 / t };
  }
  function phaseOne(s) {
    return {
      optimum: [s.b / 3, s.b / 3],
      sstar: -s.b / 3,
      feasible: s.b >= 0,
      strict: s.b > 0,
      relaxed: s.b + 3 * s.slack >= -1e-12,
      vertices: [
        [-s.slack, -s.slack],
        [s.b + 2 * s.slack, -s.slack],
        [-s.slack, s.b + 2 * s.slack],
      ],
    };
  }
  function bernoulli(s) {
    const n = s.n,
      k = Math.round(s.rate * n),
      mle = k / n,
      map = (k + s.prior - 1) / (n + 2 * s.prior - 2);
    const nll = (p, a = k, b = n - k) => {
      if ((p === 0 && a > 0) || (p === 1 && b > 0)) return Infinity;
      return -(a === 0 ? 0 : a * Math.log(p)) - (b === 0 ? 0 : b * Math.log1p(-p));
    };
    return { n, k, mle, map, nll, mapNll: (p) => nll(p, k + s.prior - 1, n - k + s.prior - 1) };
  }
  function design(s) {
    const left = s.edge * s.balance,
      right = s.edge * (1 - s.balance),
      middle = 1 - s.edge,
      m = right - left,
      M = [
        [s.n, s.n * m],
        [s.n * m, s.n * s.edge],
      ],
      det = M[0][0] * M[1][1] - M[0][1] ** 2;
    const trace = M[0][0] + M[1][1],
      d = Math.hypot(M[0][0] - M[1][1], 2 * M[0][1]),
      eigen = [(trace + d) / 2, (trace - d) / 2],
      angle = (0.5 * Math.atan2(2 * M[0][1], M[0][0] - M[1][1]) * 180) / Math.PI;
    return { weights: [left, middle, right], M, det, eigen, angle, area: det > 1e-12 ? Math.PI / Math.sqrt(det) : Infinity };
  }
  function projection(s) {
    const y = [s.px, s.py],
      q = rotate(y, -s.angle),
      axes = s.shape === "circle" ? [s.a, s.a] : [s.a, s.b];
    let z;
    if (s.shape === "box") z = q.map((v, i) => clamp(v, -axes[i], axes[i]));
    else if (q.reduce((v, t, i) => v + (t / axes[i]) ** 2, 0) <= 1) z = q.slice();
    else {
      const eq = (l) => q.reduce((v, t, i) => v + ((axes[i] * t) / (axes[i] ** 2 + l)) ** 2, 0);
      let hi = 1;
      while (eq(hi) > 1) hi *= 2;
      let lo = 0;
      for (let i = 0; i < 80; i++) {
        const mid = (lo + hi) / 2;
        if (eq(mid) > 1) lo = mid;
        else hi = mid;
      }
      z = q.map((v, i) => (axes[i] ** 2 * v) / (axes[i] ** 2 + hi));
    }
    const x = rotate(z, s.angle),
      normal = add(y, x, -1);
    return { y, x, normal, distance: norm(normal), axes };
  }
  function clipPolygon(poly, a, b) {
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i],
        q = poly[(i + 1) % poly.length],
        dp = dot(a, p) - b,
        dq = dot(a, q) - b;
      if (dp <= 1e-10) out.push(p);
      if ((dp < 0 && dq > 0) || (dp > 0 && dq < 0)) out.push(add(p, add(q, p, -1), dp / (dp - dq)));
    }
    return out;
  }
  function chebyshev(s) {
    const a = rotate([1, 0], s.angle),
      constraints = [
        [[1, 0], 2],
        [[-1, 0], 2],
        [[0, 1], 1.5],
        [[0, -1], 1.5],
        [a, s.cut],
      ],
      A = constraints.map(([a]) => [...a, norm(a)]).concat([[0, 0, -1]]),
      b = constraints.map(([, b]) => b).concat([0]);
    let best = null;
    for (let i = 0; i < A.length; i++)
      for (let j = i + 1; j < A.length; j++)
        for (let k = j + 1; k < A.length; k++) {
          const z = solve([A[i], A[j], A[k]], [b[i], b[j], b[k]]);
          if (z && A.every((a, i) => dot(a, z) <= b[i] + 1e-9) && (!best || z[2] > best[2] + 1e-9)) best = z;
        }
    const polygon = clipPolygon(
      [
        [-2, -1.5],
        [2, -1.5],
        [2, 1.5],
        [-2, 1.5],
      ],
      a,
      s.cut
    );
    return { constraints, polygon, center: best?.slice(0, 2), radius: best ? Math.max(0, best[2]) : null };
  }
  const api = {
    dot,
    norm,
    add,
    scale,
    rotate,
    mv,
    solve,
    clamp,
    quadratic,
    pnorm,
    normBall,
    convexSet,
    jensen,
    robustFit,
    ridge,
    scalarNewton,
    affineProjection,
    equalityNewton,
    barrierPoint,
    centralPath,
    phaseOne,
    bernoulli,
    design,
    projection,
    clipPolygon,
    chebyshev,
  };
  root.ChapterMath = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
