import type { Point } from '../engine'

export interface CaptureScene {
  readonly id: string
  readonly lesson: number
  readonly title: string
  readonly guided: boolean
  readonly rows: readonly string[]
  readonly targets: readonly Point[]
  readonly solution: readonly Point[]
  readonly wrongFirst: Point
  readonly wrongFollowUp?: readonly Point[]
  readonly wrongLabel?: string
  readonly connection?: Point
  readonly takeaway?: string
  readonly maxMoves: number
  readonly contrastRows?: readonly string[]
  readonly task: string
  readonly intro: string
  readonly hints: readonly [string, string, string]
}

const point = (name: string): Point => ({ x: name.charCodeAt(0) - 65, y: Number(name[1]) - 1 })

export const CAPTURE_SCENES: readonly CaptureScene[] = [
  {
    id: "direction-guided", lesson: 1, title: "关住白棋的出路", guided: true,
    rows: [".........", ".X.X.....", ".XOX.....", ".........", ".........", ".........", ".........", ".........", "........."],
    targets: [point("C3")],
    solution: [point("C4"), point("C2")], wrongFirst: point("C2"), maxMoves: 2,
    task: "把白棋赶进上方窄口，再提掉它。",
    intro: "白棋有两个出口。往下逃能走到空处，往上逃会遇到两侧的黑子。",
    hints: ["先看白棋上下两个出口。", "标出白棋以及它仅剩的两口气。", "看黑棋从下方叫吃，再堵住剩下的气。"],
  },
  {
    id: "direction-check", lesson: 1, title: "赶向有黑棋的一边", guided: false,
    rows: [".....XO.X", ".........", ".........", ".........", ".........", ".........", ".........", ".........", "........."],
    targets: [point("G1")],
    solution: [point("G2"), point("H1")], wrongFirst: point("H1"), maxMoves: 2,
    task: "从正确的方向叫吃白棋。",
    intro: "这次白棋在上边。比较它往右和往下逃时会遇到什么。",
    hints: ["留意上边线和右上角的黑棋。", "标出白棋和它的两口气。", "看黑棋从下方叫吃，把白棋赶向右侧黑棋。"],
  },
  {
    id: "double-guided", lesson: 2, title: "一手叫吃两块棋", guided: true,
    rows: [".........", "..X......", ".........", ".XOX.....", "...OX....", ".........", "...X.....", ".........", "........."],
    targets: [point("C4"), point("D5")],
    solution: [point("C5"), point("D6")], wrongFirst: point("C3"), maxMoves: 2,
    task: "下一手同时叫吃两块白棋。",
    intro: "两颗白棋各有两口气。找一个对两颗白棋都有效的交叉点。",
    hints: ["分别数两颗白棋的气，找它们共同的空点。", "标出两个目标及各自的气。", "看黑棋下一手同时压住两块，白棋救一块后提另一块。"],
  },
  {
    id: "double-check", lesson: 2, title: "别只叫吃一块", guided: false,
    rows: [".....X...", "..X.XX...", "X.O.O....", ".XX.X....", ".........", ".........", ".........", ".........", "........."],
    targets: [point("C3"), point("E3")],
    solution: [point("D3"), point("B3")], wrongFirst: point("B3"), maxMoves: 2,
    task: "找到能同时叫吃两块棋的一手。",
    intro: "这里有个点也能叫吃，但只威胁其中一块。看看同时威胁两块该下哪里。",
    hints: ["两颗白棋之间的空点同时贴着谁？", "标出两个目标和它们的气。", "看黑棋下在两颗白棋之间，白棋救一边后提另一边。"],
  },
  {
    id: "ladder-guided", lesson: 3, title: "沿着台阶追到边上", guided: true,
    rows: [".........", ".........", "....X....", ".........", "...XOX...", ".........", ".........", ".........", "........."],
    targets: [point("E5")],
    solution: [point("E6"), point("D4"), point("G4"), point("F2"), point("H3"), point("G1"), point("I2"), point("H1")], wrongFirst: point("E4"), maxMoves: 8,
    contrastRows: ["......O..", ".........", "....X....", ".........", "...XOX...", ".........", ".........", ".........", "........."],
    task: "每手叫吃，沿着台阶把白棋追到边上。",
    intro: "白棋每次逃出会出现新的两口气。选对方向，就能连续叫吃。",
    hints: ["想想第一手之后，白棋会被赶向哪边。", "标出目标白棋整块和当前的气。", "看黑棋怎样持续叫吃到边上，再提掉白棋。"],
  },
  {
    id: "ladder-check", lesson: 3, title: "换个方向征白棋", guided: false,
    rows: [".........", ".........", "...XX....", "..XO.....", ".........", ".........", ".........", ".........", "........."],
    targets: [point("D4")],
    solution: [point("D5"), point("F4"), point("E6"), point("G5"), point("F7"), point("H6"), point("G8"), point("I7"), point("H9"), point("I8")], wrongFirst: point("E4"), maxMoves: 10,
    contrastRows: [".........", ".........", "...XX....", "..XO.....", ".....O...", ".........", ".........", ".........", "........."],
    task: "先看路线，再一路叫吃提掉白棋。",
    intro: "阶梯换了方向。先看白棋逃跑的路线，确认那里没有接应。",
    hints: ["想想你希望白棋向哪个方向逃。", "标出目标白棋整块和当前的气。", "看黑棋怎样沿斜线追到底边。"],
  },
  {
    id: "net-guided", lesson: 4, title: "先封住出路", guided: true,
    rows: [".........", ".........", "...X.....", "..XO.X...", ".O.......", "...XO....", ".........", ".........", "........."],
    targets: [point("D4")], solution: [point("E5"), point("E3"), point("D5")], maxMoves: 3,
    wrongFirst: point("E4"), wrongFollowUp: [point("C5")], wrongLabel: "如果贴着白棋追",
    task: "围住中间那颗白棋，再把它提走。",
    intro: "这颗白棋可以往右伸，也可以往下伸。先找一个能同时封住两条出路的位置。",
    hints: ["看两个出口斜对着的那个空点。", "看圈出的白棋和它还能走的两个点。", "先封在外围，再堵住白棋伸出后的出口。"],
    takeaway: "第一手落在白棋斜前方。白棋当时还有两口气，往哪边伸却都冲不出去。这就是枷吃。",
  },
  {
    id: "net-check", lesson: 4, title: "换个方向封住白棋", guided: false,
    rows: [".........", ".........", ".........", "....OX...", ".........", "...X.OX..", ".....X...", ".........", "........."],
    targets: [point("F6")], solution: [point("E5"), point("G5"), point("E6")], maxMoves: 3,
    wrongFirst: point("E6"), wrongFollowUp: [point("G5")],
    task: "围住右下方的白棋，把它提走。",
    intro: "留意左上方的白子。被追的白棋朝哪边走能得到接应？",
    hints: ["先看目标通往另一颗白子的路线。", "找出两口气之间的斜角。", "看黑棋怎样抢先封住出口，再收紧包围。"],
  },
  {
    id: "connection-guided", lesson: 5, title: "为什么接不回去", guided: true,
    rows: ["..XO.O...", "....XX...", ".........", ".........", ".........", ".........", ".........", ".........", "........."],
    targets: [point("D1")], solution: [point("D2"), point("E1")], maxMoves: 2,
    wrongFirst: point("G1"), wrongLabel: "如果先堵右边", connection: point("E1"),
    task: "叫吃上边靠左的白子，把它留在边上。",
    intro: "两颗白子之间空了一点。让左边这颗只剩往同伴那边接的一口气。",
    hints: ["先堵住左边白子通向棋盘中央的那口气。", "圈出的是要吃的白子。", "看黑棋怎样把白子逼向同伴。"],
    takeaway: "白棋硬接，两边就只剩同一口气，黑棋能把它们一起提走。这种接了也救不回来的棋形叫接不归。",
  },
  {
    id: "connection-check", lesson: 5, title: "边上的白棋能接回去吗", guided: false,
    rows: [".........", "........X", "........O", ".......X.", ".......XO", ".......XO", ".........", ".........", "........."],
    targets: [point("I3")], solution: [point("H3"), point("I4")], maxMoves: 2,
    wrongFirst: point("I7"), connection: point("I4"),
    task: "吃掉右边靠上的那颗白子。",
    intro: "下面有两颗相连的白子。算一算，三颗白棋接上以后会有几口气？",
    hints: ["先堵住目标白子通向中央的路。", "沿右边线找出白棋想接上的空点。", "看黑棋堵住出口，再提走留在边线上的白子。"],
  },
]
