/* 轮廓与清理：背景识别、自动描边、孤立杂色清理 */

/* 描边目标色下标：auto = 色板里最深的颜色 */
function outlineTargetIdx() {
  if (!stateWorking || !stateWorking.length) return -1;
  if (outlineColorChoice === 'auto') {
    // 描边首选"近黑中性色"：深 + 低饱和（黑/炭灰），避免描出深绿、深蓝这种偏色
    let bi = -1, best = Infinity;
    for (let i = 0; i < stateWorking.length; i++) {
      const c = stateWorking[i].rgb;
      const lum = 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
      const sat = Math.max(c[0], c[1], c[2]) - Math.min(c[0], c[1], c[2]);
      const score = lum * 1.0 + sat * 1.6;
      if (score < best) { best = score; bi = i; }
    }
    if (bi < 0) {
      let bl = Infinity;
      for (let i = 0; i < stateWorking.length; i++) {
        const c = stateWorking[i].rgb;
        const lum = 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
        if (lum < bl) { bl = lum; bi = i; }
      }
    }
    return bi;
  }
  const n = parseInt(outlineColorChoice, 10);
  return (n >= 0 && n < stateWorking.length) ? n : -1;
}


/* 背景掩码：透明格 + （可选）与画布边缘连通的「边缘主色」格 */
function buildBgMask(g) {
  const W = gridW, H = gridH, n = W * H;
  const bg = new Uint8Array(n);
  for (let i = 0; i < n; i++) if (g[i] < 0) bg[i] = 1;
  if (!outlineAutoBg) return bg;
  const cnt = new Map();
  const edgeTotal = (W + H) * 2;
  const countEdge = (i) => { const c = g[i]; if (c < 0) return; cnt.set(c, (cnt.get(c) || 0) + 1); };
  for (let x = 0; x < W; x++) { countEdge(x); countEdge((H - 1) * W + x); }
  for (let y = 0; y < H; y++) { countEdge(y * W); countEdge(y * W + W - 1); }
  let bgColor = -1, best = 0;
  for (const [c, k] of cnt) if (k > best) { best = k; bgColor = c; }
  if (bgColor < 0 || best < edgeTotal * 0.4) return bg;
  const stack = [];
  const push = (i) => {
    if (bg[i] || g[i] !== bgColor) return;
    bg[i] = 1; stack.push(i);
  };
  for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x); }
  for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
  while (stack.length) {
    const i = stack.pop();
    const x = i % W, y = (i / W) | 0;
    if (x > 0) push(i - 1);
    if (x < W - 1) push(i + 1);
    if (y > 0) push(i - W);
    if (y < H - 1) push(i + W);
  }
  return bg;
}


/* 自动描边：沿「图案 / 背景」分界线，往外扩或往里压，可多格粗（8 邻域） */
function applyOutline(g) {
  const oc = outlineTargetIdx();
  if (oc < 0) return;
  const W = gridW, H = gridH, n = W * H;
  const bg = buildBgMask(g);
  const subject = new Uint8Array(n);
  let subjectCount = 0;
  for (let i = 0; i < n; i++) {
    if (!bg[i] && g[i] >= 0) { subject[i] = 1; subjectCount++; }
  }
  if (!subjectCount) return;
  const NB = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
  const innerDist = new Int16Array(n).fill(-1);
  const outerDist = new Int16Array(n).fill(-1);
  let f1 = [], f2 = [];
  for (let i = 0; i < n; i++) {
    const x = i % W, y = (i / W) | 0;
    let touchesBg = false, touchesSubject = false;
    for (let k = 0; k < 8; k++) {
      const nx = x + NB[k][0], ny = y + NB[k][1];
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const j = ny * W + nx;
      if (subject[i] && bg[j]) touchesBg = true;
      if (!subject[i] && subject[j]) touchesSubject = true;
    }
    if (subject[i] && touchesBg) { innerDist[i] = 1; f1.push(i); }
    if (!subject[i] && touchesSubject) { outerDist[i] = 1; f2.push(i); }
  }
  const expand = (dist, frontier) => {
    let cur = frontier;
    for (let lvl = 2; lvl <= outlineW; lvl++) {
      const next = [];
      for (let t = 0; t < cur.length; t++) {
        const i = cur[t], x = i % W, y = (i / W) | 0;
        for (let k = 0; k < 8; k++) {
          const nx = x + NB[k][0], ny = y + NB[k][1];
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const j = ny * W + nx;
          if (dist[j] !== -1) continue;
          dist[j] = lvl; next.push(j);
        }
      }
      cur = next;
      if (!cur.length) break;
    }
  };
  const wantInner = outlinePos === 'inner' || outlinePos === 'both';
  const wantOuter = outlinePos === 'outer' || outlinePos === 'both';
  if (wantInner) expand(innerDist, f1);
  if (wantOuter) expand(outerDist, f2);
  for (let i = 0; i < n; i++) {
    if (wantInner && subject[i] && innerDist[i] > 0 && innerDist[i] <= outlineW) g[i] = oc;
    else if (wantOuter && !subject[i] && outerDist[i] > 0 && outerDist[i] <= outlineW) g[i] = oc;
  }
}


/* 自动去杂色：只清「被单一颜色包住」的小连通块（8 邻域连通），避免把细节抹平 */
const DENOISE_DOMINANCE = 0.62;
function denoiseGrid(g) {
  const W = gridW, H = gridH, n = W * H;
  const out = g.slice();
  const seen = new Uint8Array(n);
  const stack = [];
  const comp = [];
  const touched = new Set();
  const NB = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
  for (let pass = 0; pass < 2; pass++) {
    seen.fill(0);
    for (let start = 0; start < n; start++) {
      if (seen[start]) continue;
      const color = out[start];
      if (color < 0) { seen[start] = 1; continue; }
      stack.length = 0; comp.length = 0;
      stack.push(start); seen[start] = 1;
      while (stack.length) {
        const i = stack.pop();
        comp.push(i);
        const x = i % W, y = (i / W) | 0;
        for (let k = 0; k < 8; k++) {
          const nx = x + NB[k][0], ny = y + NB[k][1];
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const j = ny * W + nx;
          if (!seen[j] && out[j] === color) { seen[j] = 1; stack.push(j); }
        }
      }
      if (comp.length > denoiseMax) continue;
      const cnt = new Map();
      let total = 0;
      for (let t = 0; t < comp.length; t++) {
        const i = comp[t], x = i % W, y = (i / W) | 0;
        for (let k = 0; k < 8; k++) {
          const nx = x + NB[k][0], ny = y + NB[k][1];
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const j = ny * W + nx;
          if (out[j] === color) continue;
          cnt.set(out[j], (cnt.get(out[j]) || 0) + 1);
          total++;
        }
      }
      let bestColor = -1, bestCount = 0;
      for (const [c, num] of cnt) if (num > bestCount) { bestCount = num; bestColor = c; }
      if (total === 0 || bestCount / total < DENOISE_DOMINANCE) continue;
      for (let t = 0; t < comp.length; t++) { out[comp[t]] = bestColor; touched.add(comp[t]); }
    }
  }
  return { grid: out, removed: touched.size };
}
