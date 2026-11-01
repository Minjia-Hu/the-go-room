import { getCell, neighbors, removeStones, samePoint, toIndex, toPoint } from './board'
import { getGroup } from './groups'
import type { Board, Cell, Color, Point, ScoreResult } from './types'

/**
 * 终局时标记或取消标记死子,按整块切换。
 * point 为空点时原样返回。
 */
export function toggleDeadGroup(board: Board, dead: readonly Point[], point: Point): Point[] {
  const group = getGroup(board, point)
  if (group === null) return [...dead]
  const isMarked = group.stones.some((s) => dead.some((d) => samePoint(d, s)))
  if (isMarked) {
    return dead.filter((d) => !group.stones.some((s) => samePoint(d, s)))
  }
  return [...dead, ...group.stones]
}

/**
 * 中国规则数子:移除死子后,每方得分 = 盘上活子 + 只被己方包围的空点。
 * 结果 = 黑 − 白 − 贴目。
 */
export function scoreGame(board: Board, dead: readonly Point[], komi: number): ScoreResult {
  const cleared = removeStones(board, dead)
  const ownership: Cell[] = cleared.cells.slice()
  const visited = new Set<number>()

  for (let index = 0; index < cleared.cells.length; index++) {
    if (cleared.cells[index] !== null || visited.has(index)) continue

    const region: number[] = []
    const borders = new Set<Color>()
    const stack: Point[] = [toPoint(cleared, index)]
    visited.add(index)

    while (stack.length > 0) {
      const current = stack.pop()!
      region.push(toIndex(cleared, current))
      for (const n of neighbors(cleared, current)) {
        const cell = getCell(cleared, n)
        const nIndex = toIndex(cleared, n)
        if (cell === null) {
          if (!visited.has(nIndex)) {
            visited.add(nIndex)
            stack.push(n)
          }
        } else {
          borders.add(cell)
        }
      }
    }

    if (borders.size === 1) {
      const [owner] = borders
      for (const r of region) ownership[r] = owner
    }
  }

  const black = ownership.filter((c) => c === 'black').length
  const white = ownership.filter((c) => c === 'white').length
  const diff = black - white - komi
  return {
    black,
    white,
    komi,
    winner: diff > 0 ? 'black' : diff < 0 ? 'white' : null,
    margin: Math.abs(diff),
    ownership,
  }
}
