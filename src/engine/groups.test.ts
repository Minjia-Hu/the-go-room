import { describe, expect, it } from 'vitest'
import { parseBoard } from './board'
import { getGroup } from './groups'

describe('getGroup', () => {
  it('中间的单子有 4 口气', () => {
    const group = getGroup(parseBoard(['...', '.X.', '...']), { x: 1, y: 1 })!
    expect(group.color).toBe('black')
    expect(group.stones).toHaveLength(1)
    expect(group.liberties).toHaveLength(4)
  })

  it('相连的棋子是一块,气不重复计算', () => {
    const group = getGroup(parseBoard(['XX.', '...', '...']), { x: 0, y: 0 })!
    expect(group.stones).toHaveLength(2)
    expect(group.liberties).toEqual(
      expect.arrayContaining([
        { x: 2, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
      ]),
    )
    expect(group.liberties).toHaveLength(3)
  })

  it('对方棋子会占掉气', () => {
    const group = getGroup(parseBoard(['XO.', '...', '...']), { x: 0, y: 0 })!
    expect(group.liberties).toEqual([{ x: 0, y: 1 }])
  })

  it('空点返回 null', () => {
    expect(getGroup(parseBoard(['...', '...', '...']), { x: 0, y: 0 })).toBeNull()
  })

  it('棋盘外的点返回 null,而不是算错下标', () => {
    const board = parseBoard(['.X.', '...', '...'])
    expect(getGroup(board, { x: 3, y: 0 })).toBeNull()
    expect(getGroup(board, { x: 1, y: -1 })).toBeNull()
  })
})
