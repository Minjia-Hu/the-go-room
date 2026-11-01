import { describe, expect, it } from 'vitest'
import { boardKey, createBoard, getCell, neighbors, parseBoard, setCell } from './board'

describe('board', () => {
  it('createBoard 生成指定路数的空棋盘', () => {
    const board = createBoard(9)
    expect(board.size).toBe(9)
    expect(board.cells).toHaveLength(81)
    expect(board.cells.every((c) => c === null)).toBe(true)
  })

  it('parseBoard 读取 X、O 和 .', () => {
    const board = parseBoard(['X..', '.O.', '...'])
    expect(getCell(board, { x: 0, y: 0 })).toBe('black')
    expect(getCell(board, { x: 1, y: 1 })).toBe('white')
    expect(getCell(board, { x: 2, y: 2 })).toBeNull()
  })

  it('parseBoard 拒绝非正方形输入', () => {
    expect(() => parseBoard(['X..', '...'])).toThrow()
  })

  it('setCell 返回新棋盘,不修改原棋盘', () => {
    const board = createBoard(3)
    const next = setCell(board, { x: 1, y: 1 }, 'black')
    expect(getCell(next, { x: 1, y: 1 })).toBe('black')
    expect(getCell(board, { x: 1, y: 1 })).toBeNull()
  })

  it('neighbors 在角、边、中间分别有 2、3、4 个', () => {
    const board = createBoard(9)
    expect(neighbors(board, { x: 0, y: 0 })).toHaveLength(2)
    expect(neighbors(board, { x: 4, y: 0 })).toHaveLength(3)
    expect(neighbors(board, { x: 4, y: 4 })).toHaveLength(4)
  })

  it('boardKey 按行输出 X、O、.', () => {
    expect(boardKey(parseBoard(['X.', '.O']))).toBe('X..O')
  })
})
