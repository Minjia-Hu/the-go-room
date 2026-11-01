import { describe, expect, it } from 'vitest'
import { createGame, parseBoard } from '../engine'
import type { GameState } from '../engine'
import { findAtari, findCapture, findEscape } from './simple'

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
