import { getCell } from '../../engine'
import type { Board, Point } from '../../engine'

/** 棋盘上的辅助标记:ring 套在棋子外,dot 标在空点上,selected 是被用户选中的空点。 */
export interface BoardMark {
  readonly point: Point
  readonly kind: 'ring' | 'dot' | 'selected'
}

/** 给一组点生成标记:点上有棋子用 ring,空点用 emptyKind。 */
export function marksForPoints(
  board: Board,
  points: readonly Point[],
  emptyKind: 'dot' | 'selected' = 'dot',
): BoardMark[] {
  return points.map((point) => ({ point, kind: getCell(board, point) === null ? emptyKind : 'ring' }))
}
