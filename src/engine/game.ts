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
