# 生存课分步布局实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让“保住自己的棋”八个场景的通用页面一次只给一句任务和一个主按钮，显示“第几步 / 共几步”，完成后写明去向。

**Architecture:** 新增纯函数 `survivalSteps(run)`，从现有 `SurvivalRun` 推导当前步骤，不改状态机。`SurvivalPage` 按 `BoardLayout` 的四个槽位重排：标题区放步骤，主操作区放唯一主按钮，引言、图例、统计和对照收进默认关闭的 `<details>`。

**Tech Stack:** React 19 + TypeScript + Vite，测试用 Vitest + Testing Library（jsdom），lint 用 oxlint。

**设计文档：** `docs/superpowers/specs/2026-11-21-survival-step-layout-design.md`

**仓库约定：**
- commit message 用英文，**不加任何尾注**（不加 `Co-Authored-By` 等）。
- 提交邮箱必须是 `264439153+Minjia-Hu@users.noreply.github.com`（全局 git config 已设置）。
- 分支：`survival-step-layout`，不 push、不合并。
- 界面文案、代码注释用中文，与现有代码一致。

**已知事实（写计划时核对过）：**
- jsdom 中关闭的 `<details>` 里的元素仍可被 `getByRole` / `getByText` 找到并点击，所以把内容收进折叠不会让现有测试找不到元素。验证折叠状态时用 `closest('details')!.open`。
- `<span aria-hidden="true">` 内的文字不计入按钮的可访问名称。现有测试用 `click('学习围地与终局')` 精确匹配，所以箭头必须放在 `aria-hidden` 的 span 里。
- 第一题 `danger-guided` 由 `GuidedDangerPage` 处理，本计划不改它。
- 用到通用页的认危险题，目标棋块都是多颗棋（2、3、3 颗）。

---

## 文件结构

| 文件 | 动作 | 职责 |
|---|---|---|
| `src/app/lessons/survivalRunner.ts` | 修改 | 新增 `survivalCompletion(run)`，作为完成方式的唯一来源 |
| `src/app/lessons/learningProgress.ts` | 修改 | 生存课与认危险专项题的记录改用 `survivalCompletion` |
| `src/app/lessons/survivalSteps.ts` | 新建 | `survivalSteps`、`awaitingConfirm`、`survivalNextLabel` 三个纯函数 |
| `src/app/lessons/survivalSteps.test.ts` | 新建 | 步骤表单元测试 |
| `src/app/lessons/SurvivalPage.tsx` | 修改 | 按槽位重排 |
| `src/app/lessons/SurvivalPage.test.tsx` | 新建 | 页面结构测试 |
| `src/app/lessons/LearningPage.tsx` | 修改 | 传入 `survivalNextLabel`，底部工具栏降权 |
| `src/app/styles.css` | 修改 | 步骤标签、折叠区、降权工具栏样式 |
| `docs/qa/survival-step-layout/README.md` | 新建 | 验收记录与截图 |
| `docs/status.md` | 修改 | 记录本轮变化与测试数 |

---

### Task 1: 抽出 `survivalCompletion`

**Files:**
- Modify: `src/app/lessons/survivalRunner.ts`
- Modify: `src/app/lessons/learningProgress.ts:55-65`
- Test: `src/app/lessons/survivalRunner.test.ts`

- [ ] **Step 1: 写失败的测试**

在 `src/app/lessons/survivalRunner.test.ts` 末尾追加（import 行加入 `survivalCompletion`）：

```ts
describe('完成方式', () => {
  const scene = (id: string) => SURVIVAL_SCENES.find((s) => s.id === id)!
  const finishDanger = (run: ReturnType<typeof startSurvival>) => {
    const next = choosePracticePoint(run, run.scene.target)
    return choosePracticePoint(next, getGroup(run.game.board, run.scene.target)!.liberties[0])
  }
  it('检验题：独立、重试、提示、演示依次区分', () => {
    const start = startSurvival(scene('danger-check'))
    expect(survivalCompletion(finishDanger(start))).toBe('independent')
    expect(survivalCompletion(finishDanger(choosePracticePoint(start, { x: 8, y: 8 })))).toBe('retry')
    expect(survivalCompletion(finishDanger(practiceHint(start)))).toBe('hint')
    expect(survivalCompletion(practiceHint(practiceHint(practiceHint(start))))).toBe('demo')
  })
  it('引导题起始自带一级提示，不算借助提示', () => {
    let run = startSurvival(scene('eyes-guided'))
    for (const p of run.scene.eyes!) run = choosePracticePoint(run, p)
    expect(survivalCompletion(chooseReason(run, true))).toBe('guided')
  })
})
```

- [ ] **Step 2: 运行，确认失败**

Run: `npx vitest run src/app/lessons/survivalRunner.test.ts`
Expected: FAIL，提示 `survivalCompletion` 不存在（is not a function / not exported）。

- [ ] **Step 3: 实现**

在 `src/app/lessons/survivalRunner.ts` 顶部 import 区加入：

```ts
import type { Completion } from './learningProgress'
```

在文件末尾加入：

```ts
/** 与学习记录一致的完成方式：演示 > 提示 > 引导 > 重试 > 独立。引导题开场已给一级提示，不算借助提示。 */
export function survivalCompletion(run: SurvivalRun): Completion {
  if (run.assisted) return 'demo'
  if (run.hint > (run.scene.guided ? 1 : 0)) return 'hint'
  if (run.scene.guided) return 'guided'
  return run.mistakes > 0 ? 'retry' : 'independent'
}
```

在 `src/app/lessons/learningProgress.ts` 顶部加入：

```ts
import { survivalCompletion } from './survivalRunner'
```

把这两段：

```ts
  session.runs.forEach((run) => {
    if (run.stage === 'done') record(`survival/${run.scene.id}`, run.assisted ? 'demo'
      : run.hint > (run.scene.guided ? 1 : 0) ? 'hint' : run.scene.guided ? 'guided' : run.mistakes > 0 ? 'retry' : 'independent')
  })
```

```ts
  session.practiceDangerRuns.forEach((run) => {
    if (run.stage === 'done') record(`practice/${run.scene.id}`, run.assisted ? 'demo' : run.hint > 0 ? 'hint' : run.mistakes > 0 ? 'retry' : 'independent')
  })
```

替换为：

```ts
  session.runs.forEach((run) => { if (run.stage === 'done') record(`survival/${run.scene.id}`, survivalCompletion(run)) })
```

```ts
  session.practiceDangerRuns.forEach((run) => { if (run.stage === 'done') record(`practice/${run.scene.id}`, survivalCompletion(run)) })
```

（专项危险题在 `practiceExtras.ts` 中都是 `guided: false`，所以两种写法结果相同。）

- [ ] **Step 4: 运行，确认通过**

Run: `npx vitest run src/app/lessons/survivalRunner.test.ts src/app/lessons/learningProgress.test.ts`
Expected: 全部 PASS。

- [ ] **Step 5: 提交**

```bash
git add src/app/lessons/survivalRunner.ts src/app/lessons/survivalRunner.test.ts src/app/lessons/learningProgress.ts
git commit -m "Share survival completion mode between page and progress record"
```

---

### Task 2: 步骤表 `survivalSteps`

**Files:**
- Create: `src/app/lessons/survivalSteps.ts`
- Test: `src/app/lessons/survivalSteps.test.ts`

- [ ] **Step 1: 写失败的测试**

新建 `src/app/lessons/survivalSteps.test.ts`：

```ts
import { describe, expect, it } from 'vitest'
import { getGroup } from '../../engine'
import { SURVIVAL_SCENES } from '../../content/survival'
import { choosePracticePoint, chooseReason, confirmPractice, practiceHint, startSurvival } from './survivalRunner'
import { awaitingConfirm, survivalNextLabel, survivalSteps } from './survivalSteps'

const scene = (id: string) => SURVIVAL_SCENES.find((s) => s.id === id)!

describe('步骤表', () => {
  it('认危险：找棋 → 找气 → 完成', () => {
    let run = startSurvival(scene('danger-check'))
    expect(survivalSteps(run)).toMatchObject({ current: 1, total: 2, label: '找棋', task: '点出你觉得有危险的一块黑棋。', done: false })
    run = choosePracticePoint(run, run.scene.target)
    expect(survivalSteps(run)).toMatchObject({ current: 2, total: 2, label: '找气', task: '点出这整块黑棋最后的一口气。' })
    run = choosePracticePoint(run, getGroup(run.game.board, run.scene.target)!.liberties[0])
    expect(survivalSteps(run)).toMatchObject({ current: 2, total: 2, label: '独立完成', done: true })
    expect(survivalSteps(run).task).toBeUndefined()
  })

  it('连接：选点试下 → 看后果，再确认', () => {
    let run = startSurvival(scene('connect-check'))
    expect(survivalSteps(run)).toMatchObject({ current: 1, total: 2, label: '选点试下' })
    run = choosePracticePoint(run, run.scene.examples[0])
    expect(awaitingConfirm(run)).toBe(true)
    expect(survivalSteps(run)).toMatchObject({ current: 2, total: 2, label: '看后果，再确认' })
    expect(survivalSteps(confirmPractice(run)).done).toBe(true)
  })

  it('找出路引导题：确认一种后回到第一步，并显示比较进度', () => {
    const start = startSurvival(scene('escape-guided'))
    let run = confirmPractice(choosePracticePoint(start, start.scene.examples[0]))
    expect(run.stage).toBe('move')
    expect(awaitingConfirm(run)).toBe(false)
    expect(survivalSteps(run)).toMatchObject({ current: 1, label: '选点试下', progress: '已比较 1 / 2 种', task: '从同一起点再试另一种办法：延伸，或提掉白棋。' })
    run = choosePracticePoint(run, start.scene.examples[1])
    expect(survivalSteps(run)).toMatchObject({ current: 2, progress: '已比较 1 / 2 种' })
    run = confirmPractice(run)
    expect(survivalSteps(run)).toMatchObject({ done: true, label: '跟着引导完成' })
    expect(survivalSteps(run).progress).toBeUndefined()
  })

  it('两只眼：第一个眼 → 第二个眼 → 说出原因', () => {
    let run = startSurvival(scene('eyes-check'))
    expect(survivalSteps(run)).toMatchObject({ current: 1, total: 3, label: '试第一个眼' })
    run = choosePracticePoint(run, run.scene.eyes![0])
    expect(survivalSteps(run)).toMatchObject({ current: 2, total: 3, label: '试第二个眼' })
    run = choosePracticePoint(run, run.scene.eyes![1])
    expect(survivalSteps(run)).toMatchObject({ current: 3, total: 3, label: '说出原因', task: '为什么白棋下不进这两个眼？' })
    run = chooseReason(chooseReason(run, false), true)
    expect(survivalSteps(run)).toMatchObject({ done: true, label: '重试后完成' })
  })

  it('借助提示或演示完成时保留重来建议', () => {
    const start = startSurvival(scene('danger-check'))
    const hinted = practiceHint(start)
    const viaHint = choosePracticePoint(choosePracticePoint(hinted, start.scene.target), getGroup(start.game.board, start.scene.target)!.liberties[0])
    expect(survivalSteps(viaHint)).toMatchObject({ label: '借助提示完成', task: '可以重来一次，不看提示试试。' })
    const viaDemo = practiceHint(practiceHint(practiceHint(start)))
    expect(survivalSteps(viaDemo)).toMatchObject({ label: '跟着演示完成', task: '可以重来一次，自己找答案。' })
  })
})

describe('下一步去向', () => {
  it('引导题去检验题，检验题写明下一课标题，最后一题交给页面', () => {
    expect(survivalNextLabel(2)).toBe('换个局面，自己试试 →')
    expect(survivalNextLabel(1)).toBe('下一课 · 给自己的棋找出路 →')
    expect(survivalNextLabel(3)).toBe('下一课 · 把分开的棋连起来 →')
    expect(survivalNextLabel(SURVIVAL_SCENES.length - 1)).toBeUndefined()
  })
})
```

- [ ] **Step 2: 运行，确认失败**

Run: `npx vitest run src/app/lessons/survivalSteps.test.ts`
Expected: FAIL，提示找不到模块 `./survivalSteps`。

- [ ] **Step 3: 实现**

新建 `src/app/lessons/survivalSteps.ts`：

```ts
import { getGroup, samePoint } from '../../engine'
import { SURVIVAL_SCENES } from '../../content/survival'
import { COMPLETION_LABELS } from './learningProgress'
import { survivalCompletion } from './survivalRunner'
import type { SurvivalRun } from './survivalRunner'

/** 生存课当前处在第几步。只从现有状态推导，不改变状态机。 */
export interface SurvivalStep {
  readonly current: number
  readonly total: number
  readonly label: string
  readonly task?: string
  readonly progress?: string
  readonly done: boolean
}

const TOTAL = { danger: 2, escape: 2, connect: 2, eyes: 3 } as const

/** 试下合法、且这个点还没被确认为本题解法时，才需要“确认这一步”。 */
export function awaitingConfirm(run: SurvivalRun): boolean {
  const point = run.preview?.ok ? run.preview.point : null
  return run.stage === 'move' && !!point && !run.solved.some((p) => samePoint(p, point))
}

export function survivalSteps(run: SurvivalRun): SurvivalStep {
  const { scene } = run
  const total = TOTAL[scene.kind]
  if (run.stage === 'done') {
    const mode = survivalCompletion(run)
    const task = mode === 'demo' ? '可以重来一次，自己找答案。' : mode === 'hint' ? '可以重来一次，不看提示试试。' : undefined
    return { current: total, total, label: COMPLETION_LABELS[mode], task, done: true }
  }
  if (scene.kind === 'danger') {
    if (run.stage === 'group') return { current: 1, total, label: '找棋', task: '点出你觉得有危险的一块黑棋。', done: false }
    const single = getGroup(run.game.board, scene.target)!.stones.length === 1
    return { current: 2, total, label: '找气', task: single ? '点出这颗黑棋最后的一口气。' : '点出这整块黑棋最后的一口气。', done: false }
  }
  if (scene.kind === 'eyes') {
    if (run.stage === 'reason') return { current: 3, total, label: '说出原因', task: '为什么白棋下不进这两个眼？', done: false }
    return run.selected.length === 0
      ? { current: 1, total, label: '试第一个眼', task: '替白棋点一个黑棋围住的内部空点，看看能不能下。', done: false }
      : { current: 2, total, label: '试第二个眼', task: '再点另一个内部空点试试。', done: false }
  }
  const progress = scene.kind === 'escape' && scene.guided && run.solved.length > 0
    ? `已比较 ${run.solved.length} / ${scene.examples.length} 种` : undefined
  if (awaitingConfirm(run)) return { current: 2, total, label: '看后果，再确认', task: '比较下之前和下之后，能解除危险就确认这一步。', progress, done: false }
  return { current: 1, total, label: '选点试下',
    task: progress ? '从同一起点再试另一种办法：延伸，或提掉白棋。' : '点一个空点试下，看看目标黑棋的气会怎样变化。', progress, done: false }
}

/** 课程中完成一题后主按钮的文案；最后一题返回 undefined，由页面显示终局与陪练两个去向。 */
export function survivalNextLabel(index: number): string | undefined {
  const scene = SURVIVAL_SCENES[index]
  const next = SURVIVAL_SCENES[index + 1]
  if (!scene || !next) return undefined
  return scene.guided ? '换个局面，自己试试 →' : `下一课 · ${next.title} →`
}
```

- [ ] **Step 4: 运行，确认通过**

Run: `npx vitest run src/app/lessons/survivalSteps.test.ts`
Expected: 全部 PASS。如果“重试后完成”那条失败，先检查 `chooseReason(run, false)` 是否增加了 `mistakes`（应为 1）。

- [ ] **Step 5: 提交**

```bash
git add src/app/lessons/survivalSteps.ts src/app/lessons/survivalSteps.test.ts
git commit -m "Derive survival lesson steps from the existing run state"
```

---

### Task 3: 重排 `SurvivalPage`

**Files:**
- Modify: `src/app/lessons/SurvivalPage.tsx`（整个组件的 JSX 部分）
- Test: `src/app/lessons/SurvivalPage.test.tsx`

- [ ] **Step 1: 写失败的测试**

新建 `src/app/lessons/SurvivalPage.test.tsx`：

```tsx
// @vitest-environment jsdom
import { useState } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SURVIVAL_SCENES } from '../../content/survival'
import { SurvivalPage } from './SurvivalPage'
import { startSurvival } from './survivalRunner'

afterEach(cleanup)
const scene = (id: string) => SURVIVAL_SCENES.find((s) => s.id === id)!
interface HarnessProps { readonly id: string; readonly isLast?: boolean; readonly nextLabel?: string; readonly onNext?: () => void; readonly onScoring?: () => void }
function Harness({ id, isLast = false, nextLabel, onNext = vi.fn(), onScoring }: HarnessProps) {
  const [run, setRun] = useState(() => startSurvival(scene(id)))
  return <SurvivalPage run={run} onChange={setRun} onNext={onNext} isLast={isLast} nextLabel={nextLabel} onScoring={onScoring} />
}
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }))
const point = (x: number, y: number) => click(`交叉点 ${x},${y}`)
/** 主操作区里的实心主按钮（不含 ghost 与文字链接）。 */
const solid = (container: HTMLElement) => [...container.querySelectorAll('.board-primary .button:not(.button--ghost)')].map((b) => b.textContent)
const folded = (summary: string) => screen.getByText(summary).closest('details')!

describe('生存课分步布局', () => {
  it('认危险：开场显示引言与第 1 步，讲解默认收起；完成后只有一个主按钮', () => {
    const { container } = render(<Harness id="danger-check" />)
    expect(screen.getByText('第 1 步 / 共 2 步 · 找棋')).toBeTruthy()
    expect(container.querySelector('.board-primary .step-intro')!.textContent).toBe(scene('danger-check').intro)
    expect(folded('讲解与图例').open).toBe(false)
    expect(solid(container)).toEqual([])
    point(0, 3)
    expect(screen.getByText('第 2 步 / 共 2 步 · 找气')).toBeTruthy()
    expect(container.querySelector('.board-primary .step-intro')).toBeNull()
    point(0, 5)
    expect(screen.getByText('独立完成')).toBeTruthy()
    expect(solid(container)).toEqual(['下一课 →'])
    expect(folded('看看对照').open).toBe(false)
  })

  it('找出路引导题：试下后才有“确认这一步”，确认一种后显示比较进度', () => {
    const { container } = render(<Harness id="escape-guided" />)
    point(4, 5)
    expect(screen.getByText('第 2 步 / 共 2 步 · 看后果，再确认')).toBeTruthy()
    expect(solid(container)).toEqual(['确认这一步'])
    click('确认这一步')
    expect(screen.getByText('第 1 步 / 共 2 步 · 选点试下')).toBeTruthy()
    expect(screen.getByText('已比较 1 / 2 种')).toBeTruthy()
    expect(solid(container)).toEqual([])
    point(4, 2); click('确认这一步')
    expect(screen.getByText('跟着引导完成')).toBeTruthy()
    expect(solid(container)).toEqual(['换个局面，自己试试 →'])
  })

  it('两只眼：说出原因时没有主按钮，对照收在折叠里', () => {
    const { container } = render(<Harness id="eyes-guided" />)
    point(3, 4)
    expect(screen.getByText('第 2 步 / 共 3 步 · 试第二个眼')).toBeTruthy()
    point(5, 4)
    expect(screen.getByText('第 3 步 / 共 3 步 · 说出原因')).toBeTruthy()
    expect(solid(container)).toEqual([])
    expect(folded('看看对照').open).toBe(false)
  })

  it('最后一题：主按钮去终局，陪练为次要；调用方的 nextLabel 优先', () => {
    const onScoring = vi.fn()
    const { container } = render(<Harness id="eyes-check" isLast onScoring={onScoring} />)
    point(4, 3); point(4, 5); click('白棋一次只能填一个，另一个还在')
    expect(solid(container)).toEqual(['学习围地与终局 →'])
    click('学习围地与终局')
    expect(onScoring).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: '开始我的陪练' }).className).toContain('button--ghost')
    cleanup()
    const practice = render(<Harness id="danger-check" nextLabel="下一道练习" />)
    point(0, 3); point(0, 5)
    expect(solid(practice.container)).toEqual(['下一道练习'])
  })
})
```

- [ ] **Step 2: 运行，确认失败**

Run: `npx vitest run src/app/lessons/SurvivalPage.test.tsx`
Expected: FAIL，第一条断言找不到“第 1 步 / 共 2 步 · 找棋”。

- [ ] **Step 3: 实现**

`src/app/lessons/SurvivalPage.tsx` 的 import 区加入：

```ts
import { awaitingConfirm, survivalSteps } from './survivalSteps'
```

保留从 `const { scene } = run` 到 `last.captured.forEach(...)` 的标记计算代码，以及 `demo` 函数，原样不动。删除 `const goals = {...}` 这一行。把 `return <BoardLayout ... </BoardLayout>` 整段替换为：

```tsx
  const step = survivalSteps(run)
  const done = run.stage === 'done'
  const restart = <div className="restart"><button className="text-button" onClick={() => onChange(startSurvival(scene))}>重来这一题</button></div>
  const dangerCompare = scene.kind === 'danger' && done
  const eyesCompare = !!scene.contrastRows && (run.stage === 'reason' || done)
  return <BoardLayout
      feedback={run.message && <LessonFeedback message={run.message} />}
      heading={<>
        <p className="eyebrow">{practiceOnly ? '认危险 · 专项练习' : `保住自己的棋 / 第 ${scene.course} 课 · ${scene.guided ? '一起练习' : '自己试试'}`}</p>
        <h2>{scene.title}</h2>
        <div className="step-task">
          <p className="step-label">{step.done ? step.label : `第 ${step.current} 步 / 共 ${step.total} 步 · ${step.label}`}</p>
          {step.progress && <p className="step-progress">{step.progress}</p>}
          {step.task && <p className="turn">{step.task}</p>}
        </div>
      </>}
      board={<>
      <p className="figure-number">{practiceOnly ? '换个局面，自己判断' : `第 ${scene.course} 课 / ${scene.guided ? '一起练习' : '自己试试'}`}</p>
      <Board board={shown.board} marks={marks} lastMove={last?.kind === 'play' ? last.point : null}
        disabled={run.view === 'reply' || run.view.startsWith('contrast') || run.stage === 'done' || run.stage === 'reason'}
        ghostColor={run.stage === 'move' ? 'black' : null} onPointClick={(p) => onChange(choosePracticePoint(run, p))} />
      <p className="board-caption">{run.view === 'reply' ? '演示：白棋可能这样应对' : run.view === 'contrast-before' ? '对照：这块棋只剩一个眼，没有外气' : run.view === 'contrast' ? '对照：白棋填最后一气，黑棋被提走' : run.preview?.ok && run.view === 'after' ? '试下中 · 从题目起点观察后果' : scene.kind === 'eyes' ? '这一步暂时替白棋试下' : '9 路练习 · 你执黑'}</p>
    </>}
      primary={<>
        {!run.message && !run.preview && !done && <p className="step-intro">{scene.intro}</p>}
        {run.preview && <>{(!run.message || run.view === 'reply') && <p className="board-brief">{run.view === 'reply' ? '演示：白棋能占住最后一气，提走危险黑棋。' : briefExplanation(run.preview)}</p>}{run.preview.ok && <div className="actions">
          {awaitingConfirm(run) && run.view !== 'reply' && <button className="button" onClick={() => onChange(confirmPractice(run))}>确认这一步</button>}
          <button className="button button--ghost" onClick={() => onChange({ ...run, view: 'before' })}>下之前</button>
          <button className="button button--ghost" onClick={() => onChange({ ...run, view: 'after' })}>下之后</button>
          {run.preview.dangers.length > 0 && <button className="button button--ghost" onClick={() => onChange({ ...run, view: 'reply' })}>看白棋怎样提</button>}
          {run.stage === 'move' && <button className="text-button" onClick={() => onChange({ ...run, preview: null, view: 'before', message: null })}>重新选点</button>}
        </div>}</>}
        {run.stage === 'reason' && <div className="reason-choices">
          <button className="button button--ghost" onClick={() => onChange(chooseReason(run, false))}>因为黑棋比白棋多</button>
          <button className="button button--ghost" onClick={() => onChange(chooseReason(run, true))}>白棋一次只能填一个，另一个还在</button>
        </div>}
        {!done && run.hint < 3 && <button className="text-button hint-button" onClick={() => onChange(practiceHint(run))}>{['提醒我看哪里', '标出相关棋块和气', '演示一种做法'][run.hint]}</button>}
        {done && <div className="actions next-lesson">{isLast && onScoring
          ? <><button className="button" onClick={onScoring}>学习围地与终局<span aria-hidden="true"> →</span></button><button className="button button--ghost" onClick={onNext}>{nextLabel ?? '开始我的陪练'}</button></>
          : <button className="button" onClick={onNext}>{nextLabel ?? (isLast ? '开始我的陪练' : scene.guided ? '换个局面，自己试试 →' : '下一课 →')}</button>}</div>}
        {(dangerCompare || eyesCompare) && <details className="step-compare"><summary>看看对照</summary>
          {dangerCompare && <div className="actions"><button className="button button--ghost" onClick={() => demo('ignore')}>如果去远处下</button><button className="button button--ghost" onClick={() => demo('escape')}>如果接向空处</button></div>}
          {eyesCompare && <div className="actions">
            <button className="button button--ghost" onClick={() => onChange({ ...run, view: 'contrast-before' })}>只剩一个眼时</button>
            <button className="button button--ghost" onClick={() => onChange({ ...run, view: 'contrast' })}>白棋填最后一气</button>
            <button className="text-button" onClick={() => onChange({ ...run, view: 'before' })}>回到两眼原图</button>
          </div>}
        </details>}
        {done && restart}
      </>}
    >
      <details className="step-notes"><summary>讲解与图例</summary>
        <p className="muted">{scene.intro}</p>
        <p className="small">棋子上的圈：目标棋块 · 空心圈：气 · 虚线：试下</p>
        {reveal && target && <p className="small">目标棋块：{target.stones.length} 颗棋，{target.liberties.length} 口气。</p>}
        {scene.kind === 'eyes' && onRuleSequence && <button className="text-button" onClick={onRuleSequence}>分步看：为什么不算自杀？</button>}
      </details>
      {!done && restart}
    </BoardLayout>
```

说明：
- 不再传 `legend` 给 `BoardLayout`，图例移进“讲解与图例”。
- 原来底部的“已比较 n 种办法。再试另一种：伸出或提子”那一行删掉，由 `step.progress` 和 `step.task` 取代。
- “确认这一步”的显示条件从 `run.stage === 'move'` 改为 `awaitingConfirm(run)`，已确认过的点不再重复显示。

- [ ] **Step 4: 运行新测试，确认通过**

Run: `npx vitest run src/app/lessons/SurvivalPage.test.tsx`
Expected: 全部 PASS。

- [ ] **Step 5: 运行全部测试，修复受影响的旧用例**

Run: `npm test`
Expected: 全部 PASS。写计划时排查过，不需要改的旧用例包括：`LearningPage.test.tsx`（两眼对照按钮虽然在折叠里，jsdom 仍能点击）、`PracticePage.test.tsx:102`（任务句仍是“点出这整块黑棋最后的一口气。”）、`LearningPersistence.test.tsx:37`（箭头在 `aria-hidden` 中，名称仍是“学习围地与终局”）。

如果某条旧用例因为同一段引言出现两次而报 `Found multiple elements`，把那条查询改成在 `.board-detail` 内查询（`within(container.querySelector('.board-detail')!)`），不要删掉断言。

- [ ] **Step 6: lint**

Run: `npm run lint`
Expected: 0 errors。如果报 `goals` 或 `legend` 未使用之类，按提示删除残留。

- [ ] **Step 7: 提交**

```bash
git add src/app/lessons/SurvivalPage.tsx src/app/lessons/SurvivalPage.test.tsx
git commit -m "Show one step and one primary action at a time in survival lessons"
```

---

### Task 4: 课程页去向文案与样式

**Files:**
- Modify: `src/app/lessons/LearningPage.tsx:100-106`
- Modify: `src/app/styles.css`（文件末尾追加）
- Test: `src/app/lessons/LearningPage.test.tsx`

- [ ] **Step 1: 写失败的测试**

在 `src/app/lessons/LearningPage.test.tsx` 的 `describe('生存章节界面', ...)` 内追加：

```tsx
  it('每道检验题完成后写明下一课，底部跳题链接降为次要', () => {
    const { container } = render(<Harness />)
    chapter('保住自己的棋'); click('3. 把分开的棋连起来')
    click('交叉点 4,4'); click('确认这一步')
    expect(screen.getByRole('button', { name: '换个局面，自己试试 →' })).toBeTruthy()
    click('换个局面，自己试试 →')
    click('交叉点 4,4'); click('确认这一步')
    expect(screen.getByRole('button', { name: '下一课 · 两个小空点为什么能保命 →' })).toBeTruthy()
    expect(container.querySelector('.learning-toolbar--quiet')!.textContent).toContain('先跳过这一题')
  })
```

（`click('3. 把分开的棋连起来')` 依赖首页卷目中课程链接的名称。如果实际名称不同，先运行一次，用报错信息里列出的可用按钮名称修正这一处。）

- [ ] **Step 2: 运行，确认失败**

Run: `npx vitest run src/app/lessons/LearningPage.test.tsx`
Expected: FAIL，找不到“下一课 · 两个小空点为什么能保命 →”或 `.learning-toolbar--quiet`。

- [ ] **Step 3: 实现**

`src/app/lessons/LearningPage.tsx` 的 import 区加入：

```ts
import { survivalNextLabel } from './survivalSteps'
```

把

```tsx
        nextLabel={session.runs[session.sceneIndex].scene.id === 'danger-check' ? '下一课 · 给自己的棋找出路 →' : undefined}
```

替换为

```tsx
        nextLabel={survivalNextLabel(session.sceneIndex)}
```

把生存课下方的

```tsx
      <div className="learning-toolbar archive-note">
        {session.sceneIndex > 0 && <button className="text-button" onClick={() => openScene(session.sceneIndex - 1)}>回看上一题</button>}
```

中的 `className="learning-toolbar archive-note"` 改为 `className="learning-toolbar learning-toolbar--quiet archive-note"`。只改生存课这一处，终局、策略的工具栏不动。

在 `src/app/styles.css` 末尾追加：

```css
/* 生存课分步：步骤标签、开场引言、折叠的讲解与对照 */
.step-task { margin-top: 16px; border-left: 2px solid var(--accent); padding-left: 14px; }
.step-task .step-label { margin: 0; color: var(--accent); font-size: .85rem; }
.step-task .step-progress { margin: 2px 0 0; color: var(--text-muted); font-size: .8rem; }
.step-task .turn { margin: 3px 0 0; font-family: var(--serif); font-size: 1.12rem; }
.board-primary .step-intro { color: var(--text-2); line-height: 1.7; }
.step-notes > summary, .step-compare > summary { cursor: pointer; color: var(--accent); font: .85rem/1.75 var(--serif); }
.step-compare { margin: 8px 0; }
.learning-toolbar--quiet .text-button { color: var(--text-muted); }
@media (max-width: 680px) {
  .step-task { margin: 6px 0; padding-left: 10px; }
  .step-task .turn { font-size: 1rem; }
  .step-task .step-label, .step-task .step-progress { font-size: max(12px, .72rem); }
}
```

- [ ] **Step 4: 运行全部检查**

Run: `npm test && npm run lint && npm run build`
Expected: 测试全部 PASS（330 + 本计划新增），lint 0 errors，build 成功。

- [ ] **Step 5: 提交**

```bash
git add src/app/lessons/LearningPage.tsx src/app/lessons/LearningPage.test.tsx src/app/styles.css
git commit -m "Name the next survival lesson and quiet the skip links"
```

---

### Task 5: 浏览器验收与文档

**Files:**
- Create: `docs/qa/survival-step-layout/README.md` 及截图
- Modify: `docs/status.md`

- [ ] **Step 1: 启动并走查**

Run: `npm run dev`（后台运行）

用 Playwright（可用 webapp-testing 技能）分别在 1440 × 900 与 375 × 667 视口中：
1. 首页 → 第贰卷“保住自己的棋” → 依次完成八个场景。
2. 每一步确认：标题区有“第 n 步 / 共 m 步”；主操作区最多一个实心按钮；“讲解与图例”默认收起。
3. 每题完成后：主按钮文案写明去向；“看看对照”默认收起，展开后对照可用。
4. 第八题完成后：主按钮“学习围地与终局 →”，次要按钮“开始我的陪练”。
5. 练习页：做一道认危险专项题和“自己试试：换到边上，自己找一找”，确认完成记录与以前一致，主按钮是“下一道练习”或“返回练习列表”。

- [ ] **Step 2: 截图**

保存到 `docs/qa/survival-step-layout/`：
- `danger-check-step1-desktop.png`、`danger-check-done-desktop.png`
- `escape-guided-progress-desktop.png`
- `eyes-reason-desktop.png`
- `danger-check-step1-mobile.png`、`eyes-reason-mobile.png`

- [ ] **Step 3: 写验收记录**

新建 `docs/qa/survival-step-layout/README.md`，格式参照 `docs/qa/practice-hub/README.md`，包含：
- 背景：V2EX 1 楼与 5 楼反馈（链接 <https://www.v2ex.com/t/1257558>）。
- 变化列表：步骤标签、单一主按钮、折叠区、完成去向、工具栏降权。
- 检查结果：三条命令的输出摘要与测试总数；两个视口的走查结论；截图列表。
- 未覆盖：真机 Safari；规则、终局、策略等其他课型仍是旧布局。

- [ ] **Step 4: 更新状态文档**

在 `docs/status.md` 的“当前状态”中，生存练习那一段末尾补一句：

> 生存课通用页面改为分步显示：标题区标出“第几步 / 共几步”和一句任务，棋盘旁最多一个主按钮，引言、图例与对照默认收起；完成后主按钮写明下一课。见[生存课分步验收](qa/survival-step-layout/README.md)。

把“目前 330 个测试”更新为 `npm test` 实际输出的总数，并把“本轮新增 N 项测试”改为实际新增数。

- [ ] **Step 5: 提交**

```bash
git add docs/qa/survival-step-layout docs/status.md
git commit -m "Record survival step layout QA"
```
