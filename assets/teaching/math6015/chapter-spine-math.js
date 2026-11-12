/* Shared textbook problem families. Small instances, actual iterative solvers. */
(function (root) {
  "use strict";
  const C = root.ChapterMath || (typeof require === "function" ? require("./chapter-math.js") : null);
  const { dot, norm, add, scale, solve, mv } = C;
  const transpose = (A) => A[0].map((_, j) => A.map((r) => r[j]));
  const at = (A, x) => mv(transpose(A), x);
  const weighted = (A, w) => A[0].map((_, i) => A[0].map((_, j) => A.reduce((v, a, k) => v + w[k] * a[i] * a[j], 0)));
  const cache = new Map();
  function polygon(s) {
    const A = [
        [1, 0],
        [0, 1],
        [-1, 0],
        [0, -1],
        [0.8, 0.6],
        [-0.6, 0.8],
      ],
      b = [2, 1.5, 2, 1.5, s.cut, 1.6],
      c = [Math.cos((s.angle * Math.PI) / 180), Math.sin((s.angle * Math.PI) / 180)];
    const slack = (x) => b.map((v, i) => v - dot(A[i], x)),
      vertices = [];
    for (let i = 0; i < A.length; i++)
      for (let j = 0; j < i; j++) {
        const x = solve([A[i], A[j]], [b[i], b[j]]);
        if (x && Math.min(...slack(x)) >= -1e-9 && !vertices.some((v) => norm(add(v, x, -1)) < 1e-8)) vertices.push(x);
      }
    const center = vertices.reduce((v, x) => add(v, scale(x, 1 / vertices.length)), [0, 0]);
    vertices.sort((a, b) => Math.atan2(a[1] - center[1], a[0] - center[0]) - Math.atan2(b[1] - center[1], b[0] - center[0]));
    const optimum = vertices.reduce((v, x) => (dot(c, x) < dot(c, v) ? x : v)),
      pstar = dot(c, optimum);
    const optimalVertices = vertices.filter((x) => Math.abs(dot(c, x) - pstar) < 1e-9);
    return { A, b, c, slack, vertices, optimum, pstar, optimalVertices };
  }
  function interiorStart(P, x) {
    let factor = 1;
    P.A.forEach((a, i) => {
      const ax = dot(a, x);
      if (ax > 0) factor = Math.min(factor, (0.92 * P.b[i]) / ax);
    });
    return scale(x, factor);
  }
  function barrier(P, x, t = 1) {
    const sl = P.slack(x);
    if (sl.some((v) => v <= 0)) return null;
    return {
      x: x.slice(),
      slack: sl,
      f: t * dot(P.c, x) - sl.reduce((v, z) => v + Math.log(z), 0),
      g: add(
        scale(P.c, t),
        at(
          P.A,
          sl.map((v) => 1 / v)
        )
      ),
      H: weighted(
        P.A,
        sl.map((v) => 1 / v ** 2)
      ),
    };
  }
  function search(evaluate, x, d, q, s) {
    let t = 1;
    const slope = dot(q.g, d),
      trials = [];
    for (let j = 0; j < 100; j++) {
      const next = evaluate(add(x, d, t)),
        accepted = !!next && next.f <= q.f + s.alpha * t * slope + 2e-14 * Math.max(1, Math.abs(q.f));
      trials.push({ t, f: next?.f ?? null, accepted, domain: !!next });
      if (accepted) return { t, next, trials, slope, d };
      t *= s.beta;
    }
    return null;
  }
  function minimize(P, t, start, s, method = "newton", limit = 100) {
    let x = start.slice(),
      trials = 0;
    const path = [];
    for (let k = 0; k <= limit; k++) {
      const q = barrier(P, x, t);
      if (!q) throw Error("Barrier iterate outside domain");
      const rec = { ...q, k, grad: norm(q.g), primal: 0, dual: norm(q.g), residual: norm(q.g), trials };
      path.push(rec);
      if (rec.grad < 1e-8) {
        rec.status = "已收敛";
        break;
      }
      if (k === limit) {
        rec.status = "达到迭代上限";
        break;
      }
      let d;
      if (method === "gd") d = scale(q.g, -1);
      else if (method === "scaled") d = [-(s.scaling ** 2) * q.g[0], -q.g[1]];
      else if (method === "newtonScaled") {
        const z = s.scaling,
          H = [
            [z * z * q.H[0][0], z * q.H[0][1]],
            [z * q.H[1][0], q.H[1][1]],
          ],
          v = solve(H, [-z * q.g[0], -q.g[1]]);
        d = v && [z * v[0], v[1]];
      } else d = solve(q.H, scale(q.g, -1));
      if (!d) {
        rec.status = "数值线性系统停滞";
        break;
      }
      const step = search((z) => barrier(P, z, t), x, d, q, s);
      rec.step = step;
      if (!step || norm(scale(d, step.t)) < 1e-15) {
        rec.status = "数值精度限制";
        break;
      }
      trials += step.trials.length;
      x = step.next.x;
    }
    return path;
  }
  function centers(P) {
    let x = [0, 0];
    const path = [];
    for (let j = 0; j <= 42; j++) {
      const t = 10 ** (-2 + j / 6),
        r = minimize(P, t, x, { alpha: 0.1, beta: 0.5, scaling: 1 }, "newton", 60).at(-1);
      x = r.x;
      path.push({ x, t, dual: r.grad / t });
    }
    return path;
  }
  function contours(P, t, opt) {
    const f = barrier(P, opt, t).f;
    return [0.08, 0.3, 1, 2.5, 5, 9].map((level) =>
      Array.from({ length: 101 }, (_, j) => {
        const d = [Math.cos((j * Math.PI) / 50), Math.sin((j * Math.PI) / 50)];
        let hi = Infinity;
        const sl = P.slack(opt);
        P.A.forEach((a, i) => {
          const ad = dot(a, d);
          if (ad > 0) hi = Math.min(hi, sl[i] / ad);
        });
        let lo = 0;
        hi *= 1 - 1e-12;
        for (let k = 0; k < 28; k++) {
          const mid = (lo + hi) / 2,
            q = barrier(P, add(opt, d, mid), t);
          if (!q || q.f > f + level) hi = mid;
          else lo = mid;
        }
        return add(opt, d, (lo + hi) / 2);
      })
    );
  }
  function equalityProblem(kind, s) {
    if (kind === "center") {
      const A = [[1, s.weight, 1.4]],
        b = [s.budget],
        xstar = A[0].map((a) => s.budget / (3 * a));
      return { kind, A, b, xstar, nustar: [3 / s.budget] };
    }
    const A = [
        [1, 1, 1],
        [-1, 0, 1],
      ],
      b = [1, s.mean];
    let lo = -20,
      hi = 20;
    for (let i = 0; i < 90; i++) {
      const z = (lo + hi) / 2,
        ex = [Math.exp(-z), 1, Math.exp(z)],
        sum = ex.reduce((a, b) => a + b),
        mean = (ex[2] - ex[0]) / sum;
      if (mean < s.mean) lo = z;
      else hi = z;
    }
    const theta = (lo + hi) / 2,
      ex = [Math.exp(-theta), 1, Math.exp(theta)],
      Z = ex.reduce((a, b) => a + b);
    return { kind, A, b, xstar: ex.map((v) => v / Z), nustar: [Math.log(Z) - 1, -theta] };
  }
  function primal(E, x) {
    if (x.some((v) => v <= 0 || !Number.isFinite(v))) return null;
    return E.kind === "center"
      ? { f: -x.reduce((v, z) => v + Math.log(z), 0), g: x.map((v) => -1 / v), h: x.map((v) => 1 / v ** 2) }
      : { f: x.reduce((v, z) => v + z * Math.log(z), 0), g: x.map((v) => 1 + Math.log(v)), h: x.map((v) => 1 / v) };
  }
  function dual(E, nu) {
    const y = at(E.A, nu);
    if (E.kind === "center" && y.some((v) => v <= 0)) return null;
    const x = y.map((v) => (E.kind === "center" ? 1 / v : Math.exp(-1 - v)));
    if (x.some((v) => !Number.isFinite(v) || v <= 0)) return null;
    const q = dot(E.b, nu) + (E.kind === "center" ? y.reduce((v, z) => v - 1 - Math.log(z), 0) : x.reduce((v, z) => v + z, 0));
    const weights = x.map((v) => (E.kind === "center" ? v * v : v)),
      p = E.b.length;
    return {
      f: q,
      g: add(E.b, mv(E.A, x), -1),
      H: Array.from({ length: p }, (_, i) => Array.from({ length: p }, (_, j) => x.reduce((v, _, k) => v + weights[k] * E.A[i][k] * E.A[j][k], 0))),
      x,
    };
  }
  function eqRecord(E, x, nu, k, trials) {
    const q = primal(E, x),
      rp = add(mv(E.A, x), E.b, -1),
      rd = add(q.g, at(E.A, nu)),
      du = dual(E, nu);
    return {
      ...q,
      x: x.slice(),
      nu: nu.slice(),
      k,
      primal: norm(rp),
      dual: norm(rd),
      residual: Math.hypot(norm(rp), norm(rd)),
      rp,
      rd,
      trials,
      lower: du ? -du.f : null,
    };
  }
  function eqRun(E, s, method) {
    let x = E.kind === "center" ? [s.px, s.py, s.start3] : [s.px, 1 - s.px - s.py, s.py],
      nu = E.kind === "center" ? [s.nu0] : [s.nu0, 0];
    if (method === "feasible") {
      if (E.kind === "center") x = scale(x, E.b[0] / dot(E.A[0], x));
      else {
        const middle = Math.min(x[1], 0.9 * (1 - Math.abs(s.mean)));
        x = [(1 - middle - s.mean) / 2, middle, (1 - middle + s.mean) / 2];
      }
      const q = primal(E, x),
        n = E.b.length,
        AA = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => dot(E.A[i], E.A[j])));
      nu = solve(AA, scale(mv(E.A, q.g), -1));
    }
    if (method === "dual") x = dual(E, nu).x;
    const path = [];
    let trials = 0;
    for (let k = 0; k <= 60; k++) {
      const r = eqRecord(E, x, nu, k, trials);
      path.push(r);
      if (r.residual < 1e-9) {
        r.status = "已收敛";
        break;
      }
      if (k === 60) {
        r.status = "达到迭代上限";
        break;
      }
      let dx,
        dnu,
        step,
        accepted = false;
      if (method === "dual") {
        const q = dual(E, nu);
        dnu = solve(q.H, scale(q.g, -1));
        if (!dnu) {
          r.status = "数值线性系统停滞";
          break;
        }
        step = search(
          (v) => {
            const z = dual(E, v);
            return z && { ...z, x: v };
          },
          nu,
          dnu,
          q,
          s
        );
        if (step) {
          nu = step.next.x;
          x = dual(E, nu).x;
          accepted = true;
        }
      } else {
        const n = 3,
          p = E.b.length,
          M = Array.from({ length: n + p }, (_, i) =>
            Array.from({ length: n + p }, (_, j) => (i < n && j < n ? (i === j ? r.h[i] : 0) : i < n ? E.A[j - n][i] : j < n ? E.A[i - n][j] : 0))
          );
        const direction = solve(M, [...scale(r.rd, -1), ...scale(r.rp, -1)]);
        if (!direction) {
          r.status = "数值线性系统停滞";
          break;
        }
        dx = direction.slice(0, n);
        dnu = direction.slice(n);
        let t = 1;
        const probes = [];
        for (let j = 0; j < 100; j++) {
          const xn = add(x, dx, t),
            nn = add(nu, dnu, t),
            q = primal(E, xn),
            next = q && eqRecord(E, xn, nn, k + 1, 0);
          const ok =
            !!q && (method === "feasible" ? q.f <= r.f + s.alpha * t * dot(r.g, dx) + 2e-14 : next.residual <= (1 - s.alpha * t) * r.residual);
          probes.push({ t, f: q?.f ?? null, residual: next?.residual ?? null, domain: !!q, accepted: ok });
          if (ok) {
            x = xn;
            nu = nn;
            step = { t, trials: probes, d: dx, slope: dot(r.g, dx) };
            accepted = true;
            break;
          }
          t *= s.beta;
        }
      }
      r.step = step;
      if (!accepted) {
        r.status = "数值精度限制";
        break;
      }
      trials += step.trials.length;
    }
    return path;
  }
  function lpRecord(P, x, lambda, k, meta = {}) {
    const sl = P.slack(x),
      rd = add(P.c, at(P.A, lambda)),
      eta = dot(sl, lambda);
    return {
      x: x.slice(),
      lambda: lambda.slice(),
      slack: sl,
      k,
      f: dot(P.c, x),
      gap: Math.max(0, dot(P.c, x) - P.pstar),
      dual: norm(rd),
      primal: Math.max(0, -Math.min(...sl)),
      eta,
      residual: Math.hypot(norm(rd), norm(sl.map((v, i) => v * lambda[i]))),
      ...meta,
    };
  }
  function lpBarrier(P, s, start) {
    let x = start.slice(),
      t = 10 ** s.logt0,
      outer = 0,
      trials = 0;
    const path = [];
    let rec;
    for (let k = 0; k <= 240; k++) {
      const q = barrier(P, x, t),
        d = solve(q.H, scale(q.g, -1));
      rec = lpRecord(
        P,
        x,
        q.slack.map((v) => 1 / (t * v)),
        k,
        { t, outer, trials }
      );
      path.push(rec);
      if (!d) {
        rec.status = "数值线性系统停滞";
        break;
      }
      const decrement = -dot(q.g, d),
        centered = decrement / 2 < 1e-12 && rec.dual < 1e-7;
      rec.centered = centered;
      rec.decrement = decrement;
      if (rec.gap < 1e-6 && rec.dual < 1e-6) {
        rec.status = "已收敛";
        break;
      }
      if (k === 240) {
        rec.status = "达到迭代上限";
        break;
      }
      if (centered) {
        t *= s.mu;
        outer++;
      }
      const cur = barrier(P, x, t),
        dir = solve(cur.H, scale(cur.g, -1));
      if (!dir) {
        rec.status = "数值线性系统停滞";
        break;
      }
      const step = search((v) => barrier(P, v, t), x, dir, cur, s);
      rec.step = step;
      if (!step) {
        rec.status = "数值精度限制";
        break;
      }
      trials += step.trials.length;
      x = step.next.x;
    }
    return path;
  }
  function lpPrimalDual(P, s, start) {
    let x = start.slice(),
      lambda = P.slack(x).map((v) => 1 / v),
      trials = 0;
    const path = [];
    for (let k = 0; k <= 240; k++) {
      const r = lpRecord(P, x, lambda, k, { trials });
      path.push(r);
      if (r.eta < 1e-6 && r.dual < 1e-6) {
        r.status = "已收敛";
        break;
      }
      if (k === 240) {
        r.status = "达到迭代上限";
        break;
      }
      const target = r.eta / (P.A.length * s.mu),
        v = lambda.map((l, i) => target / r.slack[i] - l),
        H = weighted(
          P.A,
          lambda.map((l, i) => l / r.slack[i])
        ),
        dx = solve(H, scale(add(add(P.c, at(P.A, lambda)), at(P.A, v)), -1));
      if (!dx) {
        r.status = "数值线性系统停滞";
        break;
      }
      const dl = add(
        v,
        mv(P.A, dx).map((z, i) => (lambda[i] * z) / r.slack[i])
      );
      const residual = (xx, ll) => Math.hypot(norm(add(P.c, at(P.A, ll))), norm(P.slack(xx).map((v, i) => v * ll[i] - target)));
      const r0 = residual(x, lambda),
        probes = [];
      let t = 0.99 * Math.min(1, ...dl.map((v, i) => (v < 0 ? -lambda[i] / v : 1))),
        ok = false;
      for (let j = 0; j < 100; j++) {
        const xn = add(x, dx, t),
          ln = add(lambda, dl, t),
          domain = Math.min(...P.slack(xn), ...ln) > 0,
          rn = domain ? residual(xn, ln) : null,
          accepted = domain && rn <= (1 - s.alpha * t) * r0;
        probes.push({ t, domain, residual: rn, accepted });
        if (accepted) {
          x = xn;
          lambda = ln;
          ok = true;
          break;
        }
        t *= s.beta;
      }
      r.step = { t, trials: probes, d: dx, target };
      if (!ok) {
        r.status = "数值精度限制";
        break;
      }
      trials += probes.length;
    }
    return path;
  }
  function calculate(id, s) {
    const keys =
      id === "barrierfamily"
        ? ["angle", "cut", "px", "py", "objective", "logt", "scaling", "alpha", "beta"]
        : id === "interiorfamily"
          ? ["angle", "cut", "px", "py", "logt0", "mu", "alpha", "beta"]
          : id === "centeringfamily"
            ? ["weight", "budget", "start3", "px", "py", "nu0", "alpha", "beta"]
            : ["mean", "px", "py", "nu0", "alpha", "beta"];
    const key = JSON.stringify([id, ...keys.map((k) => s[k])]);
    if (cache.has(key)) return cache.get(key);
    let data;
    if (id === "barrierfamily" || id === "interiorfamily") {
      const P = polygon(s),
        start = interiorStart(P, [s.px, s.py]);
      if (id === "barrierfamily") {
        const t = s.objective === "analytic" ? 0 : 10 ** s.logt,
          optimal = minimize(P, t, [0, 0], s, "newton", 80).at(-1),
          paths = {};
        for (const m of ["gd", "scaled", "newton", "newtonScaled"]) paths[m] = minimize(P, t, start, s, m, 100);
        data = { P, start, t, optimum: optimal.x, pstar: optimal.f, paths, contours: contours(P, t, optimal.x) };
      } else
        data = {
          P,
          start,
          optimum: P.optimum,
          pstar: P.pstar,
          paths: { barrier: lpBarrier(P, s, start), pd: lpPrimalDual(P, s, start) },
          centers: centers(P),
        };
    } else {
      const E = equalityProblem(id === "centeringfamily" ? "center" : "entropy", s),
        paths = {};
      for (const m of ["feasible", "infeasible", "dual"]) paths[m] = eqRun(E, s, m);
      data = { E, paths, optimum: E.xstar, pstar: primal(E, E.xstar).f };
    }
    cache.set(key, data);
    if (cache.size > 16) cache.delete(cache.keys().next().value);
    return data;
  }
  const api = { polygon, interiorStart, barrier, minimize, centers, equalityProblem, primal, dual, eqRun, lpBarrier, lpPrimalDual, calculate };
  root.ChapterSpineMath = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
