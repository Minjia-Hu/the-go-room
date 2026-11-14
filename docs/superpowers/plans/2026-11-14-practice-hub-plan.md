# 「练」页实施计划 · 2026-11-14

## 目标

在导航中加入「练」，把课程里已有的 10 道**无引导**练习题按能力重新列一遍，方便学习者找出还没独立掌握的题反复练。

- **不搬动、不复制题目**。题目仍在原来的章节里，卷目、课程顺序、课程内的「下一题」都不变。「练」只是同一批题的第二个入口。
- 进度只有一份：在「练」里完成的题，卷目里同样显示完成，反之亦然。
- 视觉沿用「墨与印」（`docs/qa/ink-and-stone/README.md`）。

## 前置条件

- 在分支 `design/ink-and-stone` 的基础上开发（在对应的 Git worktree 中工作）。先确认「墨与印」改版已经提交；没提交就先停下来问项目负责人，不要自己替它提交。
- 新开分支 `feature/practice-hub`。
- 阅读 `CONTRIBUTING.md` 的代码约定：跨层只从 `src/engine/index.ts` 导入；类型导入用 `import type`；`.tsx` 只导出组件；需要 DOM 的测试第一行写 `// @vitest-environment jsdom`。
- 提交说明用英文，不加 `Co-Authored-By` 之类的尾注；提交邮箱用 `264439153+Minjia-Hu@users.noreply.github.com`。

## 题目清单（10 道）

| 能力分组 | 学习单元 id | 题目 | 来源与组件 | 相关讲解（建议） |
| --- | --- | --- | --- | --- |
| 认危险 | `survival/danger-check` | 换到边上，自己找一找 | 第贰卷，`SurvivalPage` | 1. 认出哪块棋危险 |
| 找出路 | `survival/escape-check` | 往外伸，真的救出来了吗 | 第贰卷，`SurvivalPage` | 2. 给自己的棋找出路 |
| 找出路 | `independent/extend-1`、`extend-2` | 独立练习 · 延伸 | 第伍卷，`IndependentPage` | 2. 给自己的棋找出路 |
| 提子 | `independent/capture-1`、`capture-2` | 独立练习 · 提子 | 第伍卷，`IndependentPage` | 第 3 关:提子 |
| 连接 | `survival/connect-check` | 竖着也能连接 | 第贰卷，`SurvivalPage` | 3. 把分开的棋连起来 |
| 连接 | `independent/connect-1`、`connect-2` | 独立练习 · 连接 | 第伍卷，`IndependentPage` | 3. 把分开的棋连起来 |
| 两只眼 | `survival/eyes-check` | 自己解释两只眼 | 第贰卷，`SurvivalPage` | 4. 两个小空点为什么能保命 |

「相关讲解」一列是按题目类型给的建议。实现前请读 `src/content/survival.ts`、`src/content/independent.ts` 的棋形和文案核对一遍，不合适就换，并在提交说明里写明。

独立练习在「练」页里显示的标题，要按 `kind` 写清楚练的是什么（比如「延伸 · 第 1 题」），不要只写「第 1 题」。

## 设计

### 路由与导航

- `src/app/router.ts`：`Page` 增加 `'practice'`，hash 为 `#/practice`。
- `src/app/App.tsx`：导航改为「学 · 练 · 弈 · 复」。新增项 `{ page: 'practice', label: '练习', glyph: '练' }`；单字显示，`aria-label` 和 `title` 用完整名称（沿用现有写法）。
- `practice` 页渲染新组件 `PracticePage`，传入 App 里同一份 `learning` 状态和 `changeLearning`，保证完成记录写入同一处。

### 状态与进度（重点）

- 题目的棋盘状态仍在 `LearningSession.runs`（生存）和 `LearningSession.independentRuns`（独立）里，「练」和卷目共用。
- 「练」**不修改 `session.page`**。当前打开哪道题，作为 `PracticePage` 的本地状态（或 App 里一个不持久化的 state），刷新后回到「练」的题目列表。
- 这样 `recordLearningProgress` 照样会通过 `runs` 记录完成，但 `lastVisited`（卷目里的「续读」位置）不会被练习改动。在「练」里练题不打乱课程进度，这是有意为之，要写测试覆盖。
- 从「练」打开一道**已完成**的题时，用 `startSurvival` / `startIndependent` 重置那一道题的 run，让学习者可以重做。完成记录只保留最好的一次（`RANK` 已经这样处理），不会被冲掉。注意：重置也会影响卷目里这道题当时停在哪一步，这可以接受。
- 打开**未完成**的题，保留已有进度，不重置。

### 「练」页内容（`src/app/lessons/PracticePage.tsx` 及配套纯函数模块）

- 题目清单放在单独的 `.ts` 模块里（比如 `src/app/lessons/practiceCatalog.ts`）：分组、学习单元 id、来源、下标、相关讲解。另外导出纯函数 `nextPracticeItem(progress, afterId?)`，返回下一道**不是「独立完成」**的题。
- 页头：题目「练 · 自己判断」，一句说明（这些题在课程里也有，这里按能力集中练；做题不改变课程里的学习位置）。显示「独立完成 x / 10」，下方用墨条进度，和首页学习记录同一风格。
- 主按钮「来一道还没独立完成的题」，打开 `nextPracticeItem` 返回的题。全部独立完成时改为一句说明：可以重做任意一题，或者去「弈」下一盘。
- 按能力分组列出题目，每行包括：状态点（没做 / 借助提示 / 重试后 / 跟着演示 / 独立完成，文字用 `COMPLETION_LABELS`）、题目名、「相关讲解」文字按钮。
- 「相关讲解」切到「学」并打开对应课程（`navigate('lessons')` 加上 `openLearningUnit`）。这一步是学习者主动去上课，所以会更新课程位置。

### 做题时

- 复用现有的 `SurvivalPage` 和 `IndependentPage`，不复制组件。
- 顶部工具栏：左边「返回练习」，右边显示「练 · {分组}」。
- 完成后的「下一题」：跳到 `nextPracticeItem` 的下一道题；没有了就回到「练」的列表。
  - `SurvivalPage`：传 `isLast={false}`，不传 `onScoring`，`onNext` 换成练习版。
  - `SurvivalPage` 的 `onRuleSequence`（两眼题里的「分步看」）在「练」里不传，避免把人带进课程。
  - `IndependentPage`：`allDone` 会改变完成后按钮的文字（会出现「去陪练试试」）。请读组件后决定：传 `false`，或者加一个可选的按钮文字属性。不能出现把人从「练」带进课程顺序的按钮。
- 练习时显示的完成状态，沿用课程里「已有记录：…」的提示。

### 样式

- 只在 `src/app/styles.css` 里新增，类名加 `practice-` 前缀；状态点、墨条、按钮复用现有的 `lesson-link`、`ink-strokes`、`button` 样式。
- 桌面上分组两列；手机单列。1440、1000、390 像素宽度都不能有横向溢出。
- 遵守 `prefers-reduced-motion`。

## 不做的事

- 不改课程内容、题目棋形和课程顺序；不改卷目。
- 第肆卷「九路策略」的选择题、第叁卷终局课不放进「练」。它们是讲解课，要不要加由项目负责人另外决定。
- 不新增题目，不做随机生成局面。
- 不改动规则引擎和 AI。

## 测试

至少覆盖：

1. `practiceCatalog`：10 道题的 id 都在 `LEARNING_UNITS` 里，不重复；分组和来源正确。`nextPracticeItem` 会跳过「独立完成」、从当前题往后找并绕回开头、全部独立完成时返回 `undefined`。
2. 导航：有「练习」按钮，单字显示「练」，在 `#/practice` 时 `aria-current="page"`。原有的「教学 / 对局 / 复盘」测试照常通过。
3. 在「练」里独立完成一道题：localStorage 记录为 `independent`；回到「学」，卷目里这道题标成已完成；`lastVisited` 没有变。
4. 用过提示或重试后完成：「练」里显示对应状态，「来一道还没独立完成的题」仍然会推荐这道题。
5. 做题时点「下一题」进入下一道未独立完成的题；点「返回练习」回到列表；不会进入课程顺序。
6. 「相关讲解」打开对应课程，导航切到「学」。
7. 从卷目进入同一道题，「下一题」「返回章节」的行为和现在完全一样（现有测试应该全部不改就能通过）。
8. 刷新后在 `#/practice` 回到题目列表，进度还在。

收尾必须运行：`npm test`、`npm run lint`、`npm run build`，全部通过。

## 验收与记录

- 用 `npm run dev` 在真实浏览器里实际操作：打开「练」、做一道题、下一题、返回、相关讲解，再回卷目确认进度。键盘 Tab 和 Enter 能完成全部操作。
- 截图（桌面「练」列表、手机「练」列表、练习中的一题）放到 `docs/qa/practice-hub/`，写一份 README，格式参照 `docs/qa/ink-and-stone/README.md`，写明检查了什么、没检查什么（比如没测实体手机）。截图注意压缩体积，并检查颜色没有失真。
- 更新 `docs/status.md` 的功能说明，以及 README「可以做什么」中的相关一条。

## 交付

- 在 `feature/practice-hub` 上按逻辑分几次提交（路由与导航、题目清单与纯函数、页面与样式、测试、文档）。
- 不合并到 `main`、不推送，交给项目负责人在浏览器里确认。
