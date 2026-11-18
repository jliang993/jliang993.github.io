/* Mathematical models added while resolving the lecture 03 review. */
(function (root, factory) {
  "use strict";
  const nonquadratic =
    root.ChapterNonquadratic || (typeof require === "function" ? require("../../assets/teaching/math6015/chapter-nonquadratic.js") : null);
  const api = factory(nonquadratic);
  root.LectureReviewModels = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (nonquadratic) {
  "use strict";

  const controls = Object.freeze({
    convexPoint: { min: -2, max: 2, step: 0.05, value: 0.8 },
    preconditionerQ: { min: 0.25, max: 32, step: 0.25, value: 8 },
    newtonStart: { min: 0.1, max: 2.5, step: 0.05, value: 1.1 },
    affineScale: { min: 0.25, max: 4, step: 0.05, value: 2 },
    affineAngle: { min: -Math.PI, max: Math.PI, step: 0.05, value: 0.55 },
  });

  const dot = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0);
  const norm = (x) => Math.hypot(...x);
  const add = (a, b, scale) => a.map((value, i) => value + scale * b[i]);
  const transpose = (A) => A[0].map((_, j) => A.map((row) => row[j]));
  const matVec = (A, x) => A.map((row) => dot(row, x));
  const matMul = (A, B) => A.map((row) => transpose(B).map((column) => dot(row, column)));
  const matrixNorm = (A) => Math.hypot(...A.flat());
  const matrixSubtract = (A, B) => A.map((row, i) => row.map((value, j) => value - B[i][j]));
  function solve2(A, b) {
    const determinant = A[0][0] * A[1][1] - A[0][1] * A[1][0];
    if (!Number.isFinite(determinant) || Math.abs(determinant) < Number.EPSILON) return null;
    return [(A[1][1] * b[0] - A[0][1] * b[1]) / determinant, (A[0][0] * b[1] - A[1][0] * b[0]) / determinant];
  }
  function eigenvalues2(A) {
    const center = (A[0][0] + A[1][1]) / 2;
    const radius = Math.hypot((A[0][0] - A[1][1]) / 2, (A[0][1] + A[1][0]) / 2);
    return [center - radius, center + radius];
  }
  function finiteNumber(value, label) {
    if (!Number.isFinite(value)) throw new RangeError(label + " must be finite");
    return value;
  }
  function bounded(value, min, max, label) {
    finiteNumber(value, label);
    if (value < min || value > max) throw new RangeError(label + " must be in [" + min + ", " + max + "]");
    return value;
  }
  function equation920() {
    if (!nonquadratic || typeof nonquadratic.evaluate !== "function") {
      throw new Error("ChapterNonquadratic must be loaded before using equation (9.20) models");
    }
    return nonquadratic;
  }

  /* f(t)=t^4/4+t^2/2 has f''(t)=3t^2+1 >= 1 globally. */
  function convexLowerBounds(a = controls.convexPoint.value) {
    finiteNumber(a, "a");
    const m = 1;
    const f = a ** 4 / 4 + a ** 2 / 2;
    const g = a ** 3 + a;
    const H = 3 * a ** 2 + 1;
    const tangentCoefficients = { quadratic: 0, linear: g, constant: f - g * a };
    const strongCoefficients = {
      quadratic: m / 2,
      linear: g - m * a,
      constant: f - g * a + (m * a * a) / 2,
    };
    const polynomial = (coefficients, t) => coefficients.quadratic * t * t + coefficients.linear * t + coefficients.constant;
    return {
      a,
      f,
      g,
      H,
      m,
      curvatureMinimum: m,
      objective: (t) => t ** 4 / 4 + t ** 2 / 2,
      curvature: (t) => 3 * t * t + 1,
      tangent: (t) => polynomial(tangentCoefficients, t),
      strongLower: (t) => polynomial(strongCoefficients, t),
      tangentCoefficients,
      strongCoefficients,
    };
  }

  function armijo(evaluate, point, value, direction, alpha, beta, t0) {
    const slope = dot(value.g, direction),
      trials = [];
    if (!(slope < 0)) return { accepted: false, slope, trials };
    let step = t0;
    for (let j = 0; j < 240; j++, step *= beta) {
      const candidate = add(point, direction, step);
      const next = evaluate(candidate);
      const bound = value.f + alpha * step * slope;
      const accepted = Number.isFinite(next.f) && next.f <= bound;
      trials.push({ step, f: next.f, gap: next.gap, bound, accepted });
      if (accepted) return { accepted, step, point: candidate, value: next, slope, trials };
    }
    return { accepted: false, slope, trials };
  }

  function transformedHessian(q) {
    const model = equation920(),
      H = model.evaluate(model.optimum).H;
    const inverseRoot = [
      [1 / Math.sqrt(2), 0],
      [0, 1 / Math.sqrt(q)],
    ];
    const matrix = matMul(matMul(inverseRoot, H), inverseRoot);
    const eigenvalues = eigenvalues2(matrix);
    return { matrix, eigenvalues, condition: eigenvalues[1] / eigenvalues[0] };
  }

  function preconditionedDescent(options) {
    options = options || {};
    const model = equation920();
    const q = bounded(
      options.q === undefined ? controls.preconditionerQ.value : options.q,
      controls.preconditionerQ.min,
      controls.preconditionerQ.max,
      "q"
    );
    const start = (options.start || [-1, 1]).map((value, i) => finiteNumber(value, "start[" + i + "]"));
    const alpha = bounded(options.alpha === undefined ? 0.1 : options.alpha, Number.EPSILON, 0.499999, "alpha");
    const beta = bounded(options.beta === undefined ? 0.7 : options.beta, Number.EPSILON, 0.999999, "beta");
    const t0 = finiteNumber(options.t0 === undefined ? 1 : options.t0, "t0");
    const tolerance = finiteNumber(options.tolerance === undefined ? 1e-9 : options.tolerance, "tolerance");
    const maxIterations = Math.max(0, Math.min(200, Math.floor(options.maxIterations === undefined ? 80 : options.maxIterations)));
    if (!(t0 > 0) || !(tolerance > 0)) throw new RangeError("t0 and tolerance must be positive");
    const rootP = [Math.sqrt(2), Math.sqrt(q)];
    const path = [];
    let point = start.slice(),
      value = model.evaluate(point),
      status = "iteration limit";
    for (let k = 0; k <= maxIterations; k++) {
      const record = {
        k,
        x: point.slice(),
        z: point.map((entry, i) => rootP[i] * entry),
        f: value.f,
        gap: value.gap,
        g: value.g.slice(),
        gnorm: norm(value.g),
      };
      path.push(record);
      if (record.gnorm <= tolerance) {
        status = "gradient tolerance";
        break;
      }
      if (k === maxIterations) break;
      const direction = [-value.g[0] / 2, -value.g[1] / q];
      record.direction = direction;
      record.directionalDerivative = dot(value.g, direction);
      const search = armijo(model.evaluate, point, value, direction, alpha, beta, t0);
      record.step = search.step;
      record.trials = search.trials;
      record.trialCount = search.trials.length;
      if (!search.accepted) {
        status = "line search failed";
        break;
      }
      point = search.point;
      value = search.value;
    }
    return {
      q,
      P: [
        [2, 0],
        [0, q],
      ],
      rootP,
      start,
      alpha,
      beta,
      t0,
      tolerance,
      path,
      status,
      transformedHessian: transformedHessian(q),
    };
  }

  /* Three Newton tangents to F(x)=f'(x)=exp(x)-1, hence four iterates. */
  function newtonLinearizations(options) {
    options = options || {};
    const x0 = finiteNumber(options.x0 === undefined ? controls.newtonStart.value : options.x0, "x0");
    const points = [x0],
      lines = [];
    for (let k = 0; k < 3; k++) {
      const x = points[k],
        exponential = Math.exp(x);
      const gradient = exponential - 1,
        slope = exponential;
      const intercept = gradient - slope * x;
      const root = -intercept / slope;
      lines.push({ k, x, gradient, slope, intercept, root });
      points.push(root);
    }
    const states = points.map((x, k) => ({
      k,
      x,
      objective: Math.exp(x) - x,
      gradient: Math.exp(x) - 1,
      hessian: Math.exp(x),
    }));
    return { x0, solution: 0, points, states, lines };
  }

  function affineMatrix(theta, scale) {
    const cosine = Math.cos(theta),
      sine = Math.sin(theta);
    return [
      [scale * cosine, -sine],
      [scale * sine, cosine],
    ];
  }
  function affineMap(A, b, y) {
    return matVec(A, y).map((value, i) => value + b[i]);
  }
  function inverseAffineMap(A, b, x) {
    const shifted = x.map((value, i) => value - b[i]);
    return solve2(A, shifted);
  }
  function transformEvaluation(model, A, b, y) {
    const x = affineMap(A, b, y),
      base = model.evaluate(x),
      AT = transpose(A);
    return {
      f: base.f,
      gap: base.gap,
      x,
      g: matVec(AT, base.g),
      H: matMul(matMul(AT, base.H), A),
      base,
    };
  }
  function newtonRun(evaluate, start, options) {
    const path = [];
    let point = start.slice(),
      value = evaluate(point),
      status = "iteration limit";
    for (let k = 0; k <= options.maxIterations; k++) {
      const direction = solve2(
        value.H,
        value.g.map((entry) => -entry)
      );
      const decrementSquared = direction ? Math.max(0, -dot(value.g, direction)) : Infinity;
      const record = {
        k,
        point: point.slice(),
        f: value.f,
        gap: value.gap,
        g: value.g.slice(),
        H: value.H.map((row) => row.slice()),
        gnorm: norm(value.g),
        direction,
        decrement: Math.sqrt(decrementSquared),
      };
      path.push(record);
      if (record.decrement <= options.tolerance) {
        status = "Newton decrement tolerance";
        break;
      }
      if (!direction || !direction.every(Number.isFinite)) {
        status = "singular Hessian";
        break;
      }
      if (k === options.maxIterations) break;
      record.directionalDerivative = dot(value.g, direction);
      const search = armijo(evaluate, point, value, direction, options.alpha, options.beta, options.t0);
      record.step = search.step;
      record.trials = search.trials;
      record.trialCount = search.trials.length;
      if (!search.accepted) {
        status = "line search failed";
        break;
      }
      point = search.point;
      value = search.value;
    }
    return { path, status };
  }

  function affineNewtonDemo(options) {
    options = options || {};
    const model = equation920();
    const theta = bounded(
      options.theta === undefined ? controls.affineAngle.value : options.theta,
      controls.affineAngle.min,
      controls.affineAngle.max,
      "theta"
    );
    const scale = bounded(
      options.scale === undefined ? controls.affineScale.value : options.scale,
      controls.affineScale.min,
      controls.affineScale.max,
      "scale"
    );
    const b = (options.b || [0.3, -0.2]).map((value, i) => finiteNumber(value, "b[" + i + "]"));
    const startX = (options.startX || [-1, 1]).map((value, i) => finiteNumber(value, "startX[" + i + "]"));
    const alpha = bounded(options.alpha === undefined ? 0.1 : options.alpha, Number.EPSILON, 0.499999, "alpha");
    const beta = bounded(options.beta === undefined ? 0.7 : options.beta, Number.EPSILON, 0.999999, "beta");
    const t0 = finiteNumber(options.t0 === undefined ? 1 : options.t0, "t0");
    const tolerance = finiteNumber(options.tolerance === undefined ? 1e-8 : options.tolerance, "tolerance");
    const maxIterations = Math.max(0, Math.min(80, Math.floor(options.maxIterations === undefined ? 30 : options.maxIterations)));
    if (!(t0 > 0) || !(tolerance > 0)) throw new RangeError("t0 and tolerance must be positive");
    const A = affineMatrix(theta, scale),
      startY = inverseAffineMap(A, b, startX);
    const runOptions = { alpha, beta, t0, tolerance, maxIterations };
    const original = newtonRun(model.evaluate, startX, runOptions);
    const transformedEvaluate = (y) => transformEvaluation(model, A, b, y);
    const transformed = newtonRun(transformedEvaluate, startY, runOptions);
    const originalPath = original.path.map((record) => ({ ...record, x: record.point.slice() }));
    const transformedPath = transformed.path.map((record) => ({ ...record, y: record.point.slice() }));
    const mappedPath = transformed.path.map((record) => ({
      k: record.k,
      y: record.point.slice(),
      x: affineMap(A, b, record.point),
      f: record.f,
      gap: record.gap,
      step: record.step,
      decrement: record.decrement,
    }));
    const count = Math.min(originalPath.length, mappedPath.length),
      discrepancies = [];
    const directionRelations = [];
    for (let k = 0; k < count; k++) {
      discrepancies.push(norm(originalPath[k].x.map((value, i) => value - mappedPath[k].x[i])));
      if (originalPath[k].direction && transformedPath[k].direction) {
        const mappedDirection = matVec(A, transformedPath[k].direction);
        directionRelations.push({
          k,
          original: originalPath[k].direction.slice(),
          transformed: transformedPath[k].direction.slice(),
          mapped: mappedDirection,
          discrepancy: norm(originalPath[k].direction.map((value, i) => value - mappedDirection[i])),
        });
      }
    }
    const xEvaluation = model.evaluate(startX),
      yEvaluation = transformedEvaluate(startY),
      AT = transpose(A);
    const expectedGradient = matVec(AT, xEvaluation.g);
    const expectedHessian = matMul(matMul(AT, xEvaluation.H), A);
    const derivativeIdentity = {
      gradientX: xEvaluation.g.slice(),
      gradientY: yEvaluation.g.slice(),
      expectedGradientY: expectedGradient,
      hessianX: xEvaluation.H.map((row) => row.slice()),
      hessianY: yEvaluation.H.map((row) => row.slice()),
      expectedHessianY: expectedHessian,
      gradientError: norm(yEvaluation.g.map((value, i) => value - expectedGradient[i])),
      hessianError: matrixNorm(matrixSubtract(yEvaluation.H, expectedHessian)),
    };
    return {
      A,
      b,
      theta,
      scale,
      startX,
      startY,
      alpha,
      beta,
      t0,
      tolerance,
      originalPath,
      transformedPath,
      mappedPath,
      directionRelations,
      derivativeIdentity,
      originalStatus: original.status,
      transformedStatus: transformed.status,
      pathLengthDifference: originalPath.length - transformedPath.length,
      maxDiscrepancy: Math.max(0, ...discrepancies),
      maxDirectionDiscrepancy: Math.max(0, ...directionRelations.map((relation) => relation.discrepancy)),
    };
  }

  return {
    controls,
    convexLowerBounds,
    preconditionedDescent,
    transformedHessian,
    newtonLinearizations,
    affineNewtonDemo,
  };
});
