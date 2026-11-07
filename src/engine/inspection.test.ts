import { describe, expect, it } from 'vitest'
import { createGame, getCell, getGroup, inspectPlay, parseBoard, pass, play } from './index'

describe('落子检查的分步盘面', () => {
  it('先提掉对方，刚下的棋才获得气；中间画面不修改正式棋局', () => {
    const board = parseBoard(['.OOO.', 'OXXXO', 'OX.XO', 'OXXXO', '.OOO.'])
    const game = createGame({ board, toPlay: 'white' })
    const original = structuredClone(game)
    const inspection = inspectPlay(game, { x: 2, y: 2 })
    expect(inspection.placed && getGroup(inspection.placed, { x: 2, y: 2 })?.liberties).toHaveLength(0)
    expect(inspection.captured).toHaveLength(8)
    expect(inspection.ownLiberties).toHaveLength(4)
    expect(inspection.afterCaptures && getCell(inspection.afterCaptures, { x: 1, y: 2 })).toBeNull()
    expect(inspection.result).toEqual(play(game, { x: 2, y: 2 }))
    expect(inspection.result.ok).toBe(true)
    expect(game).toEqual(original)
  })
  it('对手还留一口气时不能提走；己方无气会被拒绝且保留原盘面', () => {
    const game = createGame({ board: parseBoard(['.OOO.', 'OXXXO', 'OX.XO', 'OXX.O', '.OOO.']), toPlay: 'white' })
    const inspection = inspectPlay(game, { x: 2, y: 2 })
    expect(inspection.captured).toHaveLength(0)
    expect(inspection.ownLiberties).toHaveLength(0)
    expect(inspection.result).toEqual({ ok: false, reason: 'suicide' })
    expect(getCell(game.board, { x: 2, y: 2 })).toBeNull()
  })
  it('越界、占点与终局不会产生伪造的中间盘面', () => {
    const game = createGame({ board: parseBoard(['X..', '...', '...']) })
    expect(inspectPlay(game, { x: 0, y: 0 }).placed).toBeNull()
    expect(inspectPlay(game, { x: -1, y: 0 }).placed).toBeNull()
    const first = pass(game)
    const second = first.ok ? pass(first.state) : first
    expect(second.ok && inspectPlay(second.state, { x: 1, y: 1 }).placed).toBeNull()
  })
})
