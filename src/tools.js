/* 图纸编辑工具：策略模式 + 继承（每类工具只管自己的手势语义） */

class GridTool {
  get name() { return 'tool'; }
  get hint() { return ''; }
  get cursor() { return 'crosshair'; }
  /** 按下：返回 true 表示这次手势已由工具接管 */
  onDown(cell, ev) { return false; }
  onMove(from, to) {}
  onUp() {}
}

/** 连续涂抹类工具（画笔/橡皮共用笔画逻辑，只改取值） */
class PaintTool extends GridTool {
  get value() { return paintColorIdx; }
  onDown(cell) {
    pushGridUndo();
    brushCells(cell.x, cell.y, this.value);
    gridApplyLive();
    return true;
  }
  onMove(from, to) {
    paintLineTo(from.x, from.y, to.x, to.y, this.value);
    gridApplyLive();
  }
}

class BrushTool extends PaintTool {
  get name() { return 'brush'; }
  get hint() { return GRID_HINTS.brush; }
}

class EraserTool extends PaintTool {
  get name() { return 'eraser'; }
  get hint() { return GRID_HINTS.eraser; }
  get value() { return -1; }
}

class FillTool extends GridTool {
  get name() { return 'fill'; }
  get hint() { return GRID_HINTS.fill; }
  onDown(cell) {
    pushGridUndo();
    floodFillGrid(cell.x, cell.y, paintColorIdx);
    gridApplyLive();
    return true;
  }
}

class PickTool extends GridTool {
  get name() { return 'pick'; }
  get hint() { return GRID_HINTS.pick; }
  onDown(cell) {
    const ci = stateIdx[cell.y * gridW + cell.x];
    if (ci < 0) { toast('这一格是空格'); return true; }
    setPaintColor(ci);
    toast('已取色：' + stateWorking[ci].code);
    return true;
  }
}

class PanTool extends GridTool {
  get name() { return 'pan'; }
  get hint() { return GRID_HINTS.pan; }
  get cursor() { return 'grab'; }
  onDown(cell, ev) { startChartPan(ev); return true; }
}

/** 工具注册表：名称 → 类（新增工具只要加一行） */
const TOOL_CLASSES = {
  brush: BrushTool,
  eraser: EraserTool,
  fill: FillTool,
  pick: PickTool,
  pan: PanTool
};

function createGridTool(name) {
  const Cls = TOOL_CLASSES[name] || BrushTool;
  return new Cls();
}

/** 当前激活的工具实例（由编辑器在 setGridTool 时替换） */
let activeTool = createGridTool('brush');
