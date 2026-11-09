/* compare.js —— 按住「对比」看"未简化"的版本
 *
 * 为什么需要：大块简化是"做减法"，用户很难凭空判断减得够不够、有没有吃掉细节。
 * 按住按钮时用 simplifyLevel=0 重跑一遍并出图，松手立刻恢复（不改变任何参数）。
 */
class ComparePreview {
  constructor(btn) {
    this.btn = btn;
    this.restore = null;
    if (!btn) return;
    const start = (e) => {
      if (e && e.cancelable) e.preventDefault();
      if (this.restore) return;
      this.restore = (typeof previewWithoutSimplify === 'function') ? previewWithoutSimplify() : null;
      if (this.restore) this.btn.classList.add('active');
    };
    const end = () => {
      if (!this.restore) return;
      this.restore();
      this.restore = null;
      this.btn.classList.remove('active');
    };
    btn.addEventListener('pointerdown', start);
    btn.addEventListener('pointerup', end);
    btn.addEventListener('pointercancel', end);
    btn.addEventListener('pointerleave', end);
    btn.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') start(e);
    });
    btn.addEventListener('keyup', (e) => {
      if (e.key === ' ' || e.key === 'Enter') end();
    });
    window.addEventListener('blur', end);
  }
}

const comparePreview = new ComparePreview(document.getElementById('compareBtn'));
