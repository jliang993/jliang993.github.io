(function (root) {
  "use strict";
  const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
  const solve2 = (H, b) => {
    const det = H[0][0] * H[1][1] - H[0][1] * H[1][0];
    return [(H[1][1] * b[0] - H[0][1] * b[1]) / det, (H[0][0] * b[1] - H[1][0] * b[0]) / det];
  };
  function lmi(x, y) {
    const r = Math.hypot(x, y),
      det = 4 - r * r,
      feasible = det > 0;
    return {
      x: [x, y],
      r,
      det,
      eigenvalues: [2 - r, 2 + r],
      feasible,
      f: feasible ? -Math.log(det) : Infinity,
      g: feasible ? [(2 * x) / det, (2 * y) / det] : null,
      H: feasible
        ? [
            [2 / det + (4 * x * x) / det ** 2, (4 * x * y) / det ** 2],
            [(4 * x * y) / det ** 2, 2 / det + (4 * y * y) / det ** 2],
          ]
        : null,
    };
  }
  function quadratic(gamma, k) {
    const ratio = (gamma - 1) / (gamma + 1);
    const path = Array.from({ length: k + 1 }, (_, j) => {
      const x = [gamma * ratio ** j, (-ratio) ** j];
      return { k: j, x, f: 0.5 * (x[0] ** 2 + gamma * x[1] ** 2) };
    });
    return { path, ratio: ratio * ratio, condition: Math.max(gamma, 1 / gamma), gamma };
  }
  function logistic(w, lambda) {
    let f = (lambda * w * w) / 2,
      g = lambda * w,
      H = lambda;
    for (const z of [2, 1, 1, 2]) {
      const a = -z * w;
      f += Math.max(a, 0) + Math.log1p(Math.exp(-Math.abs(a)));
      const p = 1 / (1 + Math.exp(z * w));
      g -= z * p;
      H += z * z * p * (1 - p);
    }
    return { f, g, H };
  }
  function logisticRun(w, lambda) {
    const path = [];
    for (let k = 0; k <= 25; k++) {
      const e = logistic(w, lambda),
        d = -e.g / e.H,
        decrement = (e.g * e.g) / e.H;
      const record = { k, w, ...e, d, decrement };
      path.push(record);
      if (Math.abs(e.g) < 1e-10 || k === 25) break;
      let t = 1,
        trials = 0;
      while (logistic(w + t * d, lambda).f > e.f + 0.1 * t * e.g * d && trials < 80) {
        t *= 0.5;
        trials++;
      }
      if (trials === 80) break;
      record.t = t;
      record.trials = trials + 1;
      w += t * d;
    }
    return path;
  }
  function selfConcordance(kind, x, c) {
    if (kind !== "exp" && x <= 0) return { valid: false };
    let f, g, H, third;
    if (kind === "log") {
      f = -Math.log(x);
      g = -1 / x;
      H = 1 / x ** 2;
      third = -2 / x ** 3;
    } else if (kind === "entropylog") {
      f = x * Math.log(x) - Math.log(x);
      g = Math.log(x) + 1 - 1 / x;
      H = (x + 1) / x ** 2;
      third = -(x + 2) / x ** 3;
    } else {
      f = g = H = third = Math.exp(x);
    }
    f *= c;
    g *= c;
    H *= c;
    third *= c;
    const ratio = Math.abs(third) / (2 * H ** 1.5);
    return { valid: true, f, g, H, third, ratio, passesHere: ratio <= 1 + 1e-12 };
  }
  const productionA = [
      [-1, 0],
      [0, -1],
      [2, 1],
      [1, 2],
    ],
    productionB = [0, 0, 8, 8];
  function productionEvaluate(x, t) {
    const slack = productionA.map((a, i) => productionB[i] - dot(a, x));
    if (slack.some((v) => v <= 0)) return { feasible: false, f: Infinity };
    const g = [-3 * t, -2 * t],
      H = [
        [0, 0],
        [0, 0],
      ];
    let f = -t * (3 * x[0] + 2 * x[1]);
    productionA.forEach((a, i) => {
      f -= Math.log(slack[i]);
      for (let j = 0; j < 2; j++) {
        g[j] += a[j] / slack[i];
        for (let l = 0; l < 2; l++) H[j][l] += (a[j] * a[l]) / slack[i] ** 2;
      }
    });
    return { f, g, H, slack, feasible: true };
  }
  const productionCache = new Map();
  function production(t) {
    if (productionCache.has(t)) return productionCache.get(t);
    let x = [2, 2];
    const path = [];
    for (let k = 0; k <= 100; k++) {
      const e = productionEvaluate(x, t),
        d = solve2(
          e.H,
          e.g.map((v) => -v)
        ),
        dec = -dot(e.g, d);
      const r = { k, x: x.slice(), ...e, decrement: dec };
      path.push(r);
      if (dec / 2 < 1e-18 || k === 100) break;
      let step = 1,
        j = 0;
      while (
        productionEvaluate(
          x.map((v, i) => v + step * d[i]),
          t
        ).f >
          e.f + 0.1 * step * dot(e.g, d) &&
        j++ < 100
      )
        step *= 0.5;
      if (j >= 100) break;
      const next = x.map((v, i) => v + step * d[i]);
      if (next.every((v, i) => v === x[i])) break;
      r.step = step;
      x = next;
    }
    const last = path.at(-1),
      profit = 3 * last.x[0] + 2 * last.x[1];
    const result = { t, path, x: last.x, profit, gap: 40 / 3 - profit, bound: 4 / t, residual: Math.hypot(...last.g), decrement: last.decrement };
    productionCache.set(t, result);
    if (productionCache.size > 100) productionCache.delete(productionCache.keys().next().value);
    return result;
  }
  function ridge(lambda) {
    return { lambda, eigen: [0.01 + lambda, 1 + lambda], condition: (1 + lambda) / (0.01 + lambda) };
  }
  function smoothing(lambda, t) {
    const y = [0, 1, 0],
      g = [-2 * lambda, 4 * lambda, -2 * lambda],
      x = y.map((v, i) => v - t * g[i]);
    const f = (z) => 0.5 * z.reduce((s, v, i) => s + (v - y[i]) ** 2, 0) + (lambda / 2) * (z[0] - 2 * z[1] + z[2]) ** 2;
    return { y, g, x, before: f(y), after: f(x), L: 1 + 6 * lambda };
  }
  function capacity(alpha, beta) {
    const f = (x) => (x > 2 && x < 8 ? 0.5 * x * x + 0.1 * (10 - x) ** 2 - 0.2 * Math.log(x - 2) - 0.2 * Math.log(8 - x) : Infinity);
    const x = 2.3,
      d = -1,
      g = x - 0.2 * (10 - x) - 0.2 / (x - 2) + 0.2 / (8 - x),
      initial = f(x),
      trials = [];
    for (let j = 0, t = 1; j < 100; j++, t *= beta) {
      const next = x + t * d,
        feasible = next > 2 && next < 8,
        value = f(next),
        bound = initial + alpha * t * g * d;
      const accepted = feasible && value <= bound;
      trials.push({ t, x: next, f: value, feasible, bound, accepted });
      if (accepted) break;
    }
    return { x, d, g, initial, trials, f };
  }
  const api = { dot, solve2, lmi, quadratic, logistic, logisticRun, selfConcordance, productionEvaluate, production, ridge, smoothing, capacity };
  root.LectureModels = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
