/* 图纸渲染：视口缩放/平移、离屏缓存、悬停高亮 */

function drawPattern(ctx, csize, ox, oy, withGrid, withSymbols, opts) {
  opts = opts || {};
  const iron = !!opts.iron;
  const beads = iron && csize >= 5;
  const gap = beads ? Math.max(1, csize * 0.10) : 0;
  for (let y = 0; y < gridH; y++) {
    for (let x = 0; x < gridW; x++) {
      const ci = stateIdx[y * gridW + x];
      const px = ox + x * csize, py = oy + y * csize;
      if (ci < 0) {
        ctx.fillStyle = iron ? '#f3ece1' : '#eef0f2';
        ctx.fillRect(px, py, csize, csize);
        if (!iron && csize >= 8) {
          ctx.strokeStyle = '#c9ccd1';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(px + 2, py + 2);
          ctx.lineTo(px + csize - 2, py + csize - 2);
          ctx.moveTo(px + csize - 2, py + 2);
          ctx.lineTo(px + 2, py + csize - 2);
          ctx.stroke();
        }
      } else {
        const hex = iron && ironHexes ? ironHexes[ci] : stateWorking[ci].hex;
        if (beads) {
          ctx.fillStyle = '#efe6da';
          ctx.fillRect(px, py, csize, csize);
          ctx.fillStyle = hex;
          roundRectPath(ctx, px + gap / 2, py + gap / 2, csize - gap, csize - gap, csize * 0.26);
          ctx.fill();
          if (csize >= 10) {
            ctx.fillStyle = 'rgba(255,255,255,0.18)';
            ctx.beginPath();
            ctx.ellipse(px + csize * 0.36, py + csize * 0.32, csize * 0.20, csize * 0.12, -0.6, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          ctx.fillStyle = hex;
          ctx.fillRect(px, py, csize, csize);
        }
      }
    }
  }
  if (showBoards) {
    ctx.strokeStyle = 'rgba(46,139,139,0.95)';
    ctx.lineWidth = Math.max(2, csize * 0.18);
    ctx.beginPath();
    for (let x = boardPegs; x < gridW; x += boardPegs) {
      ctx.moveTo(ox + x * csize, oy);
      ctx.lineTo(ox + x * csize, oy + gridH * csize);
    }
    for (let y = boardPegs; y < gridH; y += boardPegs) {
      ctx.moveTo(ox, oy + y * csize);
      ctx.lineTo(ox + gridW * csize, oy + y * csize);
    }
    ctx.stroke();
    if (csize >= 10) {
      ctx.fillStyle = 'rgba(46,139,139,0.85)';
      ctx.font = 'bold ' + Math.round(csize * 0.7) + 'px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      let idx = 0;
      for (let by = 0; by < Math.ceil(gridH / boardPegs); by++) {
        for (let bx = 0; bx < Math.ceil(gridW / boardPegs); bx++) {
          const label = String.fromCharCode(65 + (bx % 26)) + (by + 1);
          ctx.fillText(label, ox + bx * boardPegs * csize + csize * 0.25, oy + by * boardPegs * csize + csize * 0.25);
          idx++;
        }
      }
    }
  }
  if (withGrid && csize >= 6) {
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 1; x < gridW; x++) {
      ctx.moveTo(ox + x * csize + 0.5, oy);
      ctx.lineTo(ox + x * csize + 0.5, oy + gridH * csize);
    }
    for (let y = 1; y < gridH; y++) {
      ctx.moveTo(ox, oy + y * csize + 0.5);
      ctx.lineTo(ox + gridW * csize, oy + y * csize + 0.5);
    }
    ctx.stroke();
  }
  const codeMin = opts.codeMin === undefined ? 14 : opts.codeMin;
  if (withSymbols && csize >= codeMin) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    const lw = Math.max(1, csize * 0.075);
    for (let y = 0; y < gridH; y++) {
      for (let x = 0; x < gridW; x++) {
        const ci = stateIdx[y * gridW + x];
        if (ci < 0) continue;
        const txt = beadLabel(ci);
        if (!txt) continue;
        const fs = beadFontSize(csize, txt);
        ctx.font = '700 ' + fs.toFixed(1) + 'px "Segoe UI", "Microsoft YaHei", Arial, sans-serif';
        const dark = textColorFor(stateWorking[ci].rgb) === '#2c2a26';
        const cx = ox + x * csize + csize / 2;
        const cy = oy + y * csize + csize / 2 + fs * 0.06;
        ctx.lineWidth = lw;
        ctx.strokeStyle = dark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.7)';
        ctx.strokeText(txt, cx, cy);
        ctx.fillStyle = dark ? '#1b1a18' : '#ffffff';
        ctx.fillText(txt, cx, cy);
      }
    }
  }
}


function chartView() {
  viewport.measure(canvasWrap);
  return { vw: viewport.viewW, vh: viewport.viewH };
}


function fitChartCell(vw, vh) {
  return viewport.cellSize(gridW, gridH, autoFit, cell);
}


function clampChartPan(W, H, vw, vh) {
  viewport.clamp(W, H);
}


function updateZoomLabel() {
  zoomVal.textContent = autoFit ? '自动' : (cell + ' px/格');
  zoomInput.disabled = autoFit;
}


function updateChartZoomLabel() {
  if (!chartZoomInfo) return;
  chartZoomInfo.textContent = viewport.label;
}


function drawHoverCell(ctx, csize, ox, oy) {
  if (!hoverGrid || csize < 3) return;
  const x = hoverGrid.x, y = hoverGrid.y;
  if (x < 0 || y < 0 || x >= gridW || y >= gridH) return;
  const lw = Math.max(2, Math.min(4, csize * 0.16));
  ctx.strokeStyle = 'rgba(224,97,63,0.95)';
  ctx.lineWidth = lw;
  ctx.strokeRect(ox + x * csize + lw / 2, oy + y * csize + lw / 2, csize - lw, csize - lw);
}


function zoomChart(factor, anchorX, anchorY) {
  if (!stateIdx) return;
  const { vw, vh } = chartView();
  const mx = (anchorX === undefined) ? vw / 2 : anchorX;
  const my = (anchorY === undefined) ? vh / 2 : anchorY;
  if (!viewport.zoomAt(factor, mx, my, gridW, gridH, autoFit, cell)) return;
  renderPattern();
}


function renderPattern() {
  if (!stateIdx) return;
  if (typeof invalidatePreviewRect === 'function') invalidatePreviewRect();
  const { vw, vh } = chartView();
  const cs = fitChartCell(vw, vh);
  previewCell = cs;
  const W = gridW * cs, H = gridH * cs;
  const ratio = Math.max(1, Math.round(window.devicePixelRatio || 1));
  preview.style.width = vw + 'px';
  preview.style.height = vh + 'px';
  const dw = Math.round(vw * ratio), dh = Math.round(vh * ratio);
  if (preview.width !== dw) preview.width = dw;
  if (preview.height !== dh) preview.height = dh;
  if (!patCache) patCache = document.createElement('canvas');
  if (patCache.width !== W * ratio || patCache.height !== H * ratio || patDirty) {
    patCache.width = W * ratio;
    patCache.height = H * ratio;
    const pctx = patCache.getContext('2d');
    pctx.setTransform(1, 0, 0, 1, 0, 0);
    pctx.fillStyle = ironOn ? '#f7f2ea' : '#ffffff';
    pctx.fillRect(0, 0, W * ratio, H * ratio);
    drawPattern(pctx, cs * ratio, 0, 0, showGrid, true, { iron: ironOn, codeMin: 18 });
    patDirty = false;
  }
  clampChartPan(W, H, vw, vh);
  const ctx = preview.getContext('2d');
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, vw, vh);
  ctx.fillStyle = '#f6f2ec';
  ctx.fillRect(0, 0, vw, vh);
  ctx.drawImage(patCache, viewport.x, viewport.y, W, H);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  drawHoverCell(ctx, cs * ratio, viewport.x * ratio, viewport.y * ratio);
  updateChartZoomLabel();
}


function requestPatternRender() {
  if (patRaf) return;
  patRaf = requestAnimationFrame(() => { patRaf = 0; renderPattern(); });
}


function invalidatePattern() {
  patDirty = true;
  requestPatternRender();
}
