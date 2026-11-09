# 拼豆（Perler / Hama / 拼豆）图纸生成与编辑工具 · 竞品功能调研报告

- **调研人**：researcher（调研员，只做调研与写文档，未改动任何代码）
- **调研日期**：2026-11-05
- **调研范围**：英文 / 中文共 ~25 个工具与 App，含网页工具、桌面程序、iOS/Android App、开源项目
- **证据标注约定**
  - ✅ **已查证**：抓到了官方页面 / 官方仓库原文，原文可引用
  - 🟡 **部分查证**：只拿到搜索摘要、第三方对比页、应用下载站描述，或官方页面抓取被拦（会注明）
  - ⚪ **推测**：基于行业常识或我自己的算法推导，**不是**查证事实
- **重要前提（必读）**：本报告的「差距清单」不是按任务书里描述的"只有上传→降采样→匹配→预览/导出"来写的，而是按**当前仓库里 `index.html` 的真实实现**核对后写的。实测当前版本**已经**具备：最近邻/平滑/像素块对齐三种采样、1:1 像素图导出、图纸格子上的画笔/橡皮/油漆桶/取色 + 撤销重做、自动描边（含颜色与粗细）、熨烫后颜色预览（含强度滑杆）、AI 去背景、k-means 限色、Floyd–Steinberg 抖动、多品牌色板、用量清单、含图例 PNG 导出。**差距集中在"算法精度、编辑工具完整度、分板打印、熨烫色数据"四件事上**，详见第 ③ 节。
  - 核对方式：读取 `perler-bead-generator/index.html`，关键函数 `detectPixelBlock()`、`snapSource()`、`ironHexOf()`、`applyOutline()`、`quantize()`、`nearestColor()` 及 UI 面板 "4 · 像素/描边/熨烫"、"图纸编辑" 工具条。
  - 注意：调研过程中该文件行数在变化（1564 → 1723 行），说明有并行修改，因此本报告**只引用函数名与功能名，不引用行号**。

---

## 0. 结论先行（TL;DR）

1. **"1:1 真像素模式"在业界是稀缺能力**：只有少数工具把它做成显式模式（MyBeadPattern 的 **Pixel art mode**、Stitchmate 的 "Pixel art → one pixel per bead"），绝大多数工具默认平滑重采样，像素画导入就被糊掉。**没有任何工具宣传"自动识别原图像素块尺寸"**——这是我们可以做出差异化的点（学术界有成熟方法可抄，见 2.1）。
2. **"直接编辑图纸格子"已是中高端标配**，而且竞争点已经从"有没有画笔"升级到"有没有 **line/shape/text 工具 + 选区移动 + 镜像/对称绘制 + 单色聚焦 + 已放置打勾进度 + 无限撤销**"。我们目前是"画笔/橡皮/桶/取色 + 撤销重做"，属于**入门完整、进阶缺失**。
3. **"自动描边"几乎没有竞品做**（Beadifier / MakeBead / Beadify / Stitchmate / pindou 的官方功能页均无此功能；教程一律教用户手动加 1px 深色边）。我们的描边是**领先功能**，但只做了"外扩光环"一种语义，缺"内描边/只描外轮廓/内孔处理"。
4. **"熨烫后颜色预览"全球只有拼豆阿特（pindou.art）明确做了**（3D 预览可切换"未熨/已熨"，并明确提示"熨后通常略暗"）。**所有工具都没有公开的实测色差数据**，色卡网站自己都说屏幕色是"社区测量的近似值"。→ 谁先做出**按品牌实测的熨烫前后色值表**，谁就拿到一个别人抄不动的卖点。
5. **我们与专业工具最大的硬差距不在"生成质量"，而在"打印交付"**：真实尺寸打印（5mm/2.6mm 节距 + 50mm 校准条）、**分板 / 分张 PDF（每页带页码、坐标、图例）**、SVG/XLSX/CSV 导出、色号↔品牌对照。这些是"能不能真的拿去铺豆子"的分水岭。

---

## ① 工具清单与功能矩阵

### 1.1 工具画像

| # | 工具 | 形态 / 价格 | 状态与定位 | 证据 |
|---|---|---|---|---|
| 1 | **BeadSurge** | Windows 桌面（Unity），免费 | 老牌 beadspriting 工具，社区口碑好但**已停更**；支持 sprite sheet 导入 | 🟡 仓库只有可执行文件，无 README 功能表（[GitHub](https://github.com/surger1/BeadSurge)，[导入 sprite sheet 视频](https://www.youtube.com/watch?v=TQenfZhoZc4)） |
| 2 | **Kandi Pad** | Web（kandipad.com），免费 + 社区 | 目前最活跃的拼豆/pony bead 社区编辑器；有 AI 生成图案；Top Tier Beads 官方合作 App | 🟡 官方页面抓取被拦（HTTP 422），仅得搜索摘要与社媒（[create 页摘要](https://kandipad.com/create)、[AI patterns](https://www.facebook.com/kandipadapp/videos/kandi-pad-ai-patterns-are-here/311135421776436/)、[官方合作](https://www.instagram.com/p/Cu2RCQFpMut/?hl=en)） |
| 3 | **Beadifier** | Web，开源 MIT（Angular） | 老牌开源转换器；**色板最多**（含 2.6mm mini、Perler Caps、Diamond Dotz），可混品牌 | ✅ [GitHub](https://github.com/maxcleme/beadifier)、[在线对比页](https://makebead.com/beadifier-alternative) |
| 4 | **Perler 官方** | Web 商城 | **没有生成器**：只有 500+ 免费项目图纸 + 可下载色卡 PDF + 熨烫教学 | ✅ [perler.com](https://perler.com/) |
| 5 | **Perlypop** | iOS/iPad，付费（约 $10 全解锁） | 移动端体验标杆，照片→图纸 + 绘制 + 购物清单 + PDF | 🟡 [官网](https://perlypop.com/)、[App Store 评价](https://apps.apple.com/us/app/perlypop-perler-beads/id1450794449)、[Beadify 对比页](https://beadify.app/alternatives/perlypop) |
| 6 | **Beads Creator**（OneTap） | iOS + Android，免费/内购 | 日本团队，像素画风编辑，Perler/Hama 等品牌 | 🟡 [Google Play](https://play.google.com/store/apps/details?id=com.onetap.beadscreator)、[官方站](https://onetap.jp/beadscreator/en/) |
| 7 | **Pixel-Beads.net** | Web（德国，个人项目），免费捐赠 | "转换深度"标杆：5 种抖动核 + 5 种色差度量 + CSV 色板 + 8 种打印样式 + Excel 导出；**无编辑** | 🟡 无官方功能页，经第三方逐项对比核实（[对比页](https://makebead.com/pixel-beads-alternative)）、[使用说明](https://www.pixel-beads.net/sites/instruction.html) |
| 8 | **Pixel-Beads.com**（拼豆艺术） | Web + iOS/Android/Chrome 扩展，声称免费 | 2024 年后新项目，中文站做得很完整；生成器 + 画板（画笔/橡皮/取色）+ 社区画廊 + 长教程 | ✅ [中文首页](https://www.pixel-beads.com/zh)、[中文教程页](https://www.pixel-beads.com/zh) 抓取成功 |
| 9 | **MakeBead** | Web，免费 + 免费账号 | 功能最全的"转换 + 编辑器 + 云 + 画廊"组合；11 种语言；分板 PDF | ✅ [对比页原文](https://makebead.com/beadifier-alternative)、[对比页](https://makebead.com/pixel-beads-alternative) |
| 10 | **Beadify** | Web，免费额度 + 订阅（Pro $79/年） | 三段式工作台 Compare / Pattern / Crafting；库存(Stash)、云同步、5 种导出（Image/PDF/SVG/XLSX/JSON）、AI 生成额度 | ✅ [beadify.app](https://beadify.app/)、[Perlypop 对比](https://beadify.app/alternatives/perlypop) |
| 11 | **Stitchmate** | Web + Mac/Win 桌面，免费编辑，PDF $5.99 | 通用"图案编辑器"（十字绣/钻石画/拼豆共用）；brush/fill/line/shape/text + **无限撤销**；≈20 个品牌 4 种尺寸 | ✅ [拼豆页](https://stitchmate.app/fuse-bead-pattern-maker) |
| 12 | **MyBeadPattern** | Web，免费无水印 | 明确区分 **Photo mode / Pixel art mode**；"只用手头豆色"；真实尺寸打印；构建进度 | ✅ [mybeadpattern.com](https://www.mybeadpattern.com/) |
| 13 | **perlerbeads.app** | Web，免费 + Pro | 圆形豆/方形马赛克双风格、**字母色标**、10×10–100×100、4 品牌 | ✅ [generator 页](https://perlerbeads.app/generator) |
| 14 | **拼豆阿特 pindou.art** | Web（中/英），免费 + Pro 订阅 | **唯一有"熨烫/未熨"3D 预览**；选区移动、装配模式、分页 ZIP 导出、社区画廊、云存储 | ✅ [features 页](https://pindou.art/features) |
| 15 | **pindou.fun** | Web，免费 | 带"3D 编辑器 / 分层编辑 / 3D 实时预览"，多色卡 | 🟡 仅搜索摘要（[pindou.fun](https://pindou.fun/)） |
| 16 | **轻图（image.mid-life.vip）** | Web（中文），免费工具站 | 画笔/直线/矩形填充/油漆桶 + 颜色合并阈值 + 横轴切割数 + PNG/PDF(A4 自动分页)/CSV，明确"本地处理不上传" | ✅ [改色编辑页](https://image.mid-life.vip/perler-bead/pindou-bianji-gaise)、[制作指南](https://image.mid-life.vip/help/pindou-tuzhi-zaixian-zhinan) |
| 17 | **豆猫拼豆** | Android/iOS App | 画笔/橡皮/取色/填充/**镜像**/拆分、52×52 豆板自动分割、云同步 | 🟡 下载站描述（[3dmgame](https://app.3dmgame.com/android/560454.html)） |
| 18 | **拼个豆豆 PixDotDot** | Android App | **蓝牙智能拼豆板 LED 引导**、豆仓库存/缺豆预警、对称绘制、单色高亮、离线 | 🟡 下载站描述（[downkuai](https://www.downkuai.com/android/189322.html)） |
| 19 | **画像素拼豆** | Android App | 图层、魔棒、套索、抖动笔、无限撤销重做 | 🟡 下载站描述（[youxiniao](https://m.youxiniao.com/soft/fpfrwx)） |
| 20 | **拼豆喵 / 拼豆助手 / 我嘞个豆 / pixelbeads 图纸生成器** | Android App | 同类：一键转图 + 色号匹配 + 用量统计；拼豆喵宣称"自动识别图片轮廓" | 🟡 下载站描述（[拼豆喵](https://www.18touch.com/soft/91014.html)、[拼豆助手](https://m.996yy.work/apps/3940.html)） |

> 说明：中国区 App 的功能描述几乎只能从应用下载站拿到（官方页多为应用商店壳），🟡 级证据请勿当成硬结论；但"镜像 / 分板 / 库存 / 单色高亮"这些功能在中国区 App 里确实普遍存在，可信度较高。

### 1.2 功能矩阵

图例：**●** 官方文档明确具备 ｜ **◐** 有但受限 / 需付费 / 仅部分场景 ｜ **○** 官方文档未见 ｜ **?** 未能查证

| 功能 | BeadSurge | Kandi Pad | Beadifier | Perlypop | Pixel-Beads.net | Pixel-Beads.com | MakeBead | Beadify | Stitchmate | MyBeadPattern | pindou.art | 轻图 | 我们 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 照片→图纸 | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● |
| **1:1 真像素模式** | ◐ sprite 导入 | ? | ○ | ○ | ○ | ○ | ○ | ○ | ● Pixel art 导入 | ● Pixel art mode | ○（有像素放大器） | ○ | ● 最近邻 + 像素块对齐 |
| 自动识别像素块尺寸 | ○ | ? | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ◐ 起始=源网格 | ○ | ○ | ● `detectPixelBlock` |
| 原图尺寸直出 | ○ | ? | ○ | ○ | ○ | ○ | ○ | ○ | ● | ● | ○ | ○ | ◐ 受宽度上限约束 |
| **图纸格子上编辑** | ○ | ● | ○ | ● | ○ | ● | ● | ● | ● | ● | ● | ● | ● |
| 油漆桶 / 取色 | ○ | ● | ○ | ? | ○ | ● | ● | ● | ● | ● | ● | ● | ● |
| 直线/形状/文字工具 | ○ | ? | ○ | ? | ○ | ? | ○ | ○ | ● | ○ | ◐ 选区移动复制 | ● 直线/矩形填充 | ○ |
| 选区移动/复制 | ○ | ? | ○ | ? | ○ | ? | ○ | ○ | ○ | ○ | ● | ○ | ○ |
| 镜像 / 对称绘制 | ○ | ● 实时镜像 | ○ | ? | ○ | ? | ○ | ○ | ○ | ○ | ○ | ○ | ○ |
| 撤销/重做 | ? | ● | ○ | ? | ○ | ● | ● | ● | ● 无限 | ● 100 步 | ● | ● 无限 | ◐ 栈式 |
| 单色聚焦 / 已放置打勾 | ○ | ○ | ○ | ? | ○ | ○ | ○ | ● Crafting | ● 进度 | ● build-along | ● 装配模式 | ○ | ○ |
| **自动描边** | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ● |
| **熨烫后颜色预览** | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ● 3D 未熨/已熨 | ○ | ● 2D 强度滑杆 |
| 抖动 | ? | ? | ● 含 hardness | ? | ● 5 核 | ? | ● 6 核 | ? | ? | ◐ Classic/Detail | ● | ◐ 颜色合并 | ● FS 单核 |
| 色差度量 | ? | ? | ● 3 种含 CIEDE2000 | ? | ● 5 种含 CIEDE2000 | ? | ● 5 种含 CIEDE2000 | ? | ? | ? | ? | ◐ 最近邻 RGB | ● RGB 欧氏 |
| 限色数 | ? | ● | ● | ? | ● 两种量化 | ● | ● | ● | ● | ● Max colors | ● | ● 合并阈值 | ● k-means |
| 多品牌色板 | ● | ● | ● 15 套 | ● | ● 5 品牌 | ● 4 品牌 | ● 5 品牌 | ● 4 品牌 | ● ≈20 品牌 | ● 5 品牌 648 色 | ● | ● MARD 291 | ● 多品牌 |
| 豆子用量清单 | ● | ● | ● | ● | ● | ● | ● 含袋数与成本 | ● 含成本估算 | ● | ● | ● | ● | ● |
| 分板 / 分张打印 | ? | ○ | ● 多板布局 | ? | ◐ 8 打印样式 | ? | ● 每板分页 PDF | ● 多板 PDF Pack | ● 分页 + 分区图 | ● 板线 | ● A4 分页 ZIP | ● A4 自动分页 | ○ |
| 真实尺寸打印（5mm/2.6mm） | ○ | ○ | ○ | ○ | ● mm 单元格 | ○ | ○ | ● 100%/实际大小 | ● | ● + 50mm 校准条 | ● 真实节距 | ○ | ○ |
| 导出格式 | PDF/PNG | 图片 | PDF/PNG/JPEG/SVG/XLSX | PDF | PDF/Excel | PNG | PDF/PNG | Image/PDF/SVG/XLSX/JSON | PNG / PDF | PNG / PDF / 链接+二维码 | PNG / PDF / ZIP | PNG/PDF/CSV | PNG（含图例）+ 1:1 PNG |
| 账号 / 云存储 | ○ | ● | ○ | ○ | ○ | ? | ● | ● 同步 | ○ | ○ | ● 20/500 | ○ | ○ |
| 多语言 | ○ | ◐ | ○ 仅英文 | ○ | ◐ EN/DE | ● 中英 | ● 11 种 | ◐ | ○ | ○ | ● 中英 | ● 中文 | ◐ 中文 |
| 社区画廊/分享 | ○ | ● | ○ | ○ | ○ | ● | ● | ● | ○ | ● 链接+QR | ● | ○ | ○ |
| 背景移除 / AI 抠图 | ○ | ● AI 生成图案 | ○ | ○ | ○ | ? | ○ | ● AI 额度 | ○ | ○ | ○ | ◐ 配套工具 | ● 智能去背景 |

**矩阵读法（3 个关键结论）**
- 表格里 **"自动描边"整行只有我们一个 ●**；**"熨烫预览"只有 pindou.art（3D）和我们（2D）**。这两项是当前的差异化资产，值得继续加厚而不是推倒重做。
- 表格里 **"分板打印 / 真实尺寸打印 / 导出格式" 我们整行最弱**，这是最容易补、且用户最能感知的差距。
- "1:1 真像素"这一行里，真正把它做成**一等公民**（显式模式 + 官方文案）的只有 MyBeadPattern 与 Stitchmate；BeadSurge 只是支持 sprite sheet 导入（🟡）。

---

## ② 四个重点功能的业界做法（含算法与参数，可抄）

### 2.1 真像素 / 1:1 点阵模式

#### 业界现状（查证）
- **MyBeadPattern** 把两条路径写进 FAQ，是全行业最清楚的一句话：`Photo mode` 会平滑重采样；`Pixel art mode` **从源网格起步（32×32 的图标就产出 32×32 的图纸），缩放用最近邻硬边，绝不模糊、绝不抖动** ✅（[mybeadpattern.com](https://www.mybeadpattern.com/)）。它还提供 5mm/2.6mm 真实节距与 29/58/87 三种板宽预设。
- **Stitchmate**：导入时可选择 "Pixel art"，语义是 **"one pixel per bead"（一个像素 = 一颗豆）**，导入后进编辑器继续改 ✅（[stitchmate.app](https://stitchmate.app/fuse-bead-pattern-maker)）。
- **BeadSurge** 有 "Sprite sheet 导入"（能切 sprite sheet 帧），说明它理解"一个像素=一颗豆"的语义，但没有官方功能文档 🟡。
- **拼豆阿特 pindou.art** 没有 1:1 模式，但单独做了 **"像素图放大器"（1–20 倍，保持像素风）** ✅（[features](https://pindou.art/features)、[放大器页](https://pindou.art/pixel-art-upscaler)）。这反证：用户确实有"先把像素画放大再转图纸"的痛点。
- 其余工具（Beadifier / Pixel-Beads.net / MakeBead / Beadify / Pixel-Beads.com）官方文档里**都只有"宽度/色数/抖动"这些参数，没有像素模式**（✅ 见各自对比页与功能页），默认走平滑重采样 → **像素画导入会糊边、产生不存在的过渡色**。

#### 三种可抄的实现路线
**路线 A：双模式（推荐，成本最低）**
```
Photo 模式：面积平均（box filter）+ 可选抖动      ← 现有 average 分支
Pixel 模式：关闭 imageSmoothing → 中心/众数采样 → 不抖动   ← 现有 nearest 分支
```
关键细节：`ctx.imageSmoothingEnabled = false` 只保证"不插值"，但 `drawImage` 缩小时浏览器仍按实现采样。**更稳的做法是自己算**：对每个目标格，取源图对应矩形内**出现次数最多的颜色**（majority vote，对像素画最忠实）或**中心像素**；只有非整数缩放比才需要 majority。MyBeadPattern 的"绝不模糊、绝不抖动"就是这条。

**路线 B：自动识别像素块尺寸（我们的 `detectPixelBlock` 已走这条，但可显著加强）**
- 我们现在的做法（`detectPixelBlock`）：候选 `s ∈ [2, min(64, min(w,h)/4)]`，每个 s 抽样最多 24×24 个块，块内按 `step = max(1, s/4)` 采样求 RGB 极差，`spread > 26` 记为坏块，**取"坏块率 ≤ 8%"的最大 s**；命中后 `snapSource` 把每块取平均还原成原生像素图。
- **缺陷 1（会误判）**：取"最大合格 s"在大片纯色区域会一路通过（比如 8×8 纯色也能通过 s=8 的检验），导致 s 被高估、细节被吃掉。**改法**：改成"**最小合格 s**"或对合格 s 集合做"倍数剔除"（若 s 与 s' 都合格且 s 是 s' 的倍数，取小者）。
- **缺陷 2（上限太低）**：`maxS = 64`，一张 4000px 的像素画（块宽 100）检测不到。
- **缺陷 3（取平均引入混色）**：`snapSource` 对块内取平均，块边界若含抗锯齿像素会被拉脏。**改法**：取**块中心像素**或**块内众数**。
- **业界/学术上更硬的两种算法（可直接实现，无需依赖）**：
  1. **run-length + GCD**：逐行统计"连续同色段长度"直方图，对高频长度取 GCD；再对列方向做一次，取两者 GCD 的中位数作为块宽 s。对"整齐放大"的像素画又快又准。
  2. **梯度投影自相关**：算 `Gx(x) = Σ_y |I(x,y) − I(x+1,y)|`、`Gy(y)` 同理；块边界处梯度出现周期性峰值，对 `Gx` 做自相关，第一个显著峰的位置 = 块宽。这正是开源项目 spritegrid 的思路（"Gradient Analysis — computes horizontal and vertical gradient profiles"）✅（[spritegrid](https://github.com/marksverdhei/spritegrid)）。
  3. 学术参考：**《Structure-Aware Pixel Art Scaling via Block Size Detection》**（MDPI Applied Sciences, 2026）明确做"检测像素画的固有块尺寸并还原到原始单位网格" ✅（[MDPI](https://www.mdpi.com/2076-3417/16/5/2314)）——如果要写论文级实现可以照这篇的流程，工程上用 run-length/GCD 就够。

**路线 C：原图尺寸直出（1 图元 = 1 豆，不做任何缩放）**
- 交互：按钮"按原图像素 1:1 对齐"（我们已有），但需要三件事：① 明确显示 `网格 W×H`（豆）与 `= 需要 N 块标准板`；② 给出**豆数与成本警告**（上百×上百 = 上万颗豆）；③ 允许"裁剪 + 1:1"组合，避免整张照片直出。
- 上限参考：拼豆阿特免费 300×300 / Pro 500×500 ✅；MyBeadPattern 生成器 10–116 宽 ✅；perlerbeads.app 10×10–100×100 ✅。→ **直出模式必须带上限与板数提示，否则用户体验会崩**。

#### 抄什么（给我们的行动项）
1. 像素块检测换成 **run-length/GCD 或梯度自相关**，并把 `snapSource` 从"块内平均"改成"块中心/众数"。
2. Pixel 模式默认**关抖动**（现在抖动是全局开关，容易在像素模式下误开）。
3. 加"1:1 直出"的**板数/豆数/成本提示**，并把宽度上限从 150 提到可配（192/256），否则直出常被截断。

---

### 2.2 图纸上的直接编辑

#### 业界做法（查证）
| 工具 | 编辑能力（官方文案） |
|---|---|
| **Stitchmate** | `Brush, fill, line, shape and text tools with unlimited undo` ✅ —— 属于"通用像素编辑器"级别 |
| **MakeBead** | 完整编辑器：`paint, erase, fill, replace, undo` + **可叠加原图对照**在编辑时 ✅ |
| **Beadify** | Pattern 工作台可改单颗豆、按库存过滤色板；**Undo/Redo 在 Pattern 阶段始终可用**；另有 Crafting 工作台做"单色聚焦 + 打勾" ✅ |
| **MyBeadPattern** | `Paint, erase, flood-fill and pick colors right on the board`，撤销 **100 步**；另有 build-along 进度（空格键打勾）✅ |
| **pindou.art** | 画笔/橡皮/桶填/取色/**选区可整体移动或复制**；另有"装配模式"（高亮当前色、逐格打勾、本地存进度）✅ |
| **Pixel-Beads.com** | 左侧画笔/橡皮/取色器 + 右侧色板，支持拖拽连续绘制 ✅ |
| **轻图** | 画笔（1×1 方笔拖拽）、直线、矩形填充、油漆桶、滚轮缩放 ✅ |
| **Kandi Pad** | 编辑器 + **Symmetry Mirroring（垂直/水平实时镜像，可拖参考线）** ✅（仅搜索摘要） |
| **豆猫拼豆** | 画笔/橡皮/取色/填充/**镜像**/拆分 + 图层合并 🟡 |
| **画像素拼豆** | **图层**、魔棒、套索、抖动笔、无限撤销重做 🟡 |
| **拼个豆豆** | 对称绘制、单色高亮预览、翻转 🟡 |

#### 值得抄的 5 个设计决策
1. **"自动量化结果"与"手工编辑"必须分离存放**（我们已是 `autoIdx + manualEdits`）。关键坑：**重新生成/改色板/改色数时，手工编辑如何映射？** 我们现在的 `rebuildState()` 是"手动色号 → 映射到新色板最近色"。"最近色"可能跳到另一种色系。**更强做法（Beadify/MyBeadPattern 隐含做法）**：编辑记录存"**角色语义**"（该格是"描边/主色/高光"），重新生成时按角色重新求解；或至少提示"改色板会重映射 N 处手工修改，是否继续"（MyBeadPattern 的文档明确警告："later palette changes can remap corrections"）。✅
2. **单色聚焦（Focus color）**：一次只高亮一种颜色，其余压灰；这是大图铺豆的刚需（Beadify / pindou / 拼个豆豆都有）。
3. **已放置打勾（build-along）**：点/空格标记已摆，进度条 + 剩余时间估算（Stitchmate 甚至算"还要几个晚上"）✅。存储用 localStorage 即可。
4. **镜像/对称绘制**：垂直/水平实时镜像 + 可拖动参考线（Kandi Pad）。实现成本极低（画一格同时写镜像格），收益高（人物/翅膀/对称图标）。
5. **工具键位与"笔刷尺寸"**：我们已有 1–4 格笔刷；专业工具普遍还有 line/rect/ellipse/text。**line 与 rect 是最容易补、最提升"专业感"的两个**（实现：Bresenham + 实时预览图层）。

#### 算法/实现要点
- **油漆桶**：4 邻域 flood fill（图案边界为不同色号即停止），对"空格 `-1`"也要能填 → 注意"空格"既可能是"透明背景"也可能是"用户故意留空"，UI 上要区分（我们是斜纹格）。
- **撤销**：我们的 `gridUndoStack` 存 Map 快照。**成本估算**：150×150=22500 格，一次全量快照约 45KB（Int16），100 步 ≈ 4.5MB，可接受；但 500×500 就 500KB/步 → 应改**差量补丁（记录 (index, oldIdx, newIdx) 列表）**，这是无限撤销的正确做法。
- **镜像绘制**：`mirrorX = gridW-1-x`、`mirrorY = gridH-1-y`，四个镜像位一起写；撤销时四个位一起进补丁。
- **编辑与抖动的冲突**：抖动是量化阶段产物，手工编辑后的格子不应再被抖动重算。→ 我们的 `manualEdits` 优先级必须高于 dither，需确认代码里 `rebuildState` 在 dither 之后套用（按现有结构应该是，但建议加一条"编辑过的格子不参与重抖动"的断言测试）。

---

### 2.3 自动描边（outline / stroke）

#### 业界现状（这条最容易误判，先说结论）
- **没有任何一款主流工具在官方功能页里写"auto outline / 自动描边"**：Beadifier（✅ 官方 README 5 条功能无描边）、MakeBead（✅ 对比页功能表无）、Beadify（✅ 官网三大工作台无）、Stitchmate（✅ 功能页无）、pindou.art（✅ features 页 8 项无）、Pixel-Beads.com（✅ 教程页工具仅画笔/橡皮/取色）、轻图（✅ 仅画笔/直线/矩形/桶填）。
- **行业通行做法是"教用户手动加一圈深色边"**：`If the outline is unclear, add a one-pixel border in a darker shade of the main color` ✅（[beadpattern.net](https://beadpattern.net/beadpattern-advanced-editing-tricks)）；"先画轮廓、再用一个深色描边、一个亮色做高光" ✅（[perlerbeadai FAQ](https://perlerbeadai.com/faq/how-to-design-your-own-perler-bead-patterns/)）；"add one darker color for the outline"。
- 唯一宣称"自动识别图片轮廓"的是国产 App **拼豆喵** 🟡（下载站描述，无法验证是"真描边"还是"仅边缘检测辅助"）。
- **结论：我们的自动描边是领先功能，但只有一种语义（外扩光环），需要补另两种。**

#### 三种描边语义（业界像素画/贴图工具的通用分类，⚪ 我的归纳）
| 语义 | 定义 | 视觉结果 | 豆数 | 我们 |
|---|---|---|---|---|
| **A. 外扩光环（outer halo）** | 把**紧贴图案的空格**染成描边色，宽度 w 格 | 图案外多一圈深色边，主体不变 | **+** 增加（尺寸 +2w） | ✅ 已实现 |
| **B. 内描边（inner contour）** | 只把**图案最外圈的豆**改成描边色，尺寸不变 | 像"先画轮廓再填色"的像素画 | **不变** | ○ 缺 |
| **C. 只描外轮廓 / 内孔可选** | 先判定"外部背景"（从网格四边 flood fill），只对与外部背景相邻的边界描边；内部小孔可选择描或不描 | 避免把脸上的小孔、衣服的洞也描黑 | 视 w | ○ 缺（我们目前内孔也描） |

#### 我们现有实现（`applyOutline`）的准确描述与改进点
- 现状：8 邻域 BFS 距离变换。先把所有"与任意非空格 8 邻接"的空格标 `dist=1`，再逐层外扩到 `outlineW`（1–3），最后 `g[i] = outlineColor`。颜色可选"色板里最深的颜色"或指定色号。
- **优点**：O(n)、多格粗、8 邻域让斜角连续（4 邻域会出现菱形断点）。
- **缺点/改进**：
  1. **没有"内孔开关"**：眼睛、镂空、字母 O 的内孔都会被外扩描边填掉一部分 → 加一个"是否描内孔"复选框；实现：`外部背景` = 从网格四边做 flood fill 得到的连通背景；`dist=1` 的种子只取"与外部背景连通"的空格。
  2. **没有"不外扩"选项**（语义 B）→ 实现：对每个前景格，若 8 邻域里有背景格 → 轮廓层 1；要 w>1 就在前景内部做 w−1 次**腐蚀（erosion）**，用"前景 − 腐蚀^k(前景)"得到第 k 圈。8 邻域腐蚀 = 切比雪夫距离，视觉更圆；4 邻域 = 曼哈顿，视觉更方。
  3. **描边色"自动=最深色"不够好**：纯黑在浅色图案上很硬。建议给三档：`最暗色` / `主色×0.55（压暗）` / `与相邻主色 ΔE 最大的色板色`（用 Lab 计算），并允许"仅描外圈时用相邻格主色压暗"——这是像素画美术的常见做法。
  4. **描边后要参与用量统计与板数重算**：我们 `applyOutline` 写在 `rebuildState` 里、在 `manualEdits` 之前，需确认描边后用量/板数/图例都会刷新（大概率会，但要加回归测试）。
  5. **性能**：150×150 全图 BFS 每次参数变动都重跑，没问题；但 500×500 + 拖滑杆实时预览会卡 → 加 100ms debounce。

---

### 2.4 熨烫（熔珠）后颜色预览

#### 业界现状（这是全篇最"空"的一块，也是最大的机会）
- **唯一明确实现**：拼豆阿特 pindou.art 的 **3D 预览**，"可在**未熨 / 已熨**两种状态间切换"，官方同时给了最有价值的一句免责声明：**"预览是近似，不模拟真实光照与豆子光泽，**熨烫后的作品通常颜色会略暗一些**"** ✅（[pindou.art/features](https://pindou.art/features)，FAQ 原文 `ironed pieces usually come out slightly darker` / 中文页 `ironed colors are usually slightly darker`）。
- 其余全部工具：**没有熨烫后预览**（Beadifier/MakeBead/Beadify/Stitchmate/MyBeadPattern/Pixel-Beads/轻图 官方功能页均无）。
- **定性描述（可引用，但无数据）**：
  - 色卡站明确承认："豆子颜色在不同批次之间、**熨烫前后看起来都不同**，下单前请拿实物确认" ✅（[craftpatterns.app 色卡页](https://craftpatterns.app/colors/perler/)）。
  - 色板数据的性质：MyBeadPattern 直接写"屏幕色是**社区测量的近似值**（community-measured approximations）" ✅（[mybeadpattern.com](https://www.mybeadpattern.com/)）——即：**没有一家工具拥有权威的"烤后色"数据**。
  - 物理机制（教程级事实）：拼豆材质是 **LDPE，熔点 105–115 °C**；不同颜色吸热速度不同（**黑/深色快，白/透明慢**）→ 局部熔化不均 ✅（[pixel-beads.com 中文教程](https://www.pixel-beads.com/zh)，引用 Perler 官方熨烫方法）。
- **结论：不要去找"业界参数"，没有。要做就自己做实测，这是唯一能建立壁垒的路径。**

#### 物理上"烤完为什么会变色"（⚪ 我的归纳，用于设计模型）
1. **几何**：圆柱被压扁 + 中心孔闭合 → 单位面积反射率上升，**深色变亮**、**浅色略暗**（向中间灰收敛，即对比度压缩）。
2. **表面**：助烫纸给出哑光、熨烫膜给出高光；高光会让饱和度看起来**下降**、亮度局部**上升**（镜面反射叠加）。
3. **半透明化**：LDPE 熔融后结晶度变化，浅色/透明豆会更"透"，与底板/相邻色混色。
4. **热历史**：过熨（温度过高/时间过长）→ 更扁更亮更透；欠熨 → 几乎不变。**所以"熨烫强度"这个滑杆在物理上是合理的抽象**（我们已有 0–100%）。

#### 我们现有实现（`ironHexOf`）与改进建议
现状公式（`t = ironStrength/100`，`k = clamp(t)`）：
```
sat  = 1 - 0.10k            // 饱和度略降
flat = 0.12k                // 对比度压缩（向 0.5 收敛）
rgb  = lum + (rgb-lum)*sat
rgb  = 0.5 + (rgb-0.5)*(1-flat)
rgb  = rgb*0.96 + 0.015     // 整体略暗 + 抬黑位
```
评价：方向完全正确（对比度压缩 + 饱和下降 + 略暗 + 抬黑位），**是业内少见的正确抽象**；问题在"**一颗系数打天下**"：
- 白色/透明豆熨后应该**变暗**（我们的 ×0.96 对了），但黑色豆熨后常**发灰发亮**（我们的 ×0.96 也让它更暗 → **错**）。
- 荧光色/金属色/珠光色行为完全不同（色板里若有这些色号，应单独分组）。
- 缺少**逐颗豆的高光**：真实熔珠每颗都有一个镜面高光点，这是"像不像烤完"的关键视觉线索。做法：绘制时对每颗豆叠加一个径向渐变（`rgba(255,255,255,0.18)`，中心偏左上，半径 ~0.35 格），仅在 ironOn 时叠加，**不改变色号数据**（只影响预览渲染与导出图）。
- 缺少**非线性**：`k` 用线性，实际应是 `k^0.7`（前 30% 变化快，后段趋缓）。

**建议的 v2 模型（可直接实现）**
```js
// 分组系数：按色板色的 L* 与饱和度分支
const L = labL(rgb);                 // 0..100
const isDark  = L < 25;              // 黑/深色：熨后发灰发亮
const isLight = L > 88;              // 白/透明/浅色：熨后变暗变透
let dl = 0;                          // 明度偏移
if (isDark)  dl = +3.5 * k;          // 抬亮
else if (isLight) dl = -4.0 * k;     // 压暗
else dl = -1.0 * k;                  // 中间调微暗
// 对比度压缩（向中灰收敛）
const flat = 0.14 * Math.pow(k, 0.7);
// 饱和度：高饱和降得多，低饱和几乎不变
const dSat = -0.12 * k * (chroma(rgb) / 60);
// 叠加：LCh → 回 RGB，再乘 0.99 防止溢出
```
再叠加"每豆高光"渲染层，观感会明显更接近实物。

#### 实测校准方案（P1，可做成独家数据）
1. 取 Perler / Hama / Artkal / MARD 各一套**全色卡**，按色号贴在同一块板上（或分批），固定 D65 光源 + 灰卡 + 手机三脚架固定机位；
2. 拍"未熨"→ 覆盖助烫纸中温熨 8–10 s → 冷却压平 → **同机位**拍"已熨"；
3. 用灰卡做白平衡，转 Lab，计算每色 `ΔL*, Δa*, Δb*, ΔE00`；
4. 拟合：全局 `ΔL = a·k + b`、`ΔC = c·k^p`，残差按色系（红/黄/蓝/绿/黑/白/透明/荧光）建表；
5. 输出 `palettes.js` 的 `iron: {dL, dC, dH}` 字段 + 一个 `ironPreset`（哑光/亮面/过熨）；
6. 页面标注"实测 N=xxx 色，样本日期，误差范围" —— **这句话本身就是竞品没有的可信度**。

---

### 2.5 其他常见功能的业界要点（补全视角）

- **抖动 dithering**：行业标准是"多核可选"——Beadifier 有 `dithering with hardness`（可调强度）🟡/✅；Pixel-Beads.net 与 MakeBead 都是 **Floyd–Steinberg / Atkinson / Sierra / Stucki / Burkes / none 六选一** ✅；MakeBead 另称"同样的 5 个核"。→ 我们只有 FS 一种，**至少补 Atkinson（像素画常用，对比更硬）与 none**。抖动的正确做法是在 **Lab 域**扩散误差（image2pixel 的宣传点就是 "LAB Floyd–Steinberg"），RGB 域会在暗部产生偏色。
- **色差度量**：Beadifier 3 种（Euclidean / CIE94 / CIEDE2000）、Pixel-Beads.net 5 种（含 CIE76）、MakeBead 5 种 ✅。**CIEDE2000 几乎成了中高端分水岭**；我们只有加权 RGB 欧氏 → 肤色/渐变匹配明显吃亏（这是最容易感知的质量差距）。
- **限色**：典型两派——① k-means（我们）；② 频率法/中位切分 + "合并阈值"（轻图叫"颜色合并"，越高越少色）✅。真实用户诉求是"**我手上有多少色就限制多少色**"，所以"限色 + 只用手头色（MyBeadPattern 的 My bead box / Beadify 的 Stash / pindou 的常用色板）"是同一族功能，**竞品普遍提供"排除我没有的色号"**，我们只有"数量上限"。
- **分板 / 分张打印**：pindou.art 最完整——"沿格线切分，每页保留图例、坐标、页码，打包 ZIP，A4 按真实节距（2.6mm/5mm）" ✅；Beadify Pro "multi-board PDF Pack"；Stitchmate PDF 含 `cover / section map / instructions with fusing tips / color key / chart pages`，可改纸张与版式 ✅；Beadifier "multi-board layouts"；MyBeadPattern 提供板线 + 50mm 校准条 ✅（"print at real bead size"）。
- **大小/板数计算**：标准中号板 29×29（Perler/Hama midi），58=2 板、87=3 板横排（MyBeadPattern 预设）✅；Stitchmate 还提供 pegboard calculator ✅。
- **镜像**：pixel-beads.com 有专文解释"为什么很多拼豆图纸需要先镜像"（熨烫翻面/贴板方向）✅（[blog 索引](https://www.pixel-beads.com/blog)）；Kandi Pad 实时对称绘制、豆猫有镜像 🟡。
- **亮度/对比度**：没有工具把它做成显式滑杆，而是用"风格预设"替代——MyBeadPattern 的 `Cartoon / Classic / Detail`（Detail 带抖动）✅；Beadify 的 `Crop, shape and adjust the source` ✅。→ 我们若要加，做成"预处理三滑杆（亮度/对比度/饱和）+ 自动对比度"即可，成本低。
- **导出格式**：Beadifier `PDF/PNG/JPEG/SVG/XLSX` ✅、Beadify `Image/PDF/SVG/XLSX/JSON` ✅、pixel-beads.net `PDF/Excel` ✅、轻图 `PNG/PDF/CSV` ✅。→ **CSV 用量表 + PDF 是最小集合**，SVG 是"专业用户"信号。
- **多语言**：MakeBead 11 种 ✅、pixel-beads.net EN/DE、pindou 中英。→ 我们是中文单语，考虑到小红书/淘宝用户为主，中文优先没问题；若要出海再加 en。
- **账号云存储**：pindou 免费 20 / Pro 500 ✅、Beadify 云同步 ✅、MakeBead 免费云 ✅。→ 我们的"纯本地、图片不上传"是**隐私卖点**，不建议学他们做云；用 localStorage 存草稿/多项目即可（pindou 的本地草稿体验可参考）。
- **AI**：Kandi Pad 是"文本提示生成图案" ✅（社媒）；Beadify 是"AI credits 生成图"、还有 AI 抠图额度；抠图本身通常外挂（pindou/轻图 走本站其它工具）。我们已有"智能去背景"，属于**对齐而非领先**，建议加"结果可手动修补（画笔在蒙版上加减）"。

---

## ③ 对我们项目的差距清单（按 P0 / P1 / P2）

> 判定依据：`index.html` 当前实现 vs 上表竞品。**"我们已有"的功能不列**（采样三模式、1:1 导出、描边、熨烫预览、图纸编辑、去背景、FS 抖动、k-means 限色、多品牌、用量、含图例 PNG 都已存在）。

### P0 —— 不补就会明显"不够专业"（用户能一眼感知）

| # | 差距 | 竞品参照 | 具体做法 | 预估 |
|---|---|---|---|---|
| P0-1 | **色差度量只有 RGB 欧氏** | Beadifier/MakeBead/Pixel-Beads.net 均提供 CIEDE2000 | `sRGB→Lab`，实现 `deltaE2000()`（约 80 行，无依赖），默认启用 CIEDE2000，保留"快速 RGB"给低端机 | S |
| P0-2 | **抖动只有 Floyd–Steinberg** | 六核标配 + `hardness` 强度 | 加 `none / Atkinson / Sierra / Stucki / Burkes`，误差扩散改在 Lab 域；加"抖动强度 0–100%" | S |
| P0-3 | **没有 PDF / 分板分张打印** | pindou A4 分页 ZIP、Beadify multi-board PDF、Stitchmate 分区图+图例 | 加"打印模式"：A4 横向、每页 N×M 格、页边含页码/行列号/图例/50mm 校准条；用 `window.print()` + 打印 CSS（无需 PDF 库），或 canvas 拼页导出 PNG | M |
| P0-4 | **没有真实尺寸打印** | MyBeadPattern 5mm/2.6mm + 50mm 校准条；pindou 真实节距 | 打印 CSS 用 `mm` 单位：`--pitch: 5mm | 2.6mm`；页脚放 50mm 校准条 | S |
| P0-5 | **编辑工具只有 4 个** | Stitchmate brush/fill/**line/shape/text**；pindou 选区移动复制；Kandi Pad 实时镜像 | 至少补 **直线 + 矩形 + 椭圆 + 镜像绘制**（Bresenham / 扫描填充 / 四向镜像），全部走"预览层 + 松手提交"以免污染撤销栈 | M |
| P0-6 | **撤销是快照栈，深图会爆内存** | Stitchmate 无限撤销、pindou 无限 | 改**差量补丁** `[{i, old, new}]`，上限 200 步；格子编辑与"重新生成"分开压栈 | S |
| P0-7 | **熨烫预览无实测依据**，且深色/白色行为反了 | pindou 只用一句"略暗"；无人有数据 | 按 2.4 的 v2 模型分组（深色抬亮/浅色压暗/中间微暗）+ 每豆高光层；文案明确"近似，非实测" | M |
| P0-8 | **像素块检测会高估 s、且 s>64 失效** | MyBeadPattern "绝不模糊" | 改"最小合格 s + 倍数剔除"或 run-length/GCD；`snapSource` 改取块中心/众数 | S |

### P1 —— 决定"好用/愿意长期用"

| # | 差距 | 竞品参照 | 具体做法 |
|---|---|---|---|
| P1-1 | 无**单色聚焦**与**已放置打勾** | Beadify Crafting、pindou 装配模式、Stitchmate 进度、MyBeadPattern build-along（空格键打勾） | 画布层：选中色 → 其余 `opacity .25`；点击/空格 toggle 已放置；localStorage 存进度；显示"已完成 x/y（z%）" |
| P1-2 | 无**原图叠影对照** | Beadify Compare、MakeBead overlay | 预览画布叠一张半透明原图（可拖透明度 0–60%），快捷键切换 |
| P1-3 | 限色只有 `k-means 数量`，无**合并阈值**与**只用手头色** | 轻图"颜色合并"、MyBeadPattern "My bead box"、Beadify Stash | ① 色板每色加 checkbox（"我没有这色"），匹配时跳过；② 加"相似色合并阈值"（ΔE < t 合并到更常用色） |
| P1-4 | 无**孤立杂色清理** | beadpattern.net 的 "merge threshold / 小于指甲盖的簇应删掉" | 一键"清理小于 N 格的连通块"（N=1/2/3），转成邻域主导色或空格；这是大图提速神器 |
| P1-5 | 描边只有"外扩"一种语义 | 无竞品（教程教"手动内描"） | 加 `内描边 / 只描外轮廓（外部背景 flood fill）/ 是否描内孔 / 4 or 8 邻域`；描边色加"主色压暗 45%"与"ΔE 最大"两档 |
| P1-6 | 无**镜像整图**与**翻转** | 豆猫/拼个豆豆；pixel-beads 专文说明为何需要镜像 | `flipH/flipV` 一键，作用在 `stateIdx` 层（并区分"仅预览镜像"vs"真改图"） |
| P1-7 | 导出只有 PNG | Beadifier SVG/XLSX、轻图 CSV、Beadify JSON | 加 **CSV 用量表**（色号,名称,hex,数量）与 **JSON 工程文件**（可回导），PNG 加"符号/字母编码"选项 |
| P1-8 | 无**亮度/对比度/饱和**预处理 | MyBeadPattern 风格预设、Beadify adjust | 三个滑杆 + "自动对比度"（1%/99% 分位拉伸），在降采样前作用 |
| P1-9 | 无**多品牌色号对照/转换** | Stitchmate 转换表、stitchmate/perler 转换工具 | Perler↔Hama↔Artkal↔MARD 最近色对照表（可离线内联），用于"这个色号没货，换哪个" |

### P2 —— 加分项 / 差异化

| # | 差距 | 参照 | 说明 |
|---|---|---|---|
| P2-1 | 无**熨烫色实测数据** | 全球空白 | 按 2.4 的实测方案做 1–2 个品牌，生成 `iron` 字段，做"实测"徽章 —— **最强护城河** |
| P2-2 | 无 3D 预览 | pindou 3D（未熨/已熨切换） | 成本高（three.js 或 canvas 手写等轴测），可作为长期项；先用"2D + 每豆高光"逼近 |
| P2-3 | 无**分享链接/二维码** | MyBeadPattern 分享链接+QR、pindou 社区 | 纯本地定位下可做"URL 内嵌压缩网格"（LZ + base64），无需后端 |
| P2-4 | 无**多语言** | MakeBead 11 语言 | 中文优先；出海时再抽 i18n 字典 |
| P2-5 | 无**模板库/示例图** | MyBeadPattern 模板、kandipad 画廊 | 内联 10–20 个 SVG 小图当"示例"，提升首屏体验 |
| P2-6 | 无**进度/多项目草稿** | pindou 本地草稿、Beadify 项目文件夹 | localStorage 多槽位 + 自动保存 |
| P2-7 | 无**成本估算** | Beadify/MakeBead 袋数+成本 | 按"每袋 1000 颗 / 单价"算需买几袋，做"购物车" |

### 一句话优先级建议
> **先做 P0-1/2/8（算法精度，1–2 天，质量提升最明显）→ P0-3/4（打印，1–2 天，交付能力从 0 到 1）→ P0-5/6（编辑完整度）→ P0-7+P1-5（把"描边 + 熨烫"这两个独家功能做扎实）→ P2-1（实测数据，建立壁垒）。**

---

## ④ 来源列表

### ✅ 已查证（抓到官方页面/仓库原文，可作为事实引用）

| 来源 | 用途 |
|---|---|
| [mybeadpattern.com](https://www.mybeadpattern.com/) | Photo mode vs **Pixel art mode**（"starts at the source grid… crisp nearest-neighbor edges — never blurred, never dithered"）；648 色 5 品牌；My bead box；true-size 打印 + 50mm scale bar；build-along；100 步撤销；"community-measured approximations" |
| [stitchmate.app/fuse-bead-pattern-maker](https://stitchmate.app/fuse-bead-pattern-maker) | brush/fill/line/shape/text + unlimited undo；Pixel art 导入 = one pixel per bead；≈20 品牌 4 尺寸；PDF 结构（cover/section map/instructions/color key/chart）；pegboard calculator |
| [pindou.art/features](https://pindou.art/features) | 像素编辑器（画笔/橡皮/桶填/取色/**选区移动复制**）；**3D 预览可切换未熨/已熨 + "ironed pieces usually come out slightly darker"**；装配模式；A4 分页 ZIP 真实节距；免费 300×300 / Pro 500×500；云 20/500 |
| [perlerbeads.app/generator](https://perlerbeads.app/generator) | 圆形豆/方形马赛克双风格、字母色标、10×10–100×100、Hama/Perler/Artkal/Nabbi |
| [beadify.app](https://beadify.app/) · [Perlypop 对比](https://beadify.app/alternatives/perlypop) | Compare/Pattern/**Crafting** 三工作台；Stash 库存；多板 PDF；Image/PDF/SVG/XLSX/JSON；AI 额度；Perlypop 功能侧写 |
| [makebead.com/beadifier-alternative](https://makebead.com/beadifier-alternative) · [makebead.com/pixel-beads-alternative](https://makebead.com/pixel-beads-alternative) | 最详尽的第三方功能对照：Beadifier 15 色板 / 3 色差 / SVG+XLSX；pixel-beads.net 5 抖动核 / 5 色差 / 8 打印样式 / mm 单元格 / Excel；MakeBead 自身 6 抖动核 / 11 语言 / 分板 PDF / 袋数+成本 |
| [github.com/maxcleme/beadifier](https://github.com/maxcleme/beadifier) | Beadifier 官方 README 的 5 条主功能（convert / N brands / mini-midi / boards / usage / PDF）→ 证明**无描边、无编辑** |
| [perler.com](https://perler.com/) | Perler 官方**只有** 500+ 项目图纸 + 色卡 PDF（flipbook）+ 熨烫教学，**无生成器** |
| [github.com/surger1/BeadSurge](https://github.com/surger1/BeadSurge) | BeadSurge 为 Unity 打包的桌面程序，仓库无功能文档（只能作"存在且停更"的证据） |
| [beadpattern.net/beadpattern-advanced-editing-tricks](https://beadpattern.net/beadpattern-advanced-editing-tricks) | 行业编辑工作流：清理轮廓 → **"outline 不清就手动加 1px 深色边"** → 合并阈值去杂色 → 吸管+填充 → 手动镜像 → 分区域 |
| [perlerbeadai.com/faq/how-to-design-your-own-perler-bead-patterns/](https://perlerbeadai.com/faq/how-to-design-your-own-perler-bead-patterns/) | 惯例：先画轮廓 → 主色填充 → 一个深色描边 + 一个亮色高光 |
| [image.mid-life.vip/perler-bead/pindou-bianji-gaise](https://image.mid-life.vip/perler-bead/pindou-bianji-gaise) | 轻图：画笔/直线/矩形填充/油漆桶、滚轮缩放、MARD 291 色 12 色系、**颜色合并阈值**、横轴切割数、PNG/PDF(A4 自动分页)/CSV、本地处理不上传 |
| [pixel-beads.com/zh](https://www.pixel-beads.com/zh) | 中文竞品最完整教程：工具仅画笔/橡皮/取色器（无桶/无描边）；LDPE 熔点 105–115 °C；深色吸热快白色慢；300 DPI/分块打印建议 |
| [craftpatterns.app/colors/perler/](https://craftpatterns.app/colors/perler/) | **"豆子颜色在不同批次、熨烫前后看起来都不同"**（佐证熨烫色差真实存在） |
| [github.com/marksverdhei/spritegrid](https://github.com/marksverdhei/spritegrid) | 像素网格还原：梯度分析（horizontal/vertical gradient profiles）——1:1 模式的算法参考 |
| [mdpi.com/2076-3417/16/5/2314](https://www.mdpi.com/2076-3417/16/5/2314) | 论文《Structure-Aware Pixel Art Scaling via Block Size Detection》：检测像素画固有块尺寸并还原原始网格 |

### 🟡 部分查证（仅摘要/第三方/下载站；结论请打折）

| 来源 | 用途与限制 |
|---|---|
| [kandipad.com/create](https://kandipad.com/create) | 页面抓取被拦（HTTP 422）；搜索摘要显示 **"Symmetry Mirroring — vertical/horizontal mirroring to paint symmetrical patterns in real-time, drag guidelines"** → 镜像绘制可信，其余工具清单未验证 |
| [kandipad.com/about](https://kandipad.com/about) · [官方 IG](https://www.instagram.com/p/Cu2RCQFpMut/?hl=en) · [AI patterns](https://www.facebook.com/kandipadapp/videos/kandi-pad-ai-patterns-are-here/311135421776436/) | 站点版本 KPv5、Top Tier Beads 官方合作、AI 生成图案（社媒视频） |
| [pixel-beads.net/sites/instruction.html](https://www.pixel-beads.net/sites/instruction.html) · [对比页](https://makebead.com/pixel-beads-alternative) | 老牌德国工具，5 抖动核/5 色差/8 打印样式/Excel，均来自第三方逐项核实，未抓到官方功能页 |
| [perlypop.com](https://perlypop.com/) · [App Store](https://apps.apple.com/us/app/perlypop-perler-beads/id1450794449) | iOS 付费标杆：照片转换 + 绘制 + 购物清单 + PDF；具体编辑器工具集未逐项核实 |
| [play.google.com — Beads Creator](https://play.google.com/store/apps/details?id=com.onetap.beadscreator) · [onetap.jp](https://onetap.jp/beadscreator/en/) | 像素画风编辑 + 品牌色板；工具明细未核实 |
| [pindou.fun](https://pindou.fun/) | "3D 编辑器 / 分层编辑 / 3D 实时预览"，仅摘要 |
| [豆猫拼豆](https://app.3dmgame.com/android/560454.html) · [拼个豆豆](https://www.downkuai.com/android/189322.html) · [画像素拼豆](https://m.youxiniao.com/soft/fpfrwx) · [拼豆喵](https://www.18touch.com/soft/91014.html) · [拼豆助手](https://m.996yy.work/apps/3940.html) | 中国区 App 功能描述（镜像/拆分/图层/魔棒/蓝牙板/豆仓库存/单色高亮/自动轮廓）；来自应用下载站，**未获官方确认**，仅作"中国市场功能水位"参考 |
| [YouTube — BeadSurge sprite sheet 导入](https://www.youtube.com/watch?v=TQenfZhoZc4) · [Reddit 讨论](https://www.reddit.com/r/beadsprites/comments/om20j/bead_surge_beading_template_software/) | BeadSurge 支持 sprite sheet、社区口碑"比官方 App 好"；具体功能表未获文档 |

### ⚪ 推测 / 我的推导（明确标注，勿当事实）
- 2.3 节"A/B/C 三种描边语义"的分类，以及"8 邻域=切比雪夫更圆 / 4 邻域=曼哈顿更方"的结论，是我基于形态学（dilation/erosion）的推导，**未见竞品文档直接论述**。
- 2.4 节"熨烫变色的 4 条物理机制"与"深色抬亮、浅色压暗"的分组策略，是从 LDPE 熔融/Lab 色空间推导的**假说**，需要用实测数据验证（见 2.4 实测方案）。
- "CIEDE2000 是中高端分水岭""分板打印是交付分水岭"是我的判断，非查证结论。
- 各品牌色号数量在不同来源里不一致（Perler 102 vs 117、Hama 80 vs 92、Artkal A 145 vs S 207、MARD 291、COCO 291），因为我们/竞品用的是不同年份的色卡快照 —— **这正是"色板数据需要版本化"的理由**。

---

## 附：给下一步的三条建议（不写代码，只给方向）

1. **把"独家功能"做深而不是铺摊子**：自动描边 + 熨烫预览是全球（我查到的范围内）唯二独家能力，优先补"内描边/外轮廓判定"和"分组熨烫模型 + 每豆高光"，并**明确标注是近似还是实测**。
2. **打印交付是从"玩具"到"工具"的分水岭**：A4 分页 + 真实节距 + 50mm 校准条 + 图例/坐标，是 pindou/Beadify/Stitchmate 都在做、我们完全没有的一块。
3. **数据可信度可以变成品牌**：给色板加"来源/日期/测量方式"字段（现在只有 `hex`），并做一次小规模熨烫实测。竞品全部含糊其辞（"community-measured approximations"、"usually slightly darker"），我们只要敢标数据，可信度就压过一片。
