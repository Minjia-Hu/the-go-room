import { describe, expect, it } from 'vitest'
import { parseBoard } from '../engine'
import { isOwnEye } from './eyes'

describe('isOwnEye', () => {
  it('四周和四个对角都是己方:是眼', () => {
    const board = parseBoard(['.XXX.', '.X.X.', '.XXX.', '.....', '.....'])
    expect(isOwnEye(board, { x: 2, y: 1 }, 'black')).toBe(true)
  })

  it('对方是这块棋的眼,不是自己的眼', () => {
    const board = parseBoard(['.XXX.', '.X.X.', '.XXX.', '.....', '.....'])
    expect(isOwnEye(board, { x: 2, y: 1 }, 'white')).toBe(false)
  })

  it('中间的点有两个对角被对方占住:假眼', () => {
    const board = parseBoard(['.....', '.OXO.', '.X.X.', '.XXX.', '.....'])
    expect(isOwnEye(board, { x: 2, y: 2 }, 'black')).toBe(false)
  })

  it('角上的眼只看一个对角', () => {
    const board = parseBoard(['.X...', 'XX...', '.....', '.....', '.....'])
    expect(isOwnEye(board, { x: 0, y: 0 }, 'black')).toBe(true)
  })

  it('上下左右有对方棋子或空点:不是眼', () => {
    expect(isOwnEye(parseBoard(['.X...', 'O....', '.....', '.....', '.....']), { x: 0, y: 0 }, 'black')).toBe(false)
    expect(isOwnEye(parseBoard(['.X...', '.....', '.....', '.....', '.....']), { x: 0, y: 0 }, 'black')).toBe(false)
  })

  it('有棋子的点不是眼', () => {
    const board = parseBoard(['XX...', 'XX...', '.....', '.....', '.....'])
    expect(isOwnEye(board, { x: 0, y: 0 }, 'black')).toBe(false)
  })
})
