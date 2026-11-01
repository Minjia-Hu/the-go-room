import { describe, expect, it } from 'vitest'
import { getCell, parseBoard } from './board'
import { createGame, play } from './game'
import type { GameState, PlayResult } from './types'

/** 断言落子成功并返回新状态。 */
function expectOk(result: PlayResult): GameState {
  if (!result.ok) throw new Error(`预期落子成功,实际被拒绝:${result.reason}`)
  return result.state
}

describe('createGame', () => {
  it('默认 9 路、黑先、贴 7.5', () => {
    const game = createGame()
    expect(game.board.size).toBe(9)
    expect(game.toPlay).toBe('black')
    expect(game.komi).toBe(7.5)
    expect(game.phase).toBe('playing')
    expect(game.history).toEqual([])
    expect(game.positionKeys).toHaveLength(1)
  })
})

describe('play', () => {
  it('落子后轮到对方', () => {
    const game = expectOk(play(createGame(), { x: 2, y: 2 }))
    expect(getCell(game.board, { x: 2, y: 2 })).toBe('black')
    expect(game.toPlay).toBe('white')
    expect(game.history).toEqual([
      { kind: 'play', color: 'black', point: { x: 2, y: 2 }, captured: [], isKo: false },
    ])
  })

  it('已有棋子的点被拒绝', () => {
    const game = expectOk(play(createGame(), { x: 2, y: 2 }))
    expect(play(game, { x: 2, y: 2 })).toEqual({ ok: false, reason: 'occupied' })
  })

  it('棋盘外的点被拒绝', () => {
    expect(play(createGame(), { x: 9, y: 0 })).toEqual({ ok: false, reason: 'off-board' })
  })

  it('提掉没有气的对方棋子', () => {
    const board = parseBoard(['.....', '..X..', '.XO..', '..X..', '.....'])
    const game = expectOk(play(createGame({ board }), { x: 3, y: 2 }))
    expect(getCell(game.board, { x: 2, y: 2 })).toBeNull()
    expect(game.history[0]).toEqual({
      kind: 'play',
      color: 'black',
      point: { x: 3, y: 2 },
      captured: [{ x: 2, y: 2 }],
      isKo: false,
    })
  })

  it('一次提掉整块棋', () => {
    const board = parseBoard(['.XX..', 'XOO..', '.XX..', '.....', '.....'])
    const game = expectOk(play(createGame({ board }), { x: 3, y: 1 }))
    expect(getCell(game.board, { x: 1, y: 1 })).toBeNull()
    expect(getCell(game.board, { x: 2, y: 1 })).toBeNull()
    expect(game.history[0]).toMatchObject({ isKo: false })
    if (game.history[0].kind === 'play') expect(game.history[0].captured).toHaveLength(2)
  })

  it('禁入点(自杀)被拒绝', () => {
    const board = parseBoard(['.X...', 'X....', '.....', '.....', '.....'])
    const game = createGame({ board, toPlay: 'white' })
    expect(play(game, { x: 0, y: 0 })).toEqual({ ok: false, reason: 'suicide' })
  })

  it('能提子时不算自杀', () => {
    const board = parseBoard(['.XO..', 'XO...', '.....', '.....', '.....'])
    const game = expectOk(play(createGame({ board, toPlay: 'white' }), { x: 0, y: 0 }))
    expect(getCell(game.board, { x: 1, y: 0 })).toBeNull()
    expect(game.history[0]).toMatchObject({ captured: [{ x: 1, y: 0 }], isKo: true })
  })

  it('劫:提劫后不能立刻回提', () => {
    const board = parseBoard(['.XO..', 'XO...', '.....', '.....', '.....'])
    const afterTake = expectOk(play(createGame({ board, toPlay: 'white' }), { x: 0, y: 0 }))
    expect(play(afterTake, { x: 1, y: 0 })).toEqual({ ok: false, reason: 'repeated-position' })
  })

  it('劫:双方各在别处下一手后可以回提', () => {
    const board = parseBoard(['.XO..', 'XO...', '.....', '.....', '.....'])
    let game = expectOk(play(createGame({ board, toPlay: 'white' }), { x: 0, y: 0 }))
    game = expectOk(play(game, { x: 4, y: 4 }))
    game = expectOk(play(game, { x: 4, y: 0 }))
    game = expectOk(play(game, { x: 1, y: 0 }))
    expect(getCell(game.board, { x: 0, y: 0 })).toBeNull()
    expect(game.history.at(-1)).toMatchObject({ captured: [{ x: 0, y: 0 }], isKo: true })
  })

  it('超级劫:送二还一后回到原局面被拒绝', () => {
    // 黑 (1,0) 一子;白块只有 (2,0) 和 (4,2) 两口气
    const board = parseBoard(['.X.OO', 'XOOOO', 'XXXX.', '.....', '.....'])
    let game = expectOk(play(createGame({ board }), { x: 2, y: 0 })) // 黑送第二子,两子只剩一口气
    game = expectOk(play(game, { x: 0, y: 0 })) // 白提两子
    expect(game.history.at(-1)).toMatchObject({
      isKo: false,
      captured: expect.arrayContaining([
        { x: 1, y: 0 },
        { x: 2, y: 0 },
      ]),
    })
    expect(getCell(game.board, { x: 1, y: 0 })).toBeNull()
    expect(getCell(game.board, { x: 2, y: 0 })).toBeNull()
    // 黑在 (1,0) 还一子会让盘面回到起点,不是标准劫形,只有全局同形禁止能拦住
    expect(play(game, { x: 1, y: 0 })).toEqual({ ok: false, reason: 'repeated-position' })
  })

  it('每次落子都记录盘面', () => {
    let game = createGame()
    game = expectOk(play(game, { x: 0, y: 0 }))
    game = expectOk(play(game, { x: 1, y: 1 }))
    expect(game.positionKeys).toHaveLength(3)
  })
})
