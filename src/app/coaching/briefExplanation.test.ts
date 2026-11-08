import { describe, expect, it } from 'vitest'
import { createGame, parseBoard, pass } from '../../engine'
import { analyzeAction } from './analysis'
import { briefExplanation } from './briefExplanation'

describe('棋盘旁的简短理由', () => {
  it('有提子收益时仍优先提醒另一块黑棋的危险', () => {
    const game = createGame({ board: parseBoard(['OX...', '.....', '...O.', '..OXO', '.....']) })
    const action = analyzeAction(game, { x: 0, y: 1 })
    expect(action.ok && action.after.history.at(-1)).toMatchObject({ captured: [{ x: 0, y: 0 }] })
    expect(briefExplanation(action)).toContain('仍有 1 块黑棋')
  })
  it('区分合法的自叫吃和没有气的非法落子', () => {
    const game = createGame({ board: parseBoard(['.....', '..O..', '.O.O.', '.....', '.....']) })
    expect(briefExplanation(analyzeAction(game, { x: 2, y: 2 }))).toContain('这手能下')
    const blocked = createGame({ board: parseBoard(['.O.', 'O..', '...']) })
    const action = analyzeAction(blocked, { x: 0, y: 0 })
    expect(action.ok).toBe(false)
    expect(briefExplanation(action)).not.toContain('这手能下')
  })
  it('救棋说明使用真实前后气数，不保证长期存活', () => {
    const game = createGame({ board: parseBoard(['.....', '..O..', '.OXO.', '.....', '.....']) })
    const text = briefExplanation(analyzeAction(game, { x: 2, y: 3 }))
    expect(text).toContain('从 1 口气变为 3 口气')
    expect(text).toContain('暂时')
  })
  it('只有对方已经停手时才提示确认后进入数子', () => {
    const game = createGame()
    expect(briefExplanation(analyzeAction(game, null))).toContain('电脑也可能继续下')
    const whitePass = pass({ ...game, toPlay: 'white' })
    if (!whitePass.ok) throw new Error('fixture')
    expect(briefExplanation(analyzeAction(whitePass.state, null))).toContain('一起标记死子')
  })
})
