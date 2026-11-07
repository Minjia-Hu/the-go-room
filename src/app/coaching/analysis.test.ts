import { describe, expect, it } from 'vitest'
import { createGame, parseBoard, play } from '../../engine'
import { analyzeAction, analyzePosition } from './analysis'

const danger = () => createGame({ board: parseBoard(['.....', '..O..', '.OXO.', '.....', '.....']) })
describe('陪练事实', () => {
  it('核实一气威胁，忽视后会被提；延伸从一气变三气', () => {
    const game = danger()
    expect(analyzePosition(game).filter((g) => g.capture)).toHaveLength(1)
    const ignored = analyzeAction(game, { x: 0, y: 0 })
    expect(ignored.ok && ignored.dangers).toHaveLength(1)
    const saved = analyzeAction(game, { x: 2, y: 3 })
    expect(saved.ok && saved.own?.liberties).toHaveLength(3)
    expect(saved.ok && saved.rescued).toHaveLength(1)
    expect(game.history).toEqual([])
    expect(game.toPlay).toBe('black')
  })
  it('只有一气但提子盘面被全局同形禁止时不误报可提', () => {
    const game = danger()
    const taken = play({ ...game, toPlay: 'white' }, { x: 2, y: 3 })
    if (!taken.ok) throw new Error('fixture')
    const blocked = { ...game, positionKeys: [...game.positionKeys, taken.state.positionKeys.at(-1)!] }
    expect(analyzePosition(blocked).find((g) => g.color === 'black')?.capture).toBeNull()
  })
  it('自叫吃与非法落子分开；停一手进入终局不产生白棋演示', () => {
    const game = createGame({ board: parseBoard(['.....', '..O..', '.O.O.', '.....', '.....']) })
    const result = analyzeAction(game, { x: 2, y: 2 })
    expect(result.ok && result.dangers).toHaveLength(1)
    expect(analyzeAction(danger(), { x: 2, y: 2 }).ok).toBe(false)
    const end = analyzeAction({ ...game, consecutivePasses: 1 }, null)
    expect(end.ok && end.after.phase).toBe('scoring')
    expect(end.ok && end.dangers).toEqual([])
  })
  it('救一块仍报告另一块危险，共同一气的两块不会漏报', () => {
    const game = createGame({ board: parseBoard(['.O.....', 'OXO....', '.......', '.....O.', '....OXO', '.......', '.......']) })
    const a = analyzeAction(game, { x: 1, y: 2 })
    expect(a.ok && a.rescued).toHaveLength(1)
    expect(a.ok && a.dangers).toHaveLength(1)
    const shared = createGame({ board: parseBoard(['..O..', '.OXO.', 'OX...', '.O...', '.....']) })
    const danger = analyzePosition(shared).filter((g) => g.capture && g.color === 'black')
    expect(danger).toHaveLength(2)
    expect(danger.map((g) => g.capture?.point)).toEqual([{ x: 2, y: 2 }, { x: 2, y: 2 }])
    expect(danger[0].capture!.after.board.cells.filter((c) => c === 'black')).toHaveLength(0)
  })
})
