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

/** 规则检查的中间盘面仅用于解释，不能作为正式棋局继续落子。 */
export interface PlayInspection {
  readonly placed: Board | null
  readonly afterCaptures: Board | null
  readonly captured: readonly Point[]
  readonly ownLiberties: readonly Point[]
  readonly result: PlayResult
}

/**
 * 当前行棋方在 point 落子。
 * 顺序:检查空点 → 提掉无气的对方棋块 → 检查自杀 → 检查全局同形。
 */
export function inspectPlay(state: GameState, point: Point): PlayInspection {
  const invalid = (reason: RejectReason): PlayInspection => ({ placed: null, afterCaptures: null, captured: [], ownLiberties: [], result: reject(reason) })
  if (state.phase !== 'playing') return invalid('game-over')
  if (!isOnBoard(state.board, point)) return invalid('off-board')
  if (getCell(state.board, point) !== null) return invalid('occupied')

  const color = state.toPlay
  let board = setCell(state.board, point, color)
  const placed = board

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
  const inspection = { placed, afterCaptures: board, captured, ownLiberties: own.liberties }
  if (own.liberties.length === 0) return { ...inspection, result: reject('suicide') }

  const key = boardKey(board)
  if (state.positionKeys.includes(key)) return { ...inspection, result: reject('repeated-position') }

  const isKo = captured.length === 1 && own.stones.length === 1 && own.liberties.length === 1
  const record: MoveRecord = { kind: 'play', color, point, captured, isKo }

  return {
    ...inspection,
    result: {
      ok: true,
      state: {
        ...state,
        board,
        toPlay: opponent(color),
        consecutivePasses: 0,
        history: [...state.history, record],
        positionKeys: [...state.positionKeys, key],
      },
    },
  }
}

/** 正式落子与教学解释始终共用同一套检查。 */
export function play(state: GameState, point: Point): PlayResult {
  return inspectPlay(state, point).result
}

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
