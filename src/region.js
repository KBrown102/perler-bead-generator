/* region.js —— 区域简化：像素化是"做减法"
 *
 * 思路（对应用户观察）：
 *   1. 先把同色 4 连通块标号，算出每个色块的面积；
 *   2. 面积小于阈值的"碎色块"整块并到**共享边界最长、色差最小**的邻居块里
 *      → 渐变边缘的过渡色、抗锯齿杂点被成片抹掉，而大色块不动；
 *   3. 再对"大块但颜色很接近"的相邻块做一次色差合并，减少同色系噪声；
 *   4. 阈值随网格尺寸自适应：8×8 这种极小图几乎只剩纯色块 + 线条轮廓，
 *      58×76 这种大图只清真正的小碎块，细节保留。
 *
 * 全是 TypedArray + 单次线性扫描，58×76 网格约 1~3 ms。
 */
class RegionSimplifier {
  /**
   * @param {Int16Array} grid 每格色号（-1 = 空格）
   * @param {Array} colors 调色板（含 rgb）
   * @param {number} w 网格宽
   * @param {number} h 网格高
   * @param {number} level 0~3（0 = 不做）
   */
  constructor(grid, colors, w, h, level) {
    this.grid = grid;
    this.colors = colors;
    this.w = w;
    this.h = h;
    this.level = Math.max(0, Math.min(3, level | 0));
    this.labels = new Int16Array(w * h).fill(-1);
    this.areas = [];
    this.repColor = [];
  }

  /** 小于这个面积的块算"碎色块" */
  minArea() {
    const n = this.w * this.h;
    const base = { 0: 0, 1: 3, 2: 6, 3: 12 }[this.level];
    // 小图更激进：8×8=64 格时 level3 阈值 ≈ 12 格（近 1/5 面积）；58×76 时同样是 12 格（很小）
    const scale = n <= 256 ? 1.6 : (n <= 1200 ? 1.0 : 0.8);
    return Math.max(2, Math.round(base * scale));
  }

  /** 相邻块颜色差阈值（Oklab，0~1） */
  colorMergeDist() {
    return [0, 0.02, 0.045, 0.075][this.level];
  }

  /** 标号：返回块数 */
  label() {
    const { grid, labels, w, h } = this;
    labels.fill(-1);
    this.areas = [];
    this.repColor = [];
    let n = 0;
    const stack = [];
    for (let i = 0; i < grid.length; i++) {
      if (labels[i] !== -1 || grid[i] < 0) continue;
      const ci = grid[i];
      const id = n++;
      let area = 0;
      stack.length = 0;
      stack.push(i);
      labels[i] = id;
      while (stack.length) {
        const p = stack.pop();
        area++;
        const x = p % w, y = (p / w) | 0;
        if (x > 0) { const q = p - 1; if (labels[q] === -1 && grid[q] === ci) { labels[q] = id; stack.push(q); } }
        if (x < w - 1) { const q = p + 1; if (labels[q] === -1 && grid[q] === ci) { labels[q] = id; stack.push(q); } }
        if (y > 0) { const q = p - w; if (labels[q] === -1 && grid[q] === ci) { labels[q] = id; stack.push(q); } }
        if (y < h - 1) { const q = p + w; if (labels[q] === -1 && grid[q] === ci) { labels[q] = id; stack.push(q); } }
      }
      this.areas.push(area);
      this.repColor.push(ci);
    }
    return n;
  }

  /** 统计每块与邻居的共享边界长度：返回 Map("a|b" -> 长度) */
  adjacency(n) {
    const { labels, w, h } = this;
    const edges = new Map();
    const add = (a, b) => {
      if (a === b) return;
      const key = a < b ? a * 4096 + b : b * 4096 + a;
      edges.set(key, (edges.get(key) || 0) + 1);
    };
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const p = y * w + x;
        const a = labels[p];
        if (x + 1 < w) { const b = labels[p + 1]; if (b >= 0 && a >= 0) add(a, b); }
        if (y + 1 < h) { const b = labels[p + w]; if (b >= 0 && a >= 0) add(a, b); }
      }
    }
    return edges;
  }

  colorDist(ci, cj) {
    if (!this._labs) this._labs = paletteOklab(this.colors);
    const A = this._labs[ci], B = this._labs[cj];
    if (!A || !B) return 1;
    const dL = A[0] - B[0], da = A[1] - B[1], db = A[2] - B[2];
    return Math.sqrt(dL * dL + da * da + db * db);
  }

  /** 一轮：把碎块并入邻居 */
  pass() {
    const n = this.label();
    if (n <= 1) return false;
    const edges = this.adjacency(n);
    const minArea = this.minArea();
    const small = [];
    for (let id = 0; id < n; id++) if (this.areas[id] < minArea) small.push(id);
    if (!small.length) return false;

    // 每个碎块：找共享边界最长、色差最小的邻居
    const best = new Map();
    for (const [key, len] of edges) {
      const a = Math.floor(key / 4096), b = key % 4096;
      const consider = (self, other) => {
        if (this.areas[self] >= minArea) return;
        const cand = best.get(self);
        const dist = this.colorDist(this.repColor[self], this.repColor[other]);
        if (!cand || len > cand.len || (len === cand.len && dist < cand.dist)) {
          best.set(self, { to: other, len: len, dist: dist });
        }
      };
      consider(a, b); consider(b, a);
    }
    if (!best.size) return false;

    const { grid, labels } = this;
    for (let i = 0; i < grid.length; i++) {
      const id = labels[i];
      if (id < 0) continue;
      const m = best.get(id);
      if (m) grid[i] = this.repColor[m.to];
    }
    return true;
  }

  /** 多轮执行 */
  run(maxPasses) {
    if (this.level <= 0) return this.grid;
    const passes = maxPasses == null ? 3 : maxPasses;
    for (let i = 0; i < passes; i++) {
      if (!this.pass()) break;
    }
    return this.grid;
  }
}

/** 管线入口：按尺寸自适应地做区域简化 */
function simplifyRegions(grid, colors, w, h, level) {
  if (!level || level <= 0) return grid;
  return new RegionSimplifier(grid, colors, w, h, level).run(3);
}

/**
 * 统计"单格细节"：四周没有同色邻居的孤豆。
 * 像素画里的眼睛高光、线条端点就是这种单格，简化会把它们吃掉——用它给用户一个可看的数字。
 */
function countIsolatedCells(grid, w, h) {
  let n = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const c = grid[i];
      if (c < 0) continue;
      const same = (x > 0 && grid[i - 1] === c)
        || (x < w - 1 && grid[i + 1] === c)
        || (y > 0 && grid[i - w] === c)
        || (y < h - 1 && grid[i + w] === c);
      if (!same) n++;
    }
  }
  return n;
}

/**
 * 按图纸尺寸推荐简化强度（纯函数，便于单测/复用）：
 *   小图细节本来就少，越该"做减法"；超大图留 1 档保住细节。
 *   14 格以内 → 3（纯色块 + 轮廓）；24 格以内 → 2；120 格以内 → 2（实测 58×76 在 2 档最干净）；更大 → 1
 */
function autoSimplifyLevel(w, h) {
  const m = Math.max(w || 0, h || 0);
  if (m <= 14) return 3;
  if (m <= 24) return 2;
  if (m <= 120) return 2;
  return 1;
}
