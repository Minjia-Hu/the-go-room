# 参考来源与第三方声明

本项目自有内容采用 MIT，见仓库根目录的 LICENSE（网页发布包中为 LICENSE.txt）。该许可不替代第三方内容各自的许可，也不授予第三方商标权。

## 运行时依赖

网页包含 React、React DOM 和 Scheduler（Meta Platforms, Inc. and affiliates，MIT）。构建时由 Vite 自动将实际打包依赖的完整许可证输出到 `third-party-licenses.md`，并在 JavaScript 文件末尾指向许可文件。发布网页时请保留该文件、本声明和 LICENSE.txt。

开发工具的依赖、版本与许可标识记录在 package-lock.json，各包完整许可随 npm 安装包提供。开发依赖含 MIT、Apache-2.0、MPL-2.0 等不同许可，不统一重新声明为本项目的 MIT。

## 随机算法

`src/ai/random.ts` 使用 Mulberry32，拆分为可保存状态的单步函数，以支持陪练重试。JavaScript 算法参考 [bryc/code 的 Mulberry32 实现](https://github.com/bryc/code/blob/master/jshash/PRNGs.md#mulberry32)；该来源文件声明为 Public domain，并链接原始算法来源。它用于可复现的对手落子与测试，不用于密码学。

## 教学参考与资源说明

以下记录说明教学参考范围，不表示参考网站的内容由本项目授权，也不表示双方存在合作或背书。

- [British Go Association — How to Play](https://britgo.org/intro/intro2.html)：气、直线连接与两眼的教学概念参考。项目设计记录说明新棋形与文案自行编写，不复制其题图；该网站的计分说明与本项目中国规则口径不同。

棋盘、棋子、标识和页面插图由本仓库的 SVG/CSS 实现；页面使用系统字体，不分发字体文件。`docs/qa/` 和 `demos/` 中的截图记录本项目界面与设计样稿。整盘讲解为教学编排，不标榜为职业棋手棋谱或最佳手示范。

已有历史提交包含 Vite 创建项目时的模板资源，当前发布包已不使用这些示例资源；开源准备没有重写 Git 历史。上述来源记录不是对所有历史内容原创性的独立鉴定。新增课程、题图、棋谱或图片时，请同时记录来源和使用许可，避免把第三方内容默认归入项目许可。
