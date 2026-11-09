/* DOM 引用集中管理（避免散落 getElementById） */

/* ---------------- DOM ---------------- */
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');

const sampleBtn = document.getElementById('sampleBtn');
const gridWInput = document.getElementById('gridW');

const gridWVal = document.getElementById('gridWVal');
const gridHVal = document.getElementById('gridHVal');

const squareInput = document.getElementById('square');
const paletteSel = document.getElementById('palette');

const colorLimitInput = document.getElementById('colorLimit');
const limitVal = document.getElementById('limitVal');

const ditherInput = document.getElementById('dither');
const zoomInput = document.getElementById('zoom');

const zoomVal = document.getElementById('zoomVal');
const autoFitInput = document.getElementById('autoFit');

const showGridInput = document.getElementById('showGrid');

const sizeTemplateSel = document.getElementById('sizeTemplate');
const showBoardsInput = document.getElementById('showBoards');

const beadSpecSel = document.getElementById('beadSpec');
const ditherStrengthInput = document.getElementById('ditherStrength');

const ditherStrengthVal = document.getElementById('ditherStrengthVal');
const fitModeSel = document.getElementById('fitMode');

const qualityPresetSel = document.getElementById('qualityPreset');
const preSmoothInput = document.getElementById('preSmooth');




const preSmoothVal = document.getElementById('preSmoothVal');
const mergeThresholdInput = document.getElementById('mergeThreshold');
const simplifyLevelInput = document.getElementById('simplifyLevel');
const simplifyVal = document.getElementById('simplifyVal');

const mergeVal = document.getElementById('mergeVal');
const modeFilterInput = document.getElementById('modeFilter');

const exportBtn = document.getElementById('exportBtn');

const canvasWrap = document.getElementById('canvasWrap');
const preview = document.getElementById('preview');

const legendEl = document.getElementById('legend');
const statsEl = document.getElementById('stats');

const whiteBgBtn = document.getElementById('whiteBgBtn');
const autoBgInput = document.getElementById('autoBg');
const compareBtn = document.getElementById('compareBtn');
const trimBtn = document.getElementById('trimBtn');

const undoSourceBtn = document.getElementById('undoSourceBtn');
const smartBgBtn = document.getElementById('smartBgBtn');

const chartZoomInfo = document.getElementById('chartZoomInfo');
const chartZoomIn = document.getElementById('chartZoomIn');

const chartZoomOut = document.getElementById('chartZoomOut');
const chartZoomReset = document.getElementById('chartZoomReset');

const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText = document.getElementById('loadingText');



/* 新控件 DOM */
const sampleModeSel = document.getElementById('sampleMode');
const pixelInfoEl = document.getElementById('pixelInfo');

const alignBtn = document.getElementById('alignBtn');
const outlineInput = document.getElementById('outline');

const outlineOpts = document.getElementById('outlineOpts');
const outlineColorSel = document.getElementById('outlineColor');

const outlinePosSel = document.getElementById('outlinePos');
const outlineAutoBgInput = document.getElementById('outlineAutoBg');

const outlineWInput = document.getElementById('outlineW');
const outlineWVal = document.getElementById('outlineWVal');

const ironInput = document.getElementById('iron');
const ironOpts = document.getElementById('ironOpts');

const ironStrengthInput = document.getElementById('ironStrength');
const ironVal = document.getElementById('ironVal');


const paletteBar = document.getElementById('paletteBar');
const gridBrushInput = document.getElementById('gridBrush');

const gridUndoBtn = document.getElementById('gridUndo');
const gridRedoBtn = document.getElementById('gridRedo');

const paintInfoEl = document.getElementById('paintInfo');
const gridHintEl = document.getElementById('gridHint');

const ditherKernelSel = document.getElementById('ditherKernel');

const matchMetricSel = document.getElementById('matchMetric');
const ditherOpts = document.getElementById('ditherOpts');

const denoiseInput = document.getElementById('denoise');
const denoiseOpts = document.getElementById('denoiseOpts');

const denoiseMaxInput = document.getElementById('denoiseMax');
const denoiseMaxVal = document.getElementById('denoiseMaxVal');


/* ---------------- 底部上滑面板 / 步骤条 ---------------- */
const sheetEl = document.getElementById('sheet');
const sheetMask = document.getElementById('sheetMask');

const sheetGrabEl = document.getElementById('sheetGrab');

/* ---------------- UI 事件 ---------------- */
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), 1600);
}
