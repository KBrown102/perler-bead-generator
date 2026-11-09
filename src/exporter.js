/* 导出：图纸 PNG（含图例/色号）、1:1 像素图、购物清单 */

/* ---------------- 导出 ---------------- */
function exportPNG() {
  if (!stateIdx) { toast('请先生成图纸'); return; }
  const csize = 32, pad = 48, titleH = 72;
  const cols = 4, rowH = 34;
  const rows = Math.ceil(legendData.length / cols);
  // 量一下最长的一条图例文字，避免列宽撑破/文字重叠
  const probe = document.createElement('canvas').getContext('2d');
  probe.font = '13px "Segoe UI", "Microsoft YaHei", sans-serif';
  let maxTextW = 0;
  legendData.forEach(it => {
    const name = (it.color.name && it.color.name !== it.color.code) ? ' ' + it.color.name : '';
    const w = probe.measureText(it.color.code + name + '  ×' + it.count).width;
    if (w > maxTextW) maxTextW = w;
  });
  const colW = Math.max(190, Math.ceil(maxTextW) + 56);
  const legendH = rows * rowH + 54;
  const W = Math.max(gridW * csize, cols * colW) + pad * 2;
  const H = titleH + gridH * csize + legendH + pad * 2;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#222';
  ctx.font = 'bold 24px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('拼豆图纸 · ' + palettes[currentPalette].name + ' · ' + gridW + '×' + gridH, pad, pad + 26);
  ctx.font = '13px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.fillStyle = '#666';
  const totalBeads = stateIdx.length - stateEmptyCount;
  let sub = '总豆 ' + totalBeads + ' 颗 · 用色 ' + legendData.length + ' 种';
  if (stateEmptyCount > 0) sub += ' · 空格 ' + stateEmptyCount;
  ctx.fillText(sub, pad, pad + 48);
  ctx.fillStyle = '#8a857c';
  ctx.fillText('每颗豆上印的就是色号，按色号取豆；下方图例给出色号 / 色名 / 数量', pad, pad + 66);

  // 图纸始终带符号（预览里的"叠加符号"只影响屏幕显示）
  drawPattern(ctx, csize, pad, pad + titleH, true, true, { iron: ironOn, codeMin: 0 });

  const ly = pad + titleH + gridH * csize + 34;
  const legendColW = (W - pad * 2) / cols;
  const chip = 22;
  legendData.forEach((it, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const x = pad + col * legendColW, y = ly + row * rowH;
    // 色块
    ctx.fillStyle = it.color.hex;
    ctx.fillRect(x, y, chip, chip);
    ctx.strokeStyle = '#b9b3a8';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, chip - 1, chip - 1);
    let tx = x + chip + 10;
    if (ironOn) {
      const ih = ironHexOf(it.color.rgb, ironStrength / 100);
      ctx.fillStyle = ih;
      ctx.fillRect(tx - 3, y + 2, 18, 18);
      ctx.strokeStyle = '#b9b3a8';
      ctx.lineWidth = 1;
      ctx.strokeRect(tx - 2.5, y + 2.5, 17, 17);
      tx += 24;
    }
    // 文字
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#222';
    ctx.font = '14px "Segoe UI", "Microsoft YaHei", sans-serif';
    const name = (it.color.name && it.color.name !== it.color.code) ? ' ' + it.color.name : '';
    ctx.fillText(it.color.code + name + '  ×' + it.count, tx, y + chip / 2 + 1);
  });

  const a = document.createElement('a');
  a.href = c.toDataURL('image/png');
  a.download = '拼豆图纸_' + palettes[currentPalette].name + '_' + gridW + 'x' + gridH + '.png';
  a.click();
  toast('图纸已导出');
}
