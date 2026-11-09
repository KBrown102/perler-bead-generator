# 拼豆板规格 · 多板分板 · 中文竞品调研

> 调研目的：为 `perler-bead-generator/index.html` 新增「常用尺寸模板 + 分板（多块板拼接）」与「原图编辑放大」提供可落地的规格依据。
> 调研时间：2026-11-05。所有尺寸均标单位；拿不准的标「约 / 待核」。
> 置信度标记：✅ 已查证（有明确来源原文）｜🟡 部分查证（来源可信但为二手/推算）｜⚪ 推测或未能查证。

---

## 0. 结论先行（TL;DR）

1. **5mm 豆（midi）行业事实标准就是 29×29 孔 = 14.5×14.5 cm 方形板**，Perler / Hama / Artkal 三家一致；29×29 是「一块板 = 一个作品」的默认单位，也是所有工具默认画布（✅ 多源一致）。
2. **不存在官方「29×58」单板**，29×58 区域 = 两块 29×29 互锁；Perler 官方给 4 块拼装后的外形是 11.375 in = 28.9×28.9 cm（✅ Perler 官方）。
3. **2.6mm 豆（mini）板更乱**：Artkal 官方同一块 14.5×14.5 cm 板有 **50×50 孔**与 **52×52 孔**两个版本，孔距不同、**互不兼容**；52 孔版孔距更密，专为「无孔熨烫」设计（✅ Artkal 官方）。国内电商 mini 板以 **52 钉 / 78 钉 / 104 钉**为主（✅ 淘宝聚合页标题）。
4. **成品尺寸 = 豆数 × 节距**，不加边：5mm 豆按 5.0 mm/颗，2.6mm 豆按 2.6 mm/颗。行业工具的打印校准金句：**10 格 = 50 mm（midi）/ 26 mm（mini）**（✅ Beadify 帮助页）。
5. **分板 = 整除向上取整**：`ceil(W/板宽) × ceil(H/板高)`。100×100 豆 → 4×4 = **16 块 29×29 板**，成品 50×50 cm（✅ Stitchmate 计算器；多源公式一致）。
6. **业界没有「板间留 1 行重叠」的规范**（未查到任何来源）。主流做法是：整格切分 + **页码/坐标跨页延续** + **粗网格线（每 29 格）** + **10 格比例尺校准** + **拼装顺序编号**（A1/B1…或 第 x/y 页）。唯一被反复强调的是「别让接缝穿过眼睛/轮廓」。
7. 竞品里真正做了「分板」的中文产品：**豆猫拼豆**（自动裁成 52×52 / 104×104 区块）、**拼豆绘**（分板拼图 + 拼接顺序）、**pindou.art / 拼豆阿特**（大图分页导出，Pro）、**Beadify / MyBeadPattern**（板线 + 多板 PDF）。**爱拼豆、拼豆画都没有分板**。
8. **缩放交互**：爱拼豆、拼豆画都明确写了「**双指缩放/移动画布**」；两者都**没有放大镜**。爱拼豆靠「放大后逐格显示色号」解决精度，拼豆画靠「导出图纸带坐标轴 + 色号」解决。

---

## A. 拼豆板 / 豆子尺寸规格表

### A.1 5mm 豆（中豆 / midi）方形板

| 品牌 | 型号/名称 | 孔数 | 物理尺寸 | 可拼接 | 置信度 / 来源 |
|---|---|---|---|---|---|
| Perler | Large Square Pegboard（大方形板） | 29×29 = 841 孔 | 5.7 in = **14.5×14.5 cm** | 是（互锁） | ✅ [Perler 产品页摘录/pixelbead 汇总](https://pixelbead.art/guides/bead-board-sizes) |
| Perler | 4 块大方形拼装后 | 58×58 = 3364 孔 | 11.375 in = **28.9×28.9 cm** | —（4 块互锁） | ✅ [Perler 官方 4 片装](https://perler.com/products/large-clear-square-pegboards-4-ct)（经 pixelbead 引用） |
| Perler | Super-Sized Clear Pegboard（超大单板） | 未标注（待核） | **26.7×35.6 cm**（10.5×14 in） | 否（单块大板） | ✅ 同上（尺寸）／⚪ 孔数 |
| Hama | Midi Large Pegboard 234TR（大方形） | **841 孔**（即 29×29） | **14×14 cm** | 是 | ✅ [lindehobby 商品页](https://lindehobby.com/hama-pegboards-1013/hama-large-pegboard-234tr-14x14-cm-transparent-p5389) |
| Hama | Midi Little Square（小方形） | 待核（按 5mm 推算约 15×15） | **7.5×7.5 cm** | 是 | 🟡 [kids-world 商品页](https://www.kids-world.com/en-ie/hama-midi-pegboard-cat-p-116386.html)（尺寸）／⚪ 孔数 |
| Hama | Midi 圆形板（Medium Round 等） | 视型号（如 121 孔星形等异形） | 视型号 | 是 | 🟡 [kids-world 异形板列表](https://www.kids-world.com/en-ie/hama-midi-pegboard-small-heart-p-111212.html) |
| Artkal | 5mm Large Square Pegboard **BP01-K** | 29×29（与 Perler/Hama 同规格，官方未写孔数） | **14.5×14.5 cm** | 是（官方写明 linkable） | ✅ [Artkal 官方商品页](https://www.artkalfusebeads.com/products/artkalbeads-5mm-big-clear-square-pegboard)（尺寸/可拼接）／🟡 孔数 |

**结论（A.1）**
- 「29×29 孔 = 14.5 cm」在 5mm 体系里是三品牌通用事实标准 ✅；`841 = 29²`。
- 用户问到的 **「29×58」不是标准单板**：等价于 2 块 29×29 横向互锁（成品 14.5×29 cm）。⚪ 未发现任何品牌出售 29×58 单板。
- Perler 超大单板 26.7×35.6 cm 是「一块板做大图」的另一条路线，但孔数与 29 体系不通用，模板里建议单列、标「不可拼接」。

### A.2 2.6mm 豆（迷你豆 / mini）方形板

| 品牌 | 型号/名称 | 孔数 | 物理尺寸 | 可拼接 / 兼容性 | 置信度 / 来源 |
|---|---|---|---|---|---|
| Perler | Mini Beads Large Pegboard（2 片装） | 未标注（待核，按 2.6mm 推算约 56×56） | 5.875 in = **14.9×14.9 cm** | 可与其他大/小 Mini 方板互锁 | ✅ [Perler 官方商品页](https://perler.com/products/mini-beads-large-pegboards-2-ct)（尺寸）／⚪ 孔数 |
| Artkal | Large Square Pegboard for 2.6mm **BCP01**（50×50 孔版） | **50×50** | **14.5×14.5 cm** | 互锁；**与 52 孔版不兼容** | ✅ [Artkal 官方商品页](https://www.artkalfusebeads.com/collections/artkal-2-6mm-pegboards/products/artkal-clear-large-square-pegboard-for-mini-2-6mm-beads-bcp01) |
| Artkal | Large Square Pegboard for 2.6mm **BCP01**（52×52 孔版，带刻线） | **52×52** | **14.5×14.5 cm** | 孔距更密，适合「无孔熨烫」；**不能与 50 孔板拼接** | ✅ 同上（官方原文） |
| Hama | Mini Large Square Pegboard（大方形） | **待核**（Hama 官方未给孔数） | 约 14–15 cm 级（待核） | 需配 Hama Mini 专用板 | 🟡 [kids-world 商品页存在「Hama Mini Pegboard - Large Square - White」](https://www.kids-world.com/en-ie/hama-midi-pegboard-cat-p-116386.html)／⚪ 尺寸孔数 |
| Hama | Mini 节距 | Hama Mini 实为 **2.5 mm**（不是 2.6） | — | 与 Artkal/Perler mini 豆**不通用板** | ✅ [Stitchmate 计算器说明](https://stitchmate.app/tools/fuse-bead-pegboard-calculator) |

**结论（A.2）**
- 2.6mm 体系**没有统一孔径标准**：同为 14.5 cm 板，Artkal 有 50 孔与 52 孔两种、且**互不兼容**（✅ 官方警告）。做模板必须把「板型号」而不是只把「豆径」作为主键。
- 常见作品尺寸换算：29×29 豆在 mini 上只有 **约 7.5 cm**（✅ [knytstudio](https://www.knytstudio.com/blog/pegboard-sizes-bead-counts)、[Stitchmate](https://stitchmate.app/tools/fuse-bead-pegboard-calculator)）。
- Hama Mini 是 2.5 mm（✅ Stitchmate），如果模板只按 2.6 mm 算，Hama mini 成品会偏大约 4%；建议单独提供 2.5mm 档或标注误差。

### A.3 中国电商常见「拼豆板」规格

来源：淘宝「拼豆老手必备神器」聚合页商品标题（✅ 原文标题见 [淘宝逛一逛汇总页](https://guangtao.taobao.com/topic-199218823)），尺寸为**按豆径推算**，标「约」。

| 豆径体系 | 常见规格（电商叫法） | 孔数 | 板面/豆面尺寸 | 是否可拼接 | 置信度 |
|---|---|---|---|---|---|
| 5mm（大豆） | 标准方形板 / 中板 | **29×29** | **14.5×14.5 cm** | 可拼接（对标 Perler/Hama） | ✅ 孔数/尺寸（国际标准）／🟡 电商叫法 |
| 5mm（大豆） | 超大板 | **49×69 钉** | 板 **36×26 cm**（豆面约 24.5×34.5 cm） | **不可拼接**（标题明写） | ✅ [淘宝商品标题原文](https://guangtao.taobao.com/topic-199218823) |
| 5mm（大豆） | 长方形大板 | 60×120 钉 | 待核（按 5mm 推算豆面约 30×60 cm） | 可（无缝拼接款） | 🟡 标题「60*120钉长方形」 |
| 2.6mm（小豆） | 小方板 | **52×52** | 板 14.5 cm 级；豆面约 13.5 cm | 可拼接/带刻线 | 🟡（Artkal 同规格 14.5cm 已证 ✅） |
| 2.6mm（小豆） | 中板 | **78×78** | 豆面约 20.3 cm（板约 21–22 cm） | 可拼接 | 🟡 标题 + 推算 |
| 2.6mm（小豆） | 大板 / 特大板 | **104×104** | 豆面约 27 cm（板约 28 cm） | 可拼接 | 🟡 标题 + 推算 |
| 2.6mm（小豆） | Artkal 兼容 | **50×50** | 14.5×14.5 cm | 可拼接 | ✅ Artkal 官方 |
| 2.6mm（小豆） | 长条板 | **60×120** | 待核 | 无缝拼接 | 🟡 标题 |

**结论（A.3）**
- **29×29 = 14.5 cm 确实是最常见的「一块板」单位** ✅，国内 5mm 板基本对标 Perler/Hama/Artkal。
- 中国电商的「大板」概念是 **2.6mm 的 104 钉板**，不是 5mm 的 29×29 多块；5mm 的「大板」走的是 **49×69 不可拼接整板** 路线。
- ⚠️ 网上有「52×52 格 = 26×26 cm（5mm 孔距）」的说法（如 [百度 B2B 文库页](https://b2bwiki.baidu.com/article/718824530367823873)），该页由金属丝网公司发布、内容为 SEO 稿，与淘宝实际商品（52 钉为 2.6mm）矛盾，**判定不可信，不要写进模板** ⚪。

### A.4 单颗豆节距与成品尺寸公式（做尺寸模板最关键）

| 项目 | 数值 | 置信度 / 依据 |
|---|---|---|
| 5mm（midi）中心距 | **5.0 mm**（2 颗 = 1 cm） | ✅ [Stitchmate](https://stitchmate.app/tools/fuse-bead-pegboard-calculator)、[knytstudio](https://www.knytstudio.com/blog/pegboard-sizes-bead-counts) |
| 2.6mm（mini）中心距 | **2.6 mm**（工具通用值） | ✅ Stitchmate、Beadify 打印说明 |
| Hama mini 中心距 | **2.5 mm** | ✅ Stitchmate |
| Maxi（大豆） | **10.0 mm** | ✅ Stitchmate / knytstudio |
| 打印校准 | **10 格 = 50 mm（midi）/ 26 mm（mini）** | ✅ [Beadify 帮助页 FAQ](https://beadify.app/)（“Ten grid intervals should measure 26 mm for Mini or 50 mm for Midi”） |
| 成品尺寸公式 | **cm = 豆数 × 节距(mm) ÷ 10**（不加边） | ✅ 多源一致；爱拼豆导出实测一致（见下） |

**爱拼豆导出实测反证（✅ 截图观察）**：同一张 43×51 豆图，导出页同时给出
- 2.6mm 豆：**11.2 cm × 13.3 cm**（=43×2.6=111.8mm，51×2.6=132.6mm）
- 5mm 豆：**21.5 cm × 25.5 cm**（=43×5=215mm，51×5=255mm）

→ 说明主流 App 就是**纯乘法、不加边距**。熨烫后尺寸变化很小（✅ knytstudio：“Ironing fuses the beads but barely changes the footprint”）。

> 给实现的建议：模板只存 `pegs` 与 `pitchMm`，成品 cm 一律实时算，别硬编码；熨烫公差可加 ±0.2~0.5 cm 的提示文案（🟡 经验值）。

### A.5 常见作品尺寸参考（选模板用）

| 作品类型 | 建议豆数 | 5mm 成品 | 2.6mm 成品 | 置信度 / 依据 |
|---|---|---|---|---|
| 钥匙扣 / 小挂件 | 8×8 ~ 16×16 | 4 ~ 8 cm | 2.1 ~ 4.2 cm | 🟡 工具预设范围（爱拼豆 8×8 起）+ 电商模板 |
| 胸针 / 冰箱贴 | 16×16 ~ 20×20 | 8 ~ 10 cm | 4.2 ~ 5.2 cm | 🟡 同上 |
| 杯垫 | **29×29（正好一块板）** | **14.5 cm** | 7.5 cm | ✅ [knytstudio](https://www.knytstudio.com/blog/pegboard-sizes-bead-counts)、[pixelbead](https://pixelbead.art/guides/bead-board-sizes) |
| 小立牌 / 头像 | 32×32 ~ 64×64 | 16 ~ 32 cm | 8.3 ~ 16.6 cm | 🟡 画廊常见尺寸（pindou.art 32×32/64×64） |
| 相框 / 宠物肖像 | 80×80 ~ 116×116 | 40 ~ 58 cm | 21 ~ 30 cm | 🟡 pixelbead 建议肖像 80–100 列；Stitchmate 表 |
| 大幅挂画 | 100×100 ~ 145×145 | 50 ~ 72.5 cm | 26 ~ 37.7 cm | ✅ [Stitchmate 表](https://stitchmate.app/tools/fuse-bead-pegboard-calculator) |
| 手机壳（推算） | 约 29×14（5mm）/ 约 56×28（2.6mm） | 约 14.5×7 cm | 约 14.5×7.3 cm | ⚪ 按 iPhone 级 14.7×7.2 cm 反推，非来源数据 |

> 说明：钥匙扣/胸针这类没有权威标准，各 App 用「8×8 起、每 4 格一档」的预设（爱拼豆：8×8 到 128×128 共 15 档 ✅）即可，不必追求唯一答案。

---

## B. 多板拼接：怎么算、怎么标

### B.1 板数计算（可直接写进代码）

```text
boardsX = ceil(W / boardW)      // boardW = 29（5mm 板）或 52（2.6mm 大板）
boardsY = ceil(H / boardH)
boardCount = boardsX * boardsY
成品宽 cm = W * pitch / 10
成品高 cm = H * pitch / 10
```

**官方/工具给出的实测对照（29×29 板，5mm）** ✅ [Stitchmate](https://stitchmate.app/tools/fuse-bead-pegboard-calculator)：

| 豆数 | 成品尺寸 | 总豆数 | 需要板数 |
|---|---|---|---|
| 29×29 | 14.5×14.5 cm | 841 | 1 |
| 40×40 | 20×20 cm | 1,600 | 4（2×2） |
| 58×58 | 29×29 cm | 3,364 | 4 |
| 64×64 | 32×32 cm | 4,096 | 9 |
| 87×87 | 43.5×43.5 cm | 7,569 | 9 |
| **100×100** | **50×50 cm** | **10,000** | **16（4×4）** |
| 116×116 | 58×58 cm | 13,456 | 16 |
| 145×145 | 72.5×72.5 cm | 21,025 | 25 |

- 用户问的「100×100 要几块 29×29」→ **16 块**（4 行 × 4 列）；`ceil(100/29)=4`，余量 16 豆/边（约 8 cm）会空在最后一列/行，这是正常的。✅
- 2.6mm 用 52×52 板：100×100 → `ceil(100/52)=2` → **4 块**，成品 26×26 cm。🟡（公式同源，板规格见 A.2/A.3）
- 备豆：总量再 +10%（大件主色可 +20%）。✅ Stitchmate
- 拼装工艺：**逐块熨、再拼**。先在互锁板上排满 → 每块单独熨 → 取下后把成品背面接缝再熨一次连成整片。✅ [knytstudio](https://www.knytstudio.com/blog/pegboard-sizes-bead-counts)：「Iron each board separately, then join… the joined seams fuse when you iron the assembled piece from the back.」；Stitchmate 同义。

### B.2 业界工具怎么标「分板」（可抄的做法）

| 工具 | 分板/分页做法 | 关键细节 | 置信度 / 来源 |
|---|---|---|---|
| **Stitchmate** | 输入 58×58 → 直接输出「Pegboards needed 4 / Board layout 2×2」，并给「Interlock them and fuse section by section, or fuse the sections separately and join the seams」 | 板数 + 布局矩阵 + 工艺二选一提示 | ✅ [计算器页](https://stitchmate.app/tools/fuse-bead-pegboard-calculator) |
| **knytstudio** | 「Split the chart per board」，每块板单独一页图纸，并**给位置标签**：`R2-C1 = 第二行第一列` | 位置编号用「行-列」，强调「一张巨图跨 6 块板是串行错位的根源」 | ✅ [Pegboard Sizes 指南](https://www.knytstudio.com/blog/pegboard-sizes-bead-counts) |
| **MyBeadPattern** | 有 **Board lines（板线）**、板数自动计算、29/58/87 豆宽预设；打印时「**Print every page at the same scale, measure the 50 mm bar, label page order, and confirm that row and column coordinates continue correctly across tiles**」 | ①每页同比例 ②50mm 校准条 ③标页序 ④**行列坐标跨页延续** | ✅ [How it works / 指南页](https://mybeadpattern.com/) |
| **pindou.art（拼豆阿特）** | 「**大图分页导出（图纸切割）**」：按整格边界切分多页，**每页带完整色号图例、坐标和页码**，打包 ZIP；两种版式：**像素分页**（固定格子大小）与 **A4 打印版式**（按真实孔距 2.6mm/5mm 排版，可直接打印）；多页时各页画布尺寸一致、图例纵向对齐 | 最完整的「可打印分板」实现；Pro/赞助会员专属，免费只能预览前 2 页 | ✅ [价格/功能页](https://pindou.art/pricing) |
| **Beadify** | Pattern 模式可选 board size；Free 仅「one-board Patterns」，**Pro 才有 multi-board Patterns 与 multi-board PDF**（带作者名与采购清单）；打印要求 100% 实际大小 | 商业分层：分板=付费点；打印校准 10 格=26/50mm | ✅ [官网 + 定价/FAQ](https://beadify.app/) |
| **拼豆绘（中文 App）** | 「**分板拼图：大图自动拆成多块小板，标好拼接顺序，拼完再合并不串位**」；画布可选 29mm/大号/迷你板尺寸（原文如此，疑为 2.9mm 笔误） | 中文里最直白的「自动拆板 + 顺序标注」 | ✅ [3DM 应用页](https://app.3dmgame.com/android/565467.html) |
| **豆猫拼豆（中文 App）** | 「**智能拆分 + 多板适配**」：自动将超大图案切割为适配不同尺寸拼豆板的区块（**如 52×52、104×104**），支持分区域独立制作或拼接组合 | 明确以国内板规格（52/104 钉）为切分单位 | ✅ [下载站功能介绍](https://www.dljs.net/adsoft/272963.html)（厂商文案转载，🟡 原始出处待核） |
| **爱拼豆** | **无分板**：只有 8×8–128×128 画布与单张 PNG 导出（导出图带坐标轴） | 是差异化空位 | ✅ App Store 描述 + 导出截图 |
| **拼豆画** | **无分板**：只有「图纸 1 / 图纸 2 / 图纸 3」多张图纸页签（更像多方案，不是按板切） | 同上 | 🟡 截图观察 + 描述无分板字样 |

**截图/画面描述（用于对齐设计）**
- 爱拼豆导出页（✅ 官方截图）：顶部并排显示两种豆径的成品尺寸（2.6mm：11.2×13.3cm；5mm：21.5×25.5cm）；下方是单张方格图，**四边有 1..52 坐标轴**、每格写色号（A1/H6/D16…）、底部色号计数条。**没有板线/页码**。
- 拼豆画导出页（✅ 官方截图）：顶部「图纸1 图纸2 图纸3」页签；图面**带横纵坐标数字 + 红色辅助线**（约每 10 格一条，⚪ 间隔待核）；底部开关「色号 / 用量 / 网格线」，按钮「高清预览 / 生成海报 / 保存图纸」。
- MyBeadPattern（✅ 文案）：「board lines, rulers, codes or symbols」可同时开。

### B.3 「板间留 1 行重叠 / 对齐孔」到底有没有规范？

**结论：没有查到任何「留 1 行重叠」的行业规范**（⚪ 否定性结论，基于对 Perler/Hama/Artkal 官方、Stitchmate、knytstudio、Beadify、MyBeadPattern、pindou.art、拼豆绘、豆猫的检索）。

业界的真实替代做法是 4 件事（都有来源）：
1. **整格切分 + 粗板线**：分页边界一定落在豆格边界，并在图上画「每 29 格一条粗线」（MyBeadPattern 的 board lines ✅；pindou.art 的「显示大网格线」✅）。
2. **坐标跨页延续**：每页保留全局坐标（不是每页从 1 重新数），MyBeadPattern 明确要求 ✅。
3. **页码 + 位置标签**：`第 x/y 页` 与 `R2-C1` / `A1..D4` 两种写法都有先例 ✅。
4. **比例校准条**：10 格 = 50 mm（midi）/ 26 mm（mini），打印后先量尺再拼 ✅ Beadify；MyBeadPattern 用 50 mm 比例条 ✅。

**另一条被反复强调的「对齐」经验（比重叠行更实用）**：**让接缝避开眼睛、细轮廓、小特征**，落在大的平色块上；接缝两侧的色块要保持连通可读。✅ MyBeadPattern 原文：「A seam through a large flat area is usually easier to track than one through an eye, narrow outline, or tiny feature, so adjust the crop or width while the design is still flexible.」

> 如果一定要做「重叠」，建议做成**可选辅助而非默认**：在每页边缘额外渲染 1 行/列的**半透明邻板内容**（俗称 bleed），仅用于人工对齐、不计入该页豆数。⚠️ 这是本报告的建议，不是业界既有规范（⚪），落地前需产品确认，避免用户把邻板豆也拼上去。

### B.4 给分板 UI 的标注规范建议（综合以上，可直接用）

| 元素 | 建议 | 依据 |
|---|---|---|
| 切分 | 严格按板宽/板高整格切（29 / 50 / 52 / 78 / 104） | ✅ 全部工具一致 |
| 板编号 | 行用字母、列用数字：`A1..A4 / B1..B4`（100×100→4×4），同时显示 `第 3/16 块` | ✅ knytstudio R2-C1、pindou.art 页码 |
| 粗网格线 | 每 boardW 格一条 2–3px 深色线；板内每 5 或 10 格一条浅辅助线 | ✅ MyBeadPattern board lines；🟡 拼豆画红辅助线约 10 格 |
| 坐标 | 每页保留全局行/列号（0 或 1 起统一），页边标「本节覆盖 X:29–57, Y:0–28」 | ✅ MyBeadPattern |
| 拼接顺序 | 默认「从左到右、从上到下」，并允许用户改；拼豆绘即「标好拼接顺序」 | ✅ 拼豆绘 |
| 校准条 | 页脚固定「10 格 = 50 mm」标尺 | ✅ Beadify / MyBeadPattern |
| 页脚信息 | 豆径、节距、板规格、本页豆数/总豆数、色号图例、页码 | ✅ pindou.art「每页带完整色号图例、坐标和页码」 |
| 接缝提示 | 若某条板线穿过「非背景且窄」的区域，给一条软提示「接缝可能切断图案，建议平移裁切」 | ✅ MyBeadPattern 经验（作为产品化提示） |

---

## C. 中文竞品 App 功能补充

### C.1 功能矩阵（✅ 已查证 / 🟡 部分 / ⚪ 推测）

| 功能 | 爱拼豆 | 拼豆画 | 拼豆喵 | 豆猫拼豆 | 拼个豆豆 | 拼豆绘 | pindou.art |
|---|---|---|---|---|---|---|---|
| 尺寸模板 | ✅ 8×8–128×128，15 档常用 | 🟡 画布尺寸/豆数可调 | ✅ 画布尺寸可调 | 🟡 尺寸可调 | ✅ 画布编辑器 | ✅ 29/大号/迷你板 | ✅ 29×29 起，最大 300×300（Pro 500×500） |
| 分板 | ❌ 无 | ❌ 无 | ❌ 无 | ✅ 自动拆 52×52 / 104×104 | ❌ 无（用户评论在求） | ✅ 分板拼图 + 顺序 | ✅ 大图分页导出（Pro） |
| 放大/平移 | ✅ 双指缩放 + 移动 | ✅ 双指放大缩小 + 移动 | 🟡 未写明 | ✅ 自由缩放预览 | ✅ 编辑器 | 🟡 未写明 | ✅ 抓手 + 缩放百分比 |
| 放大镜 | ❌ 未发现 | ❌ 未发现 | ❌ | ❌ | ❌ | ❌ | ❌ |
| 镜像/对称 | ✅ 水平/垂直翻转 + 90° 旋转 | ✅ 旋转/翻转 | 🟡 未写明 | 🟡 未写明 | 🟡 未写明 | 🟡 未写明 | ✅ 旋转/翻转（编辑器） |
| 库存 | 🟡 无「豆仓」，有色板选择 | ❌ | ❌ | ✅ 豆子仓库管理 | ❌ | 🟡 未写明 | ❌ |
| AI 生成 | ❌（照片转换） | ❌（照片转换） | ❌（照片转换） | 🟡 文案称「AI 智能」 | ❌ | 🟡 「转Q版/去背景」 | ✅ 文生图/图生图（点数） |
| 导出格式 | ✅ 高清 PNG（带色号） | ✅ 保存图纸/海报 | ✅ 图片 | 🟡 未写明 | 🟡 未写明 | ✅ 方格图 + 色号清单 + 每行拼法 | ✅ PNG + 分页 ZIP（A4/像素） |
| 会员收费点 | ✅ 显示 ¥8（一次性，待核） | ✅ ¥28/月、¥68/年 | 🟡 未查证 | 🟡 免费版 + 付费模板 | ✅ 免费 | 🟡 未查证 | ✅ 免费/Pro/赞助 + AI 点数 |

### C.2 爱拼豆（重点）

**基本信息**（✅ [App Store 中国区](https://apps.apple.com/cn/app/%E7%88%B1%E6%8B%BC%E8%B1%86/id6756688364)，开发者「国梁 金」）：4.6 分 / 191 评分；App Store 标注价格 **¥8**（🟡 是否买断待核）；iOS 13+，iPhone/iPad。

**已查证功能（✅ 官方描述原文要点）**
- 画布：**8×8 至 128×128，15 种常用尺寸**；支持图片裁剪与预览。
- 图片转图纸：JPG/PNG，智能颜色匹配。
- 编辑工具：小/大画笔（大笔 3×3）、小/大橡皮、区域擦除、同色擦除、填充、取色、**无限撤销/重做**、颜色简化。
- 色板：**20+ 品牌**，含 Artkal（S-5MM、C-2.6MM、A-2.6MM、R-5MM）、Perler（标准/Mini/Caps）、Hama、Nabbi、Yant、Diamond Dotz、DMC、MARD（24/48/72/96/120/144/221/295）、可可/卡卡家/慢慢家/盼盼拼豆；每色标品牌色号。
- **参考图功能：支持缩放、平移、取色**（✅ 原文）。
- 画布操作：**水平/垂直翻转、90° 旋转、上下左右平移**、配色方案切换、多种显示模式（像素/网格）。
- 导出：高清 PNG，**带色号标注**（单张，无分页）。
- 项目管理：自动保存、重命名/复制/删除、缩略图。
- 内置新手教程（心形、小狗、樱桃）。
- 字体/形状：❌ 未提及「放大镜」「分板」。

**缩放与平移具体做法（✅ 截图 + 教程文案）**
- 教程第 1 步原文：「**你可以双指缩放移动画布**」（截图 shot_12）→ 手势 = **双指 pinch + 拖拽平移**。
- 商店截图标题：「精细操作 **支持缩放，移动**」（shot_10）→ 编辑器支持放大到逐格显示色号（截图里每格写着 M2/H6/D16/A1 等）。
- 精度处理：**没有指针偏移/吸附**的官方说明（🟡 无文档）；从截图看是「放大后按格命中 + 每格显示色号」，用信息密度替代放大镜。
- **无放大镜** ✅（描述与全部 6 张截图均无）。
- 导出页会**同时给出两种豆径的成品尺寸**（2.6mm/5mm），这是很值得抄的细节 ✅。

### C.3 拼豆画（重点）

**基本信息**（✅ [App Store 中国区](https://apps.apple.com/cn/app/id6754833406)，开发者「正勇 武」，bundle `com.DouHua.XiangSu`）：4.5 分 / **5932 评分**；免费 + 内购；**订阅 ¥28/月、¥68/年**（自动续订）；14.9 MB；4+ 岁；图形与设计榜 #47。

**已查证功能（✅ 官方描述）**
- 一键照片转像素图纸；**自由调节画布尺寸与豆子数量**。
- 编辑：亮度/对比度调整、一键黑白、**手动修改每一个像素点**。
- 就这三条，描述里**没有**分板、库存、镜像、缩放、AI 等字样。

**截图额外看到（🟡 截图观察，非官方文案）**
- 编辑页顶部提示「**双指可放大缩小画布**」→ 明确支持 pinch 缩放；底部工具：橡皮 / 背景 / **移动** / **旋转** / **翻转** / 更多。
- 导出页：`图纸1 / 图纸2 / 图纸3` 三个页签；图面带**横纵坐标 + 红色辅助线**（⚪ 间隔待核，目测约 10 格）；开关「色号 / 用量 / 网格线」；按钮「高清预览 / 生成海报 / 保存图纸」。
- 评论区大量「要充钱/买了会员生成变差/充了用不了」的差评（✅ 可见），说明其**付费墙很靠前**、且生成质量口碑不稳——这是我们可打的差异点。

### C.4 其余同类（简要）

| App | 关键点 | 置信度 / 来源 |
|---|---|---|
| **拼豆喵** | 照片→图纸；**智能色号匹配 + 每色颗数统计/采购清单**；一键 Q 版；内置像素画板（铅笔/橡皮）；支持「去杂色/合并相似色」；画布尺寸可调。**无分板描述** | ✅ [超好玩应用页](https://www.18touch.com/soft/91014.html) |
| **豆猫拼豆** | **智能拆分 + 多板适配（52×52、104×104）**；自由缩放预览；进度记录；**豆子仓库/库存**；**OCR 识别老图纸**；3 种采样算法；云同步；社区 | ✅ 功能文案见 [下载站](https://www.dljs.net/adsoft/272963.html)（🟡 厂商文案转载） |
| **拼个豆豆（PixDotDot）** | 蓝牙拼豆硬件联动（按颜色分区点亮豆子）；画布编辑器；图片转图纸；免费；3.7 分/726 评分。**用户评论在求「小图合并」**（把多个小图合并到一块板一起拼）→ 说明「合并/排版」是真实痛点 | ✅ [App Store](https://apps.apple.com/cn/app/id6761034586) |
| **拼豆绘** | **分板拼图（自动拆板 + 拼接顺序）**；29/大号/迷你板尺寸；导出方格图 + **色号清单 + 每行拼法**；模板（姓名牌/动漫头像/节日挂件/钥匙扣）；离线可用；厂商重庆杨桃科技 | ✅ [3DM 应用页](https://app.3dmgame.com/android/565467.html) |
| **轻图** | ⚪ **未能查证到拼豆相关的「轻图」产品**。检索到的同名内容均为图片编辑/压缩类工具，与拼豆无直接关系。建议产品侧先确认准确名称（是否为「轻图」小程序 / 「青图」/「轻拼豆」） | ⚪ 未查证 |
| **pindou.art（拼豆阿特）** | Web 工具；画布默认 29×29，最大 300×300（Pro 500×500）；工具含画笔/油漆桶/选择/抓手/橡皮/吸管/文字；显示坐标/小网格/**大网格线**/格子信息；**拼装模式 + 3D 预览**；**大图分页导出（Pro）**；AI 文生图/图生图（点数）；免费版导出带水印 | ✅ [编辑器](https://pindou.art/editor)、[价格页](https://pindou.art/pricing) |

### C.5 「原图/图纸编辑时的缩放与平移」横向总结

| 维度 | 业界做法 | 证据 |
|---|---|---|
| 手势 | **双指 pinch 缩放 + 单指/双指拖拽平移**（移动端标准） | ✅ 爱拼豆教程原文「双指缩放移动画布」；✅ 拼豆画「双指可放大缩小画布」 |
| 桌面端 | 工具栏「抓手」+ 百分比缩放控件（− 100% +） | ✅ pindou.art 编辑器工具栏 |
| 精度补偿 | 放大后**每格显示色号文本**（不是放大镜） | ✅ 爱拼豆 shot_10 每格 M2/H6/D16 |
| 放大镜 | **未发现任何一家做放大镜** | ✅ 6 家检索均无 |
| 缩放后指针精度 | 无公开文档；从实现常识看是「屏幕坐标 → 世界坐标反变换后 floor 到格」，并配合最小命中格尺寸（⚪ 推测，需自研验证） | ⚪ |
| 参考图缩放 | 参考图单独支持缩放/平移/取色（与画布解耦） | ✅ 爱拼豆「参考图支持缩放、平移、取色」 |

> 对我们产品的建议（⚪ 设计建议）：**pinch 缩放 + 拖拽平移 + 双指点击回 100%**；缩放 ≥ 某阈值（如单格 ≥ 24px）自动叠色号；编辑时对「命中格」做 1–2px 的吸附容差；不引入放大镜（竞品都没有，说明不是刚需），但可在超小格时给「长按临时放大镜」作为增强项。

---

## D. 给实现的直接清单（可直接转成配置）

### D.1 尺寸模板（建议内置，单位统一 mm）

```jsonc
// 5mm 体系：pitch = 5.0mm
{ "id": "midi_29",   "name": "标准方板 29×29", "pegs": [29,29], "boardMm": [145,145], "pitch": 5.0, "interlock": true,  "note": "Perler/Hama/Artkal 通用" },
{ "id": "midi_2x",   "name": "双板 29×58",     "pegs": [58,29], "boardMm": [290,145], "pitch": 5.0, "interlock": true,  "note": "2 块 29×29 横向互锁，无官方单板" },
{ "id": "midi_4x",   "name": "四板 58×58",     "pegs": [58,58], "boardMm": [289,289], "pitch": 5.0, "interlock": true,  "note": "Perler 官方 4 片拼装 28.9cm" },
{ "id": "midi_super","name": "超大单板 26.7×35.6", "pegs": null, "boardMm": [267,356], "pitch": 5.0, "interlock": false, "note": "Perler Super-Sized，孔数待核" },
{ "id": "midi_cn69", "name": "国内超大板 49×69", "pegs": [49,69], "boardMm": [260,360], "pitch": 5.0, "interlock": false, "note": "淘宝，不可拼接，尺寸为板外框" },

// 2.6mm 体系：pitch = 2.6mm（Hama mini 用 2.5）
{ "id": "mini_50", "name": "mini 方板 50×50", "pegs": [50,50], "boardMm": [145,145], "pitch": 2.6, "interlock": true, "note": "Artkal BCP01 50 孔版" },
{ "id": "mini_52", "name": "mini 方板 52×52", "pegs": [52,52], "boardMm": [145,145], "pitch": 2.6, "interlock": true, "note": "Artkal 52 孔版/国内 52 钉；与 50 孔不兼容" },
{ "id": "mini_78", "name": "mini 中板 78×78", "pegs": [78,78], "boardMm": [205,205], "pitch": 2.6, "interlock": true, "note": "国内电商，尺寸按节距推算，待核" },
{ "id": "mini_104","name": "mini 大板 104×104","pegs": [104,104],"boardMm": [275,275],"pitch": 2.6, "interlock": true, "note": "国内电商，尺寸按节距推算，待核" },
{ "id": "mini_hama","name":"Hama mini 大方形", "pegs": null, "boardMm": [150,150], "pitch": 2.5, "interlock": true, "note": "孔数待核；Hama 专用" }
```

### D.2 分板功能最小可行实现（MVP）

1. 输入/识别 `boardW, boardH`（默认 29），算 `boardsX/Y`，在画布上画**每 29 格一条粗线**。
2. 提供两种视图：`整图（带板线）` / `单板（第 k 块）`；单板视图顶栏显示 `A1 · 第1/16块 · 覆盖 X:0–28 Y:0–28`。
3. 导出：整图 PNG、**分板 JSON/PNG 包**（每块一张，文件名 `A1_r0c0.png`），页脚带 10 格比例尺与色号图例。
4. 若图案跨板，给「接缝警告」：板线穿过非背景窄区域时提示。
5. 不做「重叠 1 行」默认；如做，仅作为**只读 bleed 图层**并明确标注「不计入豆数」。

### D.3 还没确认、需要在实现前核实的点（待核清单）

| # | 待核项 | 影响 | 建议 |
|---|---|---|---|
| 1 | Perler mini 大板孔数（推算 ≈56×56） | mini 分板默认值 | 以 Perler 包装/实物清点，或先允许用户自定义孔数 |
| 2 | Hama mini 大方形板孔数与外形 | Hama mini 模板 | 官网/包装核实；暂用 2.5mm + 自定义孔数 |
| 3 | 国内 78/104 钉板的**板外框尺寸** | 尺寸模板显示 | 商品详情页实测；目前按豆面推算 |
| 4 | 「轻图」到底指哪个产品 | C 部分完整性 | 产品侧确认名称后再补 |
| 5 | 拼豆画导出图红色辅助线间隔 | 辅助线设计参考 | 截图放大数格或下载 App 实测 |
| 6 | 爱拼豆 ¥8 是买断还是订阅首价 | 竞品定价参考 | App Store 内购页核实 |

---

## E. 来源清单

**官方 / 厂商**
1. Perler 官方：Large Clear Square Pegboards 2ct / 4ct、Super-Sized Pegboard、Mini Beads Large Pegboards — <https://perler.com/products/large-clear-square-pegboards-2-ct>、<https://perler.com/products/large-clear-square-pegboards-4-ct>、<https://perler.com/products/super-sized-clear-pegboard>、<https://perler.com/products/mini-beads-large-pegboards-2-ct>
2. Artkal 官方：5mm BP01-K — <https://www.artkalfusebeads.com/products/artkalbeads-5mm-big-clear-square-pegboard>
3. Artkal 官方：2.6mm BCP01（50×50 / 52×52，互不兼容）— <https://www.artkalfusebeads.com/collections/artkal-2-6mm-pegboards/products/artkal-clear-large-square-pegboard-for-mini-2-6mm-beads-bcp01>
4. Hama 官方站（产品目录，无尺寸表）— <https://hama.dk/en>
5. Hama 234TR 商品规格（14×14cm / 841 pins）— <https://lindehobby.com/hama-pegboards-1013/hama-large-pegboard-234tr-14x14-cm-transparent-p5389>

**行业工具 / 指南**
6. Stitchmate 拼豆板计算器（公式、100×100=16 板、Hama Mini 2.5mm、+10% 备豆）— <https://stitchmate.app/tools/fuse-bead-pegboard-calculator>
7. pixelbead 板尺寸指南（Perler 各板官方尺寸、841 上限、A4 分页）— <https://pixelbead.art/guides/bead-board-sizes>
8. knytstudio 板尺寸与分板指南（R2-C1 标签、逐块熨再拼）— <https://www.knytstudio.com/blog/pegboard-sizes-bead-counts>
9. Beadify 官网与 FAQ（多板 PDF 为 Pro、10 格=26/50mm 校准、导出格式）— <https://beadify.app/>
10. MyBeadPattern（board lines、29/58/87 预设、页序/坐标延续/50mm 比例条、接缝经验）— <https://mybeadpattern.com/>
11. pindou.art 编辑器 — <https://pindou.art/editor>；价格/大图分页导出 — <https://pindou.art/pricing>

**中文 App / 电商**
12. 爱拼豆 App Store — <https://apps.apple.com/cn/app/%E7%88%B1%E6%8B%BC%E8%B1%86/id6756688364>（美区同款 <https://apps.apple.com/us/app/id6790279541>）
13. 拼豆画 App Store — <https://apps.apple.com/cn/app/id6754833406>
14. 拼豆喵（超好玩应用页）— <https://www.18touch.com/soft/91014.html>
15. 豆猫拼豆（下载站功能介绍，含 52×52/104×104 拆板）— <https://www.dljs.net/adsoft/272963.html>
16. 拼个豆豆 App Store — <https://apps.apple.com/cn/app/id6761034586>
17. 拼豆绘（3DM 应用页，含「分板拼图」）— <https://app.3dmgame.com/android/565467.html>
18. 淘宝「拼豆老手必备神器」聚合页（52/78/104 钉、50×50、49×69=36×26cm、60×120 钉）— <https://guangtao.taobao.com/topic-199218823>
19. 52×52 板尺寸说法（金属丝网公司 SEO 稿，已判定不可信）— <https://b2bwiki.baidu.com/article/718824530367823873>

**截图证据（本次抓取）**
- 爱拼豆 6 张官方截图（项目列表、调色板、编辑器缩放、教学「双指缩放移动画布」、导出双尺寸）
- 拼豆画 3 张官方截图（导出图纸带坐标/红色辅助线、编辑页「双指可放大缩小画布」+ 移动/旋转/翻转）

---

## F. 方法与局限

- 本次调研期间搜索 API 额度耗尽，后半程改用 HTTP 直取（Perler/Artkal/App Store/淘宝聚合页等），因此**部分中文长尾信息（如 78/104 钉板的板外框实测尺寸、Hama mini 孔数）未能闭环**，已在文中标「待核」。
- 淘宝/天猫商品详情页有反爬，尺寸取自**聚合页标题**，板面尺寸多为按节距推算，已标 🟡。
- 「轻图」未能定位到拼豆类产品，未做结论（⚪）。
- 竞品功能以**官方商店描述 + 官方截图**为准；第三方下载站文案（豆猫、拼豆喵）可能存在厂商宣传夸大，已标 🟡。
