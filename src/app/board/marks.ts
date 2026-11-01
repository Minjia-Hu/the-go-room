import { getCell } from '../../engine'
import type { Board, Point } from '../../engine'

/** ring 叫吃/教学，dot/selected 空点提示，dead 死子，captured 提子位置，area 数子归属。 */
export interface BoardMark {
  readonly point: Point
  readonly kind: 'ring' | 'dot' | 'selected' | 'dead' | 'captured' | 'black-area' | 'white-area'
}

/** 给一组点生成标记:点上有棋子用 ring,空点用 emptyKind。 */
export function marksForPoints(
  board: Board,
  points: readonly Point[],
  emptyKind: 'dot' | 'selected' = 'dot',
): BoardMark[] {
  return points.map((point) => ({ point, kind: getCell(board, point) === null ? emptyKind : 'ring' }))
}
