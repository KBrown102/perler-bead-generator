# git 常用命令速查（给不熟 git 的同学）

> 面向本项目：`perler-bead-generator`
> 记住三个词就够了：**提交（commit）= 一次存档**、**分支（branch）= 存档线**、**工作区 = 你现在改的文件**。

---

## 0. 一条铁律

```bash
git status          # 先看：改了什么、有没有暂存
```

每次动手前先 `git status`，改完先 `git status`，提交前再 `git status`。
**`git reset --hard` 会丢掉没提交的改动，不要随便用。**

---

## 1. 看历史：到底提交过什么

```bash
git log --oneline              # 一行一个提交（最好用）
git log --oneline --decorate   # 顺便显示分支/tag，例如 (HEAD -> main, tag: v1.0)
git log --oneline -10          # 只看最近 10 条
git log --stat --oneline -3    # 带上每次改了哪些文件
```

输出里左边那串 `9532931` 是**提交号（hash）**，后面所有操作都用它。

---

## 2. 看某一次提交改了什么

```bash
git show 9532931                 # 完整 diff（按 q 退出）
git show --stat 9532931          # 只看"改了哪些文件、多少行"
git show 9532931 -- src/region.js   # 只看某次提交里某个文件的变化
```

---

## 3. 看某个文件在"旧版本"里长什么样（不改代码）

```bash
git show 31a75c8:index.html            # 打印旧版 index.html 内容
git show v1.0:src/region.js            # 也可以用 tag 名
git show 31a75c8:src/image.js > old-image.js   # 另存出来慢慢看
```

> 这是最安全的方式：**只读，不碰工作区**。

---

## 4. 比较两个版本

```bash
git diff 31a75c8 9532931                    # 两个提交的全部差异
git diff 31a75c8 9532931 --stat             # 只看文件清单/行数
git diff 31a75c8 9532931 -- src/            # 只看 src 目录
git diff HEAD~1 -- index.html               # 和"上一个提交"比
git diff                                    # 工作区 vs 最后一次提交（还没提交的改动）
```

---

## 5. 真想"回到旧版本看看"（两种方式）

### 方式 A：临时切过去（推荐先试这个）

```bash
git switch --detach 31a75c8     # 进入"只看"状态（不在任何分支上，可以随便看/双击 index.html）
# 看完回来：
git switch main
```

切过去期间**不要提交**（要改就先建分支，见方式 B）。

### 方式 B：另开一个目录放旧版本（最安全，不动当前项目）

```bash
git worktree add ../perler-old 31a75c8
# 旧版本完整地出现在 ..\perler-old，可以双击 index.html 看效果
# 用完删除：
git worktree remove ../perler-old
```

### 方式 C：只把某个文件恢复成旧版本

```bash
git checkout 31a75c8 -- index.html    # 用旧版覆盖当前工作区文件（会丢当前改动，先 commit 或备份）
git restore --source=31a75c8 index.html   # 新版 git 的等价写法
```

---

## 6. 提交一次改动（本项目最常用）

```bash
git status                      # 1. 看改了什么
git add -A                      # 2. 全部暂存（或 git add src/ 只加某目录）
git diff --cached --stat        # 3. 提交前再确认一遍要提交什么
git commit -m "feat: 一句话说明改了什么"
git log --oneline -1            # 4. 确认提交成功
```

提交信息习惯（本项目一直在用）：

- `feat: 新功能`
- `fix: 修 bug`
- `refactor: 重构（不改行为）`
- `docs: 只改文档`
- `chore: 杂项（版本号、依赖等）`

---

## 7. 撤销：分三种情况

```bash
# ① 还没提交，想把某个文件改回原样
git restore index.html

# ② 已经 add 了，想撤出暂存区
git restore --staged index.html

# ③ 已经提交了，想"反向再做一次提交"（安全，历史保留）
git revert 9532931

# ④ 提交信息写错了（还没推送）
git commit --amend -m "新的说明"
```

> 和 `revert` 不同，`git reset` 会改写历史，**新手别用 `--hard`**。

---

## 8. 标签：给重要版本起名

```bash
git tag -a v1.0 -m "像素化质量升级里程碑"   # 打标签
git tag -n1                                  # 列出标签
git show v1.0                                # 看这个版本
git log --oneline --decorate                 # 历史里会显示 (tag: v1.0)
```

打标签后，"回到某个版本"就不用记 hash，直接 `git switch --detach v1.0`。

---

## 9. 远程（GitHub）相关

```bash
git remote -v                 # 看远程地址
git push                      # 推送当前分支
git push --tags               # 把标签也推上去
git fetch                     # 拉取远程信息（不改本地文件）
git pull                      # 拉取并合并
```

> 本仓库远程是 GitHub（`origin/main` 停在 31a75c8）。**v1.0 这次提交还没推送**，
> 需要时执行 `git push && git push --tags` 即可。

---

## 10. 本项目当前状态（2026-11）

```
9532931 (HEAD -> main, tag: v1.0) feat: 界面分层重构 + 像素化质量升级
31a75c8 (origin/main)             feat: 图标改天空蓝 + Android(Capacitor) 配置
```

---

## 附：最常用的 5 条，背下来就够用

```bash
git status                       # 我现在改了什么
git log --oneline -10            # 我最近提交了什么
git diff                         # 我这次具体改了什么
git add -A && git commit -m "..."   # 存档
git show v1.0:index.html         # 看旧版本里的某个文件
```
