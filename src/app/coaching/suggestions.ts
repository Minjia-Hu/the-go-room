import { getCell, samePoint, toPoint } from '../../engine'
import type { GameState, Point } from '../../engine'
import { analyzeAction, analyzePosition, threats } from './analysis'

export interface Suggestion { readonly point: Point; readonly reason: string }
export function suggest(game: GameState, target?: Point): Suggestion | null {
  if (game.phase !== 'playing' || game.toPlay !== 'black') return null
  const danger = threats(game).sort((a, b) => b.stones.length - a.stones.length)
  const selected = danger.find((g) => target && g.stones.some((s) => samePoint(s, target))) ?? danger[0]
  if (game.history.length === 0 && game.board.cells.every((c) => c === null)) {
    return { point: { x: Math.min(2, game.board.size - 1), y: Math.min(2, game.board.size - 1) }, reason: '可以从靠近角部的这里开始，借棋盘的边帮助围出空间。这只是起点示例，不是唯一正确答案。' }
  }
  const candidates: { point: Point; reason: string; rank: number }[] = []
  game.board.cells.forEach((cell, index) => {
    if (cell !== null) return
    const point = toPoint(game.board, index)
    const a = analyzeAction(game, point)
    if (!a.ok || !a.own) return
    if (selected) {
      const rescued = a.rescued.some((g) => g.stones.some((s) => samePoint(s, selected.stones[0])))
      if (!rescued) return
      const last = a.after.history.at(-1)!
      const method = last.kind === 'play' && last.captured.length ? '提掉白棋，腾出新的气' : a.connected > 1 ? '连接自己的棋，让它们共用气' : '把自己的棋接向空处'
      candidates.push({ point, reason: `可以试着${method}，暂时解除这块棋被下一手提走的危险。${a.dangers.length ? `仍有 ${a.dangers.length} 块黑棋存在直接危险。` : ''}`, rank: a.rescued.length * 100 - a.dangers.length * 1000 })
    } else if (a.dangers.length === 0) {
      if (a.connected >= 2) candidates.push({ point, reason: '试着观察这两块棋连起来后怎样共享气。这是连接练习，不代表当前最佳走法。', rank: 2 })
      else {
        const old = analyzePosition(game).find((g) => g.color === 'black' && g.stones.some((s) => a.own!.stones.some((p) => samePoint(s, p))))
        if (old && a.own.liberties.length > old.liberties.length) candidates.push({ point, reason: '试着把这块棋接向空处，看看增加了哪些气。气多不等于这一步一定更好。', rank: 1 })
      }
    }
  })
  candidates.sort((a, b) => b.rank - a.rank)
  return candidates[0] ?? null
}

export function targetSurvives(after: GameState, targets: readonly Point[]): boolean {
  return targets.every((p) => getCell(after.board, p) === 'black')
    && !threats(after).some((g) => targets.some((p) => g.stones.some((s) => samePoint(p, s))))
}
