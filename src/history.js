/* 通用撤销/重做栈（数据结构层，与具体业务无关） */

class History {
  /**
   * @param {number} limit 最多保留多少步
   */
  constructor(limit = 60) {
    this.limit = limit;
    this._undo = [];
    this._redo = [];
  }

  get canUndo() { return this._undo.length > 0; }
  get canRedo() { return this._redo.length > 0; }
  get depth() { return this._undo.length; }

  /** 压入一个"操作前"的快照；调用方保证快照是独立副本 */
  push(snapshot) {
    this._undo.push(snapshot);
    if (this._undo.length > this.limit) this._undo.shift();
    this._redo.length = 0;
    return this;
  }

  /**
   * 撤销：需要调用方传入"当前状态"的快照用于重做
   * @returns 上一步的快照，或 null
   */
  undo(currentSnapshot) {
    if (!this._undo.length) return null;
    const prev = this._undo.pop();
    this._redo.push(currentSnapshot);
    return prev;
  }

  /** 重做：同样需要当前状态快照 */
  redo(currentSnapshot) {
    if (!this._redo.length) return null;
    const next = this._redo.pop();
    this._undo.push(currentSnapshot);
    return next;
  }

  clear() {
    this._undo.length = 0;
    this._redo.length = 0;
    return this;
  }
}
