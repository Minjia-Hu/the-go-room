# 构建与发布

## 当前发布状态（2026-11-14）

- 当前已提供 29 个课程与练习单元、22 题的专项练习入口、九路陪练和复盘。练习入口包含 10 道课程配套题与 12 道新增专项题，不改变课程顺序和续读位置；生存课程目录按“课程＋配套练习”分组。
- 上述改动已合并到 `main`，应用版本为 `b6f1d71`。Node.js 24.22.3 下本地验收为 45 个测试文件、330 个测试、lint 和构建通过，详见[练习扩充验收](qa/practice-expansion/README.md)、[课程目录分组验收](qa/grouped-course-contents/README.md)。此前重试记录修复的验收见[发布前修复验收](qa/release-readiness/README.md)。
- 历史清理后的提交需要重新通过远程检查。以 [main 的 CI 运行记录](https://github.com/Minjia-Hu/the-go-room/actions/workflows/ci.yml?query=branch%3Amain)中对应新提交的结果为准；此前运行记录属于重写前历史，不能替代新提交的验证。
- 新增 12 题已在浏览器逐题验证，并检查 1440、1000、375 三种宽度及 375 × 667 试下确认布局。教学效果仍待更多实际使用反馈，实体手机触控与 Safari 工具栏尚未验证；电脑提示只解释局部后果，死子由使用者确认。
- 公开在线体验链接尚未发布。GitHub Pages 工作流已准备，尚未部署。

## 独立静态托管

演示与源码仓库可以独立部署：只上传 `dist/` 中 `index.html` 引用的资源，以及项目许可和第三方声明。浏览器会下载运行所需的 HTML、CSS 与压缩 JavaScript；构建压缩不是源码保密或防复制机制。

更新网站时，先构建已验证的应用版本，再同步发布资源。公开访问后，用未登录的浏览器验证课程、陪练与刷新，再把实际可访问的链接加入 README。

## 本地构建

使用 Node.js 24.x（`.nvmrc`），运行：

```bash
npm ci
npm test
npm run lint
npm run build
npm run preview
```

`dist/` 是完整的静态网页，不需要后端。资源使用相对路径，hash 路由可部署在域名根目录或 `/the-go-room/` 等子目录；子目录入口应以 `/` 结尾。站点服务器应正确提供 HTML、JavaScript、CSS 和 SVG 类型。

发布时完整保留：

- `LICENSE.txt`：项目许可；
- `THIRD_PARTY_NOTICES.md`：参考与来源说明；
- `third-party-licenses.md`：根据实际构建依赖自动生成的完整许可；
- `index.html`、`assets/` 与 favicon 等静态资源。

仅上传 `dist/`，不要把源码目录、node_modules 或本地环境配置作为网页目录发布。

## 自动检查

`.github/workflows/ci.yml` 在推送和拉取请求时执行安装、测试、lint 与构建。GitHub Actions 使用 Node.js 24，并将官方 action 固定到具体提交；升级时核对上游版本后更新。

## GitHub Pages（仅手动发布）

仓库公开与网站上线是两个独立操作。现有工作流仅在手动触发时部署，不会自动修改仓库可见性或启用 Pages。

维护者决定上线后：

1. 将已经审查、验证的改动合并并推送到 `main`。
2. 在仓库 Settings → Pages，将 Source 设为 GitHub Actions。是否需要公开仓库取决于 GitHub 账户方案。
3. 在 Actions 中选择 **Deploy GitHub Pages**，手动运行，选择 `main`。
4. 工作流重新执行全部检查，再上传构建产物并部署。它只接受 `main`；普通推送不会触发部署。
5. 以部署任务输出的网址为准，验证首页、课程、陪练、刷新和许可文件，再把实际地址加入 README。

未配置自定义域名时，项目站点通常位于 `https://<owner>.github.io/<repository>/`。以实际部署输出为准，不要将预期地址当作已上线链接。

工作流遵循 [GitHub Pages 自定义工作流文档](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。首次部署可能需要仓库维护者配置 Pages 或环境权限；请通过 GitHub 设置处理，不要把访问令牌写入源码。

## 发布前核对

- 确认许可证与第三方来源记录符合发布内容；MIT 允许商业使用，要求保留版权和许可说明。
- 扫描当前文件与可达提交历史，避免公开私人数据。本次已在隔离副本中清理历史文档里的本机路径和私人托管地址，检查范围与替换状态见[历史清理记录](qa/history-cleanup/README.md)。
- 在真实手机上试下四角、边线、确认按钮和横屏；浏览器模拟不能替代触控与 Safari 工具栏验证。
- 部署地址改变会改变浏览器存储的来源，已有学习记录不会自动迁移到新站点。

## 本次准备范围

整理项目许可、参考声明、对外 README、历史文档说明、Node 环境、CI 与手动 Pages 工作流；移除未使用的模板图标。历史清理只替换私人信息，保留历史截图和提交顺序，不为体积压缩历史。首页文案精简与棋盘方向键操作继续作为独立的产品改进。

## 本地验证记录（2026-11-08）

- Node.js 24.22.2 下执行 `npm ci`、263 个测试、lint 和构建，全部通过。
- 检查构建产物的相对资源路径、许可文件完整性与 JavaScript 许可指引；未使用的模板图标不再出现在发布包。
- Chromium 实际操作开发页、静态根目录及 `/the-go-room/` 子目录：课程落子、陪练试下与确认、hash 路由刷新、Logo 返回首页均通过，无页面异常或失败的 HTTP 请求。子目录另使用 375 × 667 视口检查。
- Markdown 本地链接、工作流 YAML 语法和 Git 空白检查通过。本地验收之后，GitHub Actions CI 已在当时版本上通过（重写前历史）；Pages 尚未部署，没有进行实体手机验证。

## 历史清理（2026-11-14）

已准备清理后的历史与本地验收，尚未替换远程仓库。文档中的提交引用已更新到新历史；历史验收文档里关于当时未重写、未合并或未推送的记录仍描述当时状态。正式替换后应重新验证 GitHub CI，并确认旧分支不会重新带回原历史。详见[历史清理记录](qa/history-cleanup/README.md)。
