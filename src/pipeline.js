/* 渲染管线编排：参数 → 网格 → 成品状态，含参数面板信息 */

/* ---------------- 主流程 ---------------- */
function computeGrid() {
  const iw = sourceCanvas.width, ih = sourceCanvas.height;
  if (sizeLock) {
    gridW = sizeLock.w;
    gridH = sizeLock.h;
    gridWVal.textContent = gridW;
    gridHVal.textContent = gridH;
    return;
  }
  if (square) {
    gridH = gridW;
  } else {
    gridH = Math.max(1, Math.min(200, Math.round(gridW * ih / iw)));
  }
  gridHVal.textContent = gridH;
}


/* 原图像素块检测（每张图只算一次） */
function ensureSnapInfo() {
  if (snapBlock > 0) return;
  const g = detectPixelGrid(sourceCanvas);
  if (g.period > 1) {
    snapBlock = g.period;
    snapPhaseX = g.phaseX;
    snapPhaseY = g.phaseY;
    snapNativeW = g.nativeW;
    snapNativeH = g.nativeH;
  } else {
    snapBlock = 1; snapPhaseX = 0; snapPhaseY = 0;
    snapNativeW = sourceCanvas.width;
    snapNativeH = sourceCanvas.height;
  }
}


/* 由 autoIdx + 去杂色 + 描边 + 手动编辑，合成最终图形 */
function rebuildState() {
  if (!autoIdx) return;
  let base = autoIdx;
  denoiseRemoved = 0;
  if (denoiseOn) {
    const r = denoiseGrid(autoIdx);
    base = r.grid;
    denoiseRemoved = r.removed;
  }
  stateIdx = base.slice();
  if (outlineOn) applyOutline(stateIdx);
  if (manualEdits.size) {
    for (const [i, v] of manualEdits) {
      if (i >= 0 && i < stateIdx.length) stateIdx[i] = v;
    }
  }
  patDirty = true;
}


/**
 * 渲染管线的阶段编排（模板方法）：
 *   采样 → 限色 → 量化 → 并色 → 平滑 → 合成状态 → 出图
 * 每个阶段计时（perf），整帧是否超预算可在 HUD 上看到。
 */
const Pipeline = {
  stages: ['采样', '限色', '量化', '并色', '简化', '平滑', '合成'],

  run() {
    if (!sourceCanvas) return null;
    perf.start();

    perf.stage('准备', () => {
      computeGrid();
      ensureSnapInfo();
      // 尺寸变了就按新尺寸推荐简化强度（用户亲手调过 / 像素画与细节预设时不动）
      if (autoSimplify && !simplifyTouched && typeof autoSimplifyLevel === 'function') {
        const rec = autoSimplifyLevel(gridW, gridH);
        if (rec !== simplifyLevel) {
          simplifyLevel = rec;
          if (typeof syncSimplifyUI === 'function') syncSimplifyUI();
        }
      }
    });

    const imgData = perf.stage('采样', () => downsample(sourceCanvas, gridW, gridH));
    const full = palettes[currentPalette].colors;
    let working = full;
    if (colorLimit > 0 && colorLimit < full.length) {
      working = perf.stage('限色', () => buildReducedPalette(imgData, full, colorLimit));
    }
    stateWorking = working;

    autoIdx = perf.stage('量化', () => quantize(imgData, working, useDither));
    if (mergeThreshold > 0) {
      autoIdx = perf.stage('并色', () => mergeSimilarColors(autoIdx, working, (mergeThreshold / 10) * 0.06));
    }
    // 做减法：把碎色块整块并入大色块（渐变过渡色/抗锯齿杂点成片消失，边缘更干净）
    detailBefore = perf.stage('统计', () => countIsolatedCells(autoIdx, gridW, gridH));
    if (simplifyLevel > 0) {
      autoIdx = perf.stage('简化', () => simplifyRegions(autoIdx, working, gridW, gridH, simplifyLevel));
    }
    if (modeFilterOn) {
      autoIdx = perf.stage('平滑', () => modeFilterGrid(autoIdx, modeFilterPasses));
    }
    detailAfter = countIsolatedCells(autoIdx, gridW, gridH);
    if (paintColorIdx >= stateWorking.length) paintColorIdx = 0;

    perf.stage('合成', () => { rebuildState(); rebuildIronHexes(); });
    const run = perf.end();

    renderPattern();
    renderLegend();
    renderPixelInfo();
    renderPaletteBar();
    return run;
  }
};

/** 兼容旧调用点：所有地方仍然写 process() */
function process() {
  return Pipeline.run();
}

/**
 * 按住「对比」时调用：用 simplifyLevel=0 重跑一遍并出图，返回 restore()。
 * 只做瞬时预览：不修改用户参数，松手后把网格/状态/统计原样恢复。
 */
function previewWithoutSimplify() {
  if (!sourceCanvas) return null;
  const saved = {
    level: simplifyLevel,
    autoIdx: autoIdx,
    stateIdx: stateIdx,
    stateWorking: stateWorking,
    detailBefore: detailBefore,
    detailAfter: detailAfter,
    denoiseRemoved: denoiseRemoved,
    lastRun: perf.lastRun
  };
  simplifyLevel = 0;
  process();
  return function restore() {
    simplifyLevel = saved.level;
    autoIdx = saved.autoIdx;
    stateIdx = saved.stateIdx;
    stateWorking = saved.stateWorking;
    detailBefore = saved.detailBefore;
    detailAfter = saved.detailAfter;
    denoiseRemoved = saved.denoiseRemoved;
    perf.lastRun = saved.lastRun;
    patDirty = true;
    renderPattern();
    renderLegend();
    renderPixelInfo();
  };
}


/* ---------------- 像素判定面板 ---------------- */
function renderPixelInfo() {
  if (!pixelInfoEl) return;
  if (!sourceCanvas) { pixelInfoEl.textContent = '尚未载入图片'; pixelInfoEl.classList.remove('ok'); return; }
  ensureSnapInfo();
  const sw = sourceCanvas.width, sh = sourceCanvas.height;
  const info = (typeof analyzeSource === 'function') ? analyzeSource(sourceCanvas) : null;
  const aligned = snapBlock > 1 && gridW === snapNativeW && gridH === snapNativeH;
  const native1to1 = !!(info && info.isPixelArt && gridW === sw && gridH === sh);
  let html = '原图 <b>' + sw + '×' + sh + '</b>';
  if (info && info.isPixelArt) {
    html += ' · 像素风小图（平涂率 <b>' + Math.round(info.flatness * 100) + '%</b>）';
    if (native1to1) {
      html += '<span class="badge">1:1 还原</span>';
      pixelInfoEl.classList.add('ok');
    } else {
      html += '<br>这是像素画，建议用「原图尺寸 1:1」还原（现在 <b>' + gridW + '×' + gridH + '</b> 会重采样）。';
      pixelInfoEl.classList.remove('ok');
    }
  } else if (snapBlock > 1) {
    html += ' · 检测到像素块 <b>' + snapBlock + '×' + snapBlock + '</b>'
      + ((snapPhaseX || snapPhaseY) ? '（相位 ' + snapPhaseX + ',' + snapPhaseY + '）' : '')
      + ' → 原生像素 <b>' + snapNativeW + '×' + snapNativeH + '</b>';
    if (aligned) {
      html += '<span class="badge">真像素 1:1</span>';
      pixelInfoEl.classList.add('ok');
    } else {
      html += '<br>当前网格 <b>' + gridW + '×' + gridH + '</b>，与原图像素不是 1:1，细节会被重新采样（可能糊边/串色）。';
      pixelInfoEl.classList.remove('ok');
    }
  } else {
    html += ' · 未检测到像素画块（照片/插画）：用「主色众数」采样最干净；放大过的像素画请切「像素块对齐」。';
    pixelInfoEl.classList.remove('ok');
  }
  pixelInfoEl.innerHTML = html;
  const canAlign = (snapBlock > 1) || !!(info && info.isPixelArt);
  alignBtn.disabled = !canAlign;
  if (info && info.isPixelArt) {
    alignBtn.textContent = '按原图尺寸 1:1 还原（' + sw + '×' + sh + '）';
  } else if (snapBlock > 1) {
    alignBtn.textContent = '对齐到 ' + snapNativeW + '×' + snapNativeH + '（1 豆 = 原图 1 像素）';
  } else {
    alignBtn.textContent = '按原图像素 1:1 对齐';
  }
  const key = currentPalette + '|' + stateWorking.length + '|' + (stateWorking[0] && stateWorking[0].code);
  if (outlineColorSel.dataset.built !== key) {
    rebuildOutlineColorOptions();
    outlineColorSel.dataset.built = key;
  }
}


function rebuildOutlineColorOptions() {
  if (!stateWorking) return;
  const keep = outlineColorSel.value;
  let html = '<option value="auto">自动（色板里最深的颜色）</option>';
  stateWorking.forEach((c, i) => {
    html += '<option value="' + i + '">' + c.code + ' ' + c.name + '</option>';
  });
  outlineColorSel.innerHTML = html;
  outlineColorSel.value = keep && keep !== 'auto' && parseInt(keep, 10) < stateWorking.length ? keep : 'auto';
  outlineColorSel.value = outlineColorSel.value || 'auto';
  outlineColorSel.dataset.sel = outlineColorSel.value;
}
