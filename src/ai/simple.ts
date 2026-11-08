import { getCell, getGroup, neighbors, opponent, play, toPoint } from '../engine'
import type { GameState, Point } from '../engine'
import { isOwnEye } from './eyes'
import type { Rng } from './random'

export type AiMove = { readonly kind: 'play'; readonly point: Point } | { readonly kind: 'pass' }

/** 棋盘上所有空点,按行从上到下、每行从左到右。 */
function emptyPoints(state: GameState): Point[] {
  const points: Point[] = []
  state.board.cells.forEach((cell, index) => {
    if (cell === null) points.push(toPoint(state.board, index))
  })
  return points
}

/** 找出提子最多的落点;没有能提子的点时返回 null。同样多时取扫描顺序靠前的。 */
export function findCapture(state: GameState): Point | null {
  let best: Point | null = null
  let bestCount = 0
  for (const p of emptyPoints(state)) {
    const result = play(state, p)
    if (!result.ok) continue
    const record = result.state.history.at(-1)!
    if (record.kind === 'play' && record.captured.length > bestCount) {
      best = p
      bestCount = record.captured.length
    }
  }
  return best
}

/**
 * 己方有只剩一口气的棋块时,找能让它长出至少两口气的落点。
 * 有多块时优先救子最多的那块;救不出来时返回 null。
 */
export function findEscape(state: GameState): Point | null {
  const color = state.toPlay
  let best: Point | null = null
  let bestSize = 0
  const checked = new Set<string>()

  for (let index = 0; index < state.board.cells.length; index++) {
    if (state.board.cells[index] !== color) continue
    const group = getGroup(state.board, toPoint(state.board, index))!
    if (group.liberties.length !== 1) continue
    const liberty = group.liberties[0]
    const key = `${liberty.x},${liberty.y}`
    if (checked.has(key)) continue
    checked.add(key)

    const result = play(state, liberty)
    if (!result.ok) continue
    const after = getGroup(result.state.board, liberty)!
    if (after.liberties.length >= 2 && group.stones.length > bestSize) {
      best = liberty
      bestSize = group.stones.length
    }
  }
  return best
}

/**
 * 找能把对方某块棋逼到只剩一口气(叫吃)的落点。
 * 跳过落子后自己只剩一口气的点,免得叫吃后立刻被对方提掉。
 * 有多个时优先叫吃子最多的那块。
 */
export function findAtari(state: GameState): Point | null {
  const color = state.toPlay
  let best: Point | null = null
  let bestSize = 0

  for (const p of emptyPoints(state)) {
    const result = play(state, p)
    if (!result.ok) continue
    const board = result.state.board
    if (getGroup(board, p)!.liberties.length < 2) continue

    for (const n of neighbors(board, p)) {
      if (getCell(board, n) !== opponent(color)) continue
      const target = getGroup(board, n)!
      if (target.liberties.length === 1 && target.stones.length > bestSize) {
        best = p
        bestSize = target.stones.length
      }
    }
  }
  return best
}

/** 随机候选：合法、不填自己眼，且不在未提子时把自己下成一口气。 */
export function sensibleMoves(state: GameState): Point[] {
  return emptyPoints(state).filter((p) => {
    if (isOwnEye(state.board, p, state.toPlay)) return false
    const result = play(state, p)
    if (!result.ok) return false
    const last = result.state.history.at(-1)!
    return (last.kind === 'play' && last.captured.length > 0)
      || getGroup(result.state.board, p)!.liberties.length > 1
  })
}

/**
 * 简单电脑对手:提子 → 救自己被叫吃的棋 → 叫吃对方 → 随机选一个合理的点 → 停一手。
 * 返回的落点保证在当前状态下合法。
 */
export function chooseMove(state: GameState, rng: Rng = Math.random): AiMove {
  if (state.phase !== 'playing') return { kind: 'pass' }

  const urgent = findCapture(state) ?? findEscape(state) ?? findAtari(state)
  if (urgent !== null) return { kind: 'play', point: urgent }

  const candidates = sensibleMoves(state)
  if (candidates.length === 0) return { kind: 'pass' }
  return { kind: 'play', point: candidates[Math.floor(rng() * candidates.length)] }
}
