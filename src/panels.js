/* 所有参数控件的绑定（图片/尺寸/画质/色板/描边/熨烫/显示） */
/* =========================================================================
   拼豆图纸生成器 —— 核心逻辑（纯本地运行，无依赖、无上传）
   ========================================================================= */


dropzone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', e => { if (e.target.files[0]) loadFile(e.target.files[0]); });
['dragover', 'dragenter'].forEach(ev => dropzone.addEventListener(ev, e => {
  e.preventDefault(); dropzone.classList.add('drag');
}));
['dragleave', 'drop'].forEach(ev => dropzone.addEventListener(ev, e => {
  e.preventDefault(); dropzone.classList.remove('drag');
}));
dropzone.addEventListener('drop', e => { if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]); });

sampleBtn.addEventListener('click', makeSample);

autoBgInput.addEventListener('change', () => { autoBgRemove = autoBgInput.checked; });
whiteBgBtn.addEventListener('click', () => {
  const n = removeBorderBackground(34);
  if (!n) { toast('四边没找到可去除的纯色背景'); return; }
  viewport.reset();
  process();
  toast('已去掉背景 ' + n + ' 像素');
});


gridWInput.addEventListener('input', () => {
  sizeTemplateSel.value = '';
  sizeLock = null;
  const w = parseInt(gridWInput.value, 10);
  if (w !== gridW) resetManualEdits('网格尺寸变了，图纸手动编辑已重置');
  gridW = w;
  gridWVal.textContent = gridW;
  process();
});
squareInput.addEventListener('change', () => {
  square = squareInput.checked;
  resetManualEdits('网格尺寸变了，图纸手动编辑已重置');
  process();
});
paletteSel.addEventListener('change', () => {
  currentPalette = paletteSel.value;
  resetManualEdits('换了色板，图纸手动编辑已重置');
  process();
});
colorLimitInput.addEventListener('input', () => {
  colorLimit = parseInt(colorLimitInput.value, 10);
  limitVal.textContent = colorLimit === 0 ? '不限' : colorLimit + ' 色';
  resetManualEdits('换了用色上限，图纸手动编辑已重置');
  process();
});
ditherInput.addEventListener('change', () => {
  useDither = ditherInput.checked;
  if (ditherOpts) ditherOpts.classList.toggle('hidden', !useDither);
  process();
});
if (ditherKernelSel) ditherKernelSel.addEventListener('change', () => {
  ditherKernel = ditherKernelSel.value;
  process();
});
if (matchMetricSel) matchMetricSel.addEventListener('change', () => {
  matchMetric = matchMetricSel.value;
  process();
});
showGridInput.addEventListener('change', () => { showGrid = showGridInput.checked; patDirty = true; renderPattern(); });
zoomInput.addEventListener('input', () => {
  cell = parseInt(zoomInput.value, 10);
  updateZoomLabel();
  patDirty = true;
  renderPattern();
});
autoFitInput.addEventListener('change', () => {
  autoFit = autoFitInput.checked;
  updateZoomLabel();
  patDirty = true;
  renderPattern();
});

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(renderPattern, 120);
});

exportBtn.addEventListener('click', exportPNG);
sizeTemplateSel.addEventListener('change', () => {
  const v = sizeTemplateSel.value;
  if (!v) { sizeLock = null; process(); return; }
  const parts = v.split('x');
  sizeLock = { w: parseInt(parts[0], 10), h: parseInt(parts[1], 10) };
  square = false; squareInput.checked = false;
  resetManualEdits('套用尺寸模板，图纸手动编辑已重置');
  gridW = sizeLock.w;
  gridWInput.value = Math.min(150, gridW);
  process();
  toast('已套用 ' + sizeLock.w + '×' + sizeLock.h + ' 模板（' + (sizeLock.w * beadPitch / 10).toFixed(1) + '×' + (sizeLock.h * beadPitch / 10).toFixed(1) + 'cm）');
});
fitModeSel.addEventListener('change', () => {
  fitMode = fitModeSel.value;
  resetManualEdits('换了模板填满方式，图纸手动编辑已重置');
  process();
});
showBoardsInput.addEventListener('change', () => {
  showBoards = showBoardsInput.checked;
  patDirty = true;
  renderPattern();
});
beadSpecSel.addEventListener('change', () => {
  const parts = beadSpecSel.value.split(':');
  boardPegs = parseInt(parts[0], 10);
  beadPitch = parseFloat(parts[1]);
  patDirty = true;
  renderPattern();
  renderLegend();
});
ditherStrengthInput.addEventListener('input', () => {
  ditherStrength = parseInt(ditherStrengthInput.value, 10);
  ditherStrengthVal.textContent = ditherStrength;
  if (!useDither) return;
  clearTimeout(ditherStrengthInput._t);
  ditherStrengthInput._t = setTimeout(process, 140);
});

document.querySelectorAll('.presets button').forEach(b => b.addEventListener('click', () => {
  sizeTemplateSel.value = '';
  sizeLock = null;
  const w = parseInt(b.dataset.w, 10);
  if (w !== gridW) resetManualEdits('网格尺寸变了，图纸手动编辑已重置');
  gridW = w;
  gridWInput.value = w;
  gridWVal.textContent = w;
  process();
}));


smartBgBtn.addEventListener('click', smartRemoveBg);

/* ---- 采样方式：真像素 / 像素块对齐 ---- */
sampleModeSel.addEventListener('change', () => {
  sampleMode = sampleModeSel.value;
  if (sampleMode !== 'average' && useDither) {
    useDither = false;
    ditherInput.checked = false;
    if (ditherOpts) ditherOpts.classList.add('hidden');
    toast('像素模式已自动关闭抖动（抖动会产生杂点）');
  }
  process();
});

alignBtn.addEventListener('click', () => {
  const info = (typeof analyzeSource === 'function') ? analyzeSource(sourceCanvas) : null;
  if (info && info.isPixelArt) {
    applyQualityPreset('pixel', true);
    process();
    toast('已按原图 ' + info.w + '×' + info.h + ' 1:1 还原');
    return;
  }
  if (snapBlock > 1) {
    // 放大过的像素画：按"原生像素尺寸"1:1 还原，并套用像素风参数（洗掉抗锯齿杂色）
    applyQualityPreset('pixel', true, { size: { w: snapNativeW, h: snapNativeH } });
    sampleMode = 'snap';
    if (sampleModeSel) sampleModeSel.value = 'snap';
    process();
    toast('已按原生像素 ' + snapNativeW + '×' + snapNativeH + ' 1:1 还原');
    return;
  }
  if (!(snapBlock > 1)) { toast('没检测到像素画块，用默认网格即可'); return; }
  sampleMode = 'snap';
  sampleModeSel.value = 'snap';
  resetManualEdits('已按原图像素重排网格，图纸手动编辑已重置');
  square = false;
  squareInput.checked = false;
  gridW = Math.max(8, Math.min(150, snapNativeW));
  gridWInput.value = gridW;
  gridWVal.textContent = gridW;
  useDither = false;
  ditherInput.checked = false;
  if (ditherOpts) ditherOpts.classList.add('hidden');
  applyQualityPreset('detail', true);
  process();
  toast('已对齐原图像素：' + snapNativeW + '×' + snapNativeH + '（1 豆 = 1 像素）');
});

/* ---- 画质预设 ---- */
function applyQualityPreset(name, silent, opts) {
  if (name === 'clean') {
    preSmoothPasses = 0; mergeThreshold = 4; modeFilterOn = true; modeFilterPasses = 1; simplifyLevel = 2;
    denoiseOn = true; denoiseMax = 2; useDither = false;
  } else if (name === 'pixel') {
    autoSimplify = false;              // 像素画必须 0，不许自动加
    simplifyTouched = false;
    // 像素风小图：1 格 = 1 源像素，靠"降噪 + 并色 + 众数平滑"把抗锯齿杂色洗掉。
    // 注意：像素画的线条/高光本身就是"设计细节"，大块简化会把它们吃掉 → 固定 0。
    preSmoothPasses = 2; mergeThreshold = 8; modeFilterOn = true; modeFilterPasses = 2; simplifyLevel = 0;
    denoiseOn = true; denoiseMax = 2; useDither = false;
    sampleMode = 'nearest';
    if (sampleModeSel) sampleModeSel.value = 'nearest';
    const wanted = (opts && opts.size) ? opts.size
      : (sourceCanvas && sourceCanvas.width <= 150 && sourceCanvas.height <= 220
        ? { w: sourceCanvas.width, h: sourceCanvas.height } : null);
    if (wanted) {
      sizeLock = { w: wanted.w, h: wanted.h };
      square = false; squareInput.checked = false;
    }
  } else if (name === 'balanced') {
    preSmoothPasses = 1; mergeThreshold = 2; modeFilterOn = false; modeFilterPasses = 1; simplifyLevel = 2;
    denoiseOn = true; denoiseMax = 1; useDither = false;
  } else {
    preSmoothPasses = 0; mergeThreshold = 0; modeFilterOn = false; modeFilterPasses = 1; simplifyLevel = 0;
    denoiseOn = false; useDither = false;
    autoSimplify = false;              // 细节优先：不自动简化
    simplifyTouched = false;
  }
  preSmoothInput.value = preSmoothPasses; preSmoothVal.textContent = preSmoothPasses;
  mergeThresholdInput.value = mergeThreshold; mergeVal.textContent = mergeThreshold;
  simplifyLevelInput.value = simplifyLevel; simplifyVal.textContent = simplifyLevel;
  modeFilterInput.checked = modeFilterOn;
  ditherInput.checked = useDither;
  if (ditherOpts) ditherOpts.classList.toggle('hidden', !useDither);
  denoiseInput.checked = denoiseOn;
  denoiseMaxInput.value = denoiseMax; denoiseMaxVal.textContent = denoiseMax;
  denoiseOpts.classList.toggle('hidden', !denoiseOn);
  qualityPresetSel.value = name;
  process();
  if (!silent) toast('画质预设：' + qualityPresetSel.options[qualityPresetSel.selectedIndex].text);
}

qualityPresetSel.addEventListener('change', () => applyQualityPreset(qualityPresetSel.value));


preSmoothInput.addEventListener('input', () => {
  preSmoothPasses = parseInt(preSmoothInput.value, 10);
  preSmoothVal.textContent = preSmoothPasses;
  qualityPresetSel.value = '';
  clearTimeout(preSmoothInput._t);
  preSmoothInput._t = setTimeout(process, 140);
});
function syncSimplifyUI() {
  if (!simplifyLevelInput) return;
  simplifyLevelInput.value = simplifyLevel;
  if (simplifyVal) simplifyVal.textContent = simplifyLevel;
}

simplifyLevelInput.addEventListener('input', () => {
  simplifyTouched = true;              // 用户亲手动过 → 之后不再自动改
  autoSimplify = false;
  simplifyLevel = parseInt(simplifyLevelInput.value, 10);
  simplifyVal.textContent = simplifyLevel;
  qualityPresetSel.value = '';
  clearTimeout(simplifyLevelInput._t);
  simplifyLevelInput._t = setTimeout(() => {
    process();
    // 像素画 1:1 时开了简化 → 让建议卡提醒"会吃掉细节"
    if (typeof suggestions !== 'undefined' && suggestions && suggestions.el) suggestions.refresh();
  }, 140);
});
mergeThresholdInput.addEventListener('input', () => {
  mergeThreshold = parseInt(mergeThresholdInput.value, 10);
  mergeVal.textContent = mergeThreshold;
  qualityPresetSel.value = '';
  clearTimeout(mergeThresholdInput._t);
  mergeThresholdInput._t = setTimeout(process, 140);
});
modeFilterInput.addEventListener('change', () => {
  modeFilterOn = modeFilterInput.checked;
  if (!modeFilterOn) modeFilterPasses = 1;
  qualityPresetSel.value = '';
  process();
});

/* ---- 自动去杂色 ---- */
denoiseInput.addEventListener('change', () => {
  denoiseOn = denoiseInput.checked;
  denoiseOpts.classList.toggle('hidden', !denoiseOn);
  if (denoiseOn && useDither) {
    useDither = false;
    ditherInput.checked = false;
    if (ditherOpts) ditherOpts.classList.add('hidden');
    toast('去杂色已自动关闭抖动（抖动本身就是在制造杂点）');
    process();
    return;
  }
  rebuildState();
  patDirty = true;
  renderPattern();
  renderLegend();
  if (denoiseOn) toast('已开启去杂色：清掉 ≤' + denoiseMax + ' 格的小色块');
});
denoiseMaxInput.addEventListener('input', () => {
  denoiseMax = parseInt(denoiseMaxInput.value, 10);
  denoiseMaxVal.textContent = denoiseMax;
  if (!denoiseOn) return;
  rebuildState();
  patDirty = true;
  requestPatternRender();
  clearTimeout(denoiseMaxInput._t);
  denoiseMaxInput._t = setTimeout(renderLegend, 120);
});

/* ---- 自动描边 ---- */
outlineInput.addEventListener('change', () => {
  outlineOn = outlineInput.checked;
  outlineOpts.classList.toggle('hidden', !outlineOn);
  rebuildState();
  renderPattern();
  renderLegend();
});
outlinePosSel.addEventListener('change', () => {
  outlinePos = outlinePosSel.value;
  if (outlineOn) { rebuildState(); renderPattern(); renderLegend(); }
});
outlineAutoBgInput.addEventListener('change', () => {
  outlineAutoBg = outlineAutoBgInput.checked;
  if (outlineOn) { rebuildState(); renderPattern(); renderLegend(); }
});
outlineWInput.addEventListener('input', () => {
  outlineW = parseInt(outlineWInput.value, 10);
  outlineWVal.textContent = outlineW;
  if (outlineOn) { rebuildState(); renderPattern(); renderLegend(); }
});
outlineColorSel.addEventListener('change', () => {
  outlineColorChoice = outlineColorSel.value;
  if (outlineOn) { rebuildState(); renderPattern(); renderLegend(); }
});

/* ---- 熨烫（烤完）预览 ---- */
ironInput.addEventListener('change', () => {
  ironOn = ironInput.checked;
  ironOpts.classList.toggle('hidden', !ironOn);
  rebuildIronHexes();
  patDirty = true;
  renderPattern();
  renderLegend();
  updatePaintInfo();
  if (ironOn) toast('已开启熨烫预览：颜色按熔珠压扁后的观感近似换算');
});
ironStrengthInput.addEventListener('input', () => {
  ironStrength = parseInt(ironStrengthInput.value, 10);
  ironVal.textContent = ironStrength;
  if (!ironOn) return;
  rebuildIronHexes();
  patDirty = true;
  requestPatternRender();
  clearTimeout(ironStrength._t);
  ironStrength._t = setTimeout(() => { renderLegend(); updatePaintInfo(); }, 120);
});

/* ---- 图纸编辑工具 ---- */
document.querySelectorAll('.gtool').forEach(b => b.addEventListener('click', () => setGridTool(b.dataset.gtool)));
gridBrushInput.addEventListener('input', () => { gridBrush = parseInt(gridBrushInput.value, 10); });
gridUndoBtn.addEventListener('click', doGridUndo);
gridRedoBtn.addEventListener('click', doGridRedo);

paletteBar.addEventListener('click', (e) => {
  const btn = e.target.closest('.sw-btn');
  if (!btn) return;
  setPaintColor(parseInt(btn.dataset.ci, 10));
});
legendEl.addEventListener('click', (e) => {
  const item = e.target.closest('.legend-item');
  if (!item) return;
  const ci = parseInt(item.dataset.ci, 10);
  if (!isNaN(ci)) setPaintColor(ci);
});
chartZoomIn.addEventListener('click', () => zoomChart(1.25));
chartZoomOut.addEventListener('click', () => zoomChart(1 / 1.25));
chartZoomReset.addEventListener('click', () => {
  viewport.reset();
  renderPattern();
});
preview.addEventListener('wheel', (e) => {
  if (!stateIdx) return;
  e.preventDefault();
  const rect = preview.getBoundingClientRect();
  zoomChart(e.deltaY < 0 ? 1.2 : 1 / 1.2, e.clientX - rect.left, e.clientY - rect.top);
}, { passive: false });
trimBtn.addEventListener('click', trimSource);
undoSourceBtn.addEventListener('click', undoSource);
preview.addEventListener('pointerdown', previewPointerDown);
preview.addEventListener('pointermove', previewPointerMove);
preview.addEventListener('pointerup', previewPointerUp);
preview.addEventListener('pointercancel', previewPointerUp);
preview.addEventListener('pointerleave', () => { hoverGrid = null; requestPatternRender(); });
preview.addEventListener('contextmenu', (e) => e.preventDefault());
preview.style.cursor = 'crosshair';
