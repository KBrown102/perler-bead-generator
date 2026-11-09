/* 量化层：误差扩散抖动、k-means 限色、相似色合并、众数平滑 */

/* 相似色合并：把 Oklab 距离很小、肉眼分不出的颜色并到用量最多的那种 */
function mergeSimilarColors(grid, colors, threshold) {
  if (threshold <= 0) return grid;
  const counts = new Map();
  for (let i = 0; i < grid.length; i++) {
    const v = grid[i];
    if (v >= 0) counts.set(v, (counts.get(v) || 0) + 1);
  }
  if (counts.size < 2) return grid;
  const labs = paletteOklab(colors);
  const used = [...counts.keys()].sort((x, y) => (counts.get(y) - counts.get(x)) || (x - y));
  const reps = [];
  const remap = new Map();
  // 保护色：黑/白/极深极浅的中性色不参与"被合并"，否则轮廓会变灰、白底会变脏
  const isProtected = (ci) => {
    const c = colors[ci].rgb;
    const lum = 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
    const sat = Math.max(c[0], c[1], c[2]) - Math.min(c[0], c[1], c[2]);
    return (lum < 26 || lum > 232) && sat < 40;
  };
  for (const ci of used) {
    if (isProtected(ci)) { reps.push(ci); continue; }
    let hit = -1;
    const a = labs[ci];
    for (const rep of reps) {
      const b = labs[rep];
      const dl = a[0] - b[0], da = a[1] - b[1], db = a[2] - b[2];
      if (Math.sqrt(dl * dl + da * da + db * db) <= threshold) { hit = rep; break; }
    }
    if (hit >= 0) remap.set(ci, hit); else reps.push(ci);
  }
  if (!remap.size) return grid;
  const out = grid.slice();
  for (let i = 0; i < out.length; i++) {
    const v = out[i];
    if (v >= 0 && remap.has(v)) out[i] = remap.get(v);
  }
  return out;
}


/* 图纸众数平滑：3×3 里出现最多的颜色胜出，消掉一格一格的孤立点 */
function modeFilterGrid(grid, passes) {
  if (!passes) return grid;
  const W = gridW, H = gridH;
  let cur = grid;
  for (let p = 0; p < passes; p++) {
    const out = cur.slice();
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const cnt = new Map();
        for (let dy = -1; dy <= 1; dy++) {
          const yy = y + dy;
          if (yy < 0 || yy >= H) continue;
          for (let dx = -1; dx <= 1; dx++) {
            const xx = x + dx;
            if (xx < 0 || xx >= W) continue;
            const v = cur[yy * W + xx];
            cnt.set(v, (cnt.get(v) || 0) + 1);
          }
        }
        let best = cur[y * W + x], bestN = cnt.get(best) || 0;
        for (const [v, c] of cnt) if (c > bestN) { bestN = c; best = v; }
        out[y * W + x] = best;
      }
    }
    cur = out;
  }
  return cur;
}


/* 误差扩散核：[dx, dy, 权重] */
const DITHER_KERNELS = {
  fs: [[1, 0, 7 / 16], [-1, 1, 3 / 16], [0, 1, 5 / 16], [1, 1, 1 / 16]],
  atkinson: [[1, 0, 1 / 8], [2, 0, 1 / 8], [-1, 1, 1 / 8], [0, 1, 1 / 8], [1, 1, 1 / 8], [0, 2, 1 / 8]],
  stucki: [[1, 0, 8 / 42], [2, 0, 4 / 42], [-2, 1, 2 / 42], [-1, 1, 4 / 42], [0, 1, 8 / 42], [1, 1, 4 / 42], [2, 1, 2 / 42],
           [-2, 2, 1 / 42], [-1, 2, 2 / 42], [0, 2, 4 / 42], [1, 2, 2 / 42], [2, 2, 1 / 42]],
  burkes: [[1, 0, 8 / 32], [2, 0, 4 / 32], [-2, 1, 2 / 32], [-1, 1, 4 / 32], [0, 1, 8 / 32], [1, 1, 4 / 32], [2, 1, 2 / 32]],
  sierra: [[1, 0, 5 / 32], [2, 0, 3 / 32], [-2, 1, 2 / 32], [-1, 1, 4 / 32], [0, 1, 5 / 32], [1, 1, 4 / 32], [2, 1, 2 / 32],
           [-1, 2, 2 / 32], [0, 2, 3 / 32], [1, 2, 2 / 32]]
};


function quantize(imgData, colors, dither) {
  const W = imgData.width, H = imgData.height, src = imgData.data;
  const px = new Float32Array(W * H * 3);
  const alpha = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) {
    px[i * 3] = src[i * 4]; px[i * 3 + 1] = src[i * 4 + 1]; px[i * 3 + 2] = src[i * 4 + 2];
    alpha[i] = src[i * 4 + 3];
  }
  const kernel = dither ? (DITHER_KERNELS[ditherKernel] || DITHER_KERNELS.fs) : null;
  const out = new Int16Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (alpha[i] < 128) { out[i] = -1; continue; }   // 透明 = 空格（不放置豆子）
      const r = px[i * 3], g = px[i * 3 + 1], b = px[i * 3 + 2];
      const ci = nearestColor([r, g, b], colors);
      out[i] = ci;
      if (kernel) {
        const cr = colors[ci].rgb[0], cg = colors[ci].rgb[1], cb = colors[ci].rgb[2];
        const strength = ditherStrength / 100;
        const er = (r - cr) * strength, eg = (g - cg) * strength, eb = (b - cb) * strength;
        for (let k = 0; k < kernel.length; k++) {
          const nx = x + kernel[k][0], ny = y + kernel[k][1];
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const wt = kernel[k][2], j = (ny * W + nx) * 3;
          px[j] += er * wt; px[j + 1] += eg * wt; px[j + 2] += eb * wt;
        }
      }
    }
  }
  return out;
}


/* --- 颜色数量限制：k-means（忽略透明像素）--- */
function samplePixels(imgData) {
  const w = imgData.width, h = imgData.height, data = imgData.data;
  const maxN = 20000, n = w * h;
  const step = Math.max(1, Math.floor(n / maxN));
  const pts = [];
  for (let i = 0; i < n; i += step) {
    if (data[i * 4 + 3] < 128) continue;
    pts.push([data[i * 4], data[i * 4 + 1], data[i * 4 + 2]]);
  }
  return pts;
}

function sqDist(a, b) {
  const dr = a[0] - b[0], dg = a[1] - b[1], db = a[2] - b[2];
  return dr * dr + dg * dg + db * db;
}

function nearestCenter(p, centers) {
  let bi = 0, bd = Infinity;
  for (let i = 0; i < centers.length; i++) {
    const d = sqDist(p, centers[i]);
    if (d < bd) { bd = d; bi = i; }
  }
  return bi;
}

function kmeans(points, k) {
  const n = points.length;
  if (k >= n) return points.slice();
  const centers = [points[(Math.random() * n) | 0]];
  while (centers.length < k) {
    const dists = new Float64Array(n);
    let total = 0;
    for (let i = 0; i < n; i++) {
      const d = nearestCenter(points[i], centers);
      dists[i] = d; total += d || 1e-6;
    }
    let r = Math.random() * total;
    let idx = n - 1;
    for (let i = 0; i < n; i++) { r -= dists[i]; if (r <= 0) { idx = i; break; } }
    centers.push(points[idx]);
  }
  const assign = new Int32Array(n);
  for (let it = 0; it < 8; it++) {
    for (let i = 0; i < n; i++) assign[i] = nearestCenter(points[i], centers);
    const sums = centers.map(() => [0, 0, 0]);
    const cnt = new Array(k).fill(0);
    for (let i = 0; i < n; i++) {
      const c = assign[i];
      sums[c][0] += points[i][0]; sums[c][1] += points[i][1]; sums[c][2] += points[i][2];
      cnt[c]++;
    }
    for (let j = 0; j < k; j++) {
      if (cnt[j] > 0) centers[j] = [sums[j][0] / cnt[j], sums[j][1] / cnt[j], sums[j][2] / cnt[j]];
    }
  }
  return centers;
}

function buildReducedPalette(imgData, fullColors, k) {
  const pts = samplePixels(imgData);
  if (!pts.length) return fullColors.slice(0, k);
  const centers = kmeans(pts, Math.min(k, pts.length));
  const used = new Set();
  const reduced = [];
  for (const c of centers) {
    const ci = nearestColor(c, fullColors);
    if (!used.has(ci)) { used.add(ci); reduced.push(fullColors[ci]); }
  }
  return reduced.length ? reduced : fullColors.slice(0, k);
}
