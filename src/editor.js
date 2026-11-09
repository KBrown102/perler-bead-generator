/* 图纸编辑器：手势分发（→ 工具类）、撤销栈（History）、视口平移 */

/* ---------------- 提示文案 ---------------- */
const GRID_HINTS = {
  brush: '按住拖动 = 用当前颜色改豆子；点色板换色，滚轮缩放预览',
  eraser: '按住拖动 = 把格子改成空格（不放置豆子）',
  fill: '点击 = 把整块同色区域一次涂成当前颜色',
  pick: '点击图纸 = 取这一格的豆子颜色当画笔',
  pan: '按住拖动平移图纸；滚轮缩放预览'
};

/* ---------------- 撤销栈（通用 History 实例） ---------------- */
const gridHistory = new History(60);

function pushGridUndo() {
  gridHistory.push(new Map(manualEdits));
  updateGridUndoUI();
}

function updateGridUndoUI() {
  if (gridUndoBtn) gridUndoBtn.disabled = !gridHistory.canUndo;
  if (gridRedoBtn) gridRedoBtn.disabled = !gridHistory.canRedo;
}

function doGridUndo() {
  const prev = gridHistory.undo(new Map(manualEdits));
  if (!prev) { toast('没有可撤销的图纸编辑'); return; }
  manualEdits = prev;
  rebuildState();
  renderPattern();
  renderLegend();
  updateGridUndoUI();
}

function doGridRedo() {
  const next = gridHistory.redo(new Map(manualEdits));
  if (!next) { toast('没有可重做的图纸编辑'); return; }
  manualEdits = next;
  rebuildState();
  renderPattern();
  renderLegend();
  updateGridUndoUI();
}

/* ---------------- 坐标换算（交给 Viewport） ---------------- */
/* 拖动/悬停期间画布位置不会变：缓存 rect，避免每个 pointermove 都强制布局 */
let cachedPreviewRect = null;
function previewRect() {
  if (!cachedPreviewRect) cachedPreviewRect = preview.getBoundingClientRect();
  return cachedPreviewRect;
}
function invalidatePreviewRect() { cachedPreviewRect = null; }

function eventToGrid(e) {
  const rect = previewRect();
  const p = viewport.cellAt(e.clientX, e.clientY, rect);
  const x = Math.floor(p.x), y = Math.floor(p.y);
  if (x < 0 || y < 0 || x >= gridW || y >= gridH) return null;
  return { x: x, y: y };
}

/* ---------------- 工具切换（工厂 + 策略） ---------------- */
function setGridTool(t) {
  gridTool = t;
  if (typeof createGridTool === 'function') activeTool = createGridTool(t);
  document.querySelectorAll('.gtool').forEach(b => b.classList.toggle('active', b.dataset.gtool === t));
  if (gridHintEl) gridHintEl.textContent = (activeTool && activeTool.hint) || GRID_HINTS[t] || '';
  if (preview) preview.style.cursor = (activeTool && activeTool.cursor) || 'crosshair';
}

function setPaintColor(idx) {
  paintColorIdx = idx;
  renderPaletteBar();
  document.querySelectorAll('#legend .legend-item').forEach(el => {
    el.classList.toggle('active', parseInt(el.dataset.ci, 10) === idx);
  });
}

/* ---------------- 笔画写入（手动编辑层） ---------------- */
function brushCells(x, y, val) {
  const b = Math.max(1, gridBrush | 0);
  const half = Math.floor((b - 1) / 2);
  for (let dy = 0; dy < b; dy++) {
    for (let dx = 0; dx < b; dx++) {
      const nx = x - half + dx, ny = y - half + dy;
      if (nx < 0 || ny < 0 || nx >= gridW || ny >= gridH) continue;
      const idx = ny * gridW + nx;
      if (stateIdx && stateIdx[idx] === val) continue;
      manualEdits.set(idx, val);
    }
  }
}

function paintLineTo(x0, y0, x1, y1, val) {
  let dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
  let dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (let guard = 0; guard < 4000; guard++) {
    brushCells(x0, y0, val);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

function floodFillGrid(x, y, val) {
  const target = stateIdx[y * gridW + x];
  if (target === val) return;
  const stack = [y * gridW + x];
  const seen = new Uint8Array(gridW * gridH);
  seen[y * gridW + x] = 1;
  let n = 0;
  while (stack.length) {
    const i = stack.pop();
    if (stateIdx[i] !== target) continue;
    manualEdits.set(i, val);
    n++;
    const cx = i % gridW, cy = (i / gridW) | 0;
    if (cx > 0 && !seen[i - 1]) { seen[i - 1] = 1; stack.push(i - 1); }
    if (cx < gridW - 1 && !seen[i + 1]) { seen[i + 1] = 1; stack.push(i + 1); }
    if (cy > 0 && !seen[i - gridW]) { seen[i - gridW] = 1; stack.push(i - gridW); }
    if (cy < gridH - 1 && !seen[i + gridW]) { seen[i + gridW] = 1; stack.push(i + gridW); }
  }
  if (n >= 1) toast('已填充 ' + n + ' 格');
}

function gridApplyLive() {
  rebuildState();
  requestPatternRender();
}

/* ---------------- 平移 ---------------- */
function startChartPan(e) {
  invalidatePreviewRect();
  chartPanning = true;
  chartPanStart = { x: e.clientX, y: e.clientY, px: viewport.x, py: viewport.y };
  try { preview.setPointerCapture(e.pointerId); } catch (err) { }
}

/* ---------------- 手势分发 ---------------- */
function previewPointerDown(e) {
  if (!stateIdx) return;
  if (e.pointerType === 'mouse' && e.button === 1) { startChartPan(e); return; }
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  if (gridTool === 'pan') { startChartPan(e); return; }
  invalidatePreviewRect();
  const p = eventToGrid(e);
  if (!p) return;
  e.preventDefault();
  hoverGrid = p;
  gridPainting = true;
  gridLast = p;
  activeTool.onDown(p, e);
}

function previewPointerMove(e) {
  if (!stateIdx) return;
  if (chartPanning && chartPanStart) {
    viewport.x = chartPanStart.px + (e.clientX - chartPanStart.x);
    viewport.y = chartPanStart.py + (e.clientY - chartPanStart.y);
    renderPattern();
    return;
  }
  const p = eventToGrid(e);
  if (!p) {
    if (hoverGrid) { hoverGrid = null; requestPatternRender(); }
    return;
  }
  if (!gridPainting) {
    if (!hoverGrid || hoverGrid.x !== p.x || hoverGrid.y !== p.y) {
      hoverGrid = p;
      requestPatternRender();
    }
    return;
  }
  if (gridLast && (gridLast.x !== p.x || gridLast.y !== p.y)) {
    activeTool.onMove(gridLast, p);
    gridLast = p;
  }
}

function previewPointerUp() {
  invalidatePreviewRect();
  if (chartPanning) { chartPanning = false; chartPanStart = null; return; }
  if (!gridPainting) return;
  gridPainting = false;
  gridLast = null;
  activeTool.onUp();
  renderPattern();
  renderLegend();
  updateGridUndoUI();
}

function resetManualEdits(reason) {
  if (!manualEdits.size) return;
  manualEdits.clear();
  gridHistory.clear();
  updateGridUndoUI();
  if (reason) toast(reason);
}
