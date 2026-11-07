import { getCell, getGroup, opponent, pass, play, samePoint, toIndex, toPoint } from '../../engine'
import type { Color, GameState, Group, Point, RejectReason } from '../../engine'

export interface GroupFact extends Group {
  readonly capture: { readonly point: Point; readonly after: GameState } | null
}
export type ActionAnalysis = { readonly ok: false; readonly reason: RejectReason } | {
  readonly ok: true
  readonly before: GameState
  readonly after: GameState
  readonly point: Point | null
  readonly own: Group | null
  readonly dangers: readonly GroupFact[]
  readonly rescued: readonly GroupFact[]
  readonly connected: number
}

/** 潜在威胁只切换分析副本轮次，不伪造 pass 或删去同形历史。 */
export function analyzePosition(game: GameState): GroupFact[] {
  const seen = new Set<number>()
  const groups: GroupFact[] = []
  game.board.cells.forEach((cell, index) => {
    if (!cell || seen.has(index)) return
    const group = getGroup(game.board, toPoint(game.board, index))!
    group.stones.forEach((p) => seen.add(toIndex(game.board, p)))
    let capture: GroupFact['capture'] = null
    if (game.phase === 'playing' && group.liberties.length === 1) {
      const point = group.liberties[0]
      const result = play({ ...game, toPlay: opponent(group.color) }, point)
      if (result.ok && group.stones.every((p) => getCell(result.state.board, p) !== group.color)) {
        capture = { point, after: result.state }
      }
    }
    groups.push({ ...group, capture })
  })
  return groups
}

export function threats(game: GameState, color: Color = 'black'): GroupFact[] {
  return analyzePosition(game).filter((g) => g.color === color && g.capture !== null)
}

export function analyzeAction(game: GameState, point: Point | null): ActionAnalysis {
  const result = point === null ? pass(game) : play(game, point)
  if (!result.ok) return result
  const after = result.state
  const own = point ? getGroup(after.board, point) : null
  const dangers = threats(after, game.toPlay)
  const rescued = threats(game, game.toPlay).filter((g) =>
    g.stones.every((p) => getCell(after.board, p) === g.color)
    && !dangers.some((d) => d.stones.some((p) => g.stones.some((s) => samePoint(s, p)))),
  )
  const connected = own ? analyzePosition(game).filter((g) => g.color === game.toPlay
    && g.stones.some((p) => own.stones.some((s) => samePoint(p, s)))).length : 0
  return { ok: true, before: game, after, point, own, dangers, rescued, connected }
}

export function transitionText(before: GameState, after: GameState): string {
  const move = after.history.at(-1)
  if (!move) return ''
  const name = move.color === 'white' ? '白棋' : '黑棋'
  if (move.kind === 'pass') return `${name}停了一手，没有落子。`
  if (move.captured.length) return `${name}占住了最后一口气，提走了 ${move.captured.length} 颗${move.color === 'white' ? '黑' : '白'}棋。`
  const newThreats = threats(after, opponent(move.color)).filter((g) => !threats(before, opponent(move.color))
    .some((old) => old.stones.some((p) => g.stones.some((s) => samePoint(p, s)))))
  if (newThreats.length) return `${name}这一步让 ${newThreats.length} 块对方棋只剩一口气，已经可以直接提走。先检查圈起来的棋。`
  if (threats(before, move.color).length > threats(after, move.color).length) return `${name}这一步暂时解除了自己的直接提子危险。`
  return `${name}下在第 ${move.point.x + 1} 列、第 ${move.point.y + 1} 行。接着观察自己的棋和气。`
}
