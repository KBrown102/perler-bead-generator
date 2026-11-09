/* 应用状态（唯一可变状态源，所有模块共享） */

/* ---------------- 状态 ---------------- */
let sourceCanvas = null;      // 原始图（canvas，可编辑）
let gridW = 58, gridH = 58;   // 网格尺寸
let currentPalette = 'perler';

let useDither = false;       // 抖动默认关：杂点太多，默认走"干净"路线
let ditherKernel = 'fs';      // 误差扩散核：fs | atkinson | stucki | burkes | sierra
let matchMetric = 'oklab';    // 色差算法：rgb | oklab
let colorLimit = 0;

let square = false;
let showGrid = true;

let sizeLock = null;          // {w,h} 尺寸模板锁定（自定义时 null）
let showBoards = false;       // 显示分板粗线
let boardPegs = 29;           // 每块板孔数
let beadPitch = 5;            // 单颗豆中心距 mm
let ditherStrength = 100;     // 抖动强度 %
let autoBgRemove = true;     // 载入时自动去掉纯色背景（成品异形、省豆）
let fitMode = 'contain';      // contain | cover | stretch（只在套模板、长宽比不同时生效）
let preSmoothPasses = 0;      // 原图平滑降噪遍数（0-3；众数采样下默认 0）
let simplifyLevel = 2;        // 大块简化（去碎色）：0~3，越大越"做减法"
let autoSimplify = true;      // 是否按尺寸自动推荐简化强度（手动拖滑杆即关闭）
let simplifyTouched = false;  // 用户是否亲手调过简化滑杆
let detailBefore = 0;         // 简化前的"单格细节"数量（孤立单豆）
let detailAfter = 0;          // 简化后的"单格细节"数量
let mergeThreshold = 4;       // 相似色合并强度（0-10）
let modeFilterOn = true;      // 图纸众数平滑
let modeFilterPasses = 1;    // 众数平滑遍数（像素风小图用 2 遍更干净）
let preCache = null;          // 降噪缓存
let preCacheKey = '';

let autoFit = true;           // 图纸适应窗口
let cell = 16;                // 手动缩放时预览每格像素

let stateIdx = null;          // Int16Array，每格：>=0 颜色下标，-1 空格
let stateWorking = null;      // 本次使用的色板（颜色对象数组）
let stateEmptyCount = 0;      // 空格数
let legendData = [];          // {color,count,symbol}

/* 图纸缩放 / 平移 */

let chartPanning = false, chartPanStart = null;

/* 真像素 / 描边 / 熨烫 / 图纸编辑 状态 */
let sampleMode = 'majority';      // majority | average | nearest | snap
let majorityEdge = 255;           // 众数采样时：块内色差超过该值改用平均（255=纯众数，最干净）
let snapBlock = 0;                // 检测到的原图像素块边长（0 = 未知）
let snapNativeW = 0, snapNativeH = 0;
let snapPhaseX = 0, snapPhaseY = 0;   // 网格相位（像素画被裁切/偏移时不为 0）
let lastSourceWasPixelArt = false;    // 上一张图是否像素画（换图时据此恢复默认预设）

let outlineOn = false;            // 自动描边开关
let outlineW = 1;                 // 描边粗细细（格）
let outlineColorChoice = 'auto';     // 'auto' 或色板下标
let outlinePos = 'outer';         // outer | inner | both
let outlineAutoBg = true;         // 自动识别背景色（不透明的白底/纯色底也能描边）
let ironOn = false;               // 熨烫后色值预览
let ironStrength = 55;            // 熨烫强度 0-100
let ironHexes = null;             // 当前熨烫色缓存
let denoiseOn = false;            // 自动去杂色
let denoiseMax = 1;               // 小于等于 N 格的连通块算杂色
let denoiseRemoved = 0;           // 上次清掉的格数
let autoIdx = null;               // 自动量化结果（未叠加手动编辑）
let manualEdits = new Map();      // 格索引 → 颜色下标 / -1（空格）

let gridTool = 'brush';           // brush | eraser | fill | pick
let paintColorIdx = 0;            // 画笔颜色（stateWorking 下标），-1 = 空格
let gridBrush = 1;                // 图纸画笔大小（格）
let previewCell = 16;             // 当前预览每格 CSS 像素
let patCache = null;              // 图纸离屏缓存
let patDirty = true;              // 缓存失效标记
let hoverGrid = null;             // 悬停格 {x,y}
let gridPainting = false;

let gridLast = null;
let patRaf = 0;
