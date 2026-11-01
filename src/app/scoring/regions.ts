import { neighbors, scoreGame, toIndex, toPoint } from '../../engine'
import type { Board, Color, Point } from '../../engine'

export interface ScoreRegion {
  readonly id: number
  readonly color: Color
  readonly points: readonly Point[]
  readonly stones: number
  readonly territory: number
}

export function scoringView(board: Board, dead: readonly Point[], komi: number) {
  const score = scoreGame(board, dead, komi)
  const removed = new Set(dead.map((p) => toIndex(board, p)))
  const cleared: Board = { ...board, cells: board.cells.map((cell, i) => removed.has(i) ? null : cell) }
  const visited = new Set<number>()
  const regions: ScoreRegion[] = []
  score.ownership.forEach((owner, index) => {
    if (owner === null || visited.has(index)) return
    const stack = [index]
    const points: Point[] = []
    let stones = 0
    visited.add(index)
    while (stack.length) {
      const current = stack.pop()!
      const p = toPoint(board, current)
      points.push(p)
      if (cleared.cells[current] !== null) stones++
      for (const n of neighbors(board, p)) {
        const i = toIndex(board, n)
        if (!visited.has(i) && score.ownership[i] === owner) { visited.add(i); stack.push(i) }
      }
    }
    regions.push({ id: regions.length, color: owner, points, stones, territory: points.length - stones })
  })
  return { score, cleared, regions }
}

export function resultText(winner: Color | null, margin: number): string {
  return winner === null ? '和棋' : `${winner === 'black' ? '黑方' : '白方'}胜，领先 ${margin}`
}
