# 架构说明（perler-bead-generator）

> 这个项目曾是一个 2800+ 行的单文件 `index.html`，2025-11 重构为「样式 + 模块脚本」结构。
> 目标：**一个界面/一个职责 = 一个脚本**；可变状态集中管理；数据结构和算法与 UI 解耦；性能可测。

## 1. 目录结构

```
perler-bead-generator/
├── index.html                 # 壳：只留 DOM 结构 + 按顺序引入样式/脚本
├── palettes.js                # 品牌色号数据（import-palette.ps1 生成）
├── styles/
│   ├── base.css               # 变量、重置、按钮/表单等基础件
│   ├── components.css         # 面板、图例、色板、画布、toast 等组件
│   └── layout-mobile.css      # 手机端布局：appbar / stage / dock / 上滑面板
├── src/
│   ├── util.js                # 纯工具：颜色换算、文字对比色、色号字号
│   ├── perf.js                # 性能：PerfMeter + debounce / rafThrottle
│   ├── history.js             # 数据结构：通用撤销/重做栈 History
│   ├── viewport.js            # 数据结构：视口缩放/平移数学 Viewport
│   ├── state.js               # 唯一可变状态源（所有模块共享）
│   ├── dom.js                 # DOM 引用集中管理
│   ├── palette.js             # 色板数据组装 + 色板下拉
│   ├── color.js               # 色彩科学：Oklab 色差、最近色、熨烫色值
│   ├── image.js               # 源图：载入、像素块识别、降噪、增强、采样
│   ├── quantize.js            # 量化：抖动核、k-means 限色、并色、众数平滑
│   ├── outline.js             # 背景识别、自动描边、去杂色
│   ├── pipeline.js            # 渲染管线编排（阶段化 + 计时）
│   ├── legend.js              # 图例 / 色板选色条 / 用量统计
│   ├── renderer.js            # 图纸渲染：离屏缓存、视口、悬停高亮
│   ├── editor.js              # 图纸编辑：手势分发、撤销栈、画笔写入
│   ├── tools.js               # 编辑工具类（策略 + 继承）
│   ├── exporter.js            # 导出 PNG（含图例色号）/ 1:1 像素图 / 清单
│   ├── source-ops.js          # 源图操作：去白底、AI 抠图、裁边、撤销
│   ├── sheet.js               # 底部上滑面板 + 步骤条
│   ├── panels.js              # 参数控件绑定（图片/尺寸/画质/色板/描边/熨烫/显示）
│   └── app.js                 # 启动装配
└── docs/                      # 架构与工程规范
```

## 1.5 像素画识别与还原（2025-11）

两层判断，分别解决"放大过的像素画"和"原生小像素画"：

1. **网格周期 + 相位检测** `image.js: detectPixelGrid()`
   - 统计「列/行跳变剖面」→ 对每个候选周期 p 扫相位 φ，让跳变尽量落在 x≡φ / y≡φ 上；落在边界外的比例 ≤5% 视为合格，合格里取**最大**周期（除数周期会被 2p 排除）。
   - 返回 `{period, phaseX, phaseY, badRate, nativeW, nativeH}`；`snapSource(src, period, phaseX, phaseY)` 按相位分块平均回原生尺寸。
   - 实测：原图放大 4× → 周期 4、还原一致率 100%；放大 6× 且裁掉左上 3px → 周期 6、相位 (3,3)、原生 64×69。
   - 插画/照片跳变到处都是，达不到 5% 阈值 → 周期 0（不会误判）。
2. **原生小像素画** `image.js: analyzeSource()`
   - 小尺寸（≤150×220）+ 完全平涂率 ≥22% + 颜色密度 ≤0.55 → `isPixelArt`（渐变图密度接近 1，会被排除）。
   - 只在「③ 画质」里提示 + 提供「按原图尺寸 1:1 还原」按钮，**不擅自改参数**；点击后套 `pixel` 预设（1:1、最近邻、并色 8、众数平滑 2 遍）。
   - 放大过的像素画（period>1）点「对齐到 W×H」时同样按**原生尺寸**套 pixel 预设。
3. `setSource` 换图时清理 `sizeLock`、临时预设、采样方式，避免上一张的 1:1 尺寸污染下一张。

## 1.6 自动去背景（异形成品，2025-11）

`source-ops.js`：

- `borderBackgroundInfo()`：统计四边颜色，识别 1~2 种主色；**支持"棋盘格假透明"**（白+浅灰双色底，两者都中性浅色、亮度接近、合计占比 ≥60%）。
- `removeBorderBackground(tol)`：从四边洪水填充匹配任一背景色的像素 → alpha=0（被图案包住的浅色不会被误删）；返回去掉的像素数。
- `autoRemoveBackgroundOnLoad()`：四边背景合计占比 ≥55% 且去掉后确实省豆（>2%）才自动执行，并提示「省 N 颗豆」，可用「撤销原图处理」恢复；否则静默跳过。
- 实测（大肥鱼白/灰棋盘底）：4408 颗 → 3131 颗（空格 1277，**−29%**）。

## 1.7 区域简化：像素化是"做减法"（2025-11）

`region.js: RegionSimplifier`（类）

1. 同色 4 连通块标号（`label()`），算每块面积；
2. 面积 < 阈值的碎色块，整块并到**共享边界最长、Oklab 色差最小**的邻居（`pass()`）；
3. 多轮执行（`run()`），阈值随网格尺寸自适应：`minArea = base(level) × (n≤256 ? 1.6 : n≤1200 ? 1.0 : 0.8)`；
4. 管线阶段：采样 → 限色 → 量化 → 并色 → **简化** → 平滑 → 合成（每阶段 perf 计时）。

实测（大肥鱼 58×76）：色块 121 → 96（level2）→ 65（level3），孤立单格 23 → 4，耗时 ~3ms。

**尺寸自适应推荐**：`region.js: autoSimplifyLevel(w,h)`（纯函数）→ ≤14 格 3 / ≤24 格 2 / ≤120 格 2 / 更大 1；`Pipeline.run()` 的「准备」阶段在 `computeGrid()` 之后调用它，仅当 `autoSimplify && !simplifyTouched` 时改写 `simplifyLevel` 并 `syncSimplifyUI()`。手动拖滑杆会置 `simplifyTouched=true, autoSimplify=false`；`pixel` / `detail` 预设把 `autoSimplify` 关掉；换图表 `setSource` 会重置这两个标记。

**细节保留度**：`region.js: countIsolatedCells(grid,w,h)` 统计「四周无同色邻居」的孤豆；管线在并色后记 `detailBefore`、简化+平滑后记 `detailAfter`，HUD 显示 `单格细节 524→4`。

**按住对比**：`compare.js: ComparePreview`（类，单例 `comparePreview`）监听「对比」按钮的 pointerdown/up/cancel/leave（含空格/回车键与窗口失焦兜底），调用 `pipeline.js: previewWithoutSimplify()` —— 用 simplifyLevel=0 重跑并出图，返回 restore() 把 autoIdx/stateIdx/stateWorking/细节计数/去杂色计数/perf.lastRun 全部还原，只做瞬时预览、不改用户参数。

**像素画保护**：`pixel` 预设把 `simplifyLevel` 固定为 0——像素画的单格高光/线条本身就是设计细节，简化会把它们当碎块吃掉。实测 65×70 图标 1:1：简化 0 → 2，单格细节 11 → 1，改动 143/4550 格。用户手动调高时，`suggest.js` 会出「关掉简化」建议卡；`setSource` 用 `lastSourceWasPixelArt` 判断上一张是否像素画，换图时自动回到 `clean` 预设。

`src/suggest.js: SuggestionCard`（类，单例 `suggestions`）：载入图片后按优先级挑一条建议展示，带一键执行按钮（1:1 还原 / 对齐原生像素 / 最大简化 / 大块简化 / 去背景），比 toast 可操作。

关于"买几袋"：**不做**——各品牌包装规格不同，只给总豆数。

## 1.8 网格检测的边界（诚实说明）

`detectPixelGrid()` 只接受**精确边界**：梯度能量 ≥95% 落在 `x≡φ (mod p)` 上，且网格整除画布、块内均匀、块中心颜色重复度高。
实测：原图 ×3/×4/×6 最近邻放大、含 3px 偏移 → 周期与相位全对、还原 100% 一致。
双线性/AI 平滑放大：折点被抹开、周期 4 与 5 难以区分（试过 ±1 容差梳状、拉普拉斯折点、块内均匀性最小化三种办法都不稳），因此**不认**，避免给出错误的 1:1 结果；这类图按"众数采样 + 大块简化"处理。

## 2. 加载顺序与依赖

`index.html` 底部按顺序同步加载（普通 `<script>`，**因此双击 `index.html` 也能跑，无构建步骤**）：

```
util → perf → history → viewport → state → dom → palette → color → image
→ quantize → outline → pipeline → legend → renderer → editor → tools
→ exporter → source-ops → sheet → panels → app
```

规则：
- 越靠前越"底层"，不得反向依赖上层（如 `color.js` 不认识 DOM）。
- `tools.js` 在 `editor.js` 之后加载：编辑器运行时才用工具类（工厂），类又依赖编辑器的 `GRID_HINTS`，用"运行时查找"化解循环。
- `app.js` 最后执行，负责启动顺序（初始化标签、载入示例图）。

## 3. 数据流

```
源图 sourceCanvas
   └─ image.js: enhanceSource → preSmooth → downsample → ImageData
        └─ quantize.js: nearestColor(Oklab) → 抖动/误差扩散 → 索引网格 autoIdx
             ├─ mergeSimilarColors（并色）
             ├─ modeFilterGrid（众数平滑）
             └─ pipeline.js rebuildState:
                  去杂色 → 描边 → 叠加手动编辑（manualEdits）→ stateIdx（成品网格）
                        └─ renderer.js: drawPattern → 离屏缓存 patCache → 画布
                        └─ legend.js: 用量统计 / 色板条 / HUD
```

- `state.js` 是唯一可变状态源（参数 + 网格 + 缓存），任何模块都只读写它，不各自持有副本。
- `manualEdits`（Map: 格索引 → 色号）是"用户手改层"，叠在自动结果之上；改参数不会丢，换网格/色板才清空。

## 4. 工程模式

| 模式 | 位置 | 说明 |
|---|---|---|
| **数据结构类** | `History` | 通用撤销/重做（容量、canUndo/canRedo、快照由调用方保证独立性） |
| **数据结构类** | `Viewport` | 缩放/平移纯数学，不碰 DOM：`zoomAt` 锚点缩放、`clamp` 边界、`cellAt` 命中 |
| **策略 + 继承** | `tools.js` | `GridTool` 基类 → `PaintTool`（画笔/橡皮共享笔画）→ `BrushTool` / `EraserTool`；`FillTool` / `PickTool` / `PanTool` 各自实现手势 |
| **工厂** | `createGridTool(name)` | 工具名 → 实例，新增工具只要在 `TOOL_CLASSES` 加一行 |
| **模板方法 / 管线** | `Pipeline.run()` | 固定阶段顺序 + 每阶段计时，替换算法只改阶段内函数 |
| **观测点（可观测性）** | `perf` | `PerfMeter` 记录各阶段耗时，HUD 显示"生成 x ms"，超一帧预算可告警 |
| **模块边界** | 每个 `src/*.js` | 一个职责一个文件；DOM 引用集中在 `dom.js`，避免散落查询 |

## 5. 性能实践

1. **状态分层，避免无谓重算**：编辑图纸只跑 `rebuildState()` + 重绘，不重跑采样/量化；参数不变不触发管线。
2. **离屏缓存**：`patCache` 缓存整张图纸，只有 `patDirty` 时才重绘；悬停高亮只做一次 blit。
3. **rAF 合并**：`requestPatternRender()` 把连续绘制合并到一帧，拖动画笔不会每事件重画。
4. **TypedArray**：网格 `Int16Array`、平滑/并色中间结果都用 TypedArray，避免对象数组 GC 抖动。
5. **缓存视口矩形**：拖动/悬停期间缓存 `getBoundingClientRect()`，避免每个 `pointermove` 触发强制布局（`invalidatePreviewRect()` 在重绘时失效）。
6. **缓存色板 Oklab**：`WeakMap` 以调色板数组为键，只算一次。
7. **防抖/节流工具**：`debounce(fn, ms)`、`rafThrottle(fn)` 供滑杆与高频事件复用。
8. **超预算可见**：`perf.lastRun.total` 直接写进 HUD，回归时能立刻发现变慢。

## 6. 新增一个功能怎么做

1. 判断它属于哪一层：算法 → `quantize/color/outline`；数据 → `state`；界面 → `sheet/panels`；渲染 → `renderer`。
2. 新文件写在对应层，函数保持纯输入输出，避免直接抓 DOM（除 `panels.js`）。
3. 若需要新状态，加在 `state.js` 并写注释；若需要撤销，用 `History` 实例而不是自己 push/pop。
4. 在 `index.html` 按依赖顺序插入 `<script>`，并同步更新 `sw.js` 的 `SCRIPTS`（离线缓存清单）与缓存版本号。
5. 跑 `_verify/*.mjs` 的浏览器回归（见仓库外层 `_verify`）。

## 6.5 界面分层与页面结构（2025-11）

```
第 2 层  sheet（底部上滑面板，z-index 50）+ 遮罩（40）
第 1 层  appbar 工具条（20） / stepsbar 步骤条（20） / 色板行、当前用色、选色条
第 0 层  图纸画布 canvas-wrap
```

- 步骤条 = 面板页签：`① 图片 ② 尺寸 ③ 画质 ④ 显示 ⑤ 导出`，点步骤直接展开对应页。
- 「显示」与「导出」分页：显示设置（网格线/分板/适应窗口/缩放/色号清单）与导出动作分开。
- 已移除：1:1 像素图导出、复制购物清单、色号显示开关、亮度/对比度/饱和预处理（豆色由品牌色板固定，不需要）。

## 7. 为什么不用 ES Modules / 打包器

- 需求：**双击 `index.html` 就能用**、可离线、可套 Capacitor。ES Modules 在 `file://` 下会被 CORS 拦截。
- 现在用普通 `<script>` 顺序加载 + 单文件职责边界，既保留零构建，又拿到模块化收益。
- 如果以后引入构建（esbuild/rollup），`src/` 可以直接改成 `import/export`，文件边界已经是现成的。
