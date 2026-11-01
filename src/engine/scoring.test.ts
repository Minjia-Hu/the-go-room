import { describe, expect, it } from 'vitest'
import { parseBoard, toIndex } from './board'
import { scoreGame, toggleDeadGroup } from './scoring'

const split = parseBoard(['.X.O.', '.X.O.', '.X.O.', '.X.O.', '.X.O.'])

describe('scoreGame', () => {
  it('空棋盘双方都是 0,白靠贴目获胜', () => {
    const result = scoreGame(parseBoard(['...', '...', '...']), [], 7.5)
    expect(result).toMatchObject({ black: 0, white: 0, winner: 'white', margin: 7.5 })
  })

  it('活子加只被己方包围的空点', () => {
    const result = scoreGame(split, [], 7.5)
    expect(result.black).toBe(10)
    expect(result.white).toBe(10)
    expect(result.winner).toBe('white')
    expect(result.margin).toBe(7.5)
  })

  it('整数贴目可能和棋', () => {
    const result = scoreGame(split, [], 0)
    expect(result.winner).toBeNull()
    expect(result.margin).toBe(0)
  })

  it('ownership 标出每个点的归属', () => {
    const { ownership } = scoreGame(split, [], 7.5)
    expect(ownership[toIndex(split, { x: 0, y: 0 })]).toBe('black')
    expect(ownership[toIndex(split, { x: 1, y: 0 })]).toBe('black')
    expect(ownership[toIndex(split, { x: 2, y: 0 })]).toBeNull()
    expect(ownership[toIndex(split, { x: 4, y: 0 })]).toBe('white')
  })

  it('未标记的死子会破坏对方的空', () => {
    const board = parseBoard(['.X.O.', '.X.O.', 'OX.O.', '.X.O.', '.X.O.'])
    const result = scoreGame(board, [], 7.5)
    expect(result.black).toBe(5)
    expect(result.white).toBe(11)
  })

  it('标记的死子先移除再数子', () => {
    const board = parseBoard(['.X.O.', '.X.O.', 'OX.O.', '.X.O.', '.X.O.'])
    const result = scoreGame(board, [{ x: 0, y: 2 }], 7.5)
    expect(result.black).toBe(10)
    expect(result.white).toBe(10)
  })
})

describe('toggleDeadGroup', () => {
  const board = parseBoard(['.....', '.OO..', '.....', '.....', '.....'])

  it('点一下标记整块', () => {
    const dead = toggleDeadGroup(board, [], { x: 1, y: 1 })
    expect(dead).toEqual(
      expect.arrayContaining([
        { x: 1, y: 1 },
        { x: 2, y: 1 },
      ]),
    )
    expect(dead).toHaveLength(2)
  })

  it('再点同一块的任意一子取消标记', () => {
    const dead = toggleDeadGroup(board, [], { x: 1, y: 1 })
    expect(toggleDeadGroup(board, dead, { x: 2, y: 1 })).toEqual([])
  })

  it('点空点不改变标记', () => {
    expect(toggleDeadGroup(board, [], { x: 0, y: 0 })).toEqual([])
  })
})
