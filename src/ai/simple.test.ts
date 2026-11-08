import { describe, expect, it } from 'vitest'
import { createGame, getGroup, parseBoard, pass, play } from '../engine'
import type { GameState } from '../engine'
import { createRng } from './random'
import { chooseMove, findAtari, findCapture, findEscape, sensibleMoves } from './simple'

/** 用文字棋盘建一个轮到 toPlay 下的局面。 */
function position(rows: string[], toPlay: 'black' | 'white' = 'black'): GameState {
  return createGame({ board: parseBoard(rows), toPlay })
}

describe('findCapture', () => {
  it('找到能提子的点', () => {
    const state = position(['.....', '..X..', '.XO..', '..X..', '.....'])
    expect(findCapture(state)).toEqual({ x: 3, y: 2 })
  })

  it('有多处能提时选提子最多的', () => {
    // 右上角白一子在 (4,1) 可提;下方白两子在 (3,3) 可提。扫描时 (4,1) 在前。
    const state = position(['...XO', '.....', '.XX..', 'XOO..', '.XX..'])
    expect(findCapture(state)).toEqual({ x: 3, y: 3 })
  })

  it('没有能提的子时返回 null', () => {
    expect(findCapture(createGame())).toBeNull()
  })
})

describe('findEscape', () => {
  it('长出去能有两口气以上时救子', () => {
    const state = position(['.....', '.....', '..O..', '.OXO.', '.....'])
    expect(findEscape(state)).toEqual({ x: 2, y: 4 })
  })

  it('长出去仍只有一口气时不救', () => {
    const state = position(['.....', '.....', '.O...', 'OXO..', 'O....'])
    expect(findEscape(state)).toBeNull()
  })

  it('没有被叫吃的棋时返回 null', () => {
    expect(findEscape(createGame())).toBeNull()
  })
})

describe('findAtari', () => {
  it('把对方两口气的棋逼到一口气', () => {
    const state = position(['.....', '..X..', '.XO..', '.....', '.....'])
    expect([
      { x: 3, y: 2 },
      { x: 2, y: 3 },
    ]).toContainEqual(findAtari(state))
  })

  it('跳过叫吃后自己只剩一口气的点', () => {
    // (3,2) 叫吃后黑子只剩 (4,2) 一口气,应改选 (2,3)
    const state = position(['.....', '..XO.', '.XO..', '...O.', '.....'])
    expect(findAtari(state)).toEqual({ x: 2, y: 3 })
  })

  it('没有可叫吃的棋时返回 null', () => {
    expect(findAtari(createGame())).toBeNull()
  })
})

describe('sensibleMoves', () => {
  it('不包括自己的眼', () => {
    const state = position(['X.X', 'XXX', 'X.X'])
    expect(sensibleMoves(state)).toEqual([])
  })

  it('空棋盘上所有点都合理', () => {
    expect(sensibleMoves(createGame())).toHaveLength(81)
  })
})

describe('chooseMove', () => {
  it('能提子时优先提子', () => {
    const state = position(['...XO', '.....', '.XX..', 'XOO..', '.XX..'])
    expect(chooseMove(state, createRng(1))).toEqual({ kind: 'play', point: { x: 3, y: 3 } })
  })

  it('没有提子时,救自己的棋优先于叫吃对方', () => {
    // 黑 (2,3) 被叫吃,可以在 (2,4) 长出;同时黑在 (3,0) 或 (2,1) 能叫吃白 (2,0)
    const state = position(['.XO..', '.....', '..O..', '.OXO.', '.....'])
    expect(chooseMove(state, createRng(1))).toEqual({ kind: 'play', point: { x: 2, y: 4 } })
  })

  it('只剩自己的眼时停一手', () => {
    expect(chooseMove(position(['X.X', 'XXX', 'X.X']), createRng(1))).toEqual({ kind: 'pass' })
  })

  it('终局阶段停一手', () => {
    let state = createGame()
    state = (pass(state) as { ok: true; state: GameState }).state
    state = (pass(state) as { ok: true; state: GameState }).state
    expect(chooseMove(state, createRng(1))).toEqual({ kind: 'pass' })
  })

  it('同一种子在同一局面下选同一个点', () => {
    const a = chooseMove(createGame(), createRng(3))
    const b = chooseMove(createGame(), createRng(3))
    expect(a).toEqual(b)
    expect(a.kind).toBe('play')
  })

  it('电脑自己和自己下,每步都合法,并能走到终局', () => {
    const rng = createRng(2026)
    let state = createGame()
    for (let i = 0; i < 1000 && state.phase === 'playing'; i++) {
      const move = chooseMove(state, rng)
      const result = move.kind === 'pass' ? pass(state) : play(state, move.point)
      expect(result.ok).toBe(true)
      if (result.ok) state = result.state
    }
    expect(state.phase).toBe('scoring')
  })
})


describe('随机候选的自叫吃过滤', () => {
  it('排除合法但未提子且只剩一气的点，保留有两气的点', () => {
    const state = position(['.O...', '.....', '.....', '.....', '.....'])
    const point = { x: 0, y: 0 }
    const result = play(state, point)
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('fixture must be legal')
    expect(getGroup(result.state.board, point)?.liberties).toHaveLength(1)
    expect(sensibleMoves(state)).not.toContainEqual(point)
    expect(sensibleMoves(state)).toContainEqual({ x: 4, y: 4 })
  })
  it('提子后仅剩一气仍保留，战术分支仍会选择该提子', () => {
    const state = position(['.XO..', 'XO.O.', '.XO..', '.....', '.....'])
    const point = { x: 2, y: 1 }
    const result = play(state, point)
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('fixture must be legal')
    const last = result.state.history.at(-1)!
    expect(last.kind === 'play' && last.captured.length).toBe(1)
    expect(getGroup(result.state.board, point)?.liberties).toHaveLength(1)
    expect(sensibleMoves(state)).toContainEqual(point)
    expect(chooseMove(state, createRng(7))).toEqual({ kind: 'play', point })
  })
  it('玩家停手不触发自动跟停，空盘仍正常落子', () => {
    const result = pass(createGame())
    if (!result.ok) throw new Error('pass must be legal')
    expect(chooseMove(result.state, createRng(7)).kind).toBe('play')
  })
})
