/* Additional textbook cases. Each card has its own model, controls, and diagnostics. */
(function (root) {
  "use strict";
  const C = root.ChapterMath || (typeof require === "function" ? require("./chapter-math.js") : null);
  const M = root.ChapterMoreMath || (typeof require === "function" ? require("./chapter-more-math.js") : null);
  const r = (key, label, min, max, step, value) => ({ key, label, min, max, step, value, type: "range" });
  const select = (key, label, options, value) => ({ key, label, options, value, type: "select" });
  const point = (kx, ky, label, x, y) => ({ kx, ky, label, x, y });
  const book = (section, page) => ({
    label: "Boyd & Vandenberghe · " + section + " · p. " + page,
    url: "https://web.stanford.edu/~boyd/cvxbook/bv_cvxbook.pdf#page=" + (page + 14),
  });
  const card = (id, chapter, short, title, intro, question, section, page, controls, extra = {}) => ({
    id,
    chapter,
    short,
    title,
    intro,
    question,
    ref: book(section, page),
    source: "教材模型 · 教学特例",
    controls,
    animate: controls.find((c) => c.type === "range").key,
    ...extra,
  });
  const iteration = (max = 60, value = 12) => r("k", "迭代进度 k", 0, max, 1, value);
  const view = () => select("view", "查看", ["path|几何轨迹", "error|收敛曲线"], "path");
  const defs = [
    card(
      "innerproduct",
      "00",
      "内积与正交投影",
      "内积如何度量方向上的分量？",
      "拖动向量 a、b，分解 b 在 a 上的投影和垂直余量。",
      "Cauchy–Schwarz 不等式何时取等号？零向量的夹角应如何处理？",
      "§A.1.1–A.1.2",
      633,
      [r("guide", "辅助线长度", 0.5, 2.5, 0.1, 1.5)],
      { points: [point("ax", "ay", "a", 1.6, 0.5), point("bx", "by", "b", 0.4, 1.8)] }
    ),
    card(
      "taylor",
      "00",
      "Taylor 局部模型",
      "一阶和二阶模型能相信多远？",
      "改变展开点与位移，比较指数函数、切线和二次近似。",
      "位移缩小时，两个近似的误差按什么数量级下降？",
      "§A.4.1–A.4.3",
      640,
      [r("a", "展开点 a", -1, 1, 0.05, 0), r("h", "位移 h", -1.5, 1.5, 0.025, 0.8)],
      { animate: "h" }
    ),
    card(
      "psd",
      "00",
      "Hessian 与正定性",
      "一个矩阵，决定谷底还是鞍点",
      "调整对角元与耦合项，观察等高线和最小特征值跨过零。",
      "半正定为什么不保证唯一极小点？",
      "§A.5.2",
      646,
      [r("diag", "H₂₂", -2, 3, 0.05, 1), r("off", "H₁₂ = H₂₁", -2, 2, 0.025, 0.4)],
      { animate: "off" }
    ),
    card(
      "svd",
      "00",
      "奇异值与线性变换",
      "单位圆经过矩阵后变成什么？",
      "调节缩放和剪切，沿单位圆移动输入点，观察输出椭圆。",
      "椭圆半轴为什么对应奇异值，而不是一般矩阵的特征值？",
      "§A.5.4",
      648,
      [r("scale", "水平缩放", 0.15, 2.5, 0.05, 1.5), r("shear", "剪切系数", -2, 2, 0.05, 0.8), r("theta", "圆上角度（度）", 0, 360, 2, 40)],
      { animate: "theta" }
    ),
    card(
      "epigraph",
      "01",
      "上图与光滑最大值",
      "凸函数的上图为什么是凸集？",
      "拖动 (x,t) 检查上图成员关系；切换到 log-sum-exp 并调节温度。",
      "温度趋于零时，平滑函数与 |x| 的距离怎样变化？",
      "§3.1.7；§3.1.5",
      75,
      [select("mode", "函数", ["square|x²", "lse|光滑 max(x,−x)"], "lse"), r("tau", "平滑温度 τ", 0.08, 1.2, 0.02, 0.4)],
      { points: [point("px", "py", "(x,t)", 0.8, 1.5)], pointBounds: [-2, 2, 0, 4] }
    ),
    card(
      "perspective",
      "01",
      "透视与二次除线性",
      "为什么 x²/t 在 t>0 上仍然凸？",
      "拖动 (x,t)，观察透视函数的次水平集 x²≤ct。",
      "固定 t 的截面与固定 x 的截面分别是什么曲线？",
      "§3.2.6",
      89,
      [r("level", "次水平值 c", 0.2, 3, 0.05, 1)],
      { points: [point("px", "py", "(x,t)", 1, 1)], pointBounds: [-2, 2, 0.15, 3] }
    ),
    card(
      "conjugate",
      "01",
      "共轭函数与支撑线",
      "把斜率当作变量，构造共轭函数",
      "调节支撑线斜率 y 和试探点 x，查看 Fenchel–Young 间隙。",
      "为什么最优接触点满足 f′(x)=y？指数函数的共轭定义域是什么？",
      "§3.3",
      91,
      [select("mode", "函数", ["square|x²/2", "exp|exp(x)"], "square"), r("y", "斜率 y", 0.05, 2.5, 0.05, 1), r("x", "试探点 x", -1.5, 2, 0.05, 0.2)],
      { animate: "x" }
    ),
    card(
      "lp",
      "01",
      "线性规划",
      "转动目标，最优顶点怎样切换？",
      "旋转目标方向并移动切割约束，观察线性目标的接触面。",
      "什么方向会使整条边都是最优解？",
      "§4.3",
      146,
      [
        r("angle", "目标方向（度）", -180, 180, 1, -70),
        r("cut", "切割约束 x₁+x₂≤b", -4, 3, 0.05, 1.8),
        select("domain", "可行域", ["polygon|截取多边形", "orthant|无界非负正交象限"], "polygon"),
      ]
    ),
    card(
      "qp",
      "01",
      "二次规划与活动约束",
      "最优点在内部、边上还是顶点？",
      "拖动无约束极小点 c，改变曲率比，观察三角形上的二次规划解。",
      "活动约束变化时，解路径是否一定光滑？",
      "§4.4",
      152,
      [r("kappa", "曲率比 κ", 0.25, 12, 0.25, 3)],
      { points: [point("px", "py", "c", 1.6, 1.6)] }
    ),
    card(
      "gp",
      "01",
      "几何规划的对数变换",
      "乘法约束如何变成直线？",
      "调节正系数和乘积要求，对比原变量与对数变量中的同一个问题。",
      "取对数为何需要严格正变量？",
      "§4.5",
      160,
      [
        r("a", "代价系数 a", 0.3, 3, 0.05, 1),
        r("b", "代价系数 b", 0.3, 3, 0.05, 2),
        r("product", "要求 xy≥c", 0.2, 3, 0.05, 1),
        select("view", "坐标", ["original|原变量 x,y", "log|对数变量 u,v"], "log"),
      ]
    ),
    card(
      "sdp",
      "01",
      "半正定规划",
      "三个相关系数不能随意指定",
      "固定一个相关系数，优化另外两个的线性组合；可行集来自相关矩阵半正定约束。",
      "相关系数各自落在 [−1,1]，足以保证矩阵半正定吗？",
      "§4.6.2",
      168,
      [r("r", "固定相关系数 ρ₁₂", -0.95, 0.95, 0.025, 0.5), r("angle", "目标方向（度）", -180, 180, 1, 35)],
      { animate: "angle" }
    ),
    card(
      "portfolio",
      "01",
      "投资组合的风险与收益",
      "最低收益要求怎样改变最小风险组合？",
      "改变相关性和收益下界，观察两资产组合的风险–收益曲线与可行性。",
      "为什么收益要求超过所有资产均值时，非负组合会不可行？",
      "§4.4.1",
      155,
      [r("rho", "两资产相关系数", -0.95, 0.95, 0.025, 0.2), r("target", "最低期望收益", 0.8, 2, 0.02, 1.3)],
      { animate: "target" }
    ),
    card(
      "lasso",
      "02",
      "Lasso 稀疏拟合",
      "ℓ₁ 正则化怎样把坐标压到零？",
      "拖动未正则化的解，改变特征相关性和 λ，观察折线状稀疏解路径。",
      "相关特征出现时，简单地逐坐标软阈值为何不再给出完整解？",
      "§6.5.4，式 (6.18)",
      333,
      [r("lambda", "正则化 λ", 0, 3, 0.025, 0.6), r("rho", "特征相关性 ρ", -0.8, 0.8, 0.025, 0.6)],
      { points: [point("px", "py", "未正则化解 c", 1.8, 1.2)] }
    ),
    card(
      "minimax",
      "02",
      "Chebyshev 极小极大拟合",
      "把最大残差压到最小",
      "移动一个异常观测，求解最小最大绝对残差的拟合直线和误差带。",
      "最优解处为什么常出现多个同样大的正负残差？",
      "§6.1.1",
      293,
      [r("outlier", "异常观测偏移", -3, 4, 0.05, 1)]
    ),
    card(
      "basis",
      "02",
      "最小范数与稀疏恢复",
      "同一条等式，ℓ₁ 和 ℓ₂ 怎样选解？",
      "调节测量系数和观测，比较最小 ℓ₁ 解与最小 ℓ₂ 解的几何接触。",
      "两个测量系数绝对值相等时，ℓ₁ 解为什么可能不唯一？",
      "§6.2",
      304,
      [r("a", "第二个测量系数 a", -2, 2, 0.05, 0.6), r("b", "观测 b", -2, 2, 0.05, 1)]
    ),
    card(
      "tv",
      "02",
      "总变差去噪",
      "保留跳跃，还是追随噪声？",
      "调节噪声和 TV 强度，观察分段常数信号的恢复；同时显示求解的原始–对偶间隙。",
      "TV 为什么倾向于产生平台，而不是光滑波浪？",
      "§6.3.3",
      312,
      [r("lambda", "TV 强度 λ", 0, 1.5, 0.025, 0.3), r("noise", "噪声幅度", 0, 0.8, 0.025, 0.35)]
    ),
    card(
      "smoothing",
      "02",
      "二阶差分平滑",
      "惩罚曲率，会得到怎样的曲线？",
      "改变二阶差分惩罚和噪声，比较数据、平滑估计与生成信号。",
      "惩罚趋大时，为什么估计更接近直线，而不一定趋近零？",
      "§6.3.2–6.3.3",
      307,
      [r("lambda", "曲率惩罚 λ", 0, 20, 0.2, 3), r("noise", "噪声幅度", 0, 0.8, 0.025, 0.35)]
    ),
    card(
      "armijo",
      "03",
      "Armijo 回溯",
      "沿下降方向，哪一个步长会被接受？",
      "改变起点和回溯参数，直接比较一维搜索曲线与充分下降直线。",
      "“下降了”与“满足充分下降”有什么区别？",
      "§9.2.1",
      464,
      [r("x", "当前点 x", -2, 2, 0.05, 1.4), r("c", "充分下降参数 c", 0.01, 0.45, 0.01, 0.1), r("beta", "回溯缩减比例 β", 0.2, 0.8, 0.05, 0.5)],
      { animate: "x" }
    ),
    card(
      "steepest",
      "03",
      "不同范数下的最速下降",
      "最速方向也依赖如何度量步长",
      "在相同二次型上，用 ℓ₂、ℓ₁ 和 ℓ∞ 范数选择方向，再做精确线搜索。",
      "为什么 ℓ₁ 最速下降每次只更新一个坐标？",
      "§9.4",
      475,
      [r("kappa", "曲率尺度", 1, 80, 1, 15), iteration(40, 12), view()],
      { animate: "k" }
    ),
    card(
      "cg",
      "03",
      "共轭梯度",
      "二维二次型为何两步就能解完？",
      "改变条件数，逐步观察共轭方向与最优点，同时检查方向的 Q-正交性。",
      "线性 CG 的有限步结论为什么不能直接套到一般非线性目标？",
      "§9.3.2",
      472,
      [r("kappa", "条件数 κ", 1, 500, 1, 60), iteration(2, 1)],
      { animate: "k" }
    ),
    card(
      "decrement",
      "03",
      "Newton 减量",
      "减量如何衡量局部模型的改进？",
      "改变正起点，比较原函数、二次模型、全步和保守阻尼步。",
      "当全步离开定义域时，1/(1+λ) 阻尼能做什么？",
      "§9.5.1；§9.6",
      484,
      [r("x", "正起点 x", 0.15, 4, 0.025, 2.5)]
    ),
    card(
      "precondition",
      "03",
      "坐标缩放与预条件",
      "重新选择坐标，可以改变收敛速度",
      "比较原坐标 GD 和对角预条件 GD；二者都解同一个二次问题。",
      "为什么改变算法使用的度量不等于改变最优解？",
      "§9.4.1",
      476,
      [r("kappa", "坐标尺度比", 1, 300, 1, 80), iteration(80, 30), view()],
      { animate: "k" }
    ),
    card(
      "elimination",
      "05",
      "零空间消元",
      "沿可行直线，把二维问题化成一维",
      "旋转等式约束并改变曲率，比较可行参数 z 与原空间里的点。",
      "降维后的 Hessian 为什么是 NᵀHN？",
      "§10.1.2",
      523,
      [
        r("angle", "约束法向角（度）", -90, 90, 2, 30),
        r("b", "等式右端 b", -1.5, 1.5, 0.05, 0.3),
        r("kappa", "曲率比 κ", 1, 12, 0.25, 3),
        r("z", "可行参数 z", -2.5, 2.5, 0.05, 0),
        select("view", "查看", ["path|原空间", "curve|降维目标"], "path"),
      ],
      { animate: "z" }
    ),
    card(
      "duality",
      "05",
      "Lagrange 对偶与下界",
      "每一个乘子，给出一个下界",
      "调节约束右端和非负乘子，观察凹的对偶函数、最优值与对偶间隙。",
      "非最优乘子能给出有效下界吗？什么时候间隙为零？",
      "§5.1；§5.2",
      215,
      [r("b", "约束 x≥b", -2, 2, 0.05, 1), r("lambda", "试探乘子 λ", 0, 5, 0.05, 1)],
      { animate: "lambda" }
    ),
    card(
      "sensitivity",
      "05",
      "值函数与影子价格",
      "约束放宽一点，能改善多少？",
      "移动上界 b，比较最优值曲线、切线和乘子；观察约束从活动变为非活动。",
      "为什么乘子为零时，小幅放宽约束不再降低最优值？",
      "§5.6",
      249,
      [r("b", "上界 b", -2, 3, 0.05, 0.2), r("c", "无约束最优点 c", -1, 2, 0.05, 1)]
    ),
    card(
      "waterfilling",
      "05",
      "注水算法与 KKT",
      "有限功率应该分给哪些通道？",
      "改变总预算与一个通道的噪声底，观察公共水位、零分配通道和乘子。",
      "为什么劣质通道可能完全不获得功率？",
      "§5.5.3，Example 5.2",
      245,
      [r("power", "总功率预算 P", 0.1, 6, 0.05, 2.5), r("a", "第一通道噪声底", 0.1, 3, 0.05, 0.4)]
    ),
    card(
      "logbarrier",
      "06",
      "障碍函数的形状",
      "靠近边界时，曲率怎样增大？",
      "在区间约束内调节线性目标和障碍权重，拖动试探点读取目标值。",
      "障碍为何把极小点留在严格内部？",
      "§11.2.1",
      563,
      [r("t", "目标权重 t", 0.1, 30, 0.1, 5), r("c", "线性目标系数 c", -2, 2, 0.05, 1), r("x", "试探点 x", 0.02, 0.98, 0.01, 0.5)],
      { animate: "x" }
    ),
    card(
      "complementarity",
      "06",
      "扰动互补条件",
      "中心路径连接原变量与对偶变量",
      "调整 μ 和目标中心 a，在 x–λ 平面追踪驻点直线与双曲线的交点。",
      "μ→0 时，是 x 还是 λ 走向零？",
      "§11.2.2",
      565,
      [r("logmu", "log₁₀ μ", -4, 1, 0.05, -1), r("a", "目标中心 a", -2, 2, 0.05, -0.7)]
    ),
    card(
      "analytic",
      "06",
      "解析中心与几何中心",
      "解析中心不一定是最大内切圆圆心",
      "移动多面体的一条边，比较对数障碍解析中心和 Chebyshev 中心。",
      "同一集合的冗余不等式会不会改变解析中心？",
      "§8.5.3",
      419,
      [r("angle", "切割法向角（度）", -150, 150, 1, 35), r("cut", "切割右端 b", -0.8, 2, 0.05, 0.6)]
    ),
    card(
      "socp",
      "06",
      "鲁棒线性规划与 SOCP",
      "系数不确定时，需要留多少余量？",
      "增大不确定半径，观察鲁棒可行域收缩；显示当前最坏系数对应的支撑线。",
      "欧氏球不确定性为什么产生一个二阶锥约束？",
      "§4.4.2",
      157,
      [r("sigma", "不确定半径 σ", 0.05, 1.5, 0.025, 0.5), r("angle", "收益方向（度）", 0, 90, 1, 25)]
    ),
    card(
      "logistic",
      "07",
      "Logistic 回归",
      "分类概率怎样由优化得到？",
      "移动两类样本间隔、翻转一个标签或调节正则化，重新拟合概率曲线。",
      "完全可分的数据为什么可能没有有限的未正则化极大似然估计？",
      "§7.1.1",
      354,
      [
        r("gap", "两类额外间隔", -0.8, 1.5, 0.05, 0.2),
        r("loglambda", "log₁₀ 正则化 λ", -2, 1, 0.05, -0.5),
        select("flip", "异常标签", ["no|无翻转", "yes|翻转一个正例"], "no"),
      ]
    ),
    card(
      "maxentropy",
      "07",
      "最大熵分布",
      "只知道均值，怎样选择分布？",
      "给三个可能取值指定均值，在约束下最大化熵；观察指数族分布如何倾斜。",
      "为什么均值接近端点时，熵越来越小？",
      "§7.2；Example 5.3",
      359,
      [r("mean", "规定均值 m", -0.98, 0.98, 0.02, 0.4)]
    ),
    card(
      "gaussian",
      "07",
      "高斯协方差估计",
      "用精度矩阵把似然写成凸问题",
      "改变样本相关性和尺度，在单位精度与最优精度之间插值，查看似然差。",
      "为什么对精度矩阵凸，不代表对协方差矩阵也具有同样形式？",
      "§7.1.1",
      355,
      [r("rho", "样本相关系数", -0.95, 0.95, 0.025, 0.6), r("sigma", "第二维标准差", 0.3, 2.5, 0.05, 1.5), r("mix", "精度插值比例", 0, 1, 0.02, 0.5)],
      { animate: "mix" }
    ),
    card(
      "hypothesis",
      "07",
      "Neyman–Pearson 检测",
      "控制误报，会牺牲多少检出率？",
      "调整两种正态分布的间隔和误报率要求，查看最优阈值与 ROC 曲线。",
      "两分布重合时，ROC 为什么退化为对角线？",
      "§7.3.5",
      370,
      [
        r("delta", "两分布均值差 δ", 0, 4, 0.05, 1.8),
        r("alpha", "允许误报率 α", 0.01, 0.5, 0.01, 0.1),
        select("view", "查看", ["density|密度与阈值", "roc|ROC 曲线"], "density"),
      ],
      { animate: "alpha" }
    ),
    card(
      "bounds",
      "07",
      "矩约束下的概率界",
      "只知道矩，尾部概率最多有多大？",
      "在五点支撑上穷举基本可行分布，最大化尾部概率；比较只依赖方差的 Cantelli 界。",
      "额外知道支撑集，为什么可能得到更紧的概率上界？",
      "§7.4.1",
      376,
      [r("variance", "规定方差", 0.1, 3.5, 0.05, 1), select("threshold", "尾部事件", ["1|X ≥ 1", "2|X ≥ 2"], "1")]
    ),
    card(
      "distance",
      "08",
      "集合距离与分离",
      "两个集合什么时候可以严格分开？",
      "拖动第二个圆盘并调节半径，观察最近点对和居中的分离直线。",
      "圆盘相切与相交时，严格分离结论有什么区别？",
      "§8.2",
      402,
      [r("radius", "第二个圆盘半径", 0.3, 1.3, 0.05, 0.7)],
      { points: [point("px", "py", "第二个圆心", 1.8, 0.8)] }
    ),
    card(
      "svm",
      "08",
      "软间隔分类",
      "间隔宽度与违约代价怎样权衡？",
      "移动一对对称异常点，改变误分类惩罚，重新求解软间隔线性分类器。",
      "为什么增大 C 不一定让所有样本都满足间隔要求？",
      "§8.6.1",
      423,
      [
        r("C", "松弛惩罚 C", 0.05, 5, 0.05, 1),
        r("gap", "正常样本横向间隔", 0.3, 1.5, 0.05, 0.8),
        r("outlier", "异常正例的横坐标", -1.5, 2, 0.05, 0.2),
      ],
      { animate: "outlier" }
    ),
    card(
      "ellipsoids",
      "08",
      "最优内接与外接椭圆",
      "同一三角形，两种体积最优椭圆",
      "拖动三角形顶点，同时观察最小面积外接椭圆与最大面积内接椭圆。",
      "为什么两椭圆在三角形特例中共心，半轴恰好相差两倍？",
      "§8.4",
      410,
      [r("width", "底边水平半宽", 0.6, 2.5, 0.05, 1.5)],
      { points: [point("px", "py", "第三个顶点", 0.4, 1.7)], pointBounds: [-1.8, 1.8, 0.2, 2.2] }
    ),
    card(
      "facility",
      "08",
      "几何中位数与选址",
      "服务点应该设在重心吗？",
      "拖动一个需求点并调节其权重，比较总距离最小点与加权重心。",
      "一个需求点权重很大时，最优设施会不会直接落在该点？",
      "§8.7.1",
      432,
      [r("weight", "可拖动需求点的权重", 0.2, 6, 0.1, 1)],
      { points: [point("px", "py", "需求点", 1.6, 1.5)] }
    ),
    card(
      "placement",
      "08",
      "二次布局与弹簧网络",
      "固定锚点怎样决定自由节点？",
      "拖动右侧锚点，改变两个自由节点之间的连接强度，重新求解布局。",
      "连接强度增大时，两个自由节点为什么会靠拢？",
      "§8.7.3",
      434,
      [r("weight", "节点间弹簧权重", 0.1, 8, 0.1, 1)],
      { points: [point("px", "py", "右侧锚点", 2, 0.3)] }
    ),
    card(
      "proximal",
      "S",
      "近端映射与软阈值",
      "非光滑正则项可以精确处理",
      "调节输入 z 与 λ，观察绝对值函数的近端解和软阈值映射。",
      "阈值区间为什么恰好把小坐标映射到零？",
      "§6.3.2",
      306,
      [
        r("z", "输入 z", -3, 3, 0.05, 1.8),
        r("lambda", "正则化 λ", 0, 2, 0.025, 0.8),
        select("view", "查看", ["map|软阈值映射", "objective|近端子问题"], "map"),
      ],
      { source: "课程补充 · ℓ₁ 正则化的近端解释" }
    ),
    card(
      "subgradient",
      "S",
      "次梯度与步长",
      "折点附近，固定步长为何振荡？",
      "用次梯度法最小化 |x|，对比当前值和历史最好值，切换步长衰减方式。",
      "历史最好值下降，是否意味着当前迭代也单调下降？",
      "§6.1.2",
      294,
      [
        r("x0", "初始点 x₀", -3, 3, 0.05, 2.3),
        r("step", "步长系数", 0.1, 1.5, 0.05, 0.6),
        select("schedule", "步长规则", ["constant|固定", "sqrt|1/√(k+1)", "harmonic|1/(k+1)"], "constant"),
        iteration(100, 25),
      ],
      { animate: "k", source: "课程补充 · 非光滑一阶方法" }
    ),
    card(
      "stochastic",
      "S",
      "随机梯度与噪声底",
      "梯度有噪声时，还能收敛到哪里？",
      "使用可复现的零均值随机梯度噪声，对比样本轨迹与精确期望误差。",
      "固定步长的误差地板由步长和噪声方差怎样决定？",
      "§9.3",
      466,
      [
        r("step", "步长系数", 0.03, 0.8, 0.01, 0.2),
        r("noise", "噪声标准差 σ", 0, 2, 0.05, 1),
        r("seed", "随机种子", 1, 20, 1, 7),
        select("schedule", "步长规则", ["constant|固定", "sqrt|1/√(k+1)"], "constant"),
        iteration(120, 50),
      ],
      { animate: "k", source: "课程补充 · 随机一阶方法" }
    ),
  ];
  defs.push(
    card(
      "dualnorm",
      "00",
      "对偶范数与支撑函数",
      "哪一个单位方向最能对齐给定向量？",
      "拖动线性目标向量 z，切换范数球并改变半径，寻找最优接触点。",
      "为什么 ℓ₁ 与 ℓ∞ 互为对偶，而欧氏范数自对偶？",
      "§A.1.6",
      636,
      [select("p", "原范数", ["1|ℓ₁", "2|ℓ₂", "inf|ℓ∞"], "2"), r("radius", "球半径 r", 0.3, 2, 0.05, 1)],
      { points: [point("px", "py", "z", 1.4, 0.7)] }
    ),
    card(
      "uncertainfit",
      "02",
      "不确定矩阵下的拟合",
      "名义、平均与最坏情形会选同一个解吗？",
      "在相同病态模型上，比较忽略矩阵误差、随机误差平均和 Frobenius 球最坏误差。",
      "随机方差与最坏扰动半径是同一个假设吗？",
      "§6.4，Example 6.5",
      318,
      [
        r("sigma", "独立矩阵误差标准差 σ", 0, 0.8, 0.02, 0.2),
        r("rho", "最坏扰动半径 ρ", 0, 1.5, 0.025, 0.3),
        r("b", "第二个观测 b₂", -0.4, 0.8, 0.025, 0.4),
      ],
      { animate: "rho" }
    ),
    card(
      "contact",
      "05",
      "KKT 与弹簧接触力",
      "互补松弛可以解释为接触力",
      "移动两个弹簧的自然位置并调整刚度；约束禁止两个滑块的次序交换。",
      "为什么没有接触时力为零，而有接触力时位置间隙必须为零？",
      "§5.5.4",
      246,
      [r("a", "滑块 1 的自然位置", -2, 2, 0.05, 1), r("b", "滑块 2 的自然位置", -2, 2, 0.05, -0.5), r("k", "弹簧 1 的刚度", 0.2, 5, 0.1, 2)],
      { animate: "a" }
    ),
    card(
      "primaldual",
      "06",
      "原始–对偶内点迭代",
      "让可行性、驻点和互补间隙一起收敛",
      "从严格正的松弛和乘子出发，逐步解 Newton 系统；可选原变量可行或不可行的初始点。",
      "为什么只看目标值下降不足以判定内点迭代成功？",
      "§11.7",
      609,
      [
        r("c1", "目标中心 c₁", -1, 2, 0.1, 1.3),
        r("c2", "目标中心 c₂", -1, 2, 0.1, 0.8),
        r("sigma", "中心化参数 σ", 0.05, 0.6, 0.05, 0.2),
        select("start", "初始点", ["infeasible|原变量不可行", "feasible|原变量可行"], "infeasible"),
        iteration(30, 8),
        view(),
      ],
      { animate: "k" }
    )
  );
  const courseRef = (page) => ({
    label: "课程补充：一阶优化方法",
    url: "https://jliang993.github.io/assets/teaching/math6015/supplement-first-order-methods.pdf#page=" + page,
  });
  for (const [id, page] of [
    ["cg", 69],
    ["proximal", 68],
    ["stochastic", 55],
  ]) {
    const d = defs.find((d) => d.id === id);
    d.ref = courseRef(page);
    d.source = "课程补充 · 教学演示";
  }
  Object.assign(
    defs.find((d) => d.id === "subgradient"),
    {
      source: "额外教学补充 · 非主教材内容",
      ref: {
        label: "Stephen Boyd · EE364b Subgradient Methods · pp. 4–5",
        url: "https://web.stanford.edu/class/ee364b/lectures/subgrad_method_notes.pdf#page=4",
      },
    }
  );
  const lectureDefs = [
    {
      id: "supporting-duality",
      title: "支撑线与 strong duality",
      question: String.raw`在两种情形中都取 \(\lambda=2\)，比较支撑线在 \(u=0\) 的截距。`,
      controls: [
        select("mode", "对照例", ["convex|凸上图", "nonconvex|非凸上图"], "convex"),
        r("lambda", String.raw`试探乘子 \(\lambda\)`, 0, 4, 0.05, 2),
      ],
      animate: "lambda",
    },
  ];
  const ids = new Set([...defs, ...lectureDefs].map((d) => d.id));

  function renderSupportingDuality(s, { Plot, colors: c, fmt }) {
    const nonconvex = s.mode === "nonconvex";
    const { objective, p, pstar, dstar, lambdaStar, g, contacts, uContact, current, dualityGap, gap } = M.models.supportingDuality(s);
    const geometryBounds = nonconvex ? [-1.2, 1.6, -2, 3] : [-1.2, 1.6, 0.18, 5.6];
    const geometry = new Plot("supporting-duality-geometry", geometryBounds, false, String.raw`\(u\)`, String.raw`\(t\)`, { height: 236 });
    const [, right, bottom, top] = geometry.bounds;
    const left = nonconvex ? -1 : geometry.bounds[0];
    geometry.polygon([...M.seq(left, right).map((u) => [u, p(u)]), [right, top], [left, top]], c.blue, 0.13);
    geometry.curve(p, left, right, c.blue);
    if (nonconvex)
      geometry.path(
        [
          [left, p(left)],
          [left, top],
        ],
        c.blue,
        2
      );
    else geometry.curve(objective, 1, right, c.gray, "4 4");
    geometry.label([1.22, top - 0.21 * (top - bottom)], String.raw`\(\mathcal A\)`, c.blue);
    geometry.line([1, 0], 0, c.gray, "4 4");
    geometry.label([0, top], String.raw`\(u=0\)`, c.gray, 8, 15);
    geometry.line([s.lambda, 1], current, c.red, "");

    const comparison = nonconvex ? dstar : current;
    if (pstar - comparison > 0.02)
      geometry.path(
        [
          [0, pstar],
          [-0.085, pstar],
          [-0.085, comparison],
          [0, comparison],
        ],
        c.orange,
        2.6
      );
    if (nonconvex) {
      const chord = [
        [-1, p(-1)],
        [1, p(1)],
      ];
      geometry.path(chord, c.orange, 2.4, "5 4");
      for (const endpoint of chord) geometry.dot(endpoint, "", c.orange);
      geometry.dot([0, dstar], "", c.orange);
      geometry.label([0, dstar], String.raw`\((0,d^\star)\)`, c.orange, 10, -3);
    }
    for (const u of contacts) geometry.dot([u, p(u)], !nonconvex && Math.abs(u) > 0.14 ? "切点" : "", c.red);
    const showTrial = nonconvex ? dstar - current > 0.06 : gap > 0.02;
    if (showTrial) {
      geometry.dot([0, current], "", c.red);
      geometry.label([0, current], String.raw`\(g(\lambda)\)`, c.red, 10, 20);
    }
    geometry.dot([0, pstar], gap === 0 ? String.raw`\(g(\lambda)=p^\star\)` : String.raw`\((0,p^\star)\)`, c.green);

    const dualBounds = nonconvex ? [-0.18, 4.18, -1.78, 1.75] : [-0.18, 4.18, 0.35, 1.67];
    const dual = new Plot("supporting-duality-value", dualBounds, false, String.raw`\(\lambda\)`, String.raw`\(g(\lambda)\)`, { height: 236 });
    dual.curve(g, 0, 4, c.purple);
    dual.line([0, 1], pstar, c.green, "4 4");
    if (nonconvex) {
      dual.label([3.75, pstar], String.raw`\(p^\star\)`, c.green, 0, -8);
      dual.path(
        [
          [lambdaStar, dstar],
          [lambdaStar, pstar],
        ],
        c.orange,
        3
      );
    }
    dual.dot(
      [lambdaStar, dstar],
      nonconvex ? String.raw`\((\lambda^\star,d^\star)\)` : String.raw`\(\lambda^\star=2\)`,
      nonconvex ? c.orange : c.green
    );
    if (!nonconvex)
      dual.path(
        [
          [s.lambda, current],
          [s.lambda, pstar],
        ],
        c.orange,
        3
      );
    dual.dot([s.lambda, current], Math.abs(s.lambda - lambdaStar) > 0.45 ? "当前下界" : "", c.red, "lambda");

    const hint = nonconvex
      ? String.raw`\(f_0(x)=\tfrac32-2x-x^2\)，\(\mathcal D=[-1,1]\)。`
      : String.raw`\(f_0(x)=(x-1)^2+\tfrac12\)，\(\mathcal D=\mathbb R\)。`;
    const notice = nonconvex
      ? String.raw`两边界点的中点 \((0,d^\star)\) 位于 \(\mathcal A\) 外。\(p^\star-d^\star=1\)，强对偶不成立。`
      : gap === 0
        ? String.raw`支撑线通过 \((0,p^\star)\)，此时 \(g(2)=d^\star=p^\star\)。`
        : String.raw`当前支撑线在 \(u=0\) 的截距为 \(g(\lambda)\)，离 \(p^\star\) 还有 \(${fmt(gap)}\)。`;
    const details = nonconvex
      ? String.raw`<p>目标在 \([-1,1]\) 上递减，原问题在 \(x=0\) 取到 \(p^\star=\tfrac32\)。对 \(u\ge-1\)，\(p(u)=f_0(\min(u,1))\)，而 \(u<-1\) 时 \(p(u)=+\infty\)。</p><p>\((-1,\tfrac52)\) 与 \((1,-\tfrac32)\) 都在 \(\mathcal A\) 的边界上。两点的中点 \((0,\tfrac12)\) 在边界下方，因此 \(\mathcal A\) 非凸。</p><p>拉格朗日函数对 \(x\) 严格凹，最小值在区间端点取到。于是 \(g(\lambda)=\min\{\tfrac52-\lambda,\,-\tfrac32+\lambda\}=\tfrac12-|\lambda-2|\)。最大值 \(d^\star=\tfrac12\) 在 \(\lambda=2\) 取到，最优对偶间隙为 \(1\)。</p>`
      : String.raw`<p>将约束写成 \(x\le u\)，则 \(p(u)=\tfrac12+\max(1-u,0)^2\)。蓝色为 \(\mathcal A\) 的边界，灰色虚线为原抛物线的上升支。</p><p>极小化 \((x-1)^2+\tfrac12+\lambda x\) 给出 \(u_\lambda=1-\lambda/2\)，因此 \(g(\lambda)=\tfrac32-(1-\lambda/2)^2\)。当 \(\lambda=0\) 时，水平支撑线接触整个 \(u\ge1\) 的平段，图上标出其中一点。</p>`;
    return {
      state: s,
      svg: `<figure>${geometry.finish("支撑线与上图")}<figcaption>支撑线与上图</figcaption></figure><figure>${dual.finish(
        "对偶函数"
      )}<figcaption>对偶函数</figcaption></figure>`,
      metrics: [
        { label: String.raw`原始最优值 \(p^\star\)`, value: fmt(pstar) },
        { label: String.raw`当前下界 \(g(\lambda)\)`, value: fmt(current) },
        { label: String.raw`对偶最优值 \(d^\star\)`, value: fmt(dstar) },
        { label: String.raw`对偶间隙 \(p^\star-d^\star\)`, value: fmt(dualityGap) },
      ],
      hint,
      notice,
      details,
      data: {
        mode: s.mode,
        lambda: s.lambda,
        uContact,
        tContact: p(uContact),
        contacts: contacts.map((u) => [u, p(u)]),
        pstar,
        dstar,
        lambdaStar,
        current,
        gap,
        dualityGap,
      },
    };
  }

  function render(id, s, A) {
    if (id === "supporting-duality") return renderSupportingDuality(s, A);
    const { Plot, colors: c, fmt } = A,
      { dot, norm, add, scale, rotate } = C,
      d = defs.find((d) => d.id === id);
    const values = { ...s };
    if (id === "bounds") values.threshold = Number(s.threshold);
    const data = M.models[id](values);
    let g = new Plot(id),
      metrics = [],
      legend = [],
      notice = "";
    const metric = (label, value) => ({ label, value: typeof value === "number" ? fmt(value) : value });
    const plot = (bounds, equal = true, x = "x₁", y = "x₂") => (g = new Plot(id, bounds, equal, x, y));
    const fitPlot = (points, options = {}, equal = true, x = "x₁", y = "x₂") => plot(Plot.fitBounds(points, options), equal, x, y);
    const ellipseFrame = (center, axes, angle = 0) => Plot.ellipseBox(center, axes, angle);
    const pair = (x) => x.map((v) => fmt(v)).join(", ");
    const trace = (path, color, label, k = s.k) => {
      g.path(path.slice(0, k + 1), color, 2.5);
      g.dot(path[Math.min(k, path.length - 1)], label, color);
    };
    const bars = (vals, color, offset = 0) =>
      vals.forEach((v, i) =>
        g.path(
          [
            [i + offset, 0],
            [i + offset, v],
          ],
          color,
          15
        )
      );
    const contour = (f, levels, bounds = g.bounds) => {
      const [a, b, e, h] = bounds,
        nx = 50,
        ny = 32,
        xs = M.seq(a, b, nx + 1),
        ys = M.seq(e, h, ny + 1),
        v = ys.map((y) => xs.map((x) => f([x, y])));
      for (const z of levels) {
        const segments = [];
        for (let j = 0; j < ny; j++)
          for (let i = 0; i < nx; i++) {
            const p = [
                [xs[i], ys[j]],
                [xs[i + 1], ys[j]],
                [xs[i + 1], ys[j + 1]],
                [xs[i], ys[j + 1]],
              ],
              q = [v[j][i], v[j][i + 1], v[j + 1][i + 1], v[j + 1][i]],
              hits = [];
            if (!q.every(Number.isFinite)) continue;
            for (let k = 0; k < 4; k++) {
              const l = (k + 1) % 4;
              if ((q[k] <= z && q[l] > z) || (q[l] <= z && q[k] > z)) hits.push(add(p[k], add(p[l], p[k], -1), (z - q[k]) / (q[l] - q[k])));
            }
            for (let k = 0; k + 1 < hits.length; k += 2) segments.push(hits[k], hits[k + 1], [NaN, NaN]);
          }
        g.path(segments, "var(--demo-line,#9ca9b4)", 1);
      }
    };
    if (id === "innerproduct") {
      fitPlot([[0, 0], data.a, data.b, data.p, scale(data.a, -s.guide), scale(data.a, s.guide)], { padding: 0.14, minSpan: [2.8, 1.6] });
      g.path([[0, 0], data.a], c.blue, 3);
      g.path([[0, 0], data.b], c.purple, 3);
      g.path([[0, 0], data.p], c.green, 3);
      g.path([data.p, data.b], c.orange, 1.8, "5 4");
      if (norm(data.a) > 1e-9) g.path([scale(data.a, -s.guide), scale(data.a, s.guide)], c.gray, 1, "3 4");
      g.dot(data.a, "a", c.blue, "ax,ay");
      g.dot(data.b, "b", c.purple, "bx,by");
      g.dot(data.p, "投影", c.green);
      metrics = [
        metric("aᵀb", data.value),
        metric("‖a‖₂‖b‖₂", data.bound),
        metric("夹角（度）", data.angle === null ? "零向量：未定义" : data.angle),
      ];
      notice = "绿色分量与橙色余量正交。a=0 时投影到零子空间，但夹角不定义。";
    } else if (id === "taylor") {
      const lo = Math.min(s.a - 1, data.point - 0.2),
        hi = Math.max(s.a + 1, data.point + 0.2),
        samples = M.seq(lo, hi).flatMap((x) => [
          [x, data.f(x)],
          [x, data.linear(x)],
          [x, data.quadratic(x)],
        ]);
      fitPlot(samples, { padding: [0.035, 0.1], minSpan: [1.2, 1] }, false, "x", "函数值");
      g.curve(data.f, lo, hi, c.blue);
      g.curve(data.linear, lo, hi, c.orange, "5 4");
      g.curve(data.quadratic, lo, hi, c.purple);
      g.dot([s.a, Math.exp(s.a)], "展开点", c.gray);
      g.dot([data.point, data.exact], "真实值", c.red);
      legend = [
        ["exp(x)", c.blue],
        ["一阶模型", c.orange],
        ["二阶模型", c.purple],
      ];
      metrics = [
        metric("一阶绝对误差", Math.abs(data.exact - data.linear(data.point))),
        metric("二阶绝对误差", Math.abs(data.exact - data.quadratic(data.point))),
        metric("位移 h", s.h),
      ];
      notice = "误差比较针对当前位移；Taylor 的局部精度不保证远处模型同样准确。";
    } else if (id === "psd") {
      plot([-2.7, 2.7, -1.4, 1.4]);
      contour(data.f, [-4, -2, -0.5, 0, 0.5, 1, 2, 4]);
      g.dot([0, 0], "驻点", c.red);
      g.line(rotate([0, 1], data.angle), 0, c.purple);
      metrics = [metric("最大特征值", data.values[0]), metric("最小特征值", data.values[1]), metric("H 的类型", data.kind)];
      notice =
        data.kind === "不定"
          ? "驻点为鞍点；目标沿负曲率方向趋向 −∞。"
          : data.kind === "半正定"
            ? "最小特征值为零：存在平坦方向，极小点不唯一。"
            : "两个特征值都为正：原点是唯一全局极小点。";
    } else if (id === "svd") {
      const x = rotate([1, 0], s.theta);
      fitPlot([[0, 0], x, data.point, ...ellipseFrame([0, 0], [1, 1]), ...ellipseFrame([0, 0], data.axes, data.angle)], {
        padding: 0.13,
        minSpan: [3, 2],
      });
      g.ellipse([0, 0], [1, 1], 0, c.gray);
      g.ellipse([0, 0], data.axes, data.angle, c.purple, true);
      g.path([[0, 0], x], c.blue);
      g.path([[0, 0], data.point], c.red);
      g.dot(x, "输入", c.blue);
      g.dot(data.point, "Ax", c.red);
      metrics = [metric("奇异值", pair(data.axes)), metric("面积放大倍数 |det A|", data.det), metric("2-范数条件数", data.axes[0] / data.axes[1])];
      notice = "灰色单位圆经 A 映射为紫色椭圆；半轴来自 AAᵀ 的特征值平方根。";
    } else if (id === "epigraph") {
      plot([-2, 2, -0.2, 4], false, "x", "t");
      g.polygon([...M.seq(-2, 2).map((x) => [x, data.f(x)]), [2, 4], [-2, 4]], c.purple, 0.14);
      g.curve(data.f, -2, 2, c.blue);
      if (s.mode === "lse") g.curve(Math.abs, -2, 2, c.gray, "5 3");
      g.dot(data.x, "(x,t)", data.inside ? c.green : c.red, "px,py");
      metrics = [
        metric("t−f(x)", data.gap),
        metric("属于上图", data.inside ? "是" : "否"),
        metric("平滑误差上界", s.mode === "lse" ? s.tau * Math.log(2) : "—"),
      ];
      notice = "上图包含曲线及其上方。log-sum-exp 对 |x| 的逼近误差介于 0 与 τ log 2 之间。";
    } else if (id === "perspective") {
      plot([-2.2, 2.2, 0, 3.2], false, "x", "t");
      g.polygon(
        [
          ...M.seq(-Math.sqrt(3.2 * s.level), Math.sqrt(3.2 * s.level)).map((x) => [x, (x * x) / s.level]),
          [Math.sqrt(3.2 * s.level), 3.2],
          [-Math.sqrt(3.2 * s.level), 3.2],
        ],
        c.purple,
        0.16
      );
      g.curve((x) => (x * x) / s.level, -2.2, 2.2, c.blue);
      g.dot(data.x, "(x,t)", data.inside ? c.green : c.red, "px,py");
      metrics = [metric("x²/t", data.value), metric("满足 x²/t≤c", data.inside ? "是" : "否"), metric("定义域余量 t", s.py)];
      notice = "紫色区域是次水平集在图框中的部分；t 保持严格为正。";
    } else if (id === "conjugate") {
      const domain = [-2, 2.5],
        curvePoints = M.seq(...domain).flatMap((x) => [
          [x, data.f(x)],
          [x, data.tangent(x)],
        ]);
      fitPlot(curvePoints, { padding: [0.035, 0.1], minSpan: [4.5, 2] }, false, "x", "f(x)");
      g.curve(data.f, ...domain, c.blue);
      g.curve(data.tangent, ...domain, c.orange, "5 3");
      g.dot([data.xstar, data.f(data.xstar)], "接触点", c.green);
      g.path(
        [
          [s.x, data.f(s.x)],
          [s.x, data.tangent(s.x)],
        ],
        c.red,
        3
      );
      metrics = [metric("f*(y)", data.conjugate), metric("接触点 x*", data.xstar), metric("Fenchel–Young 间隙", data.gap)];
      notice = "橙线为斜率 y 的最紧仿射下界。指数函数此处只选 y>0；y<0 时共轭为 +∞。";
    } else if (id === "lp") {
      fitPlot(data.polygon.length ? data.polygon : M.vertices, { padding: 0.12, minSpan: [2.2, 1.3] });
      if (data.polygon.length) g.polygon(data.polygon, c.blue, 0.17);
      if (s.domain === "polygon") g.line([1, 1], s.cut, c.gray);
      if (Number.isFinite(data.value)) g.line(data.c, data.value, c.orange, "");
      data.optimal.forEach((x) => g.dot(x, "最优", c.green));
      metrics = [
        metric("问题状态", data.status),
        metric("最优值", data.status === "无界" ? "−∞" : data.status === "不可行" ? "+∞" : data.value),
        metric("一个最优点", data.status === "有限最优" ? pair(data.x) : "不存在"),
      ];
      notice =
        s.domain === "orthant"
          ? "阴影只显示非负正交象限的一部分，图框不是约束。任一负目标系数使目标无界；零系数对应最优射线。"
          : "最优顶点并列时，连接它们的边也最优；把切割右端降到 −3 以下可构造不可行问题。";
    } else if (id === "qp") {
      fitPlot([...data.polygon, data.c, data.x], { padding: 0.14, minSpan: [2.5, 2.1] });
      contour(data.f, [0.2, 0.5, 1, 2, 4, 8]);
      g.polygon(data.polygon, c.blue, 0.18);
      g.dot(data.c, "c", c.red, "px,py");
      g.dot(data.x, "受约束最优解", c.green);
      metrics = [metric("最优值", data.value), metric("最优点", pair(data.x)), metric("边界余量 2−x₁−x₂", 2 - data.x[0] - data.x[1])];
      notice = "检查内部驻点及每条边上的一维极小点，得到精确的二维 QP 解。";
    } else if (id === "gp") {
      if (s.view === "log") {
        const hy = Math.max(1.2, Math.abs(data.u[1]) + 0.3, (Math.abs(data.u[0]) + 0.3) / (570 / 290)),
          hx = hy * (570 / 290);
        plot([-hx, hx, -hy, hy], true, "u=log x", "v=log y");
        contour(data.f, [-1, 0, 1, 2, 3]);
        g.line([1, 1], data.c, c.blue, "");
        g.dot(data.u, "最优对数变量", c.green);
      } else {
        const ymax = Math.max(2.2, 1.18 * data.x[1], (1.18 * data.x[0]) / (570 / 290)),
          xmax = ymax * (570 / 290);
        plot([0, xmax, 0, ymax]);
        g.curve((x) => (x > 0 ? s.product / x : NaN), 0.03, xmax, c.blue);
        g.line([s.a, s.b], data.value, c.orange, "");
        g.dot(data.x, "最优点", c.green);
      }
      metrics = [metric("(x*,y*)", pair(data.x)), metric("最小代价", data.value), metric("乘积约束余量", data.x[0] * data.x[1] - s.product)];
      notice = "正变量经对数变换后，乘法约束变为半空间；目标变为凸的 log-sum-exp。";
    } else if (id === "sdp") {
      plot([-1.2, 1.2, -1.2, 1.2], true, "ρ₁₃", "ρ₂₃");
      g.ellipse([0, 0], data.axes, data.angle, c.purple, true);
      g.line(data.c, data.value, c.orange, "");
      g.dot(data.x, "SDP 最优点", c.green);
      metrics = [metric("最大线性目标", data.value), metric("最优相关系数", pair(data.x)), metric("相关矩阵 det", data.det(...data.x))];
      notice = "固定 |ρ₁₂|<1 后，可行集是椭圆；边界对应奇异但仍半正定的 3×3 相关矩阵。";
    } else if (id === "portfolio") {
      plot([0, 1.1, 0.75, 2.1], false, "标准差（风险）", "期望收益");
      g.path(
        M.seq(0, 1).map((w) => [Math.sqrt(data.variance(w)), data.mean(w)]),
        c.purple,
        2.6
      );
      g.line([0, 1], s.target, c.orange, "");
      if (data.feasible) g.dot([Math.sqrt(data.value), data.mean(data.w)], "最小风险组合", c.green);
      metrics = [
        metric("约束状态", data.feasible ? "可行" : "不可行"),
        metric("权重", data.feasible ? pair(data.weights) : "不存在"),
        metric("最小方差", data.feasible ? data.value : "—"),
      ];
      notice = "两资产抽象模型：均值 (1,1.8)，标准差 (1,0.6)，权重非负且和为 1；紫线包括全部允许的组合。";
    } else if (id === "lasso") {
      fitPlot([[0, 0], data.c, data.x, ...data.path], { padding: 0.14, minSpan: [2.5, 1.7] });
      contour(data.f, [0.5, 1, 2, 3, 5, 8]);
      g.path(data.path, c.purple, 2.5);
      g.dot(data.c, "未正则化解", c.orange, "px,py");
      g.dot(data.x, "Lasso 解", c.green);
      metrics = [
        metric("稀疏解", pair(data.x)),
        metric("非零坐标数", data.x.filter((v) => Math.abs(v) > 1e-8).length),
        metric("KKT 残差", data.residual),
      ];
      notice = "路径覆盖 λ∈[0,3]。使用收敛的坐标下降求解相关特征问题，不把一次软阈值误当成最优解。";
    } else if (id === "minimax") {
      const [a, b, t] = data.z,
        ys = data.points.map((p) => p[1]);
      plot([-2.3, 2.3, Math.min(-2, ...ys) - 0.4, Math.max(2, ...ys) + 0.4], false, "观测位置", "观测值");
      g.polygon(
        [
          [-2.3, a * -2.3 + b - t],
          [2.3, a * 2.3 + b - t],
          [2.3, a * 2.3 + b + t],
          [-2.3, a * -2.3 + b + t],
        ],
        c.purple,
        0.13
      );
      g.curve((x) => a * x + b, -2.3, 2.3, c.purple);
      data.points.forEach((p, i) =>
        g.dot(p, Math.abs(Math.abs(data.residuals[i]) - t) < 1e-6 ? "活动" : "", Math.abs(Math.abs(data.residuals[i]) - t) < 1e-6 ? c.red : c.gray)
      );
      metrics = [
        metric("最大绝对残差 t*", t),
        metric("斜率 / 截距", pair([a, b])),
        metric("活动残差数", data.residuals.filter((v) => Math.abs(Math.abs(v) - t) < 1e-6).length),
      ];
      notice = "将 L∞ 拟合写成 3 变量 LP，枚举基本可行解；误差带包含全部观测。";
    } else if (id === "basis") {
      const v = data.value,
        r2 = norm(data.l2),
        radius = Math.max(v, r2);
      fitPlot([[-radius, -radius], [radius, radius], data.l1, data.l2], { padding: 0.14, minSpan: [2, 1.4], center: [0, 0] });
      g.line(data.a, data.b, c.blue, "");
      g.polygon(
        [
          [v, 0],
          [0, v],
          [-v, 0],
          [0, -v],
        ],
        c.purple,
        0.12
      );
      g.ellipse([0, 0], [r2, r2], 0, c.orange);
      g.dot(data.l1, "一个 ℓ₁ 最优解", c.purple);
      g.dot(data.l2, "ℓ₂ 最优解", c.orange);
      metrics = [metric("ℓ₁ 最小值", data.value), metric("ℓ₂ 最小值", r2), metric("ℓ₁ 解是否唯一", data.multiple ? "否" : "是")];
      notice = "蓝线是欠定测量方程。并列时仅标出一个 ℓ₁ 最优端点，不能推断所有最优解都同样稀疏。";
    } else if (id === "tv" || id === "smoothing") {
      const signalBounds = Plot.fitBounds(
        [...data.truth, ...data.y, ...data.x].map((v) => [0, v]),
        { padding: [0, 0.12], minSpan: [1, 0.5] }
      );
      plot([-0.3, data.y.length - 0.7, signalBounds[2], signalBounds[3]], false, "信号位置 i", "信号值");
      g.path(
        data.truth.map((v, i) => [i, v]),
        c.gray,
        1.5,
        "5 3"
      );
      g.path(
        data.y.map((v, i) => [i, v]),
        c.orange,
        1.5
      );
      g.path(
        data.x.map((v, i) => [i, v]),
        c.purple,
        2.7
      );
      data.y.forEach((v, i) => g.dot([i, v], "", c.orange));
      legend = [
        ["生成信号", c.gray],
        ["含噪观测", c.orange],
        ["优化估计", c.purple],
      ];
      metrics = [
        metric("数据残差范数", norm(add(data.x, data.y, -1))),
        metric(id === "tv" ? "原始–对偶间隙" : "线性方程残差", id === "tv" ? data.gap : data.residual),
        metric(
          id === "tv" ? "相邻差的 ℓ₁ 范数" : "二阶差平方和",
          id === "tv" ? data.x.slice(1).reduce((v, x, i) => v + Math.abs(x - data.x[i]), 0) : data.rough
        ),
      ];
      notice = id === "tv" ? "采用盒约束对偶问题的投影梯度法求解，显式报告对偶间隙。" : "解 (I+λD₂ᵀD₂)x=y；二阶差分的零空间是离散仿射信号。";
    } else if (id === "armijo") {
      const values = M.seq(0, 1).map(data.phi),
        lower = Math.min(...values, data.bound(1));
      plot([0, 1, lower - 0.1, Math.min(40, Math.max(1, ...values) * 1.1)], false, "候选步长 t", "目标 / 充分下降界");
      g.curve(data.phi, 0, 1, c.blue);
      g.curve(data.bound, 0, 1, c.orange, "5 3");
      data.trials.forEach((t, i) =>
        g.dot([t, data.phi(t)], i === data.trials.length - 1 ? "接受" : "", i === data.trials.length - 1 ? c.green : c.red)
      );
      metrics = [metric("接受步长", data.t), metric("回溯次数", data.trials.length - 1), metric("新目标值", data.f(data.x))];
      notice = "从 t=1 开始乘 β，直到蓝色目标值不高于橙色充分下降界；图框可能截去过大的候选目标。";
    } else if (["steepest", "precondition", "cg"].includes(id)) {
      const paths = id === "cg" ? { CG: data.path } : data.paths,
        names =
          id === "steepest"
            ? { l2: "ℓ₂ 最速", l1: "ℓ₁ 最速", linf: "ℓ∞ 最速" }
            : id === "precondition"
              ? { plain: "原坐标 GD", scaled: "对角预条件 GD" }
              : { CG: "CG" },
        palette = [c.blue, c.purple, c.green];
      if (s.view === "error") {
        plot([0, id === "steepest" ? 40 : 80, -16, 1], false, "迭代 k", "log₁₀ 相对目标差");
        Object.entries(paths).forEach(([key, path], i) => {
          const f0 = data.f(path[0]);
          g.path(
            path.slice(0, s.k + 1).map((x, k) => [k, Math.log10(Math.max(1e-16, data.f(x) / f0))]),
            palette[i],
            2.4
          );
        });
      } else {
        fitPlot([[0, 0], ...Object.values(paths).flat()], { padding: 0.14, minSpan: [2.8, 1.8] });
        contour(data.f, [0.5, 1, 2, 4, 8, 16, 32, 64]);
        Object.entries(paths).forEach(([key, path], i) => trace(path, palette[i], names[key]));
        g.dot([0, 0], "最优点", c.gray);
      }
      Object.entries(paths).forEach(([key, path], i) => {
        metrics.push(metric(names[key] + " 相对目标差", data.f(path[Math.min(s.k, path.length - 1)]) / data.f(path[0])));
        legend.push([names[key], palette[i]]);
      });
      notice =
        id === "cg"
          ? "仅对 SPD 二次型使用线性 CG；精确算术中至多二维两步结束。Q-共轭内积：" + fmt(data.orthogonality)
          : id === "steepest"
            ? "三种方向均配精确线搜索；不同范数定义不同的单位步长集合。"
            : "原 Hessian 条件数 " + fmt(data.condition) + "，缩放后 " + fmt(data.transformed) + "；图中迭代始终用原变量表示。";
    } else if (id === "decrement") {
      plot([0.05, Math.max(4.2, s.x + 1), -0.5, 4.5], false, "x", "目标与局部模型");
      g.curve(data.f, 0.05, 5, c.blue);
      g.curve(data.model, 0.05, 5, c.orange, "5 3");
      g.dot([s.x, data.f(s.x)], "当前点", c.gray);
      g.dot([data.next, data.f(data.next)], "阻尼步", c.green);
      if (data.full > 0) g.dot([data.full, data.f(data.full)], "全步", c.red);
      metrics = [metric("Newton 减量 λ", data.lambda), metric("阻尼步长", data.t), metric("全步是否在定义域", data.full > 0 ? "是" : "否")];
      notice = "f(x)=x−log x−1，x>0；全步可越出定义域，t=1/(1+λ) 则保留严格可行性。";
    } else if (id === "elimination") {
      if (s.view === "curve") {
        plot([-3, 3, 0, Math.max(data.phi(-3), data.phi(3)) * 1.05], false, "零空间坐标 z", "约束上的目标");
        g.curve(data.phi, -3, 3, c.purple);
        g.dot([data.z, data.phi(data.z)], "z*", c.green);
        g.dot([s.z, data.phi(s.z)], "当前 z", c.red);
      } else {
        fitPlot([[0, 0], data.c, data.base, data.x, data.trial], { padding: 0.15, minSpan: [3, 2] });
        contour(data.f, [0.5, 1, 2, 4, 8]);
        g.line(data.a, s.b, c.blue, "");
        g.dot(data.x, "最优解", c.green);
        g.dot(data.trial, "可行点", c.red);
      }
      metrics = [metric("最优 z", data.z), metric("降维曲率 NᵀHN", data.curvature), metric("当前等式残差", Math.abs(dot(data.a, data.trial) - s.b))];
      notice = "x=b a+zN，a 与 N 是单位正交向量；任意 z 都满足等式约束。";
    } else if (id === "duality") {
      fitPlot(
        M.seq(0, 5)
          .map((x) => [x, data.q(x)])
          .concat([
            [data.lambda, data.value],
            [s.lambda, data.current],
          ]),
        { padding: [0.025, 0.1], minSpan: [5, 2] },
        false,
        "非负乘子 λ",
        "对偶函数 q(λ)"
      );
      g.curve(data.q, 0, 5, c.purple);
      g.line([0, 1], data.value, c.green);
      g.dot([data.lambda, data.value], "对偶最优", c.green);
      g.dot([s.lambda, data.current], "当前下界", c.red);
      metrics = [metric("原始最优值", data.value), metric("当前对偶下界", data.current), metric("对偶间隙", data.gap)];
      notice = "q(λ)=λb−λ²/4，λ≥0。原问题严格可行，强对偶成立；b≤0 时最优乘子为零。";
    } else if (id === "sensitivity") {
      plot([-2, 3, -0.6, Math.max(2, data.p(-2)) * 1.1], false, "约束右端 b", "最优值 p*(b)");
      g.curve(data.p, -2, 3, c.blue);
      g.curve((b) => data.value - data.lambda * (b - s.b), -2, 3, c.orange, "5 3");
      g.dot([s.b, data.value], "当前约束", c.red);
      metrics = [metric("最优 x", data.x), metric("乘子 λ*", data.lambda), metric("值函数导数", data.derivative)];
      notice = "p*(b)=½ max(c−b,0)²，切线斜率等于 −λ*；b≥c 后约束非活动。";
    } else if (id === "waterfilling") {
      plot([-0.7, 2.7, 0, Math.max(...data.a, data.level) + 0.6], false, "通道 i", "噪声底 + 功率");
      data.a.forEach((v, i) => {
        g.path(
          [
            [i, 0],
            [i, v],
          ],
          c.gray,
          38
        );
        g.path(
          [
            [i, v],
            [i, v + data.x[i]],
          ],
          c.blue,
          38
        );
      });
      g.line([0, 1], data.level, c.orange, "");
      metrics = [metric("各通道功率", pair(data.x)), metric("水位 / 乘子", pair([data.level, data.lambda])), metric("预算残差", data.residual)];
      legend = [
        ["噪声底", c.gray],
        ["分配功率", c.blue],
      ];
      notice = "xᵢ=max(0,水位−aᵢ)，满足非负约束与总预算；高于水位的通道分配为零。";
    } else if (id === "logbarrier") {
      const floor = data.f(data.x);
      plot([0, 1, floor - 0.5, Math.max(data.f(0.02), data.f(0.98)) + 1], false, "x", "障碍子问题");
      g.curve(data.f, 0.005, 0.995, c.purple);
      g.dot([data.x, data.f(data.x)], "中心点", c.green);
      g.dot([s.x, data.f(s.x)], "试探点", c.red);
      metrics = [metric("中心点 x(t)", data.x), metric("中心点 Hessian", data.hessian), metric("试探点目标值", data.f(s.x))];
      notice = "端点的目标为 +∞，不画成有限数值；增加 t 相当于减弱原目标中的障碍系数 1/t。";
    } else if (id === "complementarity") {
      const upper = Math.max(3, data.x * 1.2, data.lambda * 1.2),
        right = upper * (570 / 290);
      plot([0, right, 0, upper], true, "原变量 x", "对偶变量 λ");
      g.curve((x) => (x > 0 ? data.mu / x : NaN), 0.001, right, c.purple);
      g.line([1, -1], s.a, c.blue, "");
      g.dot([data.x, data.lambda], "中心点", c.red);
      metrics = [metric("x / λ", pair([data.x, data.lambda])), metric("xλ", data.x * data.lambda), metric("原始–对偶间隙", data.gap)];
      notice = "紫线为 xλ=μ，蓝线为驻点条件 x−a−λ=0；这里的原始–对偶间隙精确等于 μ。";
    } else if (id === "analytic") {
      fitPlot([...data.polygon, data.x, data.cheb.center, ...ellipseFrame(data.cheb.center, [data.cheb.radius, data.cheb.radius])], {
        padding: 0.13,
        minSpan: [3, 2],
      });
      g.polygon(data.polygon, c.blue, 0.12);
      contour(data.f, [-1, 0, 1, 2, 3, 4]);
      g.dot(data.x, "解析中心", c.purple);
      g.dot(data.cheb.center, "内切圆圆心", c.green);
      g.ellipse(data.cheb.center, [data.cheb.radius, data.cheb.radius], 0, c.green);
      metrics = [metric("解析中心", pair(data.x)), metric("梯度残差", data.residual), metric("最小约束余量", Math.min(...data.slack(data.x)))];
      notice = "解析中心最大化所有松弛量的乘积；其位置依赖不等式表示，不能等同于最大内切圆圆心。";
    } else if (id === "socp") {
      plot([-0.1, 2.2, -0.1, 2.2]);
      g.polygon(
        [
          [0, 0],
          [2, 0],
          [0, 2],
        ],
        c.gray,
        0.08
      );
      g.polygon(data.polygon, c.purple, 0.22);
      g.line(data.worst, 2, c.red, "");
      g.line(data.c, data.value, c.orange);
      g.dot(data.x, "鲁棒最优点", c.green);
      metrics = [metric("最优收益", data.value), metric("最坏系数", pair(data.worst)), metric("鲁棒约束余量", -data.violation)];
      notice = "灰色三角形为名义可行域；紫色满足 aᵀx+σ‖x‖₂≤2，红线由最坏扰动 a+σx/‖x‖₂ 产生。";
    } else if (id === "logistic") {
      const bound = 4.2;
      plot([-bound, bound, -0.1, 1.1], false, "特征 t", "类别 / 拟合概率");
      data.points.forEach(([t, y]) => g.dot([t, y], "", y ? c.purple : c.blue));
      g.curve(data.prob, -bound, bound, c.orange);
      g.line([0, 1], 0.5, c.gray);
      metrics = [metric("斜率 / 截距", pair(data.x)), metric("正则化 λ", data.lambda), metric("梯度残差", data.residual)];
      notice = "使用正 λ 惩罚两个系数，使演示始终有有限唯一解；概率模型实时通过阻尼 Newton 重新拟合。";
    } else if (id === "maxentropy") {
      plot([-0.6, 2.6, 0, 1.05], false, "三个结果：−1，0，1", "最优概率");
      bars(data.p, c.purple);
      data.p.forEach((v, i) => g.label([i, v], fmt(v), c.purple, 0, -9));
      metrics = [metric("最大熵 H(p)", data.entropy), metric("期望 / 规定值", pair([data.mean, s.mean])), metric("指数族参数 β", data.beta)];
      notice = "pᵢ∝exp(βtᵢ)，β 通过均值方程求解。均值 0 时为均匀分布；使用自然对数。";
    } else if (id === "gaussian") {
      fitPlot([...ellipseFrame([0, 0], data.axes, data.angle), ...ellipseFrame([0, 0], data.candidateAxes, data.candidateAngle)], {
        padding: 0.12,
        minSpan: [2.4, 1.5],
        center: [0, 0],
      });
      g.ellipse([0, 0], data.axes, data.angle, c.green);
      g.ellipse([0, 0], data.candidateAxes, data.candidateAngle, c.purple, true);
      metrics = [metric("当前目标", data.value), metric("最优目标", data.minimum), metric("似然目标差", data.value - data.minimum)];
      legend = [
        ["样本协方差椭圆", c.green],
        ["当前精度对应椭圆", c.purple],
      ];
      notice = "假设均值已知为 0、样本协方差正定；最优精度为 S⁻¹。图中椭圆表示单位二次型，不指定置信水平。";
    } else if (id === "hypothesis") {
      if (s.view === "roc") {
        plot([0, 1, 0, 1], false, "误报率", "检出率");
        g.path(
          [
            [0, 0],
            [1, 1],
          ],
          c.gray,
          1,
          "4 3"
        );
        g.path(data.roc, c.purple, 2.4);
        g.dot([s.alpha, data.power], "当前检验", c.red);
      } else {
        plot([-4, Math.max(5, s.delta + 4), 0, 0.45], false, "观测 x", "概率密度");
        g.curve((x) => data.density(x, 0), -4, s.delta + 4, c.blue);
        g.curve((x) => data.density(x, s.delta), -4, s.delta + 4, c.purple);
        g.line([1, 0], data.threshold, c.red, "");
        legend = [
          ["H₀: N(0,1)", c.blue],
          ["H₁: N(δ,1)", c.purple],
        ];
      }
      metrics = [metric("拒绝阈值", data.threshold), metric("误报率", s.alpha), metric("检出率", data.power)];
      notice = "δ>0 时似然比单调，最优规则为 x>阈值；δ=0 时两假设相同，检出率等于误报率。";
    } else if (id === "bounds") {
      plot([-2.6, 2.6, 0, 1.05], false, "离散支撑 X", "极端分布概率");
      data.p.forEach((p, i) =>
        g.path(
          [
            [data.support[i], 0],
            [data.support[i], p],
          ],
          data.support[i] >= values.threshold ? c.red : c.blue,
          22
        )
      );
      metrics = [
        metric("有限支撑最优尾概率", data.value),
        metric("Cantelli 上界", data.bound),
        metric(
          "实现的二阶矩",
          dot(
            data.p,
            data.support.map((x) => x * x)
          )
        ),
      ];
      notice = "已知 E[X]=0、E[X²]=指定方差，并限制支撑 {−2,−1,0,1,2}。枚举至多三个非零概率的基本可行解；不是所有实值分布的精确界。";
    } else if (id === "distance") {
      fitPlot([...ellipseFrame(data.a, [data.r1, data.r1]), ...ellipseFrame(data.b, [data.r2, data.r2]), data.p, data.q], {
        padding: 0.14,
        minSpan: [3, 2],
      });
      g.ellipse(data.a, [data.r1, data.r1], 0, c.blue, true);
      g.ellipse(data.b, [data.r2, data.r2], 0, c.purple, true);
      g.dot(data.b, "圆心 B", c.purple, "px,py");
      if (data.distance > 1e-8) {
        g.path([data.p, data.q], c.orange, 3);
        g.line(data.normal, dot(data.normal, data.mid), c.green, "");
        g.dot(data.p, "最近点 A", c.blue);
        g.dot(data.q, "最近点 B", c.purple);
      }
      metrics = [
        metric("集合距离", data.distance),
        metric("严格分离", data.distance > 1e-8 ? "可以" : "不可以"),
        metric("圆心距离", norm(add(data.b, data.a, -1))),
      ];
      notice = "距离为 max(0,圆心距离−两半径之和)；相切或相交时不绘制严格分离线。";
    } else if (id === "svm") {
      const svmPoints = data.z.flatMap((p) => [p, scale(p, -1)]);
      fitPlot([[0, 0], ...svmPoints], { padding: 0.17, minSpan: [2.8, 1.8] });
      data.z.forEach((p) => {
        g.dot(p, "+", c.purple);
        g.dot(scale(p, -1), "−", c.blue);
      });
      if (norm(data.w) > 1e-9) {
        g.line(data.w, 0, c.green, "");
        g.line(data.w, 1, c.gray);
        g.line(data.w, -1, c.gray);
      }
      metrics = [metric("间隔宽度 2/‖w‖", data.margin), metric("总松弛量", 2 * data.slacks.reduce((a, b) => a + b)), metric("目标值", data.value)];
      notice = "样本成 ± 对称对，因此可取最优截距 0；枚举分段二次目标的驻点、折线驻点和交点。虚线为功能间隔 ±1。";
    } else if (id === "ellipsoids") {
      fitPlot([...data.points, ...ellipseFrame(data.center, data.axes, data.angle)], { padding: 0.14, minSpan: [2.6, 1.8] });
      g.polygon(data.points, c.gray, 0.12);
      g.ellipse(data.center, data.axes, data.angle, c.purple);
      g.ellipse(
        data.center,
        data.axes.map((x) => x / 2),
        data.angle,
        c.green,
        true
      );
      data.points.forEach((p, i) => g.dot(p, "顶点 " + (i + 1), c.red, i === 2 ? "px,py" : null));
      g.dot(data.center, "共同中心", c.gray);
      metrics = [metric("最小外接面积", data.area), metric("最大内接面积", data.innerArea), metric("面积比", 4)];
      legend = [
        ["最小面积外接椭圆", c.purple],
        ["最大面积内接椭圆", c.green],
      ];
      notice = "采用非退化三角形的 Steiner 椭圆精确公式；面积比 4 是该特例的性质，不能推广到任意点集或多面体。";
    } else if (id === "facility") {
      fitPlot([...data.points, data.x, data.centroid], { padding: 0.15, minSpan: [3, 2] });
      contour(data.f, [data.value + 0.1, data.value + 0.5, data.value + 1, data.value + 2, data.value + 4]);
      data.points.forEach((p, i) => {
        g.path([p, data.x], c.gray, 1, "4 3");
        g.dot(p, "需求 " + (i + 1), i === 3 ? c.red : c.blue, i === 3 ? "px,py" : null);
      });
      g.dot(data.x, "几何中位数", c.green);
      g.dot(data.centroid, "加权重心", c.orange);
      metrics = [metric("最小加权总距离", data.value), metric("重心的总距离", data.f(data.centroid)), metric("迭代次数", data.steps)];
      notice = "使用处理重合点的修正 Weiszfeld 迭代。加权重心最小化平方距离之和，几何中位数最小化距离之和。";
    } else if (id === "placement") {
      const [x, y] = data.nodes;
      fitPlot([...data.anchors, x, y], { padding: 0.15, minSpan: [3, 2] });
      g.path([data.anchors[0], x, data.anchors[1]], c.blue, 2);
      g.path([x, y], c.purple, Math.min(9, 1 + s.weight));
      g.path([y, data.anchors[2]], c.blue, 2);
      data.anchors.forEach((p, i) => g.dot(p, "锚点 " + (i + 1), c.red, i === 2 ? "px,py" : null));
      g.dot(x, "自由节点 1", c.green);
      g.dot(y, "自由节点 2", c.green);
      metrics = [metric("最小布局能量", data.energy), metric("自由节点间距", norm(add(x, y, -1))), metric("节点 1 坐标", pair(x))];
      notice = "每个坐标解相同的加权图 Laplacian 方程；这里的弹簧自然长度为零。";
    } else if (id === "proximal") {
      if (s.view === "map") {
        plot([-3.5, 3.5, -3.5, 3.5], true, "输入 z", "prox 输出");
        g.path(
          [
            [-3.5, -3.5],
            [3.5, 3.5],
          ],
          c.gray,
          1,
          "4 3"
        );
        g.curve(data.map, -3.5, 3.5, c.purple);
        g.dot([s.z, data.x], "当前映射", c.red);
      } else {
        plot([-3.5, 3.5, 0, 12], false, "候选 x", "近端目标");
        g.curve(data.f, -3.5, 3.5, c.purple);
        g.dot([data.x, data.value], "最优解", c.green);
      }
      metrics = [metric("近端解", data.x), metric("收缩量", s.z - data.x), metric("是否精确为零", data.x === 0 ? "是" : "否")];
      notice = "这是标量近端子问题的精确解；与一般相关设计矩阵下的完整 Lasso 解有区别。";
    } else if (id === "subgradient") {
      plot([0, 100, 0, Math.max(3, Math.abs(s.x0) + 0.3)], false, "迭代 k", "目标 |xₖ|");
      g.path(
        data.path.slice(0, s.k + 1).map((p, k) => [k, p.value]),
        c.purple
      );
      g.path(
        data.path.slice(0, s.k + 1).map((p, k) => [k, p.best]),
        c.green,
        2,
        "4 3"
      );
      const cur = data.path[s.k];
      metrics = [metric("当前 xₖ", cur.x), metric("当前目标", cur.value), metric("历史最好目标", cur.best)];
      legend = [
        ["当前值", c.purple],
        ["历史最好值", c.green],
      ];
      notice = "在 x=0 处选择次梯度 0。固定步长通常在折点两侧振荡，但某些起点和步长恰好有限步到零。";
    } else if (id === "stochastic") {
      const cur = data.path[s.k];
      plot([0, 120, -8, 1], false, "样本梯度调用次数 k", "log₁₀ 目标差");
      g.path(
        data.path.slice(0, s.k + 1).map((p, k) => [k, Math.log10(Math.max(1e-8, (p.x * p.x) / 2))]),
        c.purple,
        1.5
      );
      g.path(
        data.path.slice(0, s.k + 1).map((p, k) => [k, Math.log10(Math.max(1e-8, p.expected))]),
        c.orange,
        2.6
      );
      metrics = [
        metric("样本目标", (cur.x * cur.x) / 2),
        metric("精确期望目标", cur.expected),
        metric("固定步长极限", s.schedule === "constant" ? data.floor : "不使用固定噪声底"),
      ];
      legend = [
        ["一条可复现样本轨迹", c.purple],
        ["精确期望", c.orange],
      ];
      notice = "f(x)=x²/2，随机梯度 x+ε，ε 独立取 ±σ。期望曲线由二阶矩递推精确计算，未用单条样本冒充期望。";
    } else if (id === "dualnorm") {
      const r = s.radius,
        p = s.p;
      fitPlot([[-r, -r], [r, r], [0, 0], data.z, data.x], { padding: 0.14, minSpan: [2.4, 1.6], center: [0, 0] });
      if (p === "1")
        g.polygon(
          [
            [r, 0],
            [0, r],
            [-r, 0],
            [0, -r],
          ],
          c.purple,
          0.15
        );
      else if (p === "inf")
        g.polygon(
          [
            [-r, -r],
            [r, -r],
            [r, r],
            [-r, r],
          ],
          c.purple,
          0.15
        );
      else g.ellipse([0, 0], [r, r], 0, c.purple, true);
      g.path([[0, 0], data.z], c.orange);
      g.dot(data.z, "z", c.orange, "px,py");
      if (norm(data.z) > 1e-9) {
        g.line(data.z, data.support, c.green, "");
        g.dot(data.x, "一个最优接触点", c.green);
      }
      metrics = [metric("对偶范数 ‖z‖*", data.value), metric("最大支撑值", data.support), metric("接触点", pair(data.x))];
      notice = "优化变量是范数球内的 x，拖动的是目标向量 z。z=0 时全部球内点都最优；平直边上也可能出现多解。";
    } else if (id === "uncertainfit") {
      fitPlot([data.nominal, data.stochastic, data.worst], { padding: 0.18, minSpan: [2, 2] });
      contour((x) => data.residual(x) ** 2, [0.02, 0.1, 0.3, 0.7, 1.5]);
      for (const [key, name, color] of [
        ["nominal", "名义", c.blue],
        ["stochastic", "随机平均", c.purple],
        ["worst", "最坏情形", c.green],
      ]) {
        g.dot(data[key], name, color);
        metrics.push(metric(name + " 最坏残差", data.worstValue(data[key])));
        legend.push([name, color]);
      }
      notice = "随机模型假设 ΔA 各元素独立、零均值、方差 σ²；最坏模型假设 ‖ΔA‖F≤ρ，二者不能把参数直接等同。";
    } else if (id === "contact") {
      plot([-2.5, 2.5, -1.2, 1.2], false, "共同位置标尺", "两滑块错开显示");
      for (let i = 0; i < 2; i++) {
        const y = i === 0 ? 0.5 : -0.5;
        g.path(
          [
            [-2.5, y],
            [2.5, y],
          ],
          c.gray,
          1
        );
        g.path(
          [
            [data.anchors[i], y],
            [data.x[i], y],
          ],
          i ? c.blue : c.purple,
          4
        );
        g.dot([data.anchors[i], y], i ? "自然位置 2" : "自然位置 1", c.gray);
        g.dot([data.x[i], y], i ? "滑块 2" : "滑块 1", i ? c.blue : c.purple);
      }
      if (data.lambda > 0)
        g.path(
          [
            [data.x[0], 0.4],
            [data.x[1], -0.4],
          ],
          c.red,
          3,
          "4 3"
        );
      metrics = [metric("最优位置", pair(data.x)), metric("接触力 λ", data.lambda), metric("互补乘积 λ(x₂−x₁)", data.lambda * data.slack)];
      notice = "约束 x₁≤x₂；上下错开仅为绘图。非接触时 λ=0，接触时间隙 x₂−x₁=0，并满足弹力平衡。";
    } else if (id === "primaldual") {
      const cur = data.path[Math.min(s.k, data.path.length - 1)];
      if (s.view === "error") {
        plot([0, 30, -11, 2], false, "Newton 迭代", "log₁₀ 残差 / 间隙");
        for (const [key, name, color] of [
          ["primal", "原始残差", c.blue],
          ["dual", "对偶残差", c.purple],
          ["gap", "替代间隙 sᵀλ", c.orange],
        ]) {
          g.path(
            data.path.slice(0, s.k + 1).map((p, k) => [k, Math.log10(Math.max(1e-11, p[key]))]),
            color,
            2.3
          );
          legend.push([name, color]);
        }
      } else {
        fitPlot([[0, 0], [1, 0], [0, 1], ...data.path.map((p) => p.x)], { padding: 0.15, minSpan: [2.3, 1.7] });
        g.polygon(
          [
            [0, 0],
            [1, 0],
            [0, 1],
          ],
          c.blue,
          0.15
        );
        contour((x) => 0.5 * dot(add(x, data.c, -1), add(x, data.c, -1)), [0.1, 0.3, 0.7, 1.5, 3]);
        trace(
          data.path.map((p) => p.x),
          c.purple,
          "当前原变量"
        );
      }
      metrics = [metric("原始 / 对偶残差", pair([cur.primal, cur.dual])), metric("替代间隙 sᵀλ", cur.gap), metric("本步步长", cur.alpha)];
      notice = "联立驻点、Ax+s=b 和扰动互补方程；步长同时保持 s、λ 严格为正。原变量尚不可行时，替代间隙不能冒充有效原始–对偶目标界。";
    }
    return { state: s, svg: g.finish(d.title), metrics, legend, notice, data };
  }
  const api = { defs, lectureDefs, ids, render };
  root.ChapterMoreExamples = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
