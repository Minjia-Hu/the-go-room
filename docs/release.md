# 构建与发布

## 当前发布状态（2026-11-08）

- 当前已提供互动课程、九路陪练和复盘，持续完善中，欢迎试用和反馈。教学效果仍待更多实际使用反馈，实体手机体验尚未验证。电脑提示只解释局部后果，死子由使用者确认。
- GitHub 源码仓库仍为私有；已合并版本 `1731119` 的[远程 CI](https://github.com/Minjia-Hu/the-go-room/actions/runs/42458561572)已通过安装、263 个测试、lint 和构建。
- [在线体验](https://example.invalid/removed-private-preview-1)已部署，当前仅所有者登录后可访问，公开访问待确认。原[个人预览](https://example.invalid/removed-private-preview-2)仍保持私有。
- GitHub Pages 创建请求因当前套餐不支持该私有仓库而被拒绝，尚未部署。已有 Pages 工作流保留为后续选项。

## 独立托管演示

演示与 GitHub 源码仓库独立：只上传 `dist/` 中 `index.html` 引用的资源，以及项目许可和第三方声明，不上传 TypeScript 源码、测试、设计文档或 Git 历史。浏览器仍会下载运行所需的 HTML、CSS 与压缩 JavaScript；这不是源码保密或防复制机制。

本次网页对应 GitHub 提交 `1731119`，部署成功；当前访问权限仍为仅所有者，尚未验证匿名访问。托管平台默认允许复制改编，因此演示使用独立的构建产物副本；原个人预览不改变访问范围。

- 站点 ID：`REMOVED_PRIVATE_SITE_ID`
- 托管发布提交：`REMOVED_PRIVATE_HOSTING_COMMIT`
- 托管版本：`REMOVED_PRIVATE_SITE_ID~REMOVED_PRIVATE_VERSION_ID`

以后更新演示时，先构建已验证的应用版本，再只同步发布资源；不要把完整源码仓库直接同步到这个演示站点。公开访问成功后，用未登录的浏览器验证课程、陪练与刷新，再更新本页和 README 的访问状态。

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

仓库公开与网站上线是两个独立操作。独立托管预览已上线；本节的 GitHub Pages 仅准备了配置，不自动修改仓库可见性或启用 Pages。

维护者决定上线后：

1. 将已经审查、验证的改动合并并推送到 `main`。
2. 在仓库 Settings → Pages，将 Source 设为 GitHub Actions。是否需要公开仓库取决于 GitHub 账户方案。
3. 在 Actions 中选择 **Deploy GitHub Pages**，手动运行，选择 `main`。
4. 工作流重新执行全部检查，再上传构建产物并部署。它只接受 `main`；普通推送不会触发部署。
5. 以部署任务输出的网址为准，验证首页、课程、陪练、刷新和许可文件，再把实际地址加入 README。

如果仍使用当前仓库名、没有自定义域名，预期地址为 `https://minjia-hu.github.io/the-go-room/`。这只是地址预期，不代表站点已上线。

工作流遵循 [GitHub Pages 自定义工作流文档](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。首次部署可能需要仓库维护者配置 Pages 或环境权限；请通过 GitHub 设置处理，不要把访问令牌写入源码。

## 发布前核对

- 确认许可证与第三方来源记录符合发布内容；MIT 允许商业使用，要求保留版权和许可说明。
- 扫描当前文件与可达提交历史，避免公开私人数据。清理当前文档不会删除历史提交中的旧路径；本次没有重写历史。
- 在真实手机上试下四角、边线、确认按钮和横屏；浏览器模拟不能替代触控与 Safari 工具栏验证。
- 部署地址改变会改变浏览器存储的来源，已有学习记录不会自动迁移到新站点。

## 本次准备范围

整理项目许可、参考声明、对外 README、历史文档说明、Node 环境、CI 与手动 Pages 工作流；移除未使用的模板图标。保留历史截图与已合并分支，不为体积清理重写 Git 历史。首页文案精简与棋盘方向键操作继续作为独立的产品改进。

## 本地验证记录（2026-11-08）

- Node.js 24.22.2 下执行 `npm ci`、263 个测试、lint 和构建，全部通过。
- 检查构建产物的相对资源路径、许可文件完整性与 JavaScript 许可指引；未使用的模板图标不再出现在发布包。
- Chromium 实际操作开发页、静态根目录及 `/the-go-room/` 子目录：课程落子、陪练试下与确认、hash 路由刷新、Logo 返回首页均通过，无页面异常或失败的 HTTP 请求。子目录另使用 375 × 667 视口检查。
- Markdown 本地链接、工作流 YAML 语法和 Git 空白检查通过。本地验收之后，GitHub Actions CI 已在提交 `1731119` 上通过；Pages 尚未部署，没有进行实体手机验证。
