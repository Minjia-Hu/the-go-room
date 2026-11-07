import { describe, expect, it } from 'vitest'
import { createGame, parseBoard, play } from '../../engine'
import { suggest, targetSurvives } from './suggestions'
import { analyzeAction, threats } from './analysis'
import { explainAction } from './explanations'

describe('有依据的建议', () => {
  it('空盘建议是合法示例，不消耗或修改棋局', () => {
    const game = createGame()
    expect(suggest(game)?.point).toEqual({ x: 2, y: 2 })
    expect(suggest(game)?.reason).toContain('不是唯一')
    expect(game.history).toEqual([])
  })
  it('建议能救出原目标且结果稳定，解释不承诺长期安全', () => {
    const game = createGame({ board: parseBoard(['.....', '..O..', '.OXO.', '.....', '.....']) })
    const hint = suggest(game)!
    expect(hint).toEqual(suggest(game))
    const result = play(game, hint.point)
    expect(result.ok && targetSurvives(result.state, [{ x: 2, y: 2 }])).toBe(true)
    expect(explainAction(analyzeAction(game, hint.point))).toContain('不代表以后一定安全')
  })
  it('没有解围办法不建议一个救不出的点', () => {
    const game = createGame({ board: parseBoard(['.OO', 'OXO', 'O.O']) })
    expect(threats(game)).toHaveLength(1)
    expect(suggest(game)).toBeNull()
  })
})
