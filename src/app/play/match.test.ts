import { describe, expect, it } from 'vitest'
import { createGame, parseBoard } from '../../engine'
import { atariStones, computerMove, createMatch, humanMove, markDead } from './match'

describe('引导对局', () => {
  it('用户执黑，不能抢下电脑回合；非法电脑落子停一手兜底', () => {
    const first = humanMove(createMatch(), { x: 4, y: 4 })
    expect(first.game.toPlay).toBe('white')
    expect(humanMove(first, { x: 0, y: 0 })).toBe(first)
    const next = computerMove(first, { kind: 'play', point: { x: 4, y: 4 } })
    expect(next.invalid).toBe(true)
    expect(next.match.game.history.at(-1)?.kind).toBe('pass')
    expect(next.match.game.toPlay).toBe('black')
    const rejected = humanMove(next.match, { x: 4, y: 4 })
    expect(rejected.game).toBe(next.match.game)
    expect(rejected.message).toContain('已经有棋子')
  })

  it('两次停一手进入终局，说明每种只出现一次', () => {
    let match = humanMove(createMatch(), null)
    match = computerMove(match, { kind: 'play', point: { x: 0, y: 0 } }).match
    match = humanMove(match, null)
    match = computerMove(match, { kind: 'pass' }).match
    expect(match.game.phase).toBe('scoring')
    expect(match.notices).toHaveLength(2)
    expect(match.seen).toEqual(['pass', 'scoring'])
    expect(humanMove(match, { x: 1, y: 1 })).toBe(match)
    const marked = markDead(match, { x: 0, y: 0 })
    expect(marked.dead).toEqual([{ x: 0, y: 0 }])
    expect(markDead(marked, { x: 0, y: 0 }).dead).toEqual([])
  })

  it('劫的首次说明、重复盘面拒绝与叫吃标记', () => {
    const match = { ...createMatch(), game: createGame({ board: parseBoard(['.XO..', 'XO...', '.....', '.....', '.....']), toPlay: 'white' }) }
    const next = computerMove(match, { kind: 'play', point: { x: 0, y: 0 } }).match
    expect(next.notices[0]).toContain('形成了劫')
    expect(humanMove(next, { x: 1, y: 0 }).message).toContain('盘面重复')
    expect(atariStones(next.game)).toContainEqual({ x: 0, y: 0 })
    expect(markDead(next, { x: 0, y: 0 })).toBe(next)
  })
})
