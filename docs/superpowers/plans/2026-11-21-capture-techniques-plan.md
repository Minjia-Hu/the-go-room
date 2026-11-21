# 吃子技巧第一段实施计划

**目标**　在「保住自己的棋」之后加入第叁卷「吃掉对方的棋」。课程包含方向叫吃、双叫吃和征子三课，每课两题。练习页增加「别被吃」分组，两题展示征子路线有无接应时的不同结果。

**基线**　从 `main` 的 `9340c3f` 建立 `capture-techniques`。现有 343 个测试、29 个课程单元、22 道练习。设计见[吃子技巧章节设计](../specs/2026-11-21-capture-techniques-design.md)的第一段。

**实施顺序**　按 Task 1 到 Task 6 执行。每项先写测试或验收断言，运行并核对结果，再实现，复验通过后单独提交。测试失败时确认失败来自缺失行为，修正错误的测试输入并记录原因，保留原有断言意图。功能提交用各任务给出的英文说明，无尾注。先核对作者、提交者邮箱均为 `264439153+Minjia-Hu@users.noreply.github.com`。提交留在本地分支。

## 文件结构

| Task | 文件 | 动作与用途 |
| --- | --- | --- |
| 1 | `src/content/capture.ts` | 新建。六题数据、`CaptureScene`、坐标转换 |
| 1 | `src/app/lessons/captureRunner.ts` | 新建。白棋应对、黑白回合、撤销、提示、完成方式、对照重放 |
| 1 | `src/app/lessons/captureRunner.test.ts` | 新建。策略、棋形验证、状态流转和完成方式 |
| 2 | `src/app/lessons/CapturePage.tsx` | 新建。复用分步布局和棋盘 |
| 2 | `src/app/lessons/CapturePage.test.tsx` | 新建。操作、提示、对照、完成去向 |
| 3 | `src/content/ladderDefense.ts` | 新建。两道防守题，两个固定分支及原因 |
| 3 | `src/app/lessons/ladderDefenseRunner.ts` | 新建。逐手重放、选项和答题状态 |
| 3 | `src/app/lessons/ladderDefenseRunner.test.ts` | 新建。固定序列及完成方式 |
| 3 | `src/app/lessons/LadderDefensePage.tsx` | 新建。选择、逐手观察、解释原因 |
| 3 | `src/app/lessons/LadderDefensePage.test.tsx` | 新建。选择、逐手查看、答题与记录门槛 |
| 4 | `src/app/lessons/learningSession.ts` | 增加追吃题内状态、课程定位和刷新恢复 |
| 4、5 | `src/app/lessons/learningProgress.ts` | 加入六个 `capture/*` 课程 ID 和两个 `practice/*` 防守题 ID，分别记录 |
| 4 | `src/app/lessons/LearningPage.tsx` | 插入第叁卷，卷号与索引顺延，连接前后两卷 |
| 4 | `src/app/lessons/ScrollContents.tsx` | 卷首文案显示七卷 |
| 4 | `src/app/lessons/SurvivalPage.tsx` | 最后一道的主按钮由调用方提供「下一章 · 吃掉对方的棋 →」及处理函数 |
| 4 | `src/app/styles.css` | 七卷书脊仍为适应宽度的桌面布局，保留中屏纵向断点 |
| 4 | `src/app/lessons/LearningHome.test.tsx` | 陪练卷精确名称从「第陆卷」改为「第柒卷」，验证完整卷序 |
| 4、5 | `src/app/lessons/LearningPersistence.test.tsx` | 四处总数 29 → 35，更新第伍卷注释为第陆卷，并验证新卷完成和续读 |
| 4 | `src/app/lessons/learningProgress.test.ts` | 29 → 35，验证六个新 ID 的顺序与旧记录兼容 |
| 4 | `src/app/lessons/SurvivalPage.test.tsx` | 改成从生存末题进入吃子卷，仍验证陪练是次要操作和练习文案优先 |
| 4、5 | `src/app/lessons/PracticePage.test.tsx` | Task 4 改 29 → 35，Task 5 改 22 → 24，覆盖别被吃题与学习位置隔离 |
| 4、5 | `src/app/lessons/practiceExtrasProgress.test.ts` | Task 4 改 29 → 35，Task 5 增加防守题分支，保留按题完成及刷新检查 |
| 5 | `src/app/lessons/learningSession.ts` | 增加两道防守题的运行状态 |
| 5 | `src/app/lessons/practiceCatalog.ts` | 加入 `ladder-defense` 来源、两条练习、相关讲解和重做逻辑 |
| 5 | `src/app/lessons/practiceCatalog.test.ts` | 22 → 24，各组题数变为 `[3, 5, 4, 5, 1, 4, 2]`，检查两个新 ID |
| 5 | `src/app/lessons/PracticePage.tsx` | 接入防守页面，第七组用「柒」 |
| 6 | `README.md`、`README.en.md` | 两种语言都更新课程与练习数字和分组 |
| 6 | `docs/status.md` | 课程路径、单元与练习总数、测试数 |
| 6 | `docs/qa/capture-techniques/README.md`、该目录的验收截图 | 记录桌面和手机走查 |

`App` 现有学与练的路由、`BoardLayout`、`Board`、引擎和陪练 AI 接口足以支持以上变化。规则慢镜头里的「学习围地与终局」及其现有测试继续指向终局。

## 题目数据约定

`X` 黑，`O` 白，`.` 空。坐标按棋盘从左到右 A–I、从上到下 1–9。代码中的 `Point` 为零基 `{x,y}`，如 E6 = `{x:4,y:5}`。允许数据模块提供局部 `point('E6')` 转换，运行时棋形仍使用现有 `parseBoard(rows)`。追吃题的 `solution` 只列黑棋手，白棋由策略计算。两道防守题的固定序列从黑先开始，奇数项黑、偶数项白。

六道追吃题的目标开局都是 **2 气**。两道征子基准图各有一份只加一颗白子的对照。以下数据及预期来自提交计划前的临时验证脚本，直接调用本仓库的 `play`、`pass`、`getGroup`，白棋按设计策略现算。脚本存于仓库外。

第一课用两种不同的阻拦位置解释方向。门吃例中白棋向两侧被黑棋堵住的窄口逃，抱吃例中白棋被赶向前方已有黑棋的一侧。术语可对照[金钥匙围棋学校的吃子课](https://goldenkeygoschool.weebly.com/beginner-65288200132599165289/lesson-2-capture-stones)，本计划棋形为自行构造。

### 第 1 课 · 引导 · 关住白棋的出路

`id = direction-guided`，`guided = true`。

`rows`

```text
.........
.X.X.....
.XOX.....
.........
.........
.........
.........
.........
.........
```

- `targets = ["C3"]`
- `solution = ["C4", "C2"]`
- `wrongFirst = C2`
- `maxMoves = 2`
- `task`　把白棋赶进上方窄口，再提掉它。
- `intro`　白棋有两个出口。往下逃能走到空处，往上逃会遇到两侧的黑子。
- `hints`　["先看白棋上下两个出口。", "标出白棋以及它仅剩的两口气。", "看黑棋从下方叫吃，再堵住剩下的气。"]

### 第 1 课 · 检验 · 赶向有黑棋的一边

`id = direction-check`，`guided = false`。

`rows`

```text
.....XO.X
.........
.........
.........
.........
.........
.........
.........
.........
```

- `targets = ["G1"]`
- `solution = ["G2", "H1"]`
- `wrongFirst = H1`
- `maxMoves = 2`
- `task`　从正确的方向叫吃白棋。
- `intro`　这次白棋在上边。比较它往右和往下逃时会遇到什么。
- `hints`　["留意上边线和右上角的黑棋。", "标出白棋和它的两口气。", "看黑棋从下方叫吃，把白棋赶向右侧黑棋。"]

### 第 2 课 · 引导 · 一手叫吃两块棋

`id = double-guided`，`guided = true`。

`rows`

```text
.........
..X......
.........
.XOX.....
...OX....
.........
...X.....
.........
.........
```

- `targets = ["C4", "D5"]`
- `solution = ["C5", "D6"]`
- `wrongFirst = C3`
- `maxMoves = 2`
- `task`　下一手同时叫吃两块白棋。
- `intro`　两颗白棋各有两口气。找一个对两颗白棋都有效的交叉点。
- `hints`　["分别数两颗白棋的气，找它们共同的空点。", "标出两个目标及各自的气。", "看黑棋下一手同时压住两块，白棋救一块后提另一块。"]

### 第 2 课 · 检验 · 别只叫吃一块

`id = double-check`，`guided = false`。

`rows`

```text
.....X...
..X.XX...
X.O.O....
.XX.X....
.........
.........
.........
.........
.........
```

- `targets = ["C3", "E3"]`
- `solution = ["D3", "B3"]`
- `wrongFirst = B3`
- `maxMoves = 2`
- `task`　找到能同时叫吃两块棋的一手。
- `intro`　这里有个点也能叫吃，但只威胁其中一块。看看同时威胁两块该下哪里。
- `hints`　["两颗白棋之间的空点同时贴着谁？", "标出两个目标和它们的气。", "看黑棋下在两颗白棋之间，白棋救一边后提另一边。"]

### 第 3 课 · 引导 · 沿着台阶追到边上

`id = ladder-guided`，`guided = true`。

`rows`

```text
.........
.........
....X....
.........
...XOX...
.........
.........
.........
.........
```

- `targets = ["E5"]`
- `solution = ["E6", "D4", "G4", "F2", "H3", "G1", "I2", "H1"]`
- `wrongFirst = E4`
- `maxMoves = 8`
- `task`　每手叫吃，沿着台阶把白棋追到边上。
- `intro`　白棋每次逃出会出现新的两口气。选对方向，就能连续叫吃。
- `hints`　["想想第一手之后，白棋会被赶向哪边。", "标出目标白棋整块和当前的气。", "看黑棋怎样持续叫吃到边上，再提掉白棋。"]

`contrastRows`

```text
......O..
.........
....X....
.........
...XOX...
.........
.........
.........
.........
```

### 第 3 课 · 检验 · 换个方向征白棋

`id = ladder-check`，`guided = false`。

`rows`

```text
.........
.........
...XX....
..XO.....
.........
.........
.........
.........
.........
```

- `targets = ["D4"]`
- `solution = ["D5", "F4", "E6", "G5", "F7", "H6", "G8", "I7", "H9", "I8"]`
- `wrongFirst = E4`
- `maxMoves = 10`
- `task`　先看路线，再一路叫吃提掉白棋。
- `intro`　阶梯换了方向。先看白棋逃跑的路线，确认那里没有接应。
- `hints`　["想想你希望白棋向哪个方向逃。", "标出目标白棋整块和当前的气。", "看黑棋怎样沿斜线追到底边。"]

`contrastRows`

```text
.........
.........
...XX....
..XO.....
.....O...
.........
.........
.........
.........
```

### 「别被吃」的两道固定变化题

用独立的 `LadderDefenseScene` 存 `id/title/rows/target/choices/answer/reasons/reasonAnswer/intro`。其中 `choices` 按 A「继续逃」、B「在别处下」排列，每项存棋步数组 `moves` 及终盘反馈。下方的 `targets/solution/wrongFirst/maxMoves` 是与追吃题并列的验收资料，防守题运行时按固定序列播放。两题同形，第二题多黑 G1。

#### 路上没有接应

`id = ladder-defense-no-help`。初始黑 E5 仅剩一气。

`rows`

```text
.........
.........
....O....
.........
...OXO...
....O....
.........
.........
.........
```

- `targets = ["E5"]`
- `solution = ["A9"]`
- `wrongFirst = E4`
- `maxMoves = 7`（最长分支的黑棋手数）
- A「继续逃」完整黑白序列 `["E4", "D4", "F4", "G4", "F3", "F2", "G3", "H3", "G2", "G1", "H2", "I2", "H1", "I1"]`。终盘白 I1 提走连续逃出的 8 颗黑棋。
- B「在别处下」完整黑白序列 `["A9", "E4"]`。终盘白 E4 提掉目标一颗，黑 A9 仍在。
- 正确选 B。理由选项为「一路没有接应，继续逃会让更多棋被提」与「只要再接一颗，黑棋一定能多出气」，正确选前者。

#### 路上有接应

`id = ladder-defense-with-help`。初始黑 E5 仅剩一气。

`rows`

```text
......X..
.........
....O....
.........
...OXO...
....O....
.........
.........
.........
```

- `targets = ["E5"]`
- `solution = ["E4", "F4", "F3", "G3", "G2"]`
- `wrongFirst = A9`
- `maxMoves = 5`（最长分支的黑棋手数）
- A「继续逃」完整黑白序列 `["E4", "D4", "F4", "G4", "F3", "F2", "G3", "H3", "G2"]`。终盘黑 G2 连上原有黑 G1，目标成为有 3 气的 7 颗棋。
- B「在别处下」完整黑白序列 `["A9", "E4"]`。终盘白 E4 提掉目标一颗，黑 A9 仍在。
- 正确选 A。理由选项为「棋盘上有一颗黑棋就一定安全」与「沿这条路线能连到接应的黑棋，多出气」，正确选后者。

## 验证脚本输出摘要

| 题 | 目标开局气数 | 正解结果 | 错手后白棋第一次应对 | 接应对照 |
| --- | --- | --- | --- | --- |
| 关住白棋的出路 | 2 | 第 2 / 2 手提掉 | 白 C4，3 气 | — |
| 赶向有黑棋的一边 | 2 | 第 2 / 2 手提掉 | 白 G2，3 气 | — |
| 一手叫吃两块棋 | 2、2 | 黑 C5 后两块各剩一气，白 C3 救上方，黑 D6 在第 2 / 2 手提另一块 | 白 C5，两块连上，3 气 | — |
| 别只叫吃一块 | 2、2 | 黑 D3 后两块各剩一气，白 F3 救右方，黑 B3 在第 2 / 2 手提另一块 | 白 D3，两块连上，3 气 | — |
| 沿着台阶追到边上 | 2 | 第 8 / 8 手提掉，白棋第 7 回合停手 | 白 E6，3 气 | 第 5 回合白 G2 连上 G1，3 气 |
| 换个方向征白棋 | 2 | 第 10 / 10 手提掉，白棋第 9 回合停手 | 白 D5，3 气 | 第 2 回合白 E5 连上 F5，3 气 |

正解白棋应对顺序用于核对策略，终手黑棋已提掉目标，因此没有白棋应对。

- 关住白棋、赶向有黑棋的一边各为「停」。
- 双叫吃两题分别为 C3、F3。
- 征子引导为 E4、F4、F3、G3、G2、H2、停。
- 征子检验为 E4、E5、F5、F6、G6、G7、H7、H8、停。
- 防守无接应 A/B 分支分别为 14/2 个合法着手，目标被提 8/1 子。有接应 A/B 分支分别为 9/2 个合法着手，目标连上后有 3 气／目标被提 1 子。

## 实施时遵循的判定细节

- `wrongFirst` 之后的黑棋自动走法在设计中未定义。六个错手都让白棋第一回合走到 3 气，对照播放到这手白棋应对即可结束。征子对照按正解前缀重放，终止在白棋逃出那一手。两道征子都存对照数据，界面按设计只在引导题完成后提供对照入口。
- 「扫描顺序」统一为先行后列，即从上到下、每行从左到右。反提同大小时比较候选黑块最先出现的棋子，延伸同气数时比较白棋候选落点。候选落点先经 `play` 验证，过滤禁入点和重复局面。原始目标相连后只算同一块。
- 回合判定顺序按设计。合法黑棋落子提任一目标即胜，含最后一手；未提到才让白棋应对。白棋提到黑棋先判失败，其次任一剩余目标达到 3 气判逃出，最后判断是否耗尽黑棋手数。这是本组教学题的停止条件。
- 提示沿用现有引导题起始已有一级提示的记法。引导题开场展示文字提示，检验题手动索取文字提示；第二级标记，第三级从原图重放 `solution` 并记为演示。提示、失败和撤销不得改变已有最佳完成记录。
- 防守正确选「在别处下」时只说明在这条固定变化里少损失棋子，不能把示例 A9 当作实战最佳手。有接应时以连到指定黑子且达到 3 气说明局部逃出。

### Task 1：追吃策略、状态与六题数据

- [ ] **先测试。** 新建 `captureRunner.test.ts`。先用内联局面验证相邻黑棋可提时优先于延伸、多个可提块优先最大、同大小按扫描顺序、目标有多个合法出口时选气最多、同气数取较早落点、不能长到 2 气时停手。增加多个目标气数不等时只试最少气组、合并目标去重、非法候选不返回的检查。用上面的六题数据做表驱动测试，断言每个初始目标是白棋且在 1–2 气之间，正解的第一手叫吃相应目标，六个正解终盘有目标原始坐标变空，六个错手第一回合逃出，两条对照连上新增白棋且按预期手数退出。双叫吃额外检查白应之前两块都只剩一气、之后仅救了一块。测状态的终止顺序、非法不消耗手数、合法非正解仍现算白应、失败加一次错误、退回整回合、成功后无法撤销、五种完成方式。运行 `npx vitest run src/app/lessons/captureRunner.test.ts`，预期因实现缺失失败。
- [ ] **再实现。** 按题目数据建立 `CaptureScene`（`lesson` 取 1–3，补充页面文案字段 `task`）。在 `captureRunner.ts` 导出 `captureReply(game, targets): Point | null`，调用方把 `null` 转给引擎 `pass`。去重既用于参与选择的白块，也用于相邻候选黑块。纯状态至少保有原图、当前 `GameState`、上一步回合快照栈、黑棋已走手数、阶段 `active/failed/done`、错误次数、提示级别、演示标记和消息。用全局公开引擎接口和现有 `REJECTIONS`。撤销恢复回合前的引擎状态、手数及轮到哪方，保留错误和提示次数。对照重放与实际答题分开，只读返回逐手盘面。完成方式沿用既有五级含义，通过 `import type` 使用学习记录的完成类型。
- [ ] **验证、提交。** 运行上面的单测，确认全部通过。只暂存 Task 1 文件，提交 `Add verified capture puzzles and deterministic white replies`。

### Task 2：追吃页面

- [ ] **先测试。** 新建 `CapturePage.test.tsx`，用有状态的测试外壳加载真实题。点错后白棋立即应对、显示失败理由，棋盘冻结且只有「退回一手」是实心主按钮。撤销后核对黑白都被撤回。按正解完成后不再有撤销按钮。验证两级提示、演示完成的标签、可访问的折叠区、征子对照切换时的真实盘面、浏览对照不写回解题状态，以及通过传入的回调分别进入下一题和终局。运行 `npx vitest run src/app/lessons/CapturePage.test.tsx`，确认新测试失败。
- [ ] **再实现。** 新组件复用 `BoardLayout`、`Board`、`LessonFeedback` 与 `COMPLETION_LABELS`。标题显示「追吃中 · 已下 n 手 / 最多 m 手」和 `scene.task`，失败显示「这次没吃到」，完成显示完成方式。原图直接点下黑棋，白棋当回合应对。活动时有历史才显示次要撤销，失败时以撤销为主、重来为次。引言、图例收在「讲解与图例」中，首次反馈前可在棋盘旁读到引言。引导题完成显示默认收起的「看看对照」，用上一手、下一手和回原图浏览。完成去向由调用方传入，最后一题支持次要的陪练入口。使用当前分步样式类，按需用 `aria-label` 标注可交互控件。
- [ ] **验证、提交。** 单测通过后运行 `npm run lint`、`npm run build`。提交 `Guide learners through capture puzzles`。

### Task 3：「别被吃」固定变化

- [ ] **先测试。** 新建 `ladderDefenseRunner.test.ts` 与 `LadderDefensePage.test.tsx`。四条序列从各自原图逐手调用引擎，断言每手合法、回放到中途不会提前判题、结局与本计划一致。错误分支只在首次播到结尾时加一次错误，往回浏览不会重复加分。观看正确分支结尾才可提交原因；答错原因不算完成，答对后按独立、重试、提示记录。页面验证 A/B 从原图分别开始、可逐步前后看、两个正确选项各自匹配，不共享棋盘。运行 `npx vitest run src/app/lessons/ladderDefenseRunner.test.ts src/app/lessons/LadderDefensePage.test.tsx` 确认红灯。
- [ ] **再实现。** 组装两道数据与纯回放状态。参考策略课从原图逐手调用 `play` 的方式，关键状态保存选择、当前步、是否已经看完此次选择、原因、帮助和错误次数。启用前后步控制，固定序列禁止手点落子，能返回查看原图并比较另一选择。带图说明末步捕获数和连上后的气数。复用「先后判断」的题目布局和样式，页面只通过 props 接收下一练习回调和文案。
- [ ] **验证、提交。** 两个测试文件都通过后提交 `Add two ladder defense drills with fixed variations`。

### Task 4：第叁卷、前后衔接与学习记录

- [ ] **先测试。** 在 `learningProgress.test.ts` 断言 35 个稳定 ID，`capture/*` 按 1 引导、1 检验、2 引导、2 检验、3 引导、3 检验连续排在生存之后、终局之前。给已有 29 单元的版本 1 记录做解析测试，保留已有完成方式与 `lastVisited`，完成生存末题后续读捕捉第一题。用 `LearningHome.test.tsx` 检查七卷准确顺序和第叁卷每组引导／检验。用 `LearningPersistence.test.tsx` 实际走生存末题 → 吃子首题，保存与刷新回到继续位置；再从新卷末题按主按钮去围地，从次要按钮去陪练。改 `SurvivalPage.test.tsx` 的末题衔接测试，保留 `nextLabel` 练习去向测试。按文件结构表更新其余 29 的旧断言，规则慢镜头的终局按钮用例保持原期望。运行这六个受影响的测试文件，确认包含 29 → 35 和新卷衔接的预期失败。
- [ ] **再实现。** 加入 `LearningSession.page = 'capture'` 分支、`captureIndex`、六个 `captureRuns`。在 `currentLearningUnit`、`openLearningUnit` 和学习记录中接入；只记录完成方式及稳定 ID，不变更存储版本和已有 ID。用 `LearningLink` 和原有课程配对样式列新卷；卷号为壹、贰、叁吃掉对方的棋、肆围地与终局、伍九路策略入门、陆从看懂到自己下、柒有提示的陪练。同步 `chapterOf` 和卷目标题。七条书脊在桌面每条由 118 px 收到约 104 px，保留现有中屏纵向断点，使课程目录正文仍有宽度。生存末题把主按钮目标传给通用页，旁边的陪练仍通过原回调，其他生存题与专项入口不变。新卷引导题进入同一课的检验题，检验题写明下一课名字，末题主按钮进入终局、次要按钮进入陪练。
- [ ] **验证、提交。** 运行 `npm test && npm run lint && npm run build`。提交 `Insert capture lessons into the learning path`。

### Task 5：练习目录接入与记录隔离

- [ ] **先测试。** `practiceCatalog.test.ts` 验证 24 项、七组、两个 `practice/ladder-defense-*` ID、相关讲解为 `capture/ladder-guided` 及原有分类顺序。`PracticePage.test.tsx` 验证第七组标题、完成后推荐下一题、无未独立题时回列表，更新题数断言。扩充 `practiceExtrasProgress.test.ts` 的表驱动测试，使两道题也验证答题前不落盘、完成可跨刷新读取、仍为 35 个课程单元、练习不会改写课程游标；验证原旧记录继续可读。在 `LearningPersistence.test.tsx` 检查从防守题「相关讲解」主动进入征子课才更新续读位置。先运行四个测试文件核对失败。
- [ ] **再实现。** 会话初始化两道 `ladderDefenseRuns`，加入练习目录的 `ladder-defense` 来源。第七组「别被吃」及「柒」序号追加在现有组之后，点击相关讲解进入征子引导题。路由继续复用「练」和现有 `visit: false` 的保存入口。完成题重做初始化，未完成题返回保留状态。读写白名单和记录合并都使用 `practice/<scene-id>`，不放入 `LEARNING_UNITS`。推荐排除已独立完成的条目，延续原有循环。
- [ ] **验证、提交。** 运行 `npm test && npm run lint && npm run build`。提交 `Add ladder defense to the practice catalog`。

### Task 6：浏览器验收与文档

- [ ] **先编写验收断言。** 使用仓库外临时 Playwright 脚本，覆盖 1440 × 900 和 375 × 667 两个视口。断言卷序、35 个课程单元、24 个练习、六题正常完成、错手撤回、两种征子对照能分辨、有无接应都能回放到结尾并答原因、记录刷新后仍在、练习不会改动课程位置。纵向断点两侧各抽查一次卷目布局。先执行并记录结果，按任务文件表记录确需修复的缺陷及对应回归，保留未通过的验收项直到复验通过。
- [ ] **再写文档和截图。** 从实际浏览器保存新卷目录、方向叫吃完成、双叫吃、征子正解或接应对照、「别被吃」结局等截图进 `docs/qa/capture-techniques/`，桌面和手机各覆盖代表状态。验收 README 如实列出走查、测试总数与未验证范围。更新 `docs/status.md` 与双语 README 的课程、练习数字及说明。
- [ ] **验证、提交。** 最后运行 `npm test && npm run lint && npm run build` 和 `git diff --check`。按实际结果更新验收记录并提交 `Record capture techniques QA and learning counts`。
