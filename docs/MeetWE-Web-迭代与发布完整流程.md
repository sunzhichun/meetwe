# MeetWE Web 迭代与发布完整流程（1～6 步）

本文档按当前实际环境整理，可作为每次产品迭代与上线的 SOP。

| 项目 | 说明 |
|------|------|
| 源码目录 | `D:\AI\MeetWE` |
| 发布目录 | `D:\AI\publish\meetwe-web` |
| GitHub 仓库 | `sunzhichun/meetwe` |
| 线上地址 | `https://sunzhichun.github.io/meetwe/` |
| Pages 配置 | `main` + `/(root)` |

---

## 1）在 Cursor 修改源码（开发阶段）

在 `D:\AI\MeetWE` 里做产品迭代（UI / 逻辑 / 交互）。

常改文件示例：

- `src/screens/*`
- `src/components/*`
- `src/logic/*`
- `app.json`（例如 `experiments.baseUrl: "/meetwe"`，须与 GitHub 项目路径一致）

---

## 2）本地预览与基础检查（建议）

```cmd
cd /d D:\AI\MeetWE
npm run web
```

如需发布前静态导出验证：

```cmd
npm run export:web
```

检查 `web-build/index.html` 中资源路径应包含 `/meetwe/_expo/...`（与项目站路径一致）。

---

## 3）提交并推送源码（先确认分支）

### 这一步在做什么

在 Cursor 里改的是工作区文件；要用 Git **提交（commit）+ 推送（push）**，GitHub 上才有对应版本。推送前需明确：**当前本地分支**与 **GitHub Pages 使用的分支**（一般为 **`main`**）是否一致，否则可能出现「代码推了但 Pages 源码分支未更新」的错觉。

### 如何确定当前在哪条分支

```cmd
cd /d D:\AI\MeetWE
git branch
git status
```

- `git branch` 中带 `*` 的一行 = 当前分支（如 `main` 或 `web-adapt`）。
- `git status` 第一行也会显示 `On branch xxx`。

### 与 Pages 的关系

- 若在 **`web-adapt`** 开发、但 Pages 只部署 **`main`** → 上线前需合并到 `main` 再推，或改在 `main` 上开发。
- 若始终在 **`main`** 开发 → 直接推 `main` 最省事。

### 推送命令

```cmd
cd /d D:\AI\MeetWE
git add -A
git commit -m "feat(web): 本次迭代说明"
git push origin <当前分支名>
```

示例：

```cmd
git push origin main
```

或：

```cmd
git push origin web-adapt
```

### 若在 `web-adapt` 开发、Pages 用 `main`

```cmd
cd /d D:\AI\MeetWE
git checkout main
git merge web-adapt
git push origin main
```

### 若希望长期简单：固定在 `main` 开发

```cmd
git checkout main
```

之后第 3 步固定为 `git push origin main` 即可。

---

## 4）重新导出 Web 静态产物（会读取 `.env`）

```cmd
cd /d D:\AI\MeetWE
npm run export:web
```

说明：

- 构建时会读取项目根目录 `.env` 中的 `EXPO_PUBLIC_*` 并打入 JS；改 Key 或相关配置后**必须重新导出**再部署。

### 确保 `.env` 仅保留本机、不提交到 GitHub

1. **`.gitignore` 须包含**（项目已配置则保持即可）：

   ```gitignore
   .env
   .env*.local
   ```

2. **每次提交前检查**：

   ```cmd
   cd /d D:\AI\MeetWE
   git status
   ```

   不应出现 `modified: .env` 或 `new file: .env`。

3. **确认被忽略**：

   ```cmd
   git check-ignore -v .env
   ```

   有输出表示已被忽略。

4. **发布目录**：第 5 步从 `web-build` 同步，通常**不会**带上 `.env`。若在 `meetwe-web` 里看到 `.env`，勿 `git add`，并删除或加入该仓库 `.gitignore`。

5. **若历史上曾误提交 `.env`**：

   ```cmd
   git rm --cached .env
   git commit -m "Stop tracking .env"
   git push
   ```

---

## 5）同步产物到发布目录并推送（真正更新线上）

```cmd
robocopy "D:\AI\MeetWE\web-build" "D:\AI\publish\meetwe-web" /E
```

> 使用 **`/E`**，**不要**使用 **`/MIR`**（避免误删发布目录中的 `.git`）。

```cmd
cd /d D:\AI\publish\meetwe-web
type nul > .nojekyll
git add -A
git commit -m "Deploy: 本次上线说明"
git pull origin main --no-rebase
git push -u origin main
```

若 `push` 提示 non-fast-forward，先完成 `pull` 合并后再 `push`。

---

## 6）线上验收与回归

1. 等待约 1～3 分钟后打开：`https://sunzhichun.github.io/meetwe/`
2. 强刷：`Ctrl + F5`
3. 核对：参与者地址联想、生成推荐地、结果页等
4. 若接口异常：检查高德白名单是否包含 `sunzhichun.github.io`（及自定义域名）；浏览器开发者工具 Network 中是否有 `restapi.amap.com` 及返回内容

---

## 首次环境自检（仅需一次）

- 仓库 `meetwe` 的 Pages：`main` + `/(root)`
- 仓库根目录应存在：`index.html`、`_expo/`、`.nojekyll`

---

## 一句话版本（每次迭代）

改代码（`MeetWE`）→ 提交源码 → `export:web` → `robocopy` 到 `meetwe-web` → 提交发布目录并 `push` → 打开线上验收。
