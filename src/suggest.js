/* suggest.js —— 载入图片后的"建议卡"（一次只给一条最有用的建议）
 *
 * 为什么不塞进 toast：toast 会消失、不可点；建议卡带一个可执行按钮，
 * 用户点一下就得到更好结果（1:1 还原 / 最大简化 / 去背景）。
 */
class SuggestionCard {
  constructor(el) {
    this.el = el;
    this.textEl = el ? el.querySelector('.suggest-text') : null;
    this.btnEl = el ? el.querySelector('.suggest-btn') : null;
    this.closeEl = el ? el.querySelector('.suggest-close') : null;
    this.current = null;
    if (el) {
      this.btnEl.addEventListener('click', () => this.run());
      this.closeEl.addEventListener('click', () => this.hide());
    }
  }

  show(s) {
    if (!this.el) return;
    this.current = s;
    this.textEl.innerHTML = s.text;
    this.btnEl.textContent = s.action;
    this.el.classList.remove('hidden');
    this.el.classList.add('show');
  }

  hide() {
    if (!this.el) return;
    this.el.classList.remove('show');
    this.el.classList.add('hidden');
    this.current = null;
  }

  run() {
    const s = this.current;
    this.hide();
    if (s && typeof s.run === 'function') s.run();
  }

  /** 每次载入新图/参数大改后调用：挑一条最值得说的 */
  refresh() {
    if (!this.el || !sourceCanvas) { this.hide(); return; }
    const list = buildSuggestions();
    if (!list.length) { this.hide(); return; }
    this.show(list[0]);
  }
}

/** 按"收益/可信度"优先级生成建议 */
function buildSuggestions() {
  const out = [];
  if (!sourceCanvas) return out;
  const info = (typeof analyzeSource === 'function') ? analyzeSource(sourceCanvas) : null;
  const sw = sourceCanvas.width, sh = sourceCanvas.height;

  // ① 像素画没按 1:1 → 会重采样变糊
  if (info && info.isPixelArt && !(gridW === sw && gridH === sh)) {
    out.push({
      text: '这是 <b>' + sw + '×' + sh + '</b> 的像素画，现在按 <b>' + gridW + '×' + gridH + '</b> 重采样会糊边。',
      action: '按原图 1:1 还原',
      run: () => { applyQualityPreset('pixel', true); process(); toast('已按原图 ' + sw + '×' + sh + ' 1:1 还原'); }
    });
  }

  // ② 放大过的像素画
  if (snapBlock > 1 && !(gridW === snapNativeW && gridH === snapNativeH)) {
    out.push({
      text: '检测到 <b>' + snapBlock + '×' + snapBlock + '</b> 像素块（原生 <b>' + snapNativeW + '×' + snapNativeH + '</b>），可以精确还原。',
      action: '对齐到原生像素',
      run: () => { alignBtn.click(); }
    });
  }

  // ③ 像素画已 1:1，但简化开着 → 会把线条/高光当碎块吃掉
  if (info && info.isPixelArt && gridW === sw && gridH === sh && simplifyLevel > 0) {
    out.push({
      text: '已经按原图 1:1 了，但「大块简化」还开着（' + simplifyLevel + '）——像素画的线条和高光会被当成碎色块吃掉。',
      action: '关掉简化',
      run: () => { simplifyLevelInput.value = 0; simplifyLevelInput.dispatchEvent(new Event('input')); toast('已关掉大块简化，保留像素画细节'); }
    });
  }

  // ④ 小尺寸：建议最大简化（纯色块 + 轮廓）——像素画 1:1 时不建议，避免吃掉细节
  if (gridW <= 20 && simplifyLevel < 3 && !(info && info.isPixelArt && gridW === sw && gridH === sh)) {
    out.push({
      text: '尺寸只有 <b>' + gridW + '×' + gridH + '</b>，细节放不下，建议用最大简化：纯色块 + 线条轮廓。',
      action: '开最大简化',
      run: () => { simplifyLevelInput.value = 3; simplifyLevelInput.dispatchEvent(new Event('input')); }
    });
  }

  // ⑤ 颜色偏碎：建议大块简化（像素画 1:1 时跳过）
  if (stateIdx && !(info && info.isPixelArt && gridW === sw && gridH === sh)) {
    const used = new Set();
    for (let i = 0; i < stateIdx.length; i++) if (stateIdx[i] >= 0) used.add(stateIdx[i]);
    if (used.size >= 20 && simplifyLevel < 2) {
      out.push({
        text: '现在用了 <b>' + used.size + '</b> 种颜色，画面偏碎；开「大块简化」会把碎色块并成大色块。',
        action: '开大块简化',
        run: () => { simplifyLevelInput.value = 2; simplifyLevelInput.dispatchEvent(new Event('input')); }
      });
    }
  }

  // ⑤ 背景还在（满格且四边主色占比高）→ 建议去背景
  if (stateIdx && autoBgRemove === false) {
    const info2 = (typeof borderBackgroundInfo === 'function') ? borderBackgroundInfo(sourceCanvas) : null;
    if (info2 && info2.ratio >= 0.5) {
      const total = stateIdx.length;
      const used = stateIdx.filter(v => v >= 0).length;
      if (used > total * 0.9) {
        out.push({
          text: '背景还占着豆子（<b>' + (total - used) + '</b> 格是图案），去掉纯色背景能省不少豆。',
          action: '去背景',
          run: () => { whiteBgBtn.click(); }
        });
      }
    }
  }

  return out;
}

const suggestions = new SuggestionCard(document.getElementById('suggestCard'));
