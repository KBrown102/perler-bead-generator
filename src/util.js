/* 基础工具：颜色换算、文字对比色、圆角、豆上色号字体 */

function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}


/**
 * 色号简写：豆子格子很小，长色号（如 Perler 的 80-15245）要缩成能印得下的形式。
 * 规则：≤4 字符原样；带分隔符取最后一段（80-15245 → 15245）；否则取末尾 4 位。
 */
function shortCode(code) {
  const s = String(code || '');
  if (s.length <= 4) return s;
  const parts = s.split(/[-_\s]+/).filter(Boolean);
  if (parts.length > 1) {
    const last = parts[parts.length - 1];
    return last.length <= 5 ? last : last.slice(-4);
  }
  return s.slice(-4);
}

/** 豆子上印的色号（短码） */
function beadLabel(ci) {
  const c = stateWorking[ci];
  if (!c) return '';
  return shortCode(c.code);
}


/* 按格子宽度自动算字号（让 3~5 个字符塞得下） */
function beadFontSize(csize, text) {
  const len = Math.max(1, text.length);
  return Math.max(5, Math.min(csize * 0.56, (csize * 1.55) / len));
}


function toHex(n) { return ('0' + n.toString(16)).slice(-2); }

/* 熨烫（烤完）后的近似色：熔珠压扁 → 对比度变平、饱和度微降、略微变暗 + 高光 */
function ironHexOf(rgb, t) {
  const k = Math.max(0, Math.min(1, t));
  const m = 0.5;
  let r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255;
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  const sat = 1 - 0.10 * k;              // 熔珠表面高光 → 饱和略降
  const flat = 0.12 * k;                  // 压扁后对比度下降
  r = lum + (r - lum) * sat;
  g = lum + (g - lum) * sat;
  b = lum + (b - lum) * sat;
  r = m + (r - m) * (1 - flat);
  g = m + (g - m) * (1 - flat);
  b = m + (b - m) * (1 - flat);
  r = r * 0.96 + 0.015;                   // 整体略暗一点点
  g = g * 0.96 + 0.015;
  b = b * 0.955 + 0.015;
  const clamp = v => Math.max(0, Math.min(255, Math.round(v * 255)));
  return '#' + toHex(clamp(r)) + toHex(clamp(g)) + toHex(clamp(b));
}


/* ---------------- 渲染：图纸 ---------------- */
function textColorFor(rgb) {
  const lum = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];
  return lum > 150 ? '#2c2a26' : '#ffffff';
}


function roundRectPath(ctx, x, y, w, h, r) {
  if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); return; }
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
