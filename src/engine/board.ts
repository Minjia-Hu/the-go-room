import type { Board, Cell, Color, Point } from './types'

export function createBoard(size: number): Board {
  return { size, cells: Array<Cell>(size * size).fill(null) }
}

export function isOnBoard(board: Board, p: Point): boolean {
  return Number.isInteger(p.x) && Number.isInteger(p.y) && p.x >= 0 && p.y >= 0 && p.x < board.size && p.y < board.size
}

export function toIndex(board: Board, p: Point): number {
  return p.y * board.size + p.x
}

export function toPoint(board: Board, index: number): Point {
  return { x: index % board.size, y: Math.floor(index / board.size) }
}

export function getCell(board: Board, p: Point): Cell {
  return board.cells[toIndex(board, p)]
}

export function setCell(board: Board, p: Point, cell: Cell): Board {
  const cells = board.cells.slice()
  cells[toIndex(board, p)] = cell
  return { size: board.size, cells }
}

export function removeStones(board: Board, points: readonly Point[]): Board {
  const cells = board.cells.slice()
  for (const p of points) cells[toIndex(board, p)] = null
  return { size: board.size, cells }
}

export function neighbors(board: Board, p: Point): Point[] {
  const candidates = [
    { x: p.x, y: p.y - 1 },
    { x: p.x + 1, y: p.y },
    { x: p.x, y: p.y + 1 },
    { x: p.x - 1, y: p.y },
  ]
  return candidates.filter((q) => isOnBoard(board, q))
}

export function opponent(color: Color): Color {
  return color === 'black' ? 'white' : 'black'
}

export function samePoint(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y
}

/** 盘面的字符串表示,用于比较重复局面。X 黑,O 白,. 空。 */
export function boardKey(board: Board): string {
  return board.cells.map((c) => (c === 'black' ? 'X' : c === 'white' ? 'O' : '.')).join('')
}

/**
 * 从文字图解析棋盘,供测试和关卡数据使用。
 * 每行一个字符串,X 黑,O 白,. 空;必须是正方形。
 * 输入不合法时抛错:这只用于开发者编写的静态数据,不会在对局中被调用。
 */
export function parseBoard(rows: readonly string[]): Board {
  const size = rows.length
  const cells: Cell[] = []
  for (const row of rows) {
    if (row.length !== size) {
      throw new Error(`parseBoard: 每行必须有 ${size} 个字符,收到 "${row}"`)
    }
    for (const ch of row) {
      if (ch === 'X') cells.push('black')
      else if (ch === 'O') cells.push('white')
      else if (ch === '.') cells.push(null)
      else throw new Error(`parseBoard: 不认识的字符 "${ch}"`)
    }
  }
  return { size, cells }
}
