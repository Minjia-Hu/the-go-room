# 第一版计划三:棋盘组件与教学关卡

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 做出能在浏览器里打开的应用骨架、可交互的 SVG 棋盘,以及 5 关互动教学。

**Architecture:** `src/app/` 是唯一接触 DOM 的层。棋盘组件只负责"把盘面画出来、把点击报上去",不含任何规则。关卡内容是 `src/content/` 里的纯数据,关卡的推进逻辑是 `src/app/lessons/lessonRunner.ts` 里的纯函数,教学页面只是把两者接起来。页面切换用地址栏 hash,不引入路由库。

**Tech Stack:** React 19、TypeScript 7、Vite 8、Vitest 4,新增 jsdom 与 Testing Library 做界面冒烟测试。

**设计依据:** `docs/superpowers/specs/2026-11-01-v1-design.md` 第 5、8、9、10 节。

---

## 约定

- **分层**:`src/app/` 可以导入 `src/engine`、`src/content`;只从 `'../engine'` 或 `'../../engine'` 导入,不要碰引擎内部文件。`src/content/` 只能导入引擎的类型。
- **类型导入**:项目开启了 `verbatimModuleSyntax`,只导入类型时必须写 `import type`。开启了 `noUnusedLocals`,多余导入会让 `tsc -b` 失败。
- **界面测试**:需要 DOM 的测试文件第一行写 `// @vitest-environment jsdom`,其余测试仍在 Node 环境跑,不拖慢引擎测试。
- **lint**:`.oxlintrc.json` 开启了 `react/only-export-components`,组件文件(`.tsx`)里不要导出非组件的函数或常量,放到旁边的 `.ts` 文件里。
- **坐标**:`{ x, y }` 中 x 为列、y 为行,从左上角 0 开始。棋盘上每个交叉点的无障碍名称是 `交叉点 x,y`,测试靠它定位。
- **提交**:commit message 用英文,不加任何尾注(不加 `Co-Authored-By` 等)。提交邮箱应为 `264439153+Minjia-Hu@users.noreply.github.com`。不要推送。

## 与设计文档的细化

设计文档定了"5 个固定关卡、内容为数据、错误时有针对性提示",以下是本计划补充的口径:

- **关卡有两种步骤**:`place`(落一子)和 `select`(点出一组空点,用于"气"那一关)。一个关卡可以有多步,第 5 关"劫"就是两步:先撞上一次"不能马上提回"的拒绝,再在别处下一手。
- **错误落子不改变盘面**。落在不被接受的点上只显示提示;只有正确落点才真的落子。
- **拒绝原因对应提示**。引擎拒绝落子时,按原因显示关卡里预写的提示,没写的用默认提示。
- **进度不持久化**。刷新页面回到第 1 关。5 关很短,第一版不存进度。
- **视觉基线**:浅米色页面、木色棋盘、黑白子,红色做关卡标记,蓝色做"最后一手"和已选点。详细视觉另行讨论。
- **对局和复盘页面**在本计划里只是占位,计划四再做。

## 文件结构

| 文件 | 职责 |
|------|------|
| `index.html` | 页面标题与语言 |
| `src/main.tsx` | 挂载 React,引入样式 |
| `src/app/styles.css` | 全部样式,BEM 风格类名 |
| `src/app/router.ts` | 基于 hash 的页面切换 |
| `src/app/App.tsx` | 顶栏导航与页面分发 |
| `src/app/board/geometry.ts` | 星位、交叉点名称 |
| `src/app/board/marks.ts` | 标记类型与生成函数 |
| `src/app/board/Board.tsx` | SVG 棋盘组件 |
| `src/content/types.ts` | 关卡数据类型 |
| `src/content/lessons.ts` | 5 个关卡的内容 |
| `src/app/lessons/lessonRunner.ts` | 关卡推进的纯函数 |
| `src/app/lessons/LessonPage.tsx` | 教学页面 |
| `src/**/*.test.ts(x)` | 与源码同目录的测试 |

---

### Task 1:界面测试环境与应用骨架

**Files:**
- Delete:`src/App.tsx`、`src/App.css`、`src/index.css`、`src/assets/`(脚手架模板)
- Modify:`index.html`、`src/main.tsx`、`package.json`(安装依赖)
- Create:`src/app/styles.css`、`src/app/router.ts`、`src/app/App.tsx`
- Test:`src/app/App.test.tsx`

- [ ] **Step 1:安装界面测试依赖**

```bash
npm install -D jsdom @testing-library/react @testing-library/dom
```

Expected:`package.json` 的 devDependencies 多出这三项。

- [ ] **Step 2:删除脚手架模板文件**

```bash
git rm -q -r src/App.tsx src/App.css src/index.css src/assets
```

- [ ] **Step 3:改页面标题和语言**

`index.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>The Go Room</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 4:改入口文件**

`src/main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import './app/styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 5:写样式**

`src/app/styles.css`:

```css
:root {
  --bg: #f6f2ea;
  --surface: #fffdf8;
  --text: #2b2520;
  --text-muted: #6f655b;
  --border: #e1d9cc;
  --accent: #2f6f8f;
  --accent-soft: rgba(47, 111, 143, 0.12);
  --board: #dcb35c;
  --board-line: #5a4632;
  --stone-black: #1b1b1b;
  --stone-white: #f4f1ea;
  --mark: #d9534f;

  font: 17px/1.5 system-ui, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  color: var(--text);
  background: var(--bg);
  -webkit-font-smoothing: antialiased;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
}

#root {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 16px 48px;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid var(--border);
  margin-bottom: 24px;
}

.topbar__title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.topbar__nav {
  display: flex;
  gap: 4px;
}

.topbar__link {
  padding: 6px 12px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--text-muted);
  font: inherit;
  cursor: pointer;
}

.topbar__link:hover {
  background: var(--accent-soft);
  color: var(--text);
}

.topbar__link[aria-current='page'] {
  background: var(--accent);
  color: #fff;
}

.page {
  display: grid;
  gap: 24px;
  grid-template-columns: minmax(0, 1fr);
}

@media (min-width: 720px) {
  .page--with-board {
    grid-template-columns: minmax(280px, 560px) minmax(240px, 1fr);
    align-items: start;
  }
}

.panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
}

.panel h2 {
  margin: 0 0 8px;
  font-size: 1.1rem;
}

.panel p {
  margin: 0 0 12px;
}

.muted {
  color: var(--text-muted);
}

.message {
  padding: 12px 14px;
  border-radius: 8px;
  border-left: 4px solid var(--border);
  background: var(--bg);
  margin: 12px 0;
}

.message--hint {
  border-left-color: var(--mark);
}

.message--success {
  border-left-color: var(--accent);
}

.button {
  padding: 8px 16px;
  border: 1px solid var(--accent);
  border-radius: 8px;
  background: var(--accent);
  color: #fff;
  font: inherit;
  cursor: pointer;
}

.button:hover {
  filter: brightness(1.08);
}

.button--ghost {
  background: transparent;
  color: var(--accent);
}

.button:disabled {
  opacity: 0.5;
  cursor: default;
}

.progress {
  display: flex;
  gap: 6px;
  margin: 0 0 16px;
  padding: 0;
  list-style: none;
}

.progress__step {
  width: 28px;
  height: 6px;
  border-radius: 3px;
  background: var(--border);
}

.progress__step--done {
  background: var(--accent);
}

.progress__step--current {
  background: var(--mark);
}

.board {
  display: block;
  width: 100%;
  max-width: 560px;
  aspect-ratio: 1;
  touch-action: manipulation;
  user-select: none;
}

.board__wood {
  fill: var(--board);
}

.board__line {
  stroke: var(--board-line);
  stroke-width: 1;
}

.board__star {
  fill: var(--board-line);
}

.board__stone--black {
  fill: var(--stone-black);
}

.board__stone--white {
  fill: var(--stone-white);
  stroke: #8a8378;
  stroke-width: 1;
}

.board__ghost {
  opacity: 0.45;
}

.board__ring {
  fill: none;
  stroke: var(--mark);
  stroke-width: 3;
}

.board__dot {
  fill: var(--mark);
}

.board__dot--selected {
  fill: var(--accent);
}

.board__last {
  fill: none;
  stroke: var(--accent);
  stroke-width: 2.5;
}

.board__hit {
  fill: transparent;
  cursor: pointer;
}

.board--disabled .board__hit {
  cursor: default;
}
```

- [ ] **Step 6:写失败的测试**

`src/app/App.test.tsx`:

```tsx
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { App } from './App'
import { pageFromHash } from './router'

describe('pageFromHash', () => {
  it('认识三个页面', () => {
    expect(pageFromHash('#/lessons')).toBe('lessons')
    expect(pageFromHash('#/play')).toBe('play')
    expect(pageFromHash('#/replay')).toBe('replay')
  })

  it('空的或不认识的 hash 回到教学页', () => {
    expect(pageFromHash('')).toBe('lessons')
    expect(pageFromHash('#/nowhere')).toBe('lessons')
  })
})

describe('App', () => {
  beforeEach(() => {
    window.location.hash = ''
  })
  afterEach(cleanup)

  it('默认显示教学页和三个导航按钮', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('The Go Room')
    expect(screen.getByRole('button', { name: '教学' }).getAttribute('aria-current')).toBe('page')
    expect(screen.getByRole('button', { name: '对局' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '复盘' })).toBeTruthy()
  })

  it('点导航切换页面并写入 hash', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '对局' }))
    expect(window.location.hash).toBe('#/play')
    expect(screen.getByRole('button', { name: '对局' }).getAttribute('aria-current')).toBe('page')
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('对局')
  })
})
```

- [ ] **Step 7:运行测试,确认失败**

Run:`npx vitest run src/app/App.test.tsx`
Expected:FAIL,提示无法解析 `./App`。

- [ ] **Step 8:写路由**

`src/app/router.ts`:

```ts
import { useCallback, useEffect, useState } from 'react'

export type Page = 'lessons' | 'play' | 'replay'

const PAGES: readonly Page[] = ['lessons', 'play', 'replay']

/** 把地址栏的 hash(如 "#/play")转成页面名,认不出来时回到教学页。 */
export function pageFromHash(hash: string): Page {
  const key = hash.replace(/^#\/?/, '')
  return (PAGES as readonly string[]).includes(key) ? (key as Page) : 'lessons'
}

/** 当前页面和切换页面的函数。页面名写在地址栏 hash 里,刷新后还在。 */
export function usePage(): readonly [Page, (page: Page) => void] {
  const [page, setPage] = useState<Page>(() => pageFromHash(window.location.hash))

  useEffect(() => {
    const onChange = () => setPage(pageFromHash(window.location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  const navigate = useCallback((next: Page) => {
    window.location.hash = `/${next}`
    setPage(next)
  }, [])

  return [page, navigate] as const
}
```

- [ ] **Step 9:写 App,三个页面先用占位**

`src/app/App.tsx`:

```tsx
import { usePage } from './router'
import type { Page } from './router'

const NAV: readonly { page: Page; label: string }[] = [
  { page: 'lessons', label: '教学' },
  { page: 'play', label: '对局' },
  { page: 'replay', label: '复盘' },
]

function Placeholder({ title }: { title: string }) {
  return (
    <section className="page">
      <div className="panel">
        <h2>{title}</h2>
        <p className="muted">这一页还没有做好。</p>
      </div>
    </section>
  )
}

export function App() {
  const [page, navigate] = usePage()

  return (
    <>
      <header className="topbar">
        <h1 className="topbar__title">The Go Room</h1>
        <nav className="topbar__nav" aria-label="主导航">
          {NAV.map((item) => (
            <button
              key={item.page}
              type="button"
              className="topbar__link"
              aria-current={item.page === page ? 'page' : undefined}
              onClick={() => navigate(item.page)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>
      <main>
        {page === 'lessons' && <Placeholder title="教学" />}
        {page === 'play' && <Placeholder title="对局" />}
        {page === 'replay' && <Placeholder title="复盘" />}
      </main>
    </>
  )
}
```

- [ ] **Step 10:运行测试,确认通过**

Run:`npx vitest run src/app/App.test.tsx`
Expected:4 个测试全部 PASS。

- [ ] **Step 11:类型检查、lint、构建**

Run:`npx tsc -b && npx oxlint && npm run build`
Expected:tsc 与 oxlint 无输出,构建以 `✓ built in` 结尾。

- [ ] **Step 12:提交**

```bash
git add -A
git commit -m "feat(app): add app shell with hash routing and UI test setup"
```

---

### Task 2:棋盘组件

**Files:**
- Create:`src/app/board/geometry.ts`、`src/app/board/marks.ts`、`src/app/board/Board.tsx`
- Test:`src/app/board/Board.test.tsx`

棋盘用 SVG 画。相邻两条线的距离是 24 个 SVG 单位,所有半径和线宽都按这个基准算,这样描边宽度才不会把整个棋盘铺满。每个交叉点上盖一个透明的方块接收点击,它的无障碍名称是 `交叉点 x,y`。

- [ ] **Step 1:写失败的测试**

`src/app/board/Board.test.tsx`:

```tsx
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createBoard, parseBoard } from '../../engine'
import { Board } from './Board'
import { pointLabel, starPoints } from './geometry'

afterEach(cleanup)

describe('starPoints', () => {
  it('9 路有四个三三和天元', () => {
    expect(starPoints(9)).toEqual([
      { x: 2, y: 2 },
      { x: 6, y: 2 },
      { x: 2, y: 6 },
      { x: 6, y: 6 },
      { x: 4, y: 4 },
    ])
  })

  it('5 路没有星位', () => {
    expect(starPoints(5)).toEqual([])
  })
})

describe('Board', () => {
  it('每个交叉点都是一个可点的按钮', () => {
    render(<Board board={createBoard(9)} />)
    expect(screen.getAllByRole('button')).toHaveLength(81)
    expect(screen.getByRole('button', { name: pointLabel({ x: 0, y: 0 }) })).toBeTruthy()
  })

  it('按盘面画出黑白子', () => {
    const { container } = render(<Board board={parseBoard(['X.', '.O'])} />)
    const black = container.querySelectorAll('[data-stone="black"]')
    const white = container.querySelectorAll('[data-stone="white"]')
    expect(black).toHaveLength(1)
    expect(black[0].getAttribute('data-x')).toBe('0')
    expect(black[0].getAttribute('data-y')).toBe('0')
    expect(white).toHaveLength(1)
    expect(white[0].getAttribute('data-x')).toBe('1')
    expect(white[0].getAttribute('data-y')).toBe('1')
  })

  it('点交叉点时回调坐标', () => {
    const onPointClick = vi.fn()
    render(<Board board={createBoard(9)} onPointClick={onPointClick} />)
    fireEvent.click(screen.getByRole('button', { name: pointLabel({ x: 3, y: 5 }) }))
    expect(onPointClick).toHaveBeenCalledWith({ x: 3, y: 5 })
  })

  it('disabled 时点了没反应', () => {
    const onPointClick = vi.fn()
    render(<Board board={createBoard(9)} disabled onPointClick={onPointClick} />)
    fireEvent.click(screen.getByRole('button', { name: pointLabel({ x: 3, y: 5 }) }))
    expect(onPointClick).not.toHaveBeenCalled()
  })

  it('画出标记和最后一手', () => {
    const { container } = render(
      <Board
        board={parseBoard(['X..', '...', '...'])}
        lastMove={{ x: 0, y: 0 }}
        marks={[
          { point: { x: 0, y: 0 }, kind: 'ring' },
          { point: { x: 1, y: 1 }, kind: 'dot' },
          { point: { x: 2, y: 2 }, kind: 'selected' },
        ]}
      />,
    )
    expect(container.querySelectorAll('[data-mark="ring"]')).toHaveLength(1)
    expect(container.querySelectorAll('[data-mark="dot"]')).toHaveLength(1)
    expect(container.querySelectorAll('[data-mark="selected"]')).toHaveLength(1)
    expect(container.querySelectorAll('[data-mark="last"]')).toHaveLength(1)
  })

  it('悬停在空点上预览棋子,悬停在棋子上不预览', () => {
    const { container } = render(<Board board={parseBoard(['X..', '...', '...'])} ghostColor="black" />)
    fireEvent.mouseEnter(screen.getByRole('button', { name: pointLabel({ x: 1, y: 1 }) }))
    expect(container.querySelectorAll('[data-ghost="black"]')).toHaveLength(1)
    fireEvent.mouseEnter(screen.getByRole('button', { name: pointLabel({ x: 0, y: 0 }) }))
    expect(container.querySelectorAll('[data-ghost]')).toHaveLength(0)
  })
})
```

- [ ] **Step 2:运行测试,确认失败**

Run:`npx vitest run src/app/board`
Expected:FAIL,提示无法解析 `./Board`。

- [ ] **Step 3:写几何工具**

`src/app/board/geometry.ts`:

```ts
import type { Point } from '../../engine'

/** 星位坐标。9 路是四个三三和天元;13 路及以上用四四。 */
export function starPoints(size: number): Point[] {
  if (size < 7) return []
  const edge = size >= 13 ? 3 : 2
  const far = size - 1 - edge
  const points = [
    { x: edge, y: edge },
    { x: far, y: edge },
    { x: edge, y: far },
    { x: far, y: far },
  ]
  if (size % 2 === 1 && size >= 9) {
    const mid = (size - 1) / 2
    points.push({ x: mid, y: mid })
  }
  return points
}

/** 交叉点的无障碍名称,测试也用它找到对应的点。 */
export function pointLabel(p: Point): string {
  return `交叉点 ${p.x},${p.y}`
}
```

- [ ] **Step 4:写标记工具**

`src/app/board/marks.ts`:

```ts
import { getCell } from '../../engine'
import type { Board, Point } from '../../engine'

/** 棋盘上的辅助标记:ring 套在棋子外,dot 标在空点上,selected 是被用户选中的空点。 */
export interface BoardMark {
  readonly point: Point
  readonly kind: 'ring' | 'dot' | 'selected'
}

/** 给一组点生成标记:点上有棋子用 ring,空点用 emptyKind。 */
export function marksForPoints(
  board: Board,
  points: readonly Point[],
  emptyKind: 'dot' | 'selected' = 'dot',
): BoardMark[] {
  return points.map((point) => ({ point, kind: getCell(board, point) === null ? emptyKind : 'ring' }))
}
```

- [ ] **Step 5:写棋盘组件**

`src/app/board/Board.tsx`:

```tsx
import { useState } from 'react'
import { getCell } from '../../engine'
import type { Board as BoardData, Color, Point } from '../../engine'
import { pointLabel, starPoints } from './geometry'
import type { BoardMark } from './marks'

export interface BoardProps {
  readonly board: BoardData
  /** 最后一手,画一个圈。 */
  readonly lastMove?: Point | null
  readonly marks?: readonly BoardMark[]
  /** 鼠标悬停在空点上时预览这个颜色的棋子;null 不预览。 */
  readonly ghostColor?: Color | null
  /** 不响应点击,也不显示预览。 */
  readonly disabled?: boolean
  readonly onPointClick?: (point: Point) => void
}

/** 相邻两条线的距离,SVG 里的所有长度都以它为基准。 */
const UNIT = 24
const MARGIN = UNIT * 0.75
const STONE_RADIUS = UNIT * 0.47
const MARK_RADIUS = UNIT * 0.3
const DOT_RADIUS = UNIT * 0.16
const STAR_RADIUS = UNIT * 0.09

export function Board({ board, lastMove, marks = [], ghostColor = null, disabled = false, onPointClick }: BoardProps) {
  const [hovered, setHovered] = useState<Point | null>(null)
  const { size } = board
  const span = (size - 1) * UNIT
  const total = span + MARGIN * 2
  const viewBox = `${-MARGIN} ${-MARGIN} ${total} ${total}`
  const at = (i: number) => i * UNIT

  const indexes = Array.from({ length: size }, (_, i) => i)
  const showGhost =
    !disabled && ghostColor !== null && hovered !== null && getCell(board, hovered) === null

  return (
    <svg
      className={disabled ? 'board board--disabled' : 'board'}
      viewBox={viewBox}
      role="group"
      aria-label={`${size} 路棋盘`}
      onMouseLeave={() => setHovered(null)}
    >
      <rect className="board__wood" x={-MARGIN} y={-MARGIN} width={total} height={total} rx={UNIT * 0.2} />
      {indexes.map((i) => (
        <g key={i}>
          <line className="board__line" x1={0} y1={at(i)} x2={span} y2={at(i)} />
          <line className="board__line" x1={at(i)} y1={0} x2={at(i)} y2={span} />
        </g>
      ))}
      {starPoints(size).map((p) => (
        <circle key={`star-${p.x}-${p.y}`} className="board__star" cx={at(p.x)} cy={at(p.y)} r={STAR_RADIUS} />
      ))}
      {board.cells.map((cell, index) => {
        if (cell === null) return null
        const x = index % size
        const y = Math.floor(index / size)
        return (
          <circle
            key={`stone-${index}`}
            className={`board__stone board__stone--${cell}`}
            data-stone={cell}
            data-x={x}
            data-y={y}
            cx={at(x)}
            cy={at(y)}
            r={STONE_RADIUS}
          />
        )
      })}
      {showGhost && (
        <circle
          className={`board__stone board__stone--${ghostColor} board__ghost`}
          data-ghost={ghostColor}
          cx={at(hovered.x)}
          cy={at(hovered.y)}
          r={STONE_RADIUS}
        />
      )}
      {marks.map((mark) => {
        const key = `mark-${mark.kind}-${mark.point.x}-${mark.point.y}`
        const cx = at(mark.point.x)
        const cy = at(mark.point.y)
        if (mark.kind === 'ring') {
          return <circle key={key} className="board__ring" data-mark="ring" cx={cx} cy={cy} r={MARK_RADIUS} />
        }
        const cls = mark.kind === 'selected' ? 'board__dot board__dot--selected' : 'board__dot'
        return <circle key={key} className={cls} data-mark={mark.kind} cx={cx} cy={cy} r={DOT_RADIUS} />
      })}
      {lastMove && (
        <circle className="board__last" data-mark="last" cx={at(lastMove.x)} cy={at(lastMove.y)} r={MARK_RADIUS} />
      )}
      {indexes.map((y) =>
        indexes.map((x) => {
          const p = { x, y }
          return (
            <rect
              key={`hit-${x}-${y}`}
              className="board__hit"
              role="button"
              aria-label={pointLabel(p)}
              aria-disabled={disabled || undefined}
              x={at(x) - UNIT / 2}
              y={at(y) - UNIT / 2}
              width={UNIT}
              height={UNIT}
              onMouseEnter={() => setHovered(p)}
              onClick={() => {
                if (!disabled) onPointClick?.(p)
              }}
            />
          )
        }),
      )}
    </svg>
  )
}
```

- [ ] **Step 6:运行测试,确认通过**

Run:`npx vitest run src/app/board`
Expected:8 个测试全部 PASS。

- [ ] **Step 7:类型检查与 lint**

Run:`npx tsc -b && npx oxlint`
Expected:无输出。

- [ ] **Step 8:提交**

```bash
git add src/app/board
git commit -m "feat(app): add SVG board component"
```

---

### Task 3:关卡数据

**Files:**
- Create:`src/content/types.ts`、`src/content/lessons.ts`
- Test:`src/content/lessons.test.ts`

测试不只检查格式,还用引擎真的走一遍:准备手合法、正确答案能走通、第 2 关的目标点就是那块棋的气、第 3 关真的提子、第 4 关一个点是禁入点一个点能下。

第 5 关的局面,白先在 (3,3) 提掉黑 (4,3) 形成劫,然后轮到黑:

```
.........
.........
...XO....      X(3,2) O(4,2)
..X.XO...      X(2,3) 空(3,3) X(4,3) O(5,3)
...XO....      X(3,4) O(4,4)
```

- [ ] **Step 1:写类型**

`src/content/types.ts`:

```ts
import type { Color, Point, RejectReason } from '../engine'

/** 针对某个具体错误落点的提示。 */
export interface PointHint {
  readonly point: Point
  readonly text: string
}

/** 要求用户落一子的步骤。落子不被接受时盘面不变,只显示提示。 */
export interface PlaceStep {
  readonly kind: 'place'
  /** 这一步要做什么,显示在棋盘旁。 */
  readonly goal: string
  /** 算对的落点;'any-legal' 表示任何合法点都算对。 */
  readonly accept: readonly Point[] | 'any-legal'
  /** 下在特定错误点时的提示。 */
  readonly hints?: readonly PointHint[]
  /** 其他错误落点的提示。 */
  readonly fallbackHint: string
  /** 落子被引擎拒绝时,按拒绝原因给的提示;没有对应条目时用 fallbackHint。 */
  readonly rejectHints?: Partial<Record<RejectReason, string>>
  /**
   * 这一步的目的是让用户亲身撞上一次拒绝:
   * 在该点落子被引擎以该原因拒绝时,本步完成,显示 success。
   */
  readonly expectReject?: { readonly point: Point; readonly reason: RejectReason }
  readonly success: string
}

/** 要求用户点出一组空点的步骤,例如点出一块棋的所有气。点过的点再点一次取消。 */
export interface SelectStep {
  readonly kind: 'select'
  readonly goal: string
  /** 必须全部点出的点。 */
  readonly targets: readonly Point[]
  /** 点了不属于 targets 的点时的提示。 */
  readonly wrongHint: string
  readonly success: string
}

export type LessonStep = PlaceStep | SelectStep

export interface Lesson {
  readonly id: string
  readonly title: string
  /** 进入关卡时的说明,一两句话。 */
  readonly intro: string
  /** 初始盘面,X 黑 O 白 . 空,每行一个字符串。 */
  readonly rows: readonly string[]
  /** 初始盘面上轮到谁。 */
  readonly toPlay: Color
  /** 从初始盘面开始、双方轮流下的准备手,用来制造"刚刚发生过某事"的局面。 */
  readonly setupMoves?: readonly Point[]
  /** 需要用标记突出显示的点:有子的点画圈,空点画点。 */
  readonly highlight?: readonly Point[]
  readonly steps: readonly LessonStep[]
}
```

- [ ] **Step 2:写失败的测试**

`src/content/lessons.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { createGame, getCell, getGroup, isOnBoard, parseBoard, play } from '../engine'
import type { GameState, Point } from '../engine'
import { LESSONS } from './lessons'
import type { Lesson } from './types'

/** 按关卡定义建好初始局面,准备手必须全部合法。 */
function setUp(lesson: Lesson): GameState {
  let game = createGame({ board: parseBoard(lesson.rows), toPlay: lesson.toPlay })
  for (const move of lesson.setupMoves ?? []) {
    const result = play(game, move)
    if (!result.ok) throw new Error(`${lesson.id}: 准备手 ${move.x},${move.y} 被拒绝:${result.reason}`)
    game = result.state
  }
  return game
}

function byPoint(a: Point, b: Point): number {
  return a.y - b.y || a.x - b.x
}

function firstLegal(game: GameState): Point {
  for (let index = 0; index < game.board.cells.length; index++) {
    const p = { x: index % game.board.size, y: Math.floor(index / game.board.size) }
    if (play(game, p).ok) return p
  }
  throw new Error('没有合法点')
}

describe('LESSONS', () => {
  it('有 5 关,id 不重复', () => {
    expect(LESSONS).toHaveLength(5)
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(5)
  })

  it.each(LESSONS.map((l) => [l.id, l] as const))('%s:盘面、准备手和标记都合法', (_id, lesson) => {
    const game = setUp(lesson)
    expect(game.board.size).toBe(9)
    for (const p of lesson.highlight ?? []) expect(isOnBoard(game.board, p)).toBe(true)
    expect(lesson.steps.length).toBeGreaterThan(0)
  })

  it.each(LESSONS.map((l) => [l.id, l] as const))('%s:每一步都能按正确答案走通', (_id, lesson) => {
    let game = setUp(lesson)
    for (const step of lesson.steps) {
      if (step.kind === 'select') {
        expect(step.targets.length).toBeGreaterThan(0)
        for (const p of step.targets) expect(getCell(game.board, p)).toBeNull()
        continue
      }
      if (step.expectReject) {
        expect(play(game, step.expectReject.point)).toEqual({ ok: false, reason: step.expectReject.reason })
      }
      for (const hint of step.hints ?? []) expect(isOnBoard(game.board, hint.point)).toBe(true)

      if (step.accept === 'any-legal') {
        const result = play(game, firstLegal(game))
        expect(result.ok).toBe(true)
        if (result.ok) game = result.state
      } else if (step.accept.length > 0) {
        for (const p of step.accept) expect(play(game, p).ok).toBe(true)
        const result = play(game, step.accept[0])
        if (result.ok) game = result.state
      } else {
        expect(step.expectReject).toBeDefined()
      }
    }
  })

  it('第 2 关的目标点就是圈起来那块棋的全部气', () => {
    const lesson = LESSONS.find((l) => l.id === 'liberties')!
    const step = lesson.steps[0]
    if (step.kind !== 'select') throw new Error('关卡定义变了')
    const group = getGroup(setUp(lesson).board, lesson.highlight![0])!
    expect(group.stones).toHaveLength(lesson.highlight!.length)
    expect([...step.targets].sort(byPoint)).toEqual([...group.liberties].sort(byPoint))
  })

  it('第 3 关的正确落点确实提子', () => {
    const lesson = LESSONS.find((l) => l.id === 'capture')!
    const step = lesson.steps[0]
    if (step.kind !== 'place' || step.accept === 'any-legal') throw new Error('关卡定义变了')
    const result = play(setUp(lesson), step.accept[0])
    expect(result.ok && result.state.history[0].kind === 'play' && result.state.history[0].captured.length).toBe(1)
  })

  it('第 4 关的两个标记点一个是禁入点,一个能下', () => {
    const lesson = LESSONS.find((l) => l.id === 'suicide')!
    const game = setUp(lesson)
    const [forbidden, allowed] = lesson.highlight!
    expect(play(game, forbidden)).toEqual({ ok: false, reason: 'suicide' })
    expect(play(game, allowed).ok).toBe(true)
  })
})
```

- [ ] **Step 3:运行测试,确认失败**

Run:`npx vitest run src/content`
Expected:FAIL,提示无法解析 `./lessons`。

- [ ] **Step 4:写关卡内容**

`src/content/lessons.ts`:

```ts
import type { Lesson } from './types'

export type { Lesson, LessonStep, PlaceStep, PointHint, SelectStep } from './types'

const EMPTY_9 = ['.........', '.........', '.........', '.........', '.........', '.........', '.........', '.........', '.........']

export const LESSONS: readonly Lesson[] = [
  {
    id: 'place',
    title: '第 1 关:落子',
    intro: '围棋的棋子下在线和线的交叉点上,不是格子里。黑棋先下,下了就不能再移动。',
    rows: EMPTY_9,
    toPlay: 'black',
    steps: [
      {
        kind: 'place',
        goal: '在棋盘上任意一个交叉点下一颗黑子。',
        accept: 'any-legal',
        fallbackHint: '请点一个空的交叉点。',
        success: '这就是落子。接下来认识棋子的"气"。',
      },
    ],
  },
  {
    id: 'liberties',
    title: '第 2 关:气',
    intro: '紧挨着棋子的上下左右空点叫"气"。相连的同色棋子是一块,共用所有的气。斜着的点不算。',
    rows: ['.........', '.........', '.........', '....O....', '....XX...', '.........', '.........', '.........', '.........'],
    toPlay: 'black',
    highlight: [
      { x: 4, y: 4 },
      { x: 5, y: 4 },
    ],
    steps: [
      {
        kind: 'select',
        goal: '点出被圈起来的这块黑棋的所有气。白子占住的点不算。',
        targets: [
          { x: 3, y: 4 },
          { x: 6, y: 4 },
          { x: 5, y: 3 },
          { x: 4, y: 5 },
          { x: 5, y: 5 },
        ],
        wrongHint: '这个点不是这块棋的气。气是紧挨着棋子上下左右的空点,斜着的和被对方占住的都不算。',
        success: '这块棋有 5 口气。白子占住了一口,所以不是 6 口。气全部被占住,棋子就会被提走。',
      },
    ],
  },
  {
    id: 'capture',
    title: '第 3 关:提子',
    intro: '把对方一块棋的气全部占住,这块棋就会从棋盘上被拿走,这叫"提子"。',
    rows: ['.........', '.........', '.........', '....X....', '...XO....', '....X....', '.........', '.........', '.........'],
    toPlay: 'black',
    highlight: [{ x: 4, y: 4 }],
    steps: [
      {
        kind: 'place',
        goal: '圈起来的白子只剩最后一口气了。下在那里,把它提掉。',
        accept: [{ x: 5, y: 4 }],
        fallbackHint: '找一找白子紧挨着的空点,它只剩一个了。',
        success: '白子的最后一口气没了,被提走了。提掉的子不会再回到棋盘上。',
      },
    ],
  },
  {
    id: 'suicide',
    title: '第 4 关:禁入点',
    intro: '落子之后自己的棋至少要有一口气,除非这一手能提掉对方的子。一下去就没气、又提不了子的点,叫"禁入点",不能下。',
    rows: ['.........', '..O......', '.O.O.....', '..O......', '.........', '.....O...', '....O.O..', '.........', '.........'],
    toPlay: 'black',
    highlight: [
      { x: 2, y: 2 },
      { x: 5, y: 6 },
    ],
    steps: [
      {
        kind: 'place',
        goal: '两个标记点里,只有一个能下。试试看。',
        accept: [{ x: 5, y: 6 }],
        fallbackHint: '请在两个标记点里选一个。',
        rejectHints: {
          suicide: '这里是禁入点:下进去黑子一口气也没有,又提不掉任何白子,所以不能下。换另一个试试。',
        },
        success: '这里下面还有一口气,可以下。记住:落子后至少要有一口气,或者能提掉对方的子。',
      },
    ],
  },
  {
    id: 'ko',
    title: '第 5 关:劫',
    intro: '有一种形状,双方可以你提我一子、我提你一子,没完没了。规则规定:刚被提的那个点不能马上提回去。这叫"劫"。',
    rows: ['.........', '.........', '...XO....', '..X.XO...', '...XO....', '.........', '.........', '.........', '.........'],
    toPlay: 'white',
    setupMoves: [{ x: 3, y: 3 }],
    steps: [
      {
        kind: 'place',
        goal: '白刚刚下了带圈的那颗子,提了你一子。试着马上提回去。',
        accept: [],
        expectReject: { point: { x: 4, y: 3 }, reason: 'repeated-position' },
        fallbackHint: '先试试在刚被提子的位置提回去。',
        success: '下不了。这就是劫:不能让棋盘回到刚才的样子。要先在别处下一手,如果对方不应,下一手才能提回。',
      },
      {
        kind: 'place',
        goal: '在别处下一手。',
        accept: 'any-legal',
        fallbackHint: '请点一个空的交叉点。',
        success: '这一手叫"找劫材"。对方如果不理,你下一手就可以提回劫了。教学到此结束,去和电脑下一盘吧。',
      },
    ],
  },
]
```

- [ ] **Step 5:运行测试,确认通过**

Run:`npx vitest run src/content`
Expected:14 个测试全部 PASS。

- [ ] **Step 6:类型检查与 lint**

Run:`npx tsc -b && npx oxlint`
Expected:无输出。

- [ ] **Step 7:提交**

```bash
git add src/content
git commit -m "feat(content): add five interactive lessons"
```

---

### Task 4:关卡运行逻辑

**Files:**
- Create:`src/app/lessons/lessonRunner.ts`
- Test:`src/app/lessons/lessonRunner.test.ts`

这是纯函数,不碰 DOM,在 Node 环境测。每次点击返回一个新的 `LessonRun`。

- [ ] **Step 1:写失败的测试**

`src/app/lessons/lessonRunner.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { getCell } from '../../engine'
import { LESSONS } from '../../content/lessons'
import type { Lesson } from '../../content/lessons'
import { clickPoint, currentStep, isLessonDone, lessonMarks, startLesson } from './lessonRunner'

function lesson(id: string): Lesson {
  return LESSONS.find((l) => l.id === id)!
}

describe('startLesson', () => {
  it('按关卡定义建立局面,准备手已经下好', () => {
    const run = startLesson(lesson('ko'))
    expect(getCell(run.game.board, { x: 3, y: 3 })).toBe('white')
    expect(getCell(run.game.board, { x: 4, y: 3 })).toBeNull()
    expect(run.game.toPlay).toBe('black')
    expect(run.lastMove).toEqual({ x: 3, y: 3 })
    expect(run.stepIndex).toBe(0)
    expect(isLessonDone(run)).toBe(false)
  })

  it('准备手不合法时抛出明确错误', () => {
    const broken: Lesson = { ...lesson('place'), id: 'broken', setupMoves: [{ x: 0, y: 0 }, { x: 0, y: 0 }] }
    expect(() => startLesson(broken)).toThrow(/broken/)
  })

  it('高亮点有子画圈,空点画点', () => {
    const run = startLesson(lesson('suicide'))
    expect(lessonMarks(run)).toEqual([
      { point: { x: 2, y: 2 }, kind: 'dot' },
      { point: { x: 5, y: 6 }, kind: 'dot' },
    ])
    expect(lessonMarks(startLesson(lesson('capture')))).toEqual([{ point: { x: 4, y: 4 }, kind: 'ring' }])
  })
})

describe('place 步骤', () => {
  it('任意合法点算对,落子生效,本关完成', () => {
    const run = clickPoint(startLesson(lesson('place')), { x: 4, y: 4 })
    expect(getCell(run.game.board, { x: 4, y: 4 })).toBe('black')
    expect(run.lastMove).toEqual({ x: 4, y: 4 })
    expect(run.message?.kind).toBe('success')
    expect(isLessonDone(run)).toBe(true)
  })

  it('下错点时盘面不变,给出提示', () => {
    const start = startLesson(lesson('capture'))
    const run = clickPoint(start, { x: 0, y: 0 })
    expect(run.game).toBe(start.game)
    expect(run.message).toEqual({ kind: 'hint', text: '找一找白子紧挨着的空点,它只剩一个了。' })
    expect(run.stepIndex).toBe(0)
  })

  it('下对点时提子生效', () => {
    const run = clickPoint(startLesson(lesson('capture')), { x: 5, y: 4 })
    expect(getCell(run.game.board, { x: 4, y: 4 })).toBeNull()
    expect(run.message?.kind).toBe('success')
  })

  it('被引擎拒绝时按原因给提示', () => {
    const run = clickPoint(startLesson(lesson('suicide')), { x: 2, y: 2 })
    expect(run.message?.kind).toBe('hint')
    expect(run.message?.text).toContain('禁入点')
    expect(run.stepIndex).toBe(0)
  })

  it('没有针对性提示的拒绝用 fallbackHint', () => {
    const start = startLesson(lesson('capture'))
    const run = clickPoint(start, { x: 4, y: 4 })
    expect(run.message).toEqual({ kind: 'hint', text: '找一找白子紧挨着的空点,它只剩一个了。' })
  })

  it('expectReject:撞上预期的拒绝就完成本步', () => {
    const start = startLesson(lesson('ko'))
    const run = clickPoint(start, { x: 4, y: 3 })
    expect(run.game).toBe(start.game)
    expect(run.message?.kind).toBe('success')
    expect(run.stepIndex).toBe(1)
    expect(currentStep(run)?.goal).toBe('在别处下一手。')
  })

  it('expectReject:下在别处只给提示', () => {
    const run = clickPoint(startLesson(lesson('ko')), { x: 0, y: 0 })
    expect(run.message).toEqual({ kind: 'hint', text: '先试试在刚被提子的位置提回去。' })
    expect(run.stepIndex).toBe(0)
  })

  it('劫关卡走完两步', () => {
    let run = clickPoint(startLesson(lesson('ko')), { x: 4, y: 3 })
    run = clickPoint(run, { x: 0, y: 0 })
    expect(getCell(run.game.board, { x: 0, y: 0 })).toBe('black')
    expect(isLessonDone(run)).toBe(true)
  })
})

describe('select 步骤', () => {
  const targets = [
    { x: 3, y: 4 },
    { x: 6, y: 4 },
    { x: 5, y: 3 },
    { x: 4, y: 5 },
    { x: 5, y: 5 },
  ]

  it('点中目标点会记为已选,并画成 selected', () => {
    const run = clickPoint(startLesson(lesson('liberties')), targets[0])
    expect(run.selected).toEqual([targets[0]])
    expect(run.message).toBeNull()
    expect(lessonMarks(run)).toContainEqual({ point: targets[0], kind: 'selected' })
  })

  it('再点一次取消', () => {
    let run = clickPoint(startLesson(lesson('liberties')), targets[0])
    run = clickPoint(run, targets[0])
    expect(run.selected).toEqual([])
  })

  it('点错的点或棋子给提示,已选的不丢', () => {
    let run = clickPoint(startLesson(lesson('liberties')), targets[0])
    run = clickPoint(run, { x: 0, y: 0 })
    expect(run.message?.kind).toBe('hint')
    expect(run.selected).toEqual([targets[0]])
    run = clickPoint(run, { x: 4, y: 4 })
    expect(run.message?.kind).toBe('hint')
  })

  it('全部点出后完成', () => {
    let run = startLesson(lesson('liberties'))
    for (const t of targets) run = clickPoint(run, t)
    expect(run.message?.kind).toBe('success')
    expect(isLessonDone(run)).toBe(true)
  })
})

describe('clickPoint', () => {
  it('关卡完成后再点没有变化', () => {
    const done = clickPoint(startLesson(lesson('place')), { x: 4, y: 4 })
    expect(clickPoint(done, { x: 0, y: 0 })).toBe(done)
  })
})
```

- [ ] **Step 2:运行测试,确认失败**

Run:`npx vitest run src/app/lessons`
Expected:FAIL,提示无法解析 `./lessonRunner`。

- [ ] **Step 3:实现**

`src/app/lessons/lessonRunner.ts`:

```ts
import { createGame, getCell, parseBoard, play, samePoint } from '../../engine'
import type { GameState, Point } from '../../engine'
import type { Lesson, LessonStep, PlaceStep, SelectStep } from '../../content/lessons'
import { marksForPoints } from '../board/marks'
import type { BoardMark } from '../board/marks'

export interface LessonMessage {
  readonly kind: 'hint' | 'success'
  readonly text: string
}

/** 一个关卡的进行状态。所有函数都返回新对象,不修改传入的对象。 */
export interface LessonRun {
  readonly lesson: Lesson
  readonly game: GameState
  /** 当前步骤下标;等于步骤总数时表示本关完成。 */
  readonly stepIndex: number
  /** select 步骤里用户已点出的点。 */
  readonly selected: readonly Point[]
  readonly message: LessonMessage | null
  readonly lastMove: Point | null
}

/**
 * 从关卡定义建立初始局面。
 * 准备手不合法说明关卡数据写错了,这是开发期错误,直接抛出。
 */
export function startLesson(lesson: Lesson): LessonRun {
  let game = createGame({ board: parseBoard(lesson.rows), toPlay: lesson.toPlay })
  let lastMove: Point | null = null
  for (const move of lesson.setupMoves ?? []) {
    const result = play(game, move)
    if (!result.ok) {
      throw new Error(`关卡 ${lesson.id} 的准备手 ${move.x},${move.y} 不合法:${result.reason}`)
    }
    game = result.state
    lastMove = move
  }
  return { lesson, game, stepIndex: 0, selected: [], message: null, lastMove }
}

export function currentStep(run: LessonRun): LessonStep | null {
  return run.lesson.steps[run.stepIndex] ?? null
}

export function isLessonDone(run: LessonRun): boolean {
  return run.stepIndex >= run.lesson.steps.length
}

/** 当前要画在棋盘上的标记:关卡的高亮点,加上 select 步骤里已选的点。 */
export function lessonMarks(run: LessonRun): BoardMark[] {
  return [
    ...marksForPoints(run.game.board, run.lesson.highlight ?? []),
    ...marksForPoints(run.game.board, run.selected, 'selected'),
  ]
}

function includesPoint(points: readonly Point[], p: Point): boolean {
  return points.some((q) => samePoint(q, p))
}

function advance(run: LessonRun, patch: Partial<LessonRun>, success: string): LessonRun {
  return {
    ...run,
    ...patch,
    stepIndex: run.stepIndex + 1,
    selected: [],
    message: { kind: 'success', text: success },
  }
}

function hint(run: LessonRun, text: string): LessonRun {
  return { ...run, message: { kind: 'hint', text } }
}

function handlePlace(run: LessonRun, step: PlaceStep, p: Point): LessonRun {
  const result = play(run.game, p)

  if (step.expectReject && samePoint(step.expectReject.point, p)) {
    if (!result.ok && result.reason === step.expectReject.reason) {
      return advance(run, {}, step.success)
    }
  }

  if (!result.ok) {
    return hint(run, step.rejectHints?.[result.reason] ?? step.fallbackHint)
  }

  const accepted = step.accept === 'any-legal' || includesPoint(step.accept, p)
  if (!accepted) {
    const specific = step.hints?.find((h) => samePoint(h.point, p))
    return hint(run, specific?.text ?? step.fallbackHint)
  }

  return advance(run, { game: result.state, lastMove: p }, step.success)
}

function handleSelect(run: LessonRun, step: SelectStep, p: Point): LessonRun {
  if (getCell(run.game.board, p) !== null || !includesPoint(step.targets, p)) {
    return hint(run, step.wrongHint)
  }
  const selected = includesPoint(run.selected, p)
    ? run.selected.filter((q) => !samePoint(q, p))
    : [...run.selected, p]
  const complete = step.targets.every((t) => includesPoint(selected, t))
  if (complete) return advance(run, {}, step.success)
  return { ...run, selected, message: null }
}

/** 用户点了棋盘上的一个点。关卡已完成时原样返回。 */
export function clickPoint(run: LessonRun, p: Point): LessonRun {
  const step = currentStep(run)
  if (step === null) return run
  return step.kind === 'place' ? handlePlace(run, step, p) : handleSelect(run, step, p)
}
```

- [ ] **Step 4:运行测试,确认通过**

Run:`npx vitest run src/app/lessons`
Expected:16 个测试全部 PASS。

- [ ] **Step 5:类型检查与 lint**

Run:`npx tsc -b && npx oxlint`
Expected:无输出。

- [ ] **Step 6:提交**

```bash
git add src/app/lessons
git commit -m "feat(app): add lesson runner"
```

---

### Task 5:教学页面并接入 App

**Files:**
- Create:`src/app/lessons/LessonPage.tsx`
- Test:`src/app/lessons/LessonPage.test.tsx`
- Modify:`src/app/App.tsx`、`src/app/App.test.tsx`

- [ ] **Step 1:写失败的测试**

`src/app/lessons/LessonPage.test.tsx`:

```tsx
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LESSONS } from '../../content/lessons'
import { pointLabel } from '../board/geometry'
import { LessonPage } from './LessonPage'

afterEach(cleanup)

function click(x: number, y: number) {
  fireEvent.click(screen.getByRole('button', { name: pointLabel({ x, y }) }))
}

describe('LessonPage', () => {
  it('显示第一关的标题、说明和任务', () => {
    render(<LessonPage lessons={LESSONS} onFinish={() => {}} />)
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('第 1 关:落子')
    expect(screen.getByText(LESSONS[0].intro)).toBeTruthy()
    expect(screen.getByText('在棋盘上任意一个交叉点下一颗黑子。')).toBeTruthy()
    expect(screen.queryByRole('button', { name: '下一关' })).toBeNull()
  })

  it('完成一关后出现成功提示和下一关按钮', () => {
    render(<LessonPage lessons={LESSONS} onFinish={() => {}} />)
    click(4, 4)
    expect(screen.getByRole('status').textContent).toContain('这就是落子')
    fireEvent.click(screen.getByRole('button', { name: '下一关' }))
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('第 2 关:气')
  })

  it('下错时显示提示,可以重来这一关', () => {
    render(<LessonPage lessons={[LESSONS[2]]} onFinish={() => {}} />)
    click(0, 0)
    expect(screen.getByRole('status').className).toContain('message--hint')
    click(5, 4)
    expect(screen.getByRole('status').className).toContain('message--success')
    fireEvent.click(screen.getByRole('button', { name: '重来这一关' }))
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('最后一关完成后点"去对局"触发回调', () => {
    const onFinish = vi.fn()
    render(<LessonPage lessons={[LESSONS[0]]} onFinish={onFinish} />)
    click(4, 4)
    fireEvent.click(screen.getByRole('button', { name: '去对局' }))
    expect(onFinish).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2:运行测试,确认失败**

Run:`npx vitest run src/app/lessons/LessonPage.test.tsx`
Expected:FAIL,提示无法解析 `./LessonPage`。

- [ ] **Step 3:写教学页面**

`src/app/lessons/LessonPage.tsx`:

```tsx
import { useState } from 'react'
import type { Lesson } from '../../content/lessons'
import { Board } from '../board/Board'
import { clickPoint, currentStep, isLessonDone, lessonMarks, startLesson } from './lessonRunner'

export interface LessonPageProps {
  readonly lessons: readonly Lesson[]
  /** 最后一关完成后用户点"去对局"时调用。 */
  readonly onFinish: () => void
}

export function LessonPage({ lessons, onFinish }: LessonPageProps) {
  const [index, setIndex] = useState(0)
  const [run, setRun] = useState(() => startLesson(lessons[0]))

  const lesson = lessons[index]
  const step = currentStep(run)
  const done = isLessonDone(run)
  const isLast = index === lessons.length - 1

  function goTo(next: number) {
    setIndex(next)
    setRun(startLesson(lessons[next]))
  }

  return (
    <section className="page page--with-board">
      <Board
        board={run.game.board}
        lastMove={run.lastMove}
        marks={lessonMarks(run)}
        ghostColor={step?.kind === 'place' ? run.game.toPlay : null}
        disabled={done}
        onPointClick={(p) => setRun((current) => clickPoint(current, p))}
      />
      <div className="panel">
        <ol className="progress" aria-label="教学进度">
          {lessons.map((l, i) => (
            <li
              key={l.id}
              className={
                i < index ? 'progress__step progress__step--done' : i === index ? 'progress__step progress__step--current' : 'progress__step'
              }
              aria-current={i === index ? 'step' : undefined}
            />
          ))}
        </ol>
        <h2>{lesson.title}</h2>
        <p className="muted">{lesson.intro}</p>
        {step && <p>{step.goal}</p>}
        {run.message && (
          <p className={`message message--${run.message.kind}`} role="status">
            {run.message.text}
          </p>
        )}
        <p>
          {done && !isLast && (
            <button type="button" className="button" onClick={() => goTo(index + 1)}>
              下一关
            </button>
          )}
          {done && isLast && (
            <button type="button" className="button" onClick={onFinish}>
              去对局
            </button>
          )}{' '}
          <button type="button" className="button button--ghost" onClick={() => goTo(index)}>
            重来这一关
          </button>
        </p>
      </div>
    </section>
  )
}
```

- [ ] **Step 4:运行测试,确认通过**

Run:`npx vitest run src/app/lessons/LessonPage.test.tsx`
Expected:4 个测试全部 PASS。

- [ ] **Step 5:接入 App**

把 `src/app/App.tsx` 开头的导入

```tsx
import { usePage } from './router'
import type { Page } from './router'
```

整体替换为

```tsx
import { LESSONS } from '../content/lessons'
import { LessonPage } from './lessons/LessonPage'
import { usePage } from './router'
import type { Page } from './router'
```

把

```tsx
        {page === 'lessons' && <Placeholder title="教学" />}
```

替换为

```tsx
        {page === 'lessons' && <LessonPage lessons={LESSONS} onFinish={() => navigate('play')} />}
```

- [ ] **Step 6:补 App 的测试**

在 `src/app/App.test.tsx` 里,紧跟在这一行

```tsx
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('The Go Room')
```

之后插入

```tsx
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('第 1 关:落子')
```

- [ ] **Step 7:跑全部测试**

Run:`npm test`
Expected:`Test Files  12 passed (12)`,`Tests  108 passed (108)`。

- [ ] **Step 8:类型检查与 lint**

Run:`npx tsc -b && npx oxlint`
Expected:无输出。

- [ ] **Step 9:提交**

```bash
git add src/app
git commit -m "feat(app): add lesson page and wire it into the app"
```

---

### Task 6:整体验证与 README

**Files:**
- Modify:`README.md`(当前状态、接下来的工作)

- [ ] **Step 1:构建与 lint**

Run:`npm run build && npm run lint`
Expected:构建以 `✓ built in` 结尾,lint 无输出。

- [ ] **Step 2:在浏览器里过一遍**

```bash
npm run dev
```

打开终端里给出的地址,确认:棋盘是木色、有 9 路线和 5 个星位;第 1 关任意落子后出现"下一关";第 2 关点出 5 口气后过关;第 4 关点左上的标记点会看到"禁入点"提示;第 5 关先点 (4,3) 被拒绝、再在别处落子后出现"去对局"。看完用 Ctrl+C 停掉。执行者没有浏览器时,把这一步留给项目负责人,并在报告里写明。

- [ ] **Step 3:更新 README**

把 README "当前状态"一节的第一段改为下面这段,保留该节里 GitHub 仓库那一行:

```markdown
已完成项目脚手架、规则引擎(`src/engine/`)、简单电脑对手(`src/ai/`)、可交互棋盘和 5 关互动教学(`src/app/`、`src/content/`)。用 `npm run dev` 启动,`npm test` 跑测试。对局和复盘页面尚未实现。
```

把"接下来的工作"一节改为:

```markdown
## 接下来的工作

1. 引导对局、终局数子与复盘。
```

- [ ] **Step 4:提交**

```bash
git add README.md
git commit -m "docs: update README for board and lessons"
```

不要推送。是否推送到 GitHub 由项目负责人决定。
