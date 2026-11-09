/* 图例、色板选色条、用量统计 */

/* ---------------- 色板选色条 ---------------- */
function renderPaletteBar() {
  if (!paletteBar || !stateWorking) return;
  const frag = document.createDocumentFragment();
  const emptyBtn = document.createElement('button');
  emptyBtn.className = 'sw-btn empty-cell' + (paintColorIdx < 0 ? ' active' : '');
  emptyBtn.title = '空格（不放置豆子）';
  emptyBtn.dataset.ci = '-1';
  frag.appendChild(emptyBtn);
  stateWorking.forEach((c, i) => {
    const b = document.createElement('button');
    b.className = 'sw-btn' + (paintColorIdx === i ? ' active' : '');
    b.style.background = c.hex;
    b.title = c.code + ' ' + c.name + ' ' + c.hex;
    b.dataset.ci = String(i);
    frag.appendChild(b);
  });
  paletteBar.innerHTML = '';
  paletteBar.appendChild(frag);
  updatePaintInfo();
}



function updatePaintInfo() {
  if (!paintInfoEl) return;
  if (paintColorIdx < 0 || !stateWorking || !stateWorking[paintColorIdx]) {
    paintInfoEl.textContent = '当前：空格';
    return;
  }
  const c = stateWorking[paintColorIdx];
  const nm = (c.name && c.name !== c.code) ? ' ' + c.name : '';
  paintInfoEl.textContent = '当前：' + c.code + nm + (ironOn ? '（烤后 ' + ironHexOf(c.rgb, ironStrength / 100) + '）' : '');
}


/* ---------------- 图例与统计 ---------------- */
function renderLegend() {
  if (!stateIdx) return;
  const counts = new Array(stateWorking.length).fill(0);
  let emptyCount = 0;
  for (let i = 0; i < stateIdx.length; i++) {
    const ci = stateIdx[i];
    if (ci < 0) emptyCount++;
    else counts[ci]++;
  }
  const items = [];
  for (let i = 0; i < stateWorking.length; i++) {
    if (counts[i] > 0) items.push({ ci: i, color: stateWorking[i], count: counts[i] });
  }
  items.sort((a, b) => b.count - a.count);
  legendData = items;
  stateEmptyCount = emptyCount;
  legendEl.innerHTML = items.map(it => {
    const ironed = ironOn ? ironHexOf(it.color.rgb, ironStrength / 100) : '';
    const sw2 = ironOn ? '<span class="swatch2" title="熨烫后 ' + ironed + '" style="background:' + ironed + '"></span>' : '';
    const nameShown = (it.color.name && it.color.name !== it.color.code) ? ' <span>' + it.color.name + '</span>' : '';
    return '<div class="legend-item' + (paintColorIdx === it.ci ? ' active' : '') + '" data-ci="' + it.ci + '" title="点击选中该色当画笔">' +
      '<span class="swatch" style="background:' + it.color.hex + '"></span>' + sw2 +
      '<span class="meta"><b>' + it.color.code + '</b>' + nameShown + '</span>' +
      '<span class="count">×' + it.count + '</span>' +
    '</div>';
  }).join('');
  const totalBeads = stateIdx.length - emptyCount;
  let s = '尺寸 <b>' + gridW + '×' + gridH + '</b> · 总豆 <b>' + totalBeads + '</b> 颗';
  if (emptyCount > 0) s += ' · 空格 <b>' + emptyCount + '</b>';
  s += ' · 用色 <b>' + items.length + '</b> 种 · 色板 <b>' + palettes[currentPalette].name + '</b>';
  const cmW = (gridW * beadPitch / 10), cmH = (gridH * beadPitch / 10);
  s += ' · 成品约 <b>' + cmW.toFixed(1) + '×' + cmH.toFixed(1) + 'cm</b>';
  const cols = Math.ceil(gridW / boardPegs), rows = Math.ceil(gridH / boardPegs);
  if (cols * rows > 1) s += ' · <b>' + cols + '×' + rows + ' 块板</b>拼接（共 ' + (cols * rows) + ' 块）';
  else s += ' · 1 块板';
  if (denoiseOn) s += ' · 去杂色 ' + denoiseRemoved + ' 格';
  if (outlineOn) s += ' · 已描边（' + outlineW + ' 格）';
  if (ironOn) s += ' · 熨烫预览 ' + ironStrength + '%';
  if (typeof perf !== 'undefined' && perf.lastRun) s += ' · 生成 ' + perf.lastRun.total + ' ms';
  if (simplifyLevel > 0 && !simplifyTouched && autoSimplify) s += ' · 简化 <b>' + simplifyLevel + '</b>（自动）';
  if (simplifyLevel > 0 && detailBefore > 0) s += ' · 细节 <b>' + detailBefore + '→' + detailAfter + '</b>';
  if (manualEdits.size) s += ' · 手改 <b>' + manualEdits.size + '</b> 格';
  statsEl.innerHTML = s;

  // 导出页的"当前图纸"摘要
  const ex = document.getElementById('exportSummary');
  if (ex) {
    ex.innerHTML = '当前图纸：<b>' + gridW + '×' + gridH + '</b> 格 · 总豆 <b>' + totalBeads + '</b> 颗 · 用色 <b>'
      + items.length + '</b> 种 · 成品约 <b>' + cmW.toFixed(1) + '×' + cmH.toFixed(1) + 'cm</b>'
      + (cols * rows > 1 ? ' · 需 <b>' + cols + '×' + rows + '</b> 块板（共 ' + (cols * rows) + ' 块）' : ' · 1 块板');
  }
}
