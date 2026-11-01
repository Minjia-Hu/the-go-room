import { getCell, isOnBoard, neighbors } from '../engine'
import type { Board, Color, Point } from '../engine'

/**
 * 判断空点 p 是否是 color 方自己的眼,电脑不往自己眼里填子。
 * 条件:p 为空;上下左右全是己方棋子;棋盘内的对角点里己方超过一半
 * (中间 4 个对角至少 3 个,边上 2 个都要,角上 1 个就要)。
 */
export function isOwnEye(board: Board, p: Point, color: Color): boolean {
  if (getCell(board, p) !== null) return false
  if (!neighbors(board, p).every((n) => getCell(board, n) === color)) return false

  const diagonals = [
    { x: p.x - 1, y: p.y - 1 },
    { x: p.x + 1, y: p.y - 1 },
    { x: p.x - 1, y: p.y + 1 },
    { x: p.x + 1, y: p.y + 1 },
  ].filter((d) => isOnBoard(board, d))
  const own = diagonals.filter((d) => getCell(board, d) === color).length
  return own * 2 > diagonals.length
}
