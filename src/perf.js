/* 性能度量：给渲染管线各阶段计时，便于定位卡顿 */

class PerfMeter {
  constructor() {
    this.lastRun = null;      // { total, stages: {name: ms} }
    this._marks = new Map();
  }

  start() {
    this._marks.clear();
    this._t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    return this;
  }

  stage(name, fn) {
    const t = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const out = fn();
    this._marks.set(name, +((typeof performance !== 'undefined' ? performance.now() : Date.now()) - t).toFixed(2));
    return out;
  }

  mark(name, ms) {
    this._marks.set(name, +ms.toFixed(2));
    return this;
  }

  end() {
    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const stages = {};
    let sum = 0;
    for (const [k, v] of this._marks) { stages[k] = v; sum += v; }
    this.lastRun = { total: +sum.toFixed(2), stages: stages };
    return this.lastRun;
  }

  /** 是否超过一帧预算（16.7ms），供 HUD 提示 */
  get overBudget() {
    return !!(this.lastRun && this.lastRun.total > 16.7);
  }
}

const perf = new PerfMeter();

/** 轻量防抖：滑杆/输入用 */
function debounce(fn, ms) {
  let timer = 0;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

/** 按帧节流：指针移动等高频事件用 */
function rafThrottle(fn) {
  let queued = false;
  let lastArgs = null;
  return function (...args) {
    lastArgs = args;
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      fn.apply(this, lastArgs);
    });
  };
}
