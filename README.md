# 拼豆图纸生成器 (Perler Bead Pattern Generator)

把本地图片转成拼豆（perler / hama / artkal 等熔珠）图纸的网页工具。**纯本地运行，无需安装、图片不上传。**

## 在线预览

👉 [https://kbrown102.github.io/perler-bead-generator/](https://kbrown102.github.io/perler-bead-generator/)

## 快速开始

直接双击打开 `index.html` 即可（无需服务器、无需构建、无任何依赖）。

## 功能

- 上传图片 / 拖拽 / 示例图
- 网格化：宽度 8–150，高度按比例自动，可选正方形标准板
- 原图编辑：矩形裁切、铅笔、橡皮、取色、抠图（魔术棒），支持撤销
- 颜色量化 + Floyd–Steinberg 抖动；k-means 颜色数量上限
- 多品牌色板（Perler / Hama / Artkal / Mard …），透明区域 = 空格（不放置豆子）
- 图纸预览（随窗口自适应）、网格线、黑白打印符号
- 图例 + 每种豆用量统计（购物清单）
- 导出图纸 PNG（含图例）、复制购物清单

## 精确色号

`palettes.js` 由开源色号库 [maxcleme/beadcolors](https://github.com/maxcleme/beadcolors) 生成（BeadSurge / Kandi Pad 等拼豆软件在用）。

如需重新生成或更新色号，在本目录执行：

```powershell
.\import-palette.ps1
```

## 技术说明

- 单文件 `index.html`（内联 CSS/JS，无框架、无依赖）
- 核心算法：网格降采样 → 最近色匹配（含抖动）→ 豆色映射
- 后续可复用核心逻辑打包到桌面（Electron/Tauri）、移动端（Capacitor）、微信小程序（Canvas 2D）
