# The Go Room

A Go learning and playing app, from first moves to deeper understanding.

一个独立的围棋学习与对弈项目，结合互动教学、对局与复盘，面向初学者并逐步扩展专业能力。

## 当前状态

第一版完整路径已实现：5 关互动教学 → 9 路人机引导对局 → 标记死子与数子 → 带规则事件的复盘。规则引擎在 `src/engine/`，简单电脑对手在 `src/ai/`，教学数据在 `src/content/`，界面与棋谱存储在 `src/app/`。

用户执黑、电脑执白。支持非法落子解释、首次规则说明、提子位置与可选叫吃标记；双方连续停一手后，按整块标记死子，确认后自动进入复盘末尾，查看活子、空点、贴目与区域归属。

最近 10 盘已完成棋谱保存在此浏览器的 localStorage 中。切换页面保留当前对局；刷新不保留进行中的对局。历史格式错误或存储不可用不影响下棋，保存失败时会提示并保留当前内存中的复盘。

目前 141 个测试。`npm test`、`npm run build`、`npm run lint` 均通过，并已在 Chromium 中检查完整教学和对局流程、数子、刷新恢复及手机竖屏布局。

GitHub 仓库：[Minjia-Hu/the-go-room](https://github.com/Minjia-Hu/the-go-room)（Private）。

## 产品方向

第一版做 5 关互动教学、与简单电脑对手的 9 路引导对局,以及带规则事件标注的复盘。范围、规则口径与技术方案见 [第一版设计](docs/superpowers/specs/2026-11-01-v1-design.md)。

完整背景与待决定事项见 [项目愿景](docs/vision.md)。

## 本地开发

```bash
npm install
npm run dev
npm test
npm run build
npm run lint
```

构建产物位于 `dist/`，可部署到静态站点，无需后端。

## 实现约定与限制

- 跨层只从 `src/engine/index.ts`、`src/ai/index.ts` 公开入口导入；规则和对手均为纯函数。
- 第一版棋谱固定为空棋盘、9 路、黑先、白贴 7.5，读取时通过引擎重放验证，重建事件与得分。教学预设盘面不存为对局棋谱；引擎仍未单独保存初始盘面。
- 电脑是简单启发式对手，死子由用户标记，电脑默认同意；不做自动死活判断或棋力评价。
- 清除浏览器数据会删除历史；不支持账号同步或 SGF 导入导出。

## 后续工作

依据使用反馈打磨第一版；详细视觉方案和新增功能另行确认。第四阶段的实施与验收记录见 [计划四](docs/superpowers/plans/2026-11-01-v1-plan-4-play-replay.md)。
