# 第一版计划一:项目脚手架与规则引擎

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 搭好 Vite + React + TypeScript 项目,并实现一个完整、测试充分、与界面无关的中国规则围棋引擎。

**Architecture:** 规则全部放在 `src/engine/`,是零依赖的纯函数模块。状态为不可变数据,落子被拒绝时用返回值表达,不抛异常。界面层以后只通过 `src/engine/index.ts` 使用它。

**Tech Stack:** Node 25、Vite 8、React 19、TypeScript 7、Vitest。

**设计依据:** `docs/superpowers/specs/2026-11-01-v1-design.md` 第 2、3、9、10 节。

---

## 第一版计划拆分

设计文档覆盖四层,每层各写一份计划,每份结束时都有能独立运行和测试的成果:

1. **本计划**:项目脚手架 + 规则引擎(`src/engine/`)。
2. 简单电脑对手(`src/ai/`)。
3. 棋盘组件 + 教学关卡(`src/app/` 的棋盘与教学页、`src/content/`)。
4. 引导对局、终局数子与复盘(`src/app/` 的对局页和复盘页、localStorage)。

后三份在本计划完成后再写,届时可以基于引擎的真实接口。

## 约定

- **坐标**:`{ x, y }`,x 为列从左到右,y 为行从上到下,都从 0 开始。
- **文字棋盘**:测试和关卡用 `parseBoard` 读取字符串数组,`X` 黑、`O` 白、`.` 空,每行一个字符串。
- **拒绝原因**:设计文档列出的 `occupied`、`suicide`、`repeated-position` 之外,补充 `off-board`(点不在棋盘上)和 `game-over`(终局后继续落子),保证引擎对任何输入都不抛异常。
- **类型导入**:脚手架开启了 `verbatimModuleSyntax`,只导入类型时必须写 `import type`。
- **提交**:commit message 用英文,不加任何尾注。提交邮箱应为 `264439153+Minjia-Hu@users.noreply.github.com`,开始前用 `git config user.email` 确认一次。

## 文件结构

| 文件 | 职责 |
|------|------|
| `src/engine/types.ts` | 引擎所有公开类型 |
| `src/engine/board.ts` | 棋盘数据的创建、读写、邻点、文字解析、盘面键 |
| `src/engine/groups.ts` | 找出一块棋及其气 |
| `src/engine/game.ts` | 对局状态:创建、落子、停一手 |
| `src/engine/scoring.ts` | 终局:标记死子、数子计分 |
| `src/engine/index.ts` | 对外公开的唯一入口 |
| `src/engine/*.test.ts` | 与源码同目录的 Vitest 测试 |

---

### Task 1:搭建项目脚手架

**Files:**
- Create:Vite 的 react-ts 模板文件(`package.json`、`index.html`、`vite.config.ts`、`tsconfig*.json`、`.gitignore`、`.oxlintrc.json`、`src/`、`public/`)
- Keep:`README.md`、`docs/` 不动

当前目录非空,`create-vite` 不能直接在这里生成,所以先在临时目录生成再复制过来。

- [ ] **Step 1:在临时目录生成模板**

```bash
cd /tmp && rm -rf the-go-room && npm create vite@latest the-go-room -- --template react-ts
```

Expected:输出 `Scaffolding project in /private/tmp/the-go-room...` 和 `Done.`,不会出现交互提问。

- [ ] **Step 2:复制到仓库,保留现有 README**

```bash
cd the-go-room
rsync -a --exclude README.md /tmp/the-go-room/ ./
rm -rf /tmp/the-go-room
```

- [ ] **Step 3:安装依赖并加入 Vitest**

```bash
npm install
npm install -D vitest
npm pkg set scripts.test="vitest run"
```

- [ ] **Step 4:确认工具链可用**

```bash
npm run build
npm test
```

Expected:`npm run build` 以 `✓ built in` 结尾。`npm test` 报告 `No test files found` 并以非零状态退出,这在当前阶段是正常的。

- [ ] **Step 5:确认 `.DS_Store` 已被忽略**

```bash
git status --short
```

Expected:列表里没有 `.DS_Store`(模板的 `.gitignore` 已包含它),也没有 `node_modules` 和 `dist`。

- [ ] **Step 6:提交**

```bash
git add -A
git commit -m "chore: scaffold Vite React TypeScript app with Vitest"
```

---

### Task 2:引擎类型与棋盘基础操作

**Files:**
- Create:`src/engine/types.ts`
- Create:`src/engine/board.ts`
- Test:`src/engine/board.test.ts`

- [ ] **Step 1:写类型定义**

`src/engine/types.ts`:

```ts
export type Color = 'black' | 'white'

/** 一个交叉点的内容:黑子、白子或空。 */
export type Cell = Color | null

/** 棋盘坐标。x 为列(左到右),y 为行(上到下),都从 0 开始。 */
export interface Point {
  readonly x: number
  readonly y: number
}

/** 不可变棋盘。cells 下标 = y * size + x。 */
export interface Board {
  readonly size: number
  readonly cells: readonly Cell[]
}

/** 一块相连的同色棋子及其所有气。 */
export interface Group {
  readonly color: Color
  readonly stones: readonly Point[]
  readonly liberties: readonly Point[]
}

export type RejectReason =
  | 'occupied'
  | 'suicide'
  | 'repeated-position'
  | 'off-board'
  | 'game-over'

export type MoveRecord =
  | {
      readonly kind: 'play'
      readonly color: Color
      readonly point: Point
      readonly captured: readonly Point[]
      readonly isKo: boolean
    }
  | { readonly kind: 'pass'; readonly color: Color }

export type Phase = 'playing' | 'scoring'

export interface GameState {
  readonly board: Board
  readonly toPlay: Color
  readonly komi: number
  readonly phase: Phase
  readonly consecutivePasses: number
  readonly history: readonly MoveRecord[]
  /** 本局出现过的所有盘面,用于全局同形禁止。 */
  readonly positionKeys: readonly string[]
}

export type PlayResult =
  | { readonly ok: true; readonly state: GameState }
  | { readonly ok: false; readonly reason: RejectReason }

export interface ScoreResult {
  readonly black: number
  readonly white: number
  readonly komi: number
  /** null 表示和棋(只有整数贴目时可能出现)。 */
  readonly winner: Color | null
  /** 胜方领先的子数,已计入贴目。 */
  readonly margin: number
  /** 每个交叉点归属:活子与只被一方包围的空点归该方,其余为 null。下标同 Board.cells。 */
  readonly ownership: readonly Cell[]
}
```

- [ ] **Step 2:写失败的测试**

`src/engine/board.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { boardKey, createBoard, getCell, neighbors, parseBoard, setCell } from './board'

describe('board', () => {
  it('createBoard 生成指定路数的空棋盘', () => {
    const board = createBoard(9)
    expect(board.size).toBe(9)
    expect(board.cells).toHaveLength(81)
    expect(board.cells.every((c) => c === null)).toBe(true)
  })

  it('parseBoard 读取 X、O 和 .', () => {
    const board = parseBoard(['X..', '.O.', '...'])
    expect(getCell(board, { x: 0, y: 0 })).toBe('black')
    expect(getCell(board, { x: 1, y: 1 })).toBe('white')
    expect(getCell(board, { x: 2, y: 2 })).toBeNull()
  })

  it('parseBoard 拒绝非正方形输入', () => {
    expect(() => parseBoard(['X..', '...'])).toThrow()
  })

  it('setCell 返回新棋盘,不修改原棋盘', () => {
    const board = createBoard(3)
    const next = setCell(board, { x: 1, y: 1 }, 'black')
    expect(getCell(next, { x: 1, y: 1 })).toBe('black')
    expect(getCell(board, { x: 1, y: 1 })).toBeNull()
  })

  it('neighbors 在角、边、中间分别有 2、3、4 个', () => {
    const board = createBoard(9)
    expect(neighbors(board, { x: 0, y: 0 })).toHaveLength(2)
    expect(neighbors(board, { x: 4, y: 0 })).toHaveLength(3)
    expect(neighbors(board, { x: 4, y: 4 })).toHaveLength(4)
  })

  it('boardKey 按行输出 X、O、.', () => {
    expect(boardKey(parseBoard(['X.', '.O']))).toBe('X..O')
  })
})
```

- [ ] **Step 3:运行测试,确认失败**

Run:`npx vitest run src/engine/board.test.ts`
Expected:FAIL,提示无法解析 `./board`。

- [ ] **Step 4:实现棋盘操作**

`src/engine/board.ts`:

```ts
import type { Board, Cell, Color, Point } from './types'

export function createBoard(size: number): Board {
  return { size, cells: Array<Cell>(size * size).fill(null) }
}

export function isOnBoard(board: Board, p: Point): boolean {
  return p.x >= 0 && p.y >= 0 && p.x < board.size && p.y < board.size
}

export function toIndex(board: Board, p: Point): number {
  return p.y * board.size + p.x
}

export function toPoint(board: Board, index: number): Point {
  return { x: index % board.size, y: Math.floor(index / board.size) }
}

export function getCell(board: Board, p: Point): Cell {
  return board.cells[toIndex(board, p)]
}

export function setCell(board: Board, p: Point, cell: Cell): Board {
  const cells = board.cells.slice()
  cells[toIndex(board, p)] = cell
  return { size: board.size, cells }
}

export function removeStones(board: Board, points: readonly Point[]): Board {
  const cells = board.cells.slice()
  for (const p of points) cells[toIndex(board, p)] = null
  return { size: board.size, cells }
}

export function neighbors(board: Board, p: Point): Point[] {
  const candidates = [
    { x: p.x, y: p.y - 1 },
    { x: p.x + 1, y: p.y },
    { x: p.x, y: p.y + 1 },
    { x: p.x - 1, y: p.y },
  ]
  return candidates.filter((q) => isOnBoard(board, q))
}

export function opponent(color: Color): Color {
  return color === 'black' ? 'white' : 'black'
}

export function samePoint(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y
}

/** 盘面的字符串表示,用于比较重复局面。X 黑,O 白,. 空。 */
export function boardKey(board: Board): string {
  return board.cells.map((c) => (c === 'black' ? 'X' : c === 'white' ? 'O' : '.')).join('')
}

/**
 * 从文字图解析棋盘,供测试和关卡数据使用。
 * 每行一个字符串,X 黑,O 白,. 空;必须是正方形。
 * 输入不合法时抛错:这只用于开发者编写的静态数据,不会在对局中被调用。
 */
export function parseBoard(rows: readonly string[]): Board {
  const size = rows.length
  const cells: Cell[] = []
  for (const row of rows) {
    if (row.length !== size) {
      throw new Error(`parseBoard: 每行必须有 ${size} 个字符,收到 "${row}"`)
    }
    for (const ch of row) {
      if (ch === 'X') cells.push('black')
      else if (ch === 'O') cells.push('white')
      else if (ch === '.') cells.push(null)
      else throw new Error(`parseBoard: 不认识的字符 "${ch}"`)
    }
  }
  return { size, cells }
}
```

- [ ] **Step 5:运行测试,确认通过**

Run:`npx vitest run src/engine/board.test.ts`
Expected:6 个测试全部 PASS。

- [ ] **Step 6:提交**

```bash
git add src/engine/types.ts src/engine/board.ts src/engine/board.test.ts
git commit -m "feat(engine): add board model and text parser"
```

---

### Task 3:棋块与气

**Files:**
- Create:`src/engine/groups.ts`
- Test:`src/engine/groups.test.ts`

- [ ] **Step 1:写失败的测试**

`src/engine/groups.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { parseBoard } from './board'
import { getGroup } from './groups'

describe('getGroup', () => {
  it('中间的单子有 4 口气', () => {
    const group = getGroup(parseBoard(['...', '.X.', '...']), { x: 1, y: 1 })!
    expect(group.color).toBe('black')
    expect(group.stones).toHaveLength(1)
    expect(group.liberties).toHaveLength(4)
  })

  it('相连的棋子是一块,气不重复计算', () => {
    const group = getGroup(parseBoard(['XX.', '...', '...']), { x: 0, y: 0 })!
    expect(group.stones).toHaveLength(2)
    expect(group.liberties).toEqual(
      expect.arrayContaining([
        { x: 2, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
      ]),
    )
    expect(group.liberties).toHaveLength(3)
  })

  it('对方棋子会占掉气', () => {
    const group = getGroup(parseBoard(['XO.', '...', '...']), { x: 0, y: 0 })!
    expect(group.liberties).toEqual([{ x: 0, y: 1 }])
  })

  it('空点返回 null', () => {
    expect(getGroup(parseBoard(['...', '...', '...']), { x: 0, y: 0 })).toBeNull()
  })
})
```

- [ ] **Step 2:运行测试,确认失败**

Run:`npx vitest run src/engine/groups.test.ts`
Expected:FAIL,提示无法解析 `./groups`。

- [ ] **Step 3:实现**

`src/engine/groups.ts`:

```ts
import { getCell, neighbors, toIndex } from './board'
import type { Board, Group, Point } from './types'

/** 返回包含 p 的整块棋;p 为空点时返回 null。 */
export function getGroup(board: Board, p: Point): Group | null {
  const color = getCell(board, p)
  if (color === null) return null

  const stones: Point[] = []
  const liberties: Point[] = []
  const seenStones = new Set<number>([toIndex(board, p)])
  const seenLiberties = new Set<number>()
  const stack: Point[] = [p]

  while (stack.length > 0) {
    const current = stack.pop()!
    stones.push(current)
    for (const n of neighbors(board, current)) {
      const index = toIndex(board, n)
      const cell = getCell(board, n)
      if (cell === null && !seenLiberties.has(index)) {
        seenLiberties.add(index)
        liberties.push(n)
      } else if (cell === color && !seenStones.has(index)) {
        seenStones.add(index)
        stack.push(n)
      }
    }
  }

  return { color, stones, liberties }
}
```

- [ ] **Step 4:运行测试,确认通过**

Run:`npx vitest run src/engine/groups.test.ts`
Expected:4 个测试全部 PASS。

- [ ] **Step 5:提交**

```bash
git add src/engine/groups.ts src/engine/groups.test.ts
git commit -m "feat(engine): find groups and liberties"
```

---

### Task 4:创建对局与落子(提子、禁入点、劫)

**Files:**
- Create:`src/engine/game.ts`
- Test:`src/engine/game.test.ts`

劫的测试局面说明:白在 (0,0) 落子,提掉黑 (1,0),形成劫。黑立刻在 (1,0) 回提会让盘面回到落子前,被全局同形规则拒绝。

```
.XO..      X 黑  O 白  . 空
XO...      白下 (0,0) 提黑 (1,0)
.....
```

- [ ] **Step 1:写失败的测试**

`src/engine/game.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { getCell, parseBoard } from './board'
import { createGame, play } from './game'
import type { GameState, PlayResult } from './types'

/** 断言落子成功并返回新状态。 */
function expectOk(result: PlayResult): GameState {
  if (!result.ok) throw new Error(`预期落子成功,实际被拒绝:${result.reason}`)
  return result.state
}

describe('createGame', () => {
  it('默认 9 路、黑先、贴 7.5', () => {
    const game = createGame()
    expect(game.board.size).toBe(9)
    expect(game.toPlay).toBe('black')
    expect(game.komi).toBe(7.5)
    expect(game.phase).toBe('playing')
    expect(game.history).toEqual([])
    expect(game.positionKeys).toHaveLength(1)
  })
})

describe('play', () => {
  it('落子后轮到对方', () => {
    const game = expectOk(play(createGame(), { x: 2, y: 2 }))
    expect(getCell(game.board, { x: 2, y: 2 })).toBe('black')
    expect(game.toPlay).toBe('white')
    expect(game.history).toEqual([
      { kind: 'play', color: 'black', point: { x: 2, y: 2 }, captured: [], isKo: false },
    ])
  })

  it('已有棋子的点被拒绝', () => {
    const game = expectOk(play(createGame(), { x: 2, y: 2 }))
    expect(play(game, { x: 2, y: 2 })).toEqual({ ok: false, reason: 'occupied' })
  })

  it('棋盘外的点被拒绝', () => {
    expect(play(createGame(), { x: 9, y: 0 })).toEqual({ ok: false, reason: 'off-board' })
  })

  it('提掉没有气的对方棋子', () => {
    const board = parseBoard(['.....', '..X..', '.XO..', '..X..', '.....'])
    const game = expectOk(play(createGame({ board }), { x: 3, y: 2 }))
    expect(getCell(game.board, { x: 2, y: 2 })).toBeNull()
    expect(game.history[0]).toEqual({
      kind: 'play',
      color: 'black',
      point: { x: 3, y: 2 },
      captured: [{ x: 2, y: 2 }],
      isKo: false,
    })
  })

  it('一次提掉整块棋', () => {
    const board = parseBoard(['.XX..', 'XOO..', '.XX..', '.....', '.....'])
    const game = expectOk(play(createGame({ board }), { x: 3, y: 1 }))
    expect(getCell(game.board, { x: 1, y: 1 })).toBeNull()
    expect(getCell(game.board, { x: 2, y: 1 })).toBeNull()
    expect(game.history[0]).toMatchObject({ isKo: false })
    if (game.history[0].kind === 'play') expect(game.history[0].captured).toHaveLength(2)
  })

  it('禁入点(自杀)被拒绝', () => {
    const board = parseBoard(['.X...', 'X....', '.....', '.....', '.....'])
    const game = createGame({ board, toPlay: 'white' })
    expect(play(game, { x: 0, y: 0 })).toEqual({ ok: false, reason: 'suicide' })
  })

  it('能提子时不算自杀', () => {
    const board = parseBoard(['.XO..', 'XO...', '.....', '.....', '.....'])
    const game = expectOk(play(createGame({ board, toPlay: 'white' }), { x: 0, y: 0 }))
    expect(getCell(game.board, { x: 1, y: 0 })).toBeNull()
    expect(game.history[0]).toMatchObject({ captured: [{ x: 1, y: 0 }], isKo: true })
  })

  it('劫:提劫后不能立刻回提', () => {
    const board = parseBoard(['.XO..', 'XO...', '.....', '.....', '.....'])
    const afterTake = expectOk(play(createGame({ board, toPlay: 'white' }), { x: 0, y: 0 }))
    expect(play(afterTake, { x: 1, y: 0 })).toEqual({ ok: false, reason: 'repeated-position' })
  })

  it('劫:双方各在别处下一手后可以回提', () => {
    const board = parseBoard(['.XO..', 'XO...', '.....', '.....', '.....'])
    let game = expectOk(play(createGame({ board, toPlay: 'white' }), { x: 0, y: 0 }))
    game = expectOk(play(game, { x: 4, y: 4 }))
    game = expectOk(play(game, { x: 4, y: 0 }))
    game = expectOk(play(game, { x: 1, y: 0 }))
    expect(getCell(game.board, { x: 0, y: 0 })).toBeNull()
    expect(game.history.at(-1)).toMatchObject({ captured: [{ x: 0, y: 0 }], isKo: true })
  })

  it('每次落子都记录盘面', () => {
    let game = createGame()
    game = expectOk(play(game, { x: 0, y: 0 }))
    game = expectOk(play(game, { x: 1, y: 1 }))
    expect(game.positionKeys).toHaveLength(3)
  })
})
```

- [ ] **Step 2:运行测试,确认失败**

Run:`npx vitest run src/engine/game.test.ts`
Expected:FAIL,提示无法解析 `./game`。

- [ ] **Step 3:实现**

`src/engine/game.ts`:

```ts
import { boardKey, createBoard, getCell, isOnBoard, neighbors, opponent, removeStones, setCell } from './board'
import { getGroup } from './groups'
import type { Board, Color, GameState, MoveRecord, PlayResult, Point, RejectReason } from './types'

export interface GameOptions {
  /** 棋盘路数,默认 9。传入 board 时忽略。 */
  readonly size?: number
  /** 贴目,默认 7.5(中国规则)。 */
  readonly komi?: number
  /** 初始盘面,用于教学关卡;默认空棋盘。 */
  readonly board?: Board
  /** 先行方,默认黑。 */
  readonly toPlay?: Color
}

export function createGame(options: GameOptions = {}): GameState {
  const board = options.board ?? createBoard(options.size ?? 9)
  return {
    board,
    toPlay: options.toPlay ?? 'black',
    komi: options.komi ?? 7.5,
    phase: 'playing',
    consecutivePasses: 0,
    history: [],
    positionKeys: [boardKey(board)],
  }
}

function reject(reason: RejectReason): PlayResult {
  return { ok: false, reason }
}

/**
 * 当前行棋方在 point 落子。
 * 顺序:检查空点 → 提掉无气的对方棋块 → 检查自杀 → 检查全局同形。
 */
export function play(state: GameState, point: Point): PlayResult {
  if (state.phase !== 'playing') return reject('game-over')
  if (!isOnBoard(state.board, point)) return reject('off-board')
  if (getCell(state.board, point) !== null) return reject('occupied')

  const color = state.toPlay
  let board = setCell(state.board, point, color)

  const captured: Point[] = []
  for (const n of neighbors(board, point)) {
    if (getCell(board, n) !== opponent(color)) continue
    const group = getGroup(board, n)!
    if (group.liberties.length === 0) {
      board = removeStones(board, group.stones)
      captured.push(...group.stones)
    }
  }

  const own = getGroup(board, point)!
  if (own.liberties.length === 0) return reject('suicide')

  const key = boardKey(board)
  if (state.positionKeys.includes(key)) return reject('repeated-position')

  const isKo = captured.length === 1 && own.stones.length === 1 && own.liberties.length === 1
  const record: MoveRecord = { kind: 'play', color, point, captured, isKo }

  return {
    ok: true,
    state: {
      ...state,
      board,
      toPlay: opponent(color),
      consecutivePasses: 0,
      history: [...state.history, record],
      positionKeys: [...state.positionKeys, key],
    },
  }
}
```

- [ ] **Step 4:运行测试,确认通过**

Run:`npx vitest run src/engine/game.test.ts`
Expected:11 个测试全部 PASS。

- [ ] **Step 5:提交**

```bash
git add src/engine/game.ts src/engine/game.test.ts
git commit -m "feat(engine): play moves with capture, suicide and superko rules"
```

---

### Task 5:停一手与进入终局

**Files:**
- Modify:`src/engine/game.ts`(文件末尾追加 `pass`)
- Modify:`src/engine/game.test.ts`(改导入行,文件末尾追加测试)

- [ ] **Step 1:写失败的测试**

把 `src/engine/game.test.ts` 的导入行

```ts
import { createGame, play } from './game'
```

改为

```ts
import { createGame, pass, play } from './game'
```

并在文件末尾追加:

```ts
describe('pass', () => {
  it('停一手后轮到对方并记录', () => {
    const game = expectOk(pass(createGame()))
    expect(game.toPlay).toBe('white')
    expect(game.consecutivePasses).toBe(1)
    expect(game.history).toEqual([{ kind: 'pass', color: 'black' }])
    expect(game.phase).toBe('playing')
  })

  it('落子会把连续停一手清零', () => {
    let game = expectOk(pass(createGame()))
    game = expectOk(play(game, { x: 0, y: 0 }))
    expect(game.consecutivePasses).toBe(0)
  })

  it('连续两次停一手进入终局', () => {
    let game = expectOk(pass(createGame()))
    game = expectOk(pass(game))
    expect(game.phase).toBe('scoring')
  })

  it('终局后不能再落子或停一手', () => {
    let game = expectOk(pass(createGame()))
    game = expectOk(pass(game))
    expect(play(game, { x: 0, y: 0 })).toEqual({ ok: false, reason: 'game-over' })
    expect(pass(game)).toEqual({ ok: false, reason: 'game-over' })
  })
})
```

- [ ] **Step 2:运行测试,确认失败**

Run:`npx vitest run src/engine/game.test.ts`
Expected:FAIL,`pass` 相关的 4 个测试报错 `pass is not a function`。

- [ ] **Step 3:实现**

在 `src/engine/game.ts` 文件末尾追加:

```ts
/** 当前行棋方停一手。双方连续停一手后进入终局(数子)阶段。 */
export function pass(state: GameState): PlayResult {
  if (state.phase !== 'playing') return reject('game-over')
  const consecutivePasses = state.consecutivePasses + 1
  return {
    ok: true,
    state: {
      ...state,
      toPlay: opponent(state.toPlay),
      consecutivePasses,
      phase: consecutivePasses >= 2 ? 'scoring' : 'playing',
      history: [...state.history, { kind: 'pass', color: state.toPlay }],
    },
  }
}
```

- [ ] **Step 4:运行测试,确认通过**

Run:`npx vitest run src/engine/game.test.ts`
Expected:15 个测试全部 PASS。

- [ ] **Step 5:提交**

```bash
git add src/engine/game.ts src/engine/game.test.ts
git commit -m "feat(engine): support passing and enter scoring after two passes"
```

---

### Task 6:死子标记与中国规则数子

**Files:**
- Create:`src/engine/scoring.ts`
- Test:`src/engine/scoring.test.ts`

测试局面说明:黑占第 2 列,白占第 4 列,第 1 列只挨黑子算黑空,第 5 列只挨白子算白空,中间一列双方都挨着不计。

```
.X.O.     黑 = 5 子 + 5 空 = 10
.X.O.     白 = 5 子 + 5 空 = 10
.X.O.     贴 7.5 后白胜 7.5
.X.O.
.X.O.
```

- [ ] **Step 1:写失败的测试**

`src/engine/scoring.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { parseBoard, toIndex } from './board'
import { scoreGame, toggleDeadGroup } from './scoring'

const split = parseBoard(['.X.O.', '.X.O.', '.X.O.', '.X.O.', '.X.O.'])

describe('scoreGame', () => {
  it('空棋盘双方都是 0,白靠贴目获胜', () => {
    const result = scoreGame(parseBoard(['...', '...', '...']), [], 7.5)
    expect(result).toMatchObject({ black: 0, white: 0, winner: 'white', margin: 7.5 })
  })

  it('活子加只被己方包围的空点', () => {
    const result = scoreGame(split, [], 7.5)
    expect(result.black).toBe(10)
    expect(result.white).toBe(10)
    expect(result.winner).toBe('white')
    expect(result.margin).toBe(7.5)
  })

  it('整数贴目可能和棋', () => {
    const result = scoreGame(split, [], 0)
    expect(result.winner).toBeNull()
    expect(result.margin).toBe(0)
  })

  it('ownership 标出每个点的归属', () => {
    const { ownership } = scoreGame(split, [], 7.5)
    expect(ownership[toIndex(split, { x: 0, y: 0 })]).toBe('black')
    expect(ownership[toIndex(split, { x: 1, y: 0 })]).toBe('black')
    expect(ownership[toIndex(split, { x: 2, y: 0 })]).toBeNull()
    expect(ownership[toIndex(split, { x: 4, y: 0 })]).toBe('white')
  })

  it('未标记的死子会破坏对方的空', () => {
    const board = parseBoard(['.X.O.', '.X.O.', 'OX.O.', '.X.O.', '.X.O.'])
    const result = scoreGame(board, [], 7.5)
    expect(result.black).toBe(5)
    expect(result.white).toBe(11)
  })

  it('标记的死子先移除再数子', () => {
    const board = parseBoard(['.X.O.', '.X.O.', 'OX.O.', '.X.O.', '.X.O.'])
    const result = scoreGame(board, [{ x: 0, y: 2 }], 7.5)
    expect(result.black).toBe(10)
    expect(result.white).toBe(10)
  })
})

describe('toggleDeadGroup', () => {
  const board = parseBoard(['.....', '.OO..', '.....', '.....', '.....'])

  it('点一下标记整块', () => {
    const dead = toggleDeadGroup(board, [], { x: 1, y: 1 })
    expect(dead).toEqual(
      expect.arrayContaining([
        { x: 1, y: 1 },
        { x: 2, y: 1 },
      ]),
    )
    expect(dead).toHaveLength(2)
  })

  it('再点同一块的任意一子取消标记', () => {
    const dead = toggleDeadGroup(board, [], { x: 1, y: 1 })
    expect(toggleDeadGroup(board, dead, { x: 2, y: 1 })).toEqual([])
  })

  it('点空点不改变标记', () => {
    expect(toggleDeadGroup(board, [], { x: 0, y: 0 })).toEqual([])
  })
})
```

- [ ] **Step 2:运行测试,确认失败**

Run:`npx vitest run src/engine/scoring.test.ts`
Expected:FAIL,提示无法解析 `./scoring`。

- [ ] **Step 3:实现**

`src/engine/scoring.ts`:

```ts
import { getCell, neighbors, removeStones, samePoint, toIndex, toPoint } from './board'
import { getGroup } from './groups'
import type { Board, Cell, Color, Point, ScoreResult } from './types'

/**
 * 终局时标记或取消标记死子,按整块切换。
 * point 为空点时原样返回。
 */
export function toggleDeadGroup(board: Board, dead: readonly Point[], point: Point): Point[] {
  const group = getGroup(board, point)
  if (group === null) return [...dead]
  const isMarked = group.stones.some((s) => dead.some((d) => samePoint(d, s)))
  if (isMarked) {
    return dead.filter((d) => !group.stones.some((s) => samePoint(d, s)))
  }
  return [...dead, ...group.stones]
}

/**
 * 中国规则数子:移除死子后,每方得分 = 盘上活子 + 只被己方包围的空点。
 * 结果 = 黑 − 白 − 贴目。
 */
export function scoreGame(board: Board, dead: readonly Point[], komi: number): ScoreResult {
  const cleared = removeStones(board, dead)
  const ownership: Cell[] = cleared.cells.slice()
  const visited = new Set<number>()

  for (let index = 0; index < cleared.cells.length; index++) {
    if (cleared.cells[index] !== null || visited.has(index)) continue

    const region: number[] = []
    const borders = new Set<Color>()
    const stack: Point[] = [toPoint(cleared, index)]
    visited.add(index)

    while (stack.length > 0) {
      const current = stack.pop()!
      region.push(toIndex(cleared, current))
      for (const n of neighbors(cleared, current)) {
        const cell = getCell(cleared, n)
        const nIndex = toIndex(cleared, n)
        if (cell === null) {
          if (!visited.has(nIndex)) {
            visited.add(nIndex)
            stack.push(n)
          }
        } else {
          borders.add(cell)
        }
      }
    }

    if (borders.size === 1) {
      const [owner] = borders
      for (const r of region) ownership[r] = owner
    }
  }

  const black = ownership.filter((c) => c === 'black').length
  const white = ownership.filter((c) => c === 'white').length
  const diff = black - white - komi
  return {
    black,
    white,
    komi,
    winner: diff > 0 ? 'black' : diff < 0 ? 'white' : null,
    margin: Math.abs(diff),
    ownership,
  }
}
```

- [ ] **Step 4:运行测试,确认通过**

Run:`npx vitest run src/engine/scoring.test.ts`
Expected:9 个测试全部 PASS。

- [ ] **Step 5:提交**

```bash
git add src/engine/scoring.ts src/engine/scoring.test.ts
git commit -m "feat(engine): mark dead groups and score by area"
```

---

### Task 7:公开入口与整体验证

**Files:**
- Create:`src/engine/index.ts`
- Modify:`README.md`(当前状态、接下来的工作)

- [ ] **Step 1:写公开入口**

`src/engine/index.ts`:

```ts
export * from './types'
export {
  boardKey,
  createBoard,
  getCell,
  isOnBoard,
  neighbors,
  opponent,
  parseBoard,
  samePoint,
  toIndex,
  toPoint,
} from './board'
export { getGroup } from './groups'
export { createGame, pass, play } from './game'
export type { GameOptions } from './game'
export { scoreGame, toggleDeadGroup } from './scoring'
```

- [ ] **Step 2:跑全部测试**

Run:`npm test`
Expected:`Test Files  4 passed (4)`,`Tests  34 passed (34)`。

- [ ] **Step 3:类型检查与构建**

Run:`npm run build`
Expected:`tsc -b` 无报错,输出以 `✓ built in` 结尾。

- [ ] **Step 4:lint**

Run:`npm run lint`
Expected:没有 error。

- [ ] **Step 5:更新 README**

把 README 的"当前状态"一节改为:

```markdown
## 当前状态

已完成项目脚手架与规则引擎(`src/engine/`),按中国规则实现落子、提子、禁入点、全局同形禁止、停一手和数子,测试用 `npm test` 运行。界面尚未开始。
```

把"接下来的工作"一节改为:

```markdown
## 接下来的工作

1. 简单电脑对手(`src/ai/`)。
2. 棋盘组件与教学关卡。
3. 引导对局、终局数子与复盘。
```

- [ ] **Step 6:提交并推送**

```bash
git add src/engine/index.ts README.md
git commit -m "feat(engine): expose public engine API"
git push origin main
```
