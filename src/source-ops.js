/* 源图操作：去白底、智能去背景、裁边、撤销 */

/**
 * 识别"背景色"：四边出现最多的 1~2 种颜色。
 * 特别处理"棋盘格假透明"——很多导出图把透明区域画成白/浅灰相间的格子，
 * 这种要把两种颜色都当背景，否则只能去掉一半。
 * @returns {{colors:number[][], ratio:number, checker:boolean}|null}
 */
function borderBackgroundInfo(src) {
  const w = src.width, h = src.height;
  const d = readPixels(src).data;
  const buckets = new Map();   // key -> {n, r, g, b}
  let totalSamples = 0;
  const add = (x, y) => {
    const i = (y * w + x) * 4;
    if (d[i + 3] < 8) return;
    const key = ((d[i] >> 4) << 8) | ((d[i + 1] >> 4) << 4) | (d[i + 2] >> 4);
    const b = buckets.get(key);
    if (b) { b.n++; b.r += d[i]; b.g += d[i + 1]; b.b += d[i + 2]; }
    else buckets.set(key, { n: 1, r: d[i], g: d[i + 1], b: d[i + 2] });
    totalSamples++;
  };
  for (let x = 0; x < w; x++) { add(x, 0); add(x, h - 1); }
  for (let y = 0; y < h; y++) { add(0, y); add(w - 1, y); }
  if (!totalSamples) return null;

  const sorted = [...buckets.values()].sort((a, b) => b.n - a.n);
  const toColor = (b) => [Math.round(b.r / b.n), Math.round(b.g / b.n), Math.round(b.b / b.n)];
  const neutral = (c) => (Math.max(c[0], c[1], c[2]) - Math.min(c[0], c[1], c[2])) <= 14;
  const lum = (c) => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];

  const first = sorted[0];
  const second = sorted[1];
  const primary = toColor(first);
  let colors = [primary];
  let ratio = first.n / totalSamples;
  let checker = false;
  if (second && second.n / totalSamples >= 0.12) {
    const c2 = toColor(second);
    // 棋盘格特征：两种颜色都是中性浅色、亮度接近、合起来占四边绝大多数
    if (neutral(primary) && neutral(c2) && Math.abs(lum(primary) - lum(c2)) <= 46
        && (first.n + second.n) / totalSamples >= 0.6) {
      colors = [primary, c2];
      ratio = (first.n + second.n) / totalSamples;
      checker = true;
    }
  }
  return { colors: colors, ratio: ratio, checker: checker };
}

/**
 * 去掉与四边连通的纯色背景（不限于白色）：四周洪水 + 颜色容差，
 * 被图案包住的白/浅色区域不会被误删。返回去掉的像素数。
 */
function removeBorderBackground(tolerance) {
  const tol = tolerance == null ? 30 : tolerance;
  const src = sourceCanvas;
  if (!src) return 0;
  const w = src.width, h = src.height;
  const ctx = src.getContext('2d', { willReadFrequently: true });
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const info = borderBackgroundInfo(src);
  if (!info) return 0;
  const bgs = info.colors;
  const near = (i) => {
    if (d[i + 3] <= 0) return false;
    for (let k = 0; k < bgs.length; k++) {
      const c = bgs[k];
      if (Math.abs(d[i] - c[0]) + Math.abs(d[i + 1] - c[1]) + Math.abs(d[i + 2] - c[2]) <= tol) return true;
    }
    return false;
  };
  const seen = new Uint8Array(w * h);
  const stack = [];
  const push = (p) => {
    if (seen[p]) return;
    if (!near(p * 4)) return;
    seen[p] = 1; stack.push(p);
  };
  for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }
  let n = 0;
  while (stack.length) {
    const p = stack.pop();
    d[p * 4 + 3] = 0;
    n++;
    const x = p % w, y = (p / w) | 0;
    if (x > 0) push(p - 1);
    if (x < w - 1) push(p + 1);
    if (y > 0) push(p - w);
    if (y < h - 1) push(p + w);
  }
  if (!n) return 0;
  pushUndo();
  ctx.putImageData(img, 0, 0);
  snapBlock = 0; snapNativeW = snapNativeH = 0;
  return n;
}

/** 载入图片后自动判断：背景占比够高 + 去掉后还剩足够主体，才自动处理 */
function autoRemoveBackgroundOnLoad() {
  if (!autoBgRemove || !sourceCanvas) return;
  const info = borderBackgroundInfo(sourceCanvas);
  if (!info || info.ratio < 0.55) return;
  const total = sourceCanvas.width * sourceCanvas.height;
  const before = stateIdx ? stateIdx.filter(v => v >= 0).length : 0;
  const removed = removeBorderBackground(34);
  if (!removed || removed < total * 0.08) return;
  viewport.reset();
  process();
  const after = stateIdx.filter(v => v >= 0).length;
  if (before > 0 && after > 0 && after > before * 0.98) return;   // 没省下豆子就撤销
  const saved = Math.max(0, before - after);
  if (saved > 0) toast('已自动去掉纯色背景，省 ' + saved + ' 颗豆（可用「撤销原图处理」恢复）');
}

/* ---------------- 一键去白底（本地，不联网） ---------------- */
function removeWhiteBg() {
  if (!sourceCanvas) return;
  const W = sourceCanvas.width, H = sourceCanvas.height;
  const ctx = sourceCanvas.getContext('2d', { willReadFrequently: true });
  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;
  const TOL = 30;
  const nearWhite = (i) => (255 - Math.min(d[i], d[i + 1], d[i + 2])) <= TOL && d[i + 3] > 0;
  const seen = new Uint8Array(W * H);
  const stack = [];
  const push = (p) => {
    if (seen[p]) return;
    if (!nearWhite(p * 4)) return;
    seen[p] = 1; stack.push(p);
  };
  for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x); }
  for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
  let n = 0;
  while (stack.length) {
    const p = stack.pop();
    d[p * 4 + 3] = 0;
    n++;
    const x = p % W, y = (p / W) | 0;
    if (x > 0) push(p - 1);
    if (x < W - 1) push(p + 1);
    if (y > 0) push(p - W);
    if (y < H - 1) push(p + W);
  }
  if (!n) { toast('四边没找到接近纯白的背景'); return; }
  pushUndo();
  ctx.putImageData(img, 0, 0);
  snapBlock = 0; snapNativeW = snapNativeH = 0;
  process();
  toast('已去掉白底 ' + n + ' 像素（只处理与画布四边连通的白色）');
}

/* ---------------- 智能去背景 ---------------- */
let smartBusy = false;
function showLoading(show, text) {
  loadingOverlay.classList.toggle('hidden', !show);
  if (text) loadingText.textContent = text;
}


async function smartRemoveBg() {
  if (smartBusy) return;
  if (!sourceCanvas) { toast('请先上传图片'); return; }
  if (!window.__bgRemovalPromise) { toast('AI 抠图模块尚未加载（需联网），请稍后重试'); return; }
  smartBusy = true;
  smartBgBtn.disabled = true;
  showLoading(true, '正在加载 AI 模型…');
  try {
    const removeBackground = await window.__bgRemovalPromise;
    if (!removeBackground) throw new Error('module load failed');
    showLoading(true, 'AI 抠图中…（首次需下载模型，稍慢）');
    pushUndo();
    const blob = await removeBackground(sourceCanvas.toDataURL('image/png'), {
      model: 'isnet_quint8',
      progress: (key, current, total) => {
        showLoading(true, 'AI 抠图中… ' + (current && total ? Math.round(current / total * 100) + '%' : ''));
      }
    });
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      c.getContext('2d').drawImage(img, 0, 0);
      sourceCanvas = c;
      snapBlock = 0; snapNativeW = snapNativeH = 0;
      showLoading(false);
      process();
      toast('智能去背景完成');
    };
    img.onerror = () => { showLoading(false); toast('结果解析失败'); };
    img.src = URL.createObjectURL(blob);
  } catch (e) {
    showLoading(false);
    toast('智能去背景失败：' + (e && e.message ? e.message : '请检查网络后重试'));
  } finally {
    smartBusy = false;
    smartBgBtn.disabled = false;
  }
}


/* ---------------- 原图处理（无独立视图，直接作用在源图） ---------------- */
const sourceHistory = new History(12);

function pushUndo() {
  const c = document.createElement('canvas');
  c.width = sourceCanvas.width;
  c.height = sourceCanvas.height;
  c.getContext('2d').drawImage(sourceCanvas, 0, 0);
  sourceHistory.push(c);
}


function undoSource() {
  const prev = sourceHistory.undo(sourceCanvas);
  if (!prev) { toast('没有可撤销的原图操作'); return; }
  sourceCanvas = prev;
  snapBlock = 0; snapNativeW = snapNativeH = 0;
  viewport.reset();
  process();
  toast('已撤销上一步原图处理');
}


/* 自动裁掉四周全透明的空白边 */
function trimSource() {
  if (!sourceCanvas) { toast('请先上传图片'); return; }
  const W = sourceCanvas.width, H = sourceCanvas.height;
  const d = sourceCanvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, W, H).data;
  const blank = (x, y) => d[(y * W + x) * 4 + 3] < 8;
  const rowEmpty = (y) => { for (let x = 0; x < W; x++) if (!blank(x, y)) return false; return true; };
  const colEmpty = (x) => { for (let y = 0; y < H; y++) if (!blank(x, y)) return false; return true; };
  let top = 0, bottom = H - 1, left = 0, right = W - 1;
  while (top < bottom && rowEmpty(top)) top++;
  while (bottom > top && rowEmpty(bottom)) bottom--;
  while (left < right && colEmpty(left)) left++;
  while (right > left && colEmpty(right)) right--;
  if (top === 0 && left === 0 && bottom === H - 1 && right === W - 1) { toast('四周没有可裁的空白'); return; }
  pushUndo();
  const c = document.createElement('canvas');
  c.width = right - left + 1;
  c.height = bottom - top + 1;
  c.getContext('2d').drawImage(sourceCanvas, left, top, c.width, c.height, 0, 0, c.width, c.height);
  sourceCanvas = c;
  snapBlock = 0; snapNativeW = snapNativeH = 0;
  viewport.reset();
  process();
  toast('已裁掉空白边 → ' + c.width + '×' + c.height);
}
