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
