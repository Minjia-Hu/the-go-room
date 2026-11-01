import { getCell, isOnBoard, neighbors, toIndex } from './board'
import type { Board, Group, Point } from './types'

/** 返回包含 p 的整块棋;p 为空点或不在棋盘上时返回 null。 */
export function getGroup(board: Board, p: Point): Group | null {
  if (!isOnBoard(board, p)) return null
  const color = getCell(board, p)
  if (color === null) return null

  const stones: Point[] = []
  const liberties: Point[] = []
  const seenStones = new Set<number>([toIndex(board, p)])
  const seenLiberties = new Set<number>()
  const stack: Point[] = [p]

  while (stack.length > 0) {
    const current = stack.pop()!
    stones.push(current)
    for (const n of neighbors(board, current)) {
      const index = toIndex(board, n)
      const cell = getCell(board, n)
      if (cell === null && !seenLiberties.has(index)) {
        seenLiberties.add(index)
        liberties.push(n)
      } else if (cell === color && !seenStones.has(index)) {
        seenStones.add(index)
        stack.push(n)
      }
    }
  }

  return { color, stones, liberties }
}
