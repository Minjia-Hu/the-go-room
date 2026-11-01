# The Go Room

A Go learning and playing app, from first moves to deeper understanding.

一个独立的围棋学习与对弈项目，结合互动教学、对局与复盘，面向初学者并逐步扩展专业能力。

## 当前状态

已完成项目脚手架、规则引擎(`src/engine/`)和简单电脑对手(`src/ai/`)。引擎按中国规则实现落子、提子、禁入点、全局同形禁止、停一手和数子;电脑按提子、救子、叫吃、随机的顺序选点。测试用 `npm test` 运行。界面尚未开始。

GitHub 仓库：[Minjia-Hu/the-go-room](https://github.com/Minjia-Hu/the-go-room)（Private）。

## 产品方向

第一版做 5 关互动教学、与简单电脑对手的 9 路引导对局,以及带规则事件标注的复盘。范围、规则口径与技术方案见 [第一版设计](docs/superpowers/specs/2026-11-01-v1-design.md)。

完整背景与待决定事项见 [项目愿景](docs/vision.md)。

## 接下来的工作

1. 棋盘组件与教学关卡。
2. 引导对局、终局数子与复盘。
