/* MATH 6015 — numerical engine. No DOM or external dependencies.
 * Silver schedule: Altschuler & Parrilo, arXiv:2309.16530 (smooth convex version).
 * All diagnostics use the original objective: no clipping or projection of iterates.
 */
(function (root) {
  "use strict";
  const METHODS = [
    { id: "gd", name: "梯度下降", short: "GD", color: "#2474c6" },
    { id: "hb", name: "Heavy-ball", short: "HB", color: "#db7b25" },
    { id: "nag", name: "Nesterov", short: "NAG", color: "#8b5ac0" },
    { id: "cg", name: "共轭梯度", short: "CG", color: "#c54d72" },
    { id: "newton", name: "Newton", short: "Newton", color: "#188875" },
    { id: "silver", name: "Silver GD", short: "Silver", color: "#64748b" },
  ];
  const DEFAULTS = {
    problem: "ls",
    shape: "cosh",
    kappa: 40,
    mu: 1,
    angle: 32,
    nonlinearity: 0.9,
    x0: [-3.4, 2.5],
    center: [0, 0],
    lFactor: 1,
    steps: 255,
    tolExp: 8,
    criterion: "rel",
    stopAtTol: true,
    gdMode: "fixed",
    gdScale: 1,
    hbScale: 1,
    hbAuto: true,
    hbBeta: 0.6,
    nagScale: 1,
    nagAuto: true,
    nagBeta: 0.7,
    nagRestart: false,
    cgFormula: "pr",
    cgRestart: 2,
    newtonMode: "armijo",
    newtonScale: 1,
    silverScale: 1,
    silverPeriod: 0,
    weightG: 2,
    weightH: 5,
    weightSolve: 5,
    enabled: METHODS.map((m) => m.id),
  };
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
  const norm = (a) => Math.hypot(a[0], a[1]);
  const add = (a, b, t = 1) => [a[0] + t * b[0], a[1] + t * b[1]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const scale = (a, t) => [t * a[0], t * a[1]];
  const mv = (H, v) => [H[0] * v[0] + H[1] * v[1], H[1] * v[0] + H[2] * v[1]];
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const finiteVec = (v) => v.every(Number.isFinite);
  function normalize(input = {}) {
    const c = JSON.parse(JSON.stringify(DEFAULTS));
    const ranges = {
      kappa: [1, 1000],
      mu: [0.1, 5],
      angle: [-180, 180],
      nonlinearity: [0.1, 2.5],
      lFactor: [0.25, 4],
      steps: [1, 2047],
      tolExp: [2, 14],
      gdScale: [0.05, 2.5],
      hbScale: [0.1, 2],
      hbBeta: [0, 0.999],
      nagScale: [0.1, 2],
      nagBeta: [0, 0.999],
      cgRestart: [0, 50],
      newtonScale: [0.05, 1.5],
      silverScale: [0.1, 2],
      silverPeriod: [0, 10],
      weightG: [0, 100],
      weightH: [0, 100],
      weightSolve: [0, 100],
    };
    for (const [key, range] of Object.entries(ranges)) {
      if (Number.isFinite(Number(input[key])) && input[key] !== null && input[key] !== "") c[key] = clamp(Number(input[key]), ...range);
    }
    for (const key of ["steps", "tolExp", "cgRestart", "silverPeriod"]) c[key] = Math.round(c[key]);
    for (const key of ["hbAuto", "nagAuto", "nagRestart", "stopAtTol"]) if (typeof input[key] === "boolean") c[key] = input[key];
    const enums = {
      problem: ["ls", "nonlinear"],
      shape: ["cosh", "exp"],
      criterion: ["rel", "gn", "dist"],
      gdMode: ["fixed", "exact", "armijo"],
      cgFormula: ["pr", "fr"],
      newtonMode: ["armijo", "full"],
    };
    for (const [key, values] of Object.entries(enums)) if (values.includes(input[key])) c[key] = input[key];
    for (const key of ["x0", "center"])
      if (Array.isArray(input[key]) && input[key].length === 2 && input[key].every((x) => Number.isFinite(Number(x))))
        c[key] = input[key].map((x) => clamp(Number(x), -12, 12));
    if (Array.isArray(input.enabled)) c.enabled = METHODS.map((m) => m.id).filter((id) => input.enabled.includes(id));
    return c;
  }
  function expRemainder(t) {
    if (Math.abs(t) < 1e-4) return t * t * (0.5 + t * (1 / 6 + t * (1 / 24 + t / 120)));
    return Math.expm1(t) - t;
  }
  function logCosh(t) {
    const a = Math.abs(t);
    if (a < 1e-4) return t * t * (0.5 + t * t * (-1 / 12 + (t * t) / 45));
    return a + Math.log1p(Math.exp(-2 * a)) - Math.LN2;
  }
  function makeProblem(input) {
    const c = normalize(input),
      theta = (c.angle * Math.PI) / 180;
    const co = Math.cos(theta),
      si = Math.sin(theta),
      mu = c.mu,
      stiff = mu * (c.kappa - 1),
      s = c.nonlinearity;
    const rotate = (z) => [co * z[0] - si * z[1], si * z[0] + co * z[1]];
    const local = (x) => {
      const u = sub(x, c.center);
      return [co * u[0] + si * u[1], -si * u[0] + co * u[1]];
    };
    function f(x) {
      const z = local(x);
      if (c.problem === "ls") return 0.5 * mu * (z[0] * z[0] + c.kappa * z[1] * z[1]);
      const base = 0.5 * mu * dot(z, z);
      return stiff === 0 ? base : base + (stiff / (s * s)) * (c.shape === "cosh" ? logCosh(s * z[1]) : expRemainder(s * z[1]));
    }
    function g(x) {
      const z = local(x),
        extra = c.problem === "ls" ? stiff * z[1] : stiff === 0 ? 0 : (stiff / s) * (c.shape === "cosh" ? Math.tanh(s * z[1]) : Math.expm1(s * z[1]));
      return rotate([mu * z[0], mu * z[1] + extra]);
    }
    function curvature(x) {
      if (c.problem === "ls") return mu * c.kappa;
      if (stiff === 0) return mu;
      const t = s * local(x)[1];
      const d2 = c.shape === "cosh" ? (4 * Math.exp(-2 * Math.abs(t))) / (1 + Math.exp(-2 * Math.abs(t))) ** 2 : Math.exp(t);
      return mu + stiff * d2;
    }
    function h(x) {
      const l = curvature(x);
      return [mu * co * co + l * si * si, (mu - l) * co * si, mu * si * si + l * co * co];
    }
    let Lbase = mu * c.kappa,
      sublevelT = null;
    const globalSmooth = c.problem === "ls" || c.shape === "cosh" || stiff === 0;
    if (!globalSmooth) {
      // On f(x) <= f(x0), exp(t)-t-1 <= s^2 f(x0)/stiff.
      const budget = (s * s * f(c.x0)) / stiff;
      let lo = 0,
        hi = Math.max(1, Math.log1p(budget) + 2);
      while (expRemainder(hi) < budget && hi < 700) hi *= 1.5;
      for (let i = 0; i < 70; i++) {
        const mid = (lo + hi) / 2;
        if (expRemainder(mid) > budget) hi = mid;
        else lo = mid;
      }
      sublevelT = hi;
      Lbase = mu + stiff * Math.exp(hi);
    }
    const L = Math.max(mu, Lbase * c.lFactor);
    const A = [
      [Math.sqrt(mu) * co, Math.sqrt(mu) * si],
      [-Math.sqrt(mu * c.kappa) * si, Math.sqrt(mu * c.kappa) * co],
    ];
    const b = A.map((row) => dot(row, c.center));
    return { c, f, g, h, local, rotate, curvature, mu, L, Lbase, globalSmooth, sublevelT, A, b, optimum: c.center.slice() };
  }
  const rho = 1 + Math.SQRT2;
  function silverMultiplier(step, periodPower = 0) {
    let index = step + 1;
    if (periodPower > 0) index = (step % (2 ** periodPower - 1)) + 1;
    let v = 0;
    while (index % 2 === 0) {
      v++;
      index /= 2;
    }
    return 1 + rho ** (v - 1);
  }
  function parameters(p, c) {
    const q = Math.sqrt(p.L / p.mu),
      beta = (q - 1) / (q + 1);
    return {
      gdAlpha: c.gdScale / p.L,
      hbAlpha: (c.hbScale * 4) / (Math.sqrt(p.L) + Math.sqrt(p.mu)) ** 2,
      hbBeta: c.hbAuto ? beta * beta : c.hbBeta,
      nagAlpha: c.nagScale / p.L,
      nagBeta: c.nagAuto ? beta : c.nagBeta,
    };
  }
  function makeOracle(p) {
    const counts = { f: 0, g: 0, h: 0, hv: 0, solve: 0 };
    const cache = new Map();
    function evaluate(kind, x) {
      const key = `${x[0]},${x[1]}`;
      let entry = cache.get(key);
      if (!entry) {
        entry = {};
        cache.set(key, entry);
      }
      if (!(kind in entry)) {
        entry[kind] = p[kind](x);
        counts[kind]++;
      }
      return entry[kind];
    }
    return { counts, f: (x) => evaluate("f", x), g: (x) => evaluate("g", x), h: (x) => evaluate("h", x) };
  }
  function armijo(o, x, d, fx, gx, start = 1) {
    const slope = dot(gx, d);
    if (!(slope < 0)) return { ok: false, reason: "非下降方向", trials: 0 };
    let alpha = start;
    for (let i = 0; i < 60; i++) {
      const next = add(x, d, alpha),
        value = o.f(next);
      if (Number.isFinite(value) && value <= fx + 1e-4 * alpha * slope) return { ok: true, alpha, x: next, trials: i + 1 };
      alpha *= 0.5;
    }
    return { ok: false, reason: "线搜索未通过", trials: 60 };
  }
  function strongWolfe(o, x, d, fx, gx) {
    const d0 = dot(gx, d),
      c1 = 1e-4,
      c2 = 0.1;
    let trials = 0;
    if (!(d0 < 0)) return { ok: false, reason: "非下降方向", trials };
    function point(a) {
      const xx = add(x, d, a),
        f = o.f(xx);
      trials++;
      return { a, x: xx, f, der: Number.isFinite(f) ? dot(o.g(xx), d) : Infinity };
    }
    const origin = { a: 0, x, f: fx, der: d0 };
    function zoom(lo, hi) {
      for (let j = 0; j < 65; j++) {
        const mid = point((lo.a + hi.a) / 2);
        if (!Number.isFinite(mid.f) || mid.f > fx + c1 * mid.a * d0 || mid.f >= lo.f) hi = mid;
        else {
          if (Math.abs(mid.der) <= -c2 * d0) return { ok: true, alpha: mid.a, x: mid.x, trials };
          if (mid.der * (hi.a - lo.a) >= 0) hi = lo;
          lo = mid;
        }
        if (Math.abs(hi.a - lo.a) <= 1e-16 * Math.max(1, Math.abs(lo.a))) break;
      }
      return { ok: false, reason: "Wolfe 搜索达到数值限度", trials };
    }
    let prev = origin,
      a = 1;
    for (let i = 0; i < 30; i++) {
      const curr = point(a);
      if (!Number.isFinite(curr.f) || curr.f > fx + c1 * a * d0 || (i > 0 && curr.f >= prev.f)) return zoom(prev, curr);
      if (Math.abs(curr.der) <= -c2 * d0) return { ok: true, alpha: a, x: curr.x, trials };
      if (curr.der >= 0) return zoom(curr, prev);
      prev = curr;
      a *= 2;
    }
    return { ok: false, reason: "Wolfe 搜索未找到区间", trials };
  }
  function run(p, input, id) {
    const c = normalize(input),
      par = parameters(p, c),
      o = makeOracle(p);
    let x = c.x0.slice(),
      prev = x.slice(),
      gx = o.g(x),
      fx = o.f(x),
      d = scale(gx, -1);
    const f0 = fx,
      tol = 10 ** -c.tolExp;
    const path = [],
      result = { id, path, status: "budget", reason: "达到迭代预算", firstHit: null, exceededL: false, failedAt: null };
    const value = (r) => r[c.criterion];
    function record(k, extra = {}) {
      const r = {
        k,
        x: x.slice(),
        f: fx,
        rel: f0 > 0 ? fx / f0 : fx === 0 ? 0 : Infinity,
        g: gx.slice(),
        gn: norm(gx),
        dist: norm(sub(x, p.optimum)),
        alpha: null,
        beta: 0,
        y: null,
        restarted: false,
        trials: 0,
        localL: p.curvature(x),
        counts: { ...o.counts },
        ...extra,
      };
      path.push(r);
      if (r.localL > p.L * (1 + 1e-10)) result.exceededL = true;
      if (result.firstHit === null && value(r) <= tol) result.firstHit = k;
      return r;
    }
    let last = record(0);
    for (let k = 0; k < c.steps; k++) {
      if (c.stopAtTol && value(last) <= tol) {
        result.status = "converged";
        result.reason = "达到所选精度";
        break;
      }
      if (last.gn === 0 || fx === 0 || dot(gx, gx) === 0) {
        result.status = "precision";
        result.reason = "梯度或目标差达到浮点数值零";
        break;
      }
      let next,
        alpha = 0,
        beta = 0,
        y = null,
        restarted = false,
        trials = 0;
      if (id === "gd" || id === "silver") {
        alpha = id === "silver" ? (c.silverScale * silverMultiplier(k, c.silverPeriod)) / p.L : par.gdAlpha;
        if (id === "gd" && c.gdMode === "exact" && c.problem === "ls") {
          o.counts.hv++;
          alpha = dot(gx, gx) / dot(gx, mv(p.h(x), gx));
        } else if (id === "gd" && c.gdMode !== "fixed") {
          const ls = armijo(o, x, scale(gx, -1), fx, gx, par.gdAlpha);
          trials = ls.trials;
          if (!ls.ok) {
            result.status = "stalled";
            result.reason = ls.reason;
            break;
          }
          alpha = ls.alpha;
        }
        next = add(x, gx, -alpha);
      } else if (id === "hb") {
        alpha = par.hbAlpha;
        beta = par.hbBeta;
        next = add(add(x, gx, -alpha), sub(x, prev), beta);
      } else if (id === "nag") {
        alpha = par.nagAlpha;
        beta = par.nagBeta;
        y = add(x, sub(x, prev), beta);
        next = add(y, o.g(y), -alpha);
        if (c.nagRestart && dot(sub(y, next), sub(next, x)) > 0) restarted = true;
      } else if (id === "cg") {
        if (!(dot(gx, d) < 0)) {
          d = scale(gx, -1);
          restarted = true;
        }
        if (c.problem === "ls") {
          o.counts.hv++;
          const denom = dot(d, mv(p.h(x), d));
          alpha = -dot(gx, d) / denom;
          next = add(x, d, alpha);
        } else {
          const ls = strongWolfe(o, x, d, fx, gx);
          trials = ls.trials;
          if (!ls.ok) {
            result.status = "stalled";
            result.reason = ls.reason;
            break;
          }
          alpha = ls.alpha;
          next = ls.x;
        }
      } else if (id === "newton") {
        const H = o.h(x),
          det = H[0] * H[2] - H[1] * H[1];
        o.counts.solve++;
        if (!(det > 0) || !Number.isFinite(det)) {
          result.status = "stalled";
          result.reason = "Hessian 无法稳定求解";
          break;
        }
        const dn = [(-H[2] * gx[0] + H[1] * gx[1]) / det, (H[1] * gx[0] - H[0] * gx[1]) / det];
        alpha = c.newtonScale;
        if (c.newtonMode === "armijo") {
          const ls = armijo(o, x, dn, fx, gx, alpha);
          trials = ls.trials;
          if (!ls.ok) {
            result.status = "stalled";
            result.reason = ls.reason;
            break;
          }
          alpha = ls.alpha;
        }
        next = add(x, dn, alpha);
      }
      if (!finiteVec(next) || norm(next) > 1e10) {
        result.status = "diverged";
        result.reason = "迭代点溢出或范数超过 10¹⁰";
        result.failedAt = k + 1;
        break;
      }
      const fn = o.f(next),
        gn = o.g(next);
      if (!Number.isFinite(fn) || !finiteVec(gn) || fn > Math.max(1, f0) * 1e20) {
        result.status = "diverged";
        result.reason = "目标/梯度溢出，或目标增长超过 10²⁰ 倍";
        result.failedAt = k + 1;
        break;
      }
      if (id === "cg") {
        const denom = dot(gx, gx);
        beta = c.problem === "ls" || c.cgFormula === "fr" ? dot(gn, gn) / denom : Math.max(0, dot(gn, sub(gn, gx)) / denom);
        if (c.problem !== "ls" && c.cgRestart > 0 && (k + 1) % c.cgRestart === 0) {
          beta = 0;
          restarted = true;
        }
        d = add(scale(gn, -1), d, beta);
      }
      const stepNorm = norm(sub(next, x));
      prev = id === "nag" && restarted ? next.slice() : x;
      x = next;
      fx = fn;
      gx = gn;
      last = record(k + 1, { alpha, beta, y, restarted, trials, stepNorm });
      if (stepNorm === 0) {
        result.status = "precision";
        result.reason = "浮点精度下迭代点不再变化";
        break;
      }
    }
    if (result.status === "budget" && value(path.at(-1)) <= tol) {
      result.status = "converged";
      result.reason = "最终点达到所选精度";
    }
    result.counts = { ...o.counts };
    path.at(-1).counts = { ...o.counts };
    return result;
  }
  function solveAll(input) {
    const c = normalize(input),
      problem = makeProblem(c);
    return { config: c, problem, runs: METHODS.map((m) => run(problem, c, m.id)) };
  }
  function cost(record, c) {
    const n = record.counts;
    return n.f + c.weightG * n.g + c.weightH * n.h + n.hv + c.weightSolve * n.solve;
  }
  root.OptLab = {
    METHODS,
    DEFAULTS,
    normalize,
    makeProblem,
    silverMultiplier,
    parameters,
    run,
    solveAll,
    cost,
    dot,
    norm,
    mv,
    sub,
    add,
    logCosh,
    expRemainder,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = root.OptLab;
})(typeof globalThis !== "undefined" ? globalThis : this);
