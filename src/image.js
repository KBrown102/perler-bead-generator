/* 源图处理：载入、像素块识别、降噪、增强、网格采样 */

/* ---------------- 图片载入 ---------------- */
function setSource(canvas) {
  sourceCanvas = canvas;
  const info = (typeof analyzeSource === 'function') ? analyzeSource(canvas) : null;
  // 换图后不沿用上一张的尺寸锁定；上一张如果是像素画（走过 pixel 预设），先回到干净预设
  sizeLock = null;
  const wasPixelPreset = typeof qualityPresetSel !== 'undefined' && qualityPresetSel && qualityPresetSel.value === 'pixel';
  if ((wasPixelPreset || lastSourceWasPixelArt) && typeof applyQualityPreset === 'function') {
    applyQualityPreset('clean', true);
    // pixel 预设会改 gridW/采样方式/简化，换图时恢复默认
    gridW = 58;
    sampleMode = 'majority';
    if (sampleModeSel) sampleModeSel.value = 'majority';
    if (gridWInput) gridWInput.value = 58;
    if (gridWVal) gridWVal.textContent = 58;
  }
  lastSourceWasPixelArt = !!(info && info.isPixelArt);
  simplifyTouched = false;      // 新图重新按尺寸自动推荐
  autoSimplify = true;
  viewport.reset();
  if (typeof sourceHistory !== 'undefined') sourceHistory.clear();
  snapBlock = 0; snapNativeW = snapNativeH = 0;
  manualEdits.clear();
  gridHistory.clear();
  hoverGrid = null;
  process();
  // 纯色背景自动去掉（成品异形、省豆）；失败/没收益会自动跳过
  if (typeof autoRemoveBackgroundOnLoad === 'function') autoRemoveBackgroundOnLoad();
  // 建议卡：挑一条最有用的建议（不再用会消失的 toast 提示）
  if (typeof suggestions !== 'undefined' && suggestions && suggestions.el) {
    setTimeout(() => suggestions.refresh(), 120);
  }
}


function loadFile(file) {
  if (!file || !file.type.startsWith('image/')) { toast('请选择图片文件'); return; }
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const cap = 2000;
      let w = img.naturalWidth, h = img.naturalHeight;
      const s = Math.min(1, cap / Math.max(w, h));
      w = Math.max(1, Math.round(w * s));
      h = Math.max(1, Math.round(h * s));
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      setSource(c);
    };
    img.onerror = () => toast('图片读取失败');
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

/* ---------------- 示例图 ---------------- */
function drawHeart(ctx, cx, cy, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  const a = r * 0.5, dx = r * 0.48, cy1 = cy - r * 0.38;
  ctx.arc(cx - dx, cy1, a, 0, Math.PI * 2);
  ctx.arc(cx + dx, cy1, a, 0, Math.PI * 2);
  ctx.moveTo(cx - r, cy - r * 0.15);
  ctx.lineTo(cx, cy + r * 0.85);
  ctx.lineTo(cx + r, cy - r * 0.15);
  ctx.closePath();
  ctx.fill();
}

function sparkle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.moveTo(x, y - r); ctx.lineTo(x + r * 0.3, y - r * 0.3);
  ctx.lineTo(x + r, y); ctx.lineTo(x + r * 0.3, y + r * 0.3);
  ctx.lineTo(x, y + r); ctx.lineTo(x - r * 0.3, y + r * 0.3);
  ctx.lineTo(x - r, y); ctx.lineTo(x - r * 0.3, y - r * 0.3);
  ctx.closePath();
  ctx.fill();
}

function makeSample() {
  const c = document.createElement('canvas');
  c.width = c.height = 96;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 96, 96);
  g.addColorStop(0, '#ffe9c7'); g.addColorStop(0.5, '#ffd6e7'); g.addColorStop(1, '#c7e9ff');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 96, 96);
  drawHeart(ctx, 48, 46, 44, '#e0245e');
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath(); ctx.ellipse(33, 31, 7, 5, -0.6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffd700';
  sparkle(ctx, 76, 18, 6);
  sparkle(ctx, 22, 72, 4);
  setSource(c);
}

/* ---------------- 核心算法 ---------------- */
/* 统一取网格像素：按采样方式决定「一格取原图哪一块颜色」 */
function readPixels(src) {
  const ctx = src.getContext('2d', { willReadFrequently: true });
  return ctx.getImageData(0, 0, src.width, src.height);
}


/**
 * 检测「放大过的像素画」的网格：周期（块边长）+ 相位（块边界的偏移）。
 *
 * 做法（比"块内是否均匀"更稳、能处理被裁切/偏移的图）：
 *   1. 先在整图上统计"列跳变剖面 / 行跳变剖面"（相邻像素差超过阈值的位置）；
 *   2. 对每个候选周期 p，分别扫相位 φ（0..p-1），让尽量多的跳变落在 x≡φ / y≡φ 上；
 *   3. 跳变落在边界外的比例 ≤5% 视为合格；合格周期里取**最大**的（除数周期会被 2p 排除）。
 *
 * @returns {{period:number, phaseX:number, phaseY:number, badRate:number, nativeW:number, nativeH:number}}
 */
function detectPixelGrid(src) {
  const empty = { period: 0, phaseX: 0, phaseY: 0, badRate: 1, nativeW: 0, nativeH: 0, confidence: 0 };
  const w = src.width, h = src.height;
  if (w < 12 || h < 12) return empty;
  let d;
  try { d = readPixels(src).data; } catch (e) { return empty; }

  // ---- 梯度能量剖面（前向差分；边界处能量峰，块内接近 0） ----
  const ex = new Float64Array(w);
  const ey = new Float64Array(h);
  let sumX = 0, sumY = 0;
  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 1; x < w; x++) {
      const i = (row + x) * 4, j = i - 4;
      const v = Math.abs(d[i] - d[j]) + Math.abs(d[i + 1] - d[j + 1]) + Math.abs(d[i + 2] - d[j + 2]);
      ex[x] += v; sumX += v;
    }
  }
  for (let y = 1; y < h; y++) {
    const row = y * w, up = y * w - w;
    for (let x = 0; x < w; x++) {
      const i = (row + x) * 4, j = (up + x) * 4;
      const v = Math.abs(d[i] - d[j]) + Math.abs(d[i + 1] - d[j + 1]) + Math.abs(d[i + 2] - d[j + 2]);
      ey[y] += v; sumY += v;
    }
  }
  if (sumX + sumY <= 0) return empty;

  const maxP = Math.min(96, Math.floor(Math.min(w, h) / 3));

  /** 梳状相位：tol=0 精确边界；tol=1 容忍模糊边界 */
  const comb = (e, p, tol) => {
    let best = 0, bestScore = -1;
    for (let off = 0; off < p; off++) {
      let n = 0;
      for (let i = 0; i < e.length; i++) {
        if (!e[i]) continue;
        let r = (i - off) % p;
        if (r < 0) r += p;
        if (r <= tol || r >= p - tol) n += e[i];
      }
      if (n > bestScore) { bestScore = n; best = off; }
    }
    return { phase: best, on: bestScore };
  };

  /** 块内均匀性：块内部（去掉 1px 边）平均离散度 / 全图平均离散度 */
  const uniformity = (p, phx, phy) => {
    let intra = 0, n = 0;
    for (let by = phy; by + p <= h; by += p) {
      for (let bx = phx; bx + p <= w; bx += p) {
        let r = 0, g = 0, b = 0, cnt = 0;
        for (let y = by + 1; y < by + p - 1; y += 2) {
          for (let x = bx + 1; x < bx + p - 1; x += 2) {
            const i = (y * w + x) * 4;
            if (d[i + 3] < 8) continue;
            r += d[i]; g += d[i + 1]; b += d[i + 2]; cnt++;
          }
        }
        if (cnt < 1) continue;
        const mr = r / cnt, mg = g / cnt, mb = b / cnt;
        for (let y = by + 1; y < by + p - 1; y += 2) {
          for (let x = bx + 1; x < bx + p - 1; x += 2) {
            const i = (y * w + x) * 4;
            if (d[i + 3] < 8) continue;
            intra += Math.abs(d[i] - mr) + Math.abs(d[i + 1] - mg) + Math.abs(d[i + 2] - mb);
            n++;
          }
        }
      }
    }
    return n ? intra / n : 999;
  };

  /** 块中心颜色重复度：像素画里大量块颜色相同 */
  const repeatRatio = (p, phx, phy) => {
    const set = new Set();
    let total = 0;
    for (let by = phy; by + p <= h; by += p) {
      for (let bx = phx; bx + p <= w; bx += p) {
        const i = ((by + (p >> 1)) * w + (bx + (p >> 1))) * 4;
        set.add((d[i] >> 4) << 8 | (d[i + 1] >> 4) << 4 | (d[i + 2] >> 4));
        total++;
      }
    }
    return total ? set.size / total : 1;
  };

  const total = sumX + sumY;

  // ---- Pass A：精确边界（最近邻放大/原生像素画的典型情况） ----
  let hitA = null;
  for (let p = 2; p <= maxP; p++) {
    const sx = comb(ex, p, 0), sy = comb(ey, p, 0);
    // 网格必须基本整除图像：真周期满足 (尺寸-相位) % p ≈ 0
    if ((w - sx.phase) % p > 1 || (h - sy.phase) % p > 1) continue;
    if (1 - (sx.on + sy.on) / total <= 0.05) {
      hitA = { period: p, phaseX: sx.phase, phaseY: sy.phase, conf: 1, bad: 1 - (sx.on + sy.on) / total };
    }
  }
  let hit = hitA;

  // 只认"精确边界"（整像素倍数放大/原生像素画）。
  // 平滑放大/AI 生成的伪像素画不做 1:1 谎报——交给众数采样 + 大块简化处理。
  if (!hit) return empty;

  const nativeW = Math.max(1, Math.floor((w - hit.phaseX) / hit.period));
  const nativeH = Math.max(1, Math.floor((h - hit.phaseY) / hit.period));
  if (nativeW < 3 || nativeH < 3) return empty;
  return {
    period: hit.period, phaseX: hit.phaseX, phaseY: hit.phaseY,
    badRate: hit.bad, nativeW: nativeW, nativeH: nativeH, confidence: hit.conf
  };
}

/** 兼容旧调用：只返回周期 */
function detectPixelBlock(src) {
  return detectPixelGrid(src).period || 1;
}

/** 把放大过的像素画还原成原生尺寸（按相位取块内平均，忽略不完整的边角块） */
function snapSource(src, s, phaseX, phaseY) {
  s = Math.max(1, s | 0);
  if (s <= 1) return src;
  const ph = phaseX || 0, pv = phaseY || 0;
  const w = src.width, h = src.height;
  const nw = Math.max(1, Math.floor((w - ph) / s));
  const nh = Math.max(1, Math.floor((h - pv) / s));
  if (nw < 2 || nh < 2) return src;
  let data;
  try { data = readPixels(src).data; } catch (e) { return src; }
  const c = document.createElement('canvas');
  c.width = nw; c.height = nh;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  const out = ctx.createImageData(nw, nh);
  const stride = Math.max(1, Math.floor(s / 4));
  for (let by = 0; by < nh; by++) {
    for (let bx = 0; bx < nw; bx++) {
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      const x0 = ph + bx * s, y0 = pv + by * s;
      const x1 = Math.min(w, x0 + s), y1 = Math.min(h, y0 + s);
      for (let y = y0; y < y1; y += stride) {
        for (let x = x0; x < x1; x += stride) {
          const i = (y * w + x) * 4;
          const aa = data[i + 3];
          if (aa < 8) continue;
          r += data[i]; g += data[i + 1]; b += data[i + 2]; a += aa; n++;
        }
      }
      const o = (by * nw + bx) * 4;
      if (!n) { out.data[o + 3] = 0; continue; }
      out.data[o] = Math.round(r / n);
      out.data[o + 1] = Math.round(g / n);
      out.data[o + 2] = Math.round(b / n);
      out.data[o + 3] = Math.round(a / n);
    }
  }
  ctx.putImageData(out, 0, 0);
  return c;
}

/**
 * 分析原图是不是"像素风小图"：小尺寸 + 有大块完全平涂 + 颜色密度低（渐变/照片密度接近 1）。
 * 这类图建议按原图 1:1 还原，而不是重采样。
 */
function analyzeSource(src) {
  const w = src.width, h = src.height;
  let d;
  try { d = readPixels(src).data; } catch (e) {
    return { w: w, h: h, flatness: 0, colors: 0, density: 1, isPixelArt: false };
  }
  const seen = new Set();
  let exact = 0, total = 0, opaque = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (d[i + 3] < 8) continue;
      opaque++;
      seen.add((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]);
      if (x + 1 < w) {
        const j = i + 4;
        if (d[j + 3] < 8) continue;
        total++;
        if (d[i] === d[j] && d[i + 1] === d[j + 1] && d[i + 2] === d[j + 2]) exact++;
      }
    }
  }
  const flatness = total ? exact / total : 0;
  const colors = seen.size;
  const density = opaque ? colors / opaque : 1;
  const small = w <= 150 && h <= 220;
  return {
    w: w, h: h, flatness: flatness, colors: colors, density: density,
    isPixelArt: small && flatness >= 0.22 && density <= 0.55
  };
}

/**
 * 主色（众数）采样：每格统计源图对应小块里出现最多的颜色（5bit 分桶去噪）。
 * 默认纯众数（majorityEdge=255）：平坦块不受抗锯齿/噪点影响，画面最干净；
 * 若把 majorityEdge 调小，块内色差超过阈值的"边缘块"会改用平均，保留细线。
 */
function majorityDownsample(src, w, h) {
  const sw = src.width, sh = src.height;
  const sd = readPixels(src).data;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  const out = ctx.createImageData(w, h);
  for (let gy = 0; gy < h; gy++) {
    const y0 = Math.floor(gy * sh / h);
    const y1 = Math.max(y0 + 1, Math.floor((gy + 1) * sh / h));
    for (let gx = 0; gx < w; gx++) {
      const x0 = Math.floor(gx * sw / w);
      const x1 = Math.max(x0 + 1, Math.floor((gx + 1) * sw / w));
      const counts = new Map();
      let bestKey = -1, bestN = 0;
      let minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (y * sw + x) * 4;
          if (sd[i + 3] < 8) continue;
          const r0 = sd[i], g0 = sd[i + 1], b0 = sd[i + 2];
          if (r0 < minR) minR = r0; if (r0 > maxR) maxR = r0;
          if (g0 < minG) minG = g0; if (g0 > maxG) maxG = g0;
          if (b0 < minB) minB = b0; if (b0 > maxB) maxB = b0;
          const key = ((r0 >> 3) << 10) | ((g0 >> 3) << 5) | (b0 >> 3);
          const n = (counts.get(key) || 0) + 1;
          counts.set(key, n);
          if (n > bestN) { bestN = n; bestKey = key; }
        }
      }
      const o = (gy * w + gx) * 4;
      if (bestKey < 0) { out.data[o + 3] = 0; continue; }
      const spread = Math.max(maxR - minR, maxG - minG, maxB - minB);
      const edgeBlock = spread > majorityEdge;
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (y * sw + x) * 4;
          if (sd[i + 3] < 8) continue;
          if (!edgeBlock) {
            const key = ((sd[i] >> 3) << 10) | ((sd[i + 1] >> 3) << 5) | (sd[i + 2] >> 3);
            if (key !== bestKey) continue;
          }
          r += sd[i]; g += sd[i + 1]; b += sd[i + 2]; a += sd[i + 3]; n++;
        }
      }
      if (!n) { out.data[o + 3] = 0; continue; }
      out.data[o] = Math.round(r / n);
      out.data[o + 1] = Math.round(g / n);
      out.data[o + 2] = Math.round(b / n);
      out.data[o + 3] = Math.round(a / n);
    }
  }
  ctx.putImageData(out, 0, 0);
  return out;
}

/* 采样成网格：average=平滑平均；majority=主色众数；nearest=最近邻；snap=先还原原生像素再最近邻 */
function downsample(src, w, h) {
  if (sampleMode === 'majority') {
    if (preSmoothPasses > 0) {
      const sm = preSmooth(src, preSmoothPasses);
      return majorityDownsample(sm, w, h);
    }
    return majorityDownsample(src, w, h);
  }
  let base = src;
  if (sampleMode === 'average' && preSmoothPasses > 0) base = preSmooth(base === src ? src : base, preSmoothPasses);
  if (sampleMode === 'snap') {
    ensureSnapInfo();
    if (snapBlock > 1) base = snapSource(src, snapBlock, snapPhaseX, snapPhaseY);
  }
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  const smooth = sampleMode === 'average';
  ctx.imageSmoothingEnabled = smooth;
  ctx.imageSmoothingQuality = 'high';
  ctx.clearRect(0, 0, w, h);
  const bw = base.width, bh = base.height;
  const sameAspect = Math.abs((bw / bh) - (w / h)) < 0.01;
  if (sizeLock && fitMode !== 'stretch' && !sameAspect) {
    const scale = fitMode === 'cover' ? Math.max(w / bw, h / bh) : Math.min(w / bw, h / bh);
    const dw = bw * scale, dh = bh * scale;
    ctx.drawImage(base, 0, 0, bw, bh, (w - dw) / 2, (h - dh) / 2, dw, dh);
  } else {
    ctx.drawImage(base, 0, 0, w, h);
  }
  return ctx.getImageData(0, 0, w, h);
}
