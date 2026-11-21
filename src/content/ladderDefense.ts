import type { Point } from '../engine'

interface LadderDefenseChoice {
  readonly label: string
  readonly moves: readonly Point[]
  readonly feedback: string
}

export interface LadderDefenseScene {
  readonly id: string
  readonly title: string
  readonly rows: readonly string[]
  readonly target: Point
  readonly choices: readonly [LadderDefenseChoice, LadderDefenseChoice]
  readonly answer: 0 | 1
  readonly reasons: readonly [string, string]
  readonly reasonAnswer: 0 | 1
  readonly intro: string
}

const point = (name: string): Point => ({ x: name.charCodeAt(0) - 65, y: Number(name[1]) - 1 })

export const LADDER_DEFENSE_SCENES: readonly LadderDefenseScene[] = [
  {
    id: "ladder-defense-no-help", title: "路上没有接应",
    rows: [".........", ".........", "....O....", ".........", "...OXO...", "....O....", ".........", ".........", "........."],
    target: point("E5"),
    choices: [
      { label: '继续逃', moves: [point("E4"), point("D4"), point("F4"), point("G4"), point("F3"), point("F2"), point("G3"), point("H3"), point("G2"), point("G1"), point("H2"), point("I2"), point("H1"), point("I1")],
        feedback: "黑棋一路逃到了边上，最后白棋在 I1 提走了连在一起的 8 颗黑棋。" },
      { label: '在别处下', moves: [point("A9"), point("E4")],
        feedback: '白棋在 E4 提掉了目标 1 颗黑棋。下在 A9 的黑棋仍留在盘上。' },
    ],
    answer: 1,
    reasons: ["一路没有接应，继续逃会让更多棋被提", "只要再接一颗，黑棋一定能多出气"],
    reasonAnswer: 0,
    intro: '黑棋已经只剩一口气。看看征子路线上有没有接应，再比较继续逃和在别处下的结果。',
  },
  {
    id: "ladder-defense-with-help", title: "路上有接应",
    rows: ["......X..", ".........", "....O....", ".........", "...OXO...", "....O....", ".........", ".........", "........."],
    target: point("E5"),
    choices: [
      { label: '继续逃', moves: [point("E4"), point("D4"), point("F4"), point("G4"), point("F3"), point("F2"), point("G3"), point("H3"), point("G2")],
        feedback: "黑棋在 G2 连上了 G1 的接应子，目标棋块现在有 3 口气，摆脱了这条征子。" },
      { label: '在别处下', moves: [point("A9"), point("E4")],
        feedback: '白棋在 E4 提掉了目标 1 颗黑棋。下在 A9 的黑棋仍留在盘上。' },
    ],
    answer: 0,
    reasons: ["棋盘上有一颗黑棋就一定安全", "沿这条路线能连到接应的黑棋，多出气"],
    reasonAnswer: 1,
    intro: '黑棋已经只剩一口气。看看征子路线上有没有接应，再比较继续逃和在别处下的结果。',
  },
]
