# 三种视觉方向 · 2026-11-07

三套独立的视觉与交互样稿，供项目负责人选型。样稿独立于正式应用 `src/`，不参与正式构建，也不需要新增依赖。名称仅表示设计方向，产品名称仍为 The Go Room。

后续决定：项目负责人已选定 **B「棋谱编辑部」**，并整合至正式应用；见[正式版验收](../../docs/qa/editorial-design/README.md)。此目录保留选型时的三套原始样稿，不随正式页面同步修改。

## 打开

可以直接用浏览器打开此目录下的 `index.html`，无需服务器。CSS、JavaScript、预览图片均在同一目录中，移动或分享时请保留整个目录。

也可以在项目根目录运行 `npm run dev`，访问终端显示地址下的 `/demos/visual-directions/index.html`。

顶部切换 A / B / C；每套方案的导航可以切换学习首页与生存练习。切换方案时保留当前页面类型，但重置本题。

## 方向

| 方案 | 视觉重点 | 结构与体验 |
| --- | --- | --- |
| A 晴空棋室 | 浅蓝、白色、柔和圆角 | 用一个具体问题邀请新手尝试，横向课程路线，讲解卡片突出原因。 |
| B 棋谱编辑部 | 纸色、墨色、宋体、细线 | 使用目录、章节编号与图注，减少卡片装饰，像翻阅棋书。 |
| C 夜航棋社 | 深蓝黑、薄荷绿、冷色棋盘 | 侧边学习路线、棋盘为中心的工作台，强调专注练习。 |

三套方案都注重清晰的信息层级、留白与课程入口，让初学者容易找到下一步操作。

## 交互范围

每套方案都展示同一个固定局面：目标黑棋仅剩 A 一口气。

- A：向下连接，整块棋从一口气变为三口气；可以对照下之前／下之后，再确认。
- B：在远处落子，目标棋块仍只有一口气；可以演示白棋占 A 后提走目标黑棋，再换到 A 试下。
- 支持提示、重新选点、再次练习，以及棋盘 A / B 落点的键盘 Enter / Space。
- 只开放两个预设落点；这是视觉选型用的有限交互，不提供完整规则、AI 对局或进度存储。其他课程标注为内容示意。

正式整合时继续复用现有 React 组件与规则引擎，不把样稿中的固定局面逻辑替代正式实现。

## 验证

使用 `npm run dev` 和本机 Chromium 实际检查：

- 三套首页与三套练习页的桌面、手机截图。
- 320、390、768、1024、1440 像素宽度，无横向溢出。
- A / B 选择、气的显示、白棋提子演示、前后对照、确认、重新练习、提示及键盘操作。
- 直接以 `file://` 打开后，脚本、样式与练习正常，无需 Vite。
- 未出现浏览器运行错误；`node --check demos/visual-directions/demo.js`、`npm run lint` 通过。

## 预览

- [三案总览](previews/overview.png)
- A：[首页](previews/a-home.png) / [练习](previews/a-lesson.png) / [手机首页](previews/a-home-mobile.png) / [手机练习](previews/a-lesson-mobile.png)
- B：[首页](previews/b-home.png) / [练习](previews/b-lesson.png) / [手机首页](previews/b-home-mobile.png) / [手机练习](previews/b-lesson-mobile.png)
- C：[首页](previews/c-home.png) / [练习](previews/c-lesson.png) / [手机首页](previews/c-home-mobile.png) / [手机练习](previews/c-lesson-mobile.png)
