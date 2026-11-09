/* 图纸视口：缩放 / 平移的纯数学层（不碰 DOM，方便单测与复用） */

class Viewport {
  constructor() {
    this.zoom = 1;      // 1 = 适应窗口（或手动基准）
    this.x = 0;         // 图纸左上角在画布中的 CSS 像素偏移
    this.y = 0;
    this.cell = 1;      // 当前每格 CSS 像素
    this.viewW = 1;     // 画布可视区宽高
    this.viewH = 1;
  }

  /** 由画布容器测量可视区 */
  measure(wrap) {
    this.viewW = Math.max(1, wrap.clientWidth - 20);
    this.viewH = Math.max(1, wrap.clientHeight - 20);
    return this;
  }

  /** 计算并缓存每格像素；autoFit=true 时按窗口自适应，否则用滑杆基准 */
  cellSize(gridW, gridH, autoFit, baseCell) {
    const base = autoFit ? Math.min(this.viewW / gridW, this.viewH / gridH) : baseCell;
    this.cell = Math.max(1, Math.round(base * this.zoom));
    return this.cell;
  }

  contentSize(gridW, gridH) {
    return { w: gridW * this.cell, h: gridH * this.cell };
  }

  /** 让图纸始终可见（小于视口居中，大于视口限制在边界内） */
  clamp(w, h) {
    if (w <= this.viewW) this.x = (this.viewW - w) / 2;
    else this.x = Math.min(0, Math.max(this.viewW - w, this.x));
    if (h <= this.viewH) this.y = (this.viewH - h) / 2;
    else this.y = Math.min(0, Math.max(this.viewH - h, this.y));
    return this;
  }

  /** 以视口坐标 (mx,my) 为锚点缩放：该点下的格子保持不动 */
  zoomAt(factor, mx, my, gridW, gridH, autoFit, baseCell) {
    const cs = this.cell || 1;
    const gx = (mx - this.x) / cs;
    const gy = (my - this.y) / cs;
    const next = Math.max(1, Math.min(12, this.zoom * factor));
    if (Math.abs(next - this.zoom) < 0.001) return false;
    this.zoom = next;
    this.cellSize(gridW, gridH, autoFit, baseCell);
    this.x = mx - gx * this.cell;
    this.y = my - gy * this.cell;
    return true;
  }

  panBy(dx, dy) {
    this.x += dx;
    this.y += dy;
    return this;
  }

  reset() {
    this.zoom = 1;
    this.x = 0;
    this.y = 0;
    return this;
  }

  /** 屏幕 client 坐标 → 图纸内的小数格坐标 */
  cellAt(clientX, clientY, rect) {
    const cs = this.cell || 1;
    return {
      x: (clientX - rect.left - this.x) / cs,
      y: (clientY - rect.top - this.y) / cs
    };
  }

  get label() {
    return this.zoom <= 1.001 ? '适应窗口' : Math.round(this.zoom * 100) + '%';
  }
}

/** 全局唯一视口 */
const viewport = new Viewport();
