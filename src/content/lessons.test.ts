import { describe, expect, it } from 'vitest'
import { createGame, getCell, getGroup, isOnBoard, parseBoard, play } from '../engine'
import type { GameState, Point } from '../engine'
import { LESSONS } from './lessons'
import type { Lesson } from './types'

/** 按关卡定义建好初始局面,准备手必须全部合法。 */
function setUp(lesson: Lesson): GameState {
  let game = createGame({ board: parseBoard(lesson.rows), toPlay: lesson.toPlay })
  for (const move of lesson.setupMoves ?? []) {
    const result = play(game, move)
    if (!result.ok) throw new Error(`${lesson.id}: 准备手 ${move.x},${move.y} 被拒绝:${result.reason}`)
    game = result.state
  }
  return game
}

function byPoint(a: Point, b: Point): number {
  return a.y - b.y || a.x - b.x
}

function firstLegal(game: GameState): Point {
  for (let index = 0; index < game.board.cells.length; index++) {
    const p = { x: index % game.board.size, y: Math.floor(index / game.board.size) }
    if (play(game, p).ok) return p
  }
  throw new Error('没有合法点')
}

describe('LESSONS', () => {
  it('有 5 关,id 不重复', () => {
    expect(LESSONS).toHaveLength(5)
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(5)
  })

  it.each(LESSONS.map((l) => [l.id, l] as const))('%s:盘面、准备手和标记都合法', (_id, lesson) => {
    const game = setUp(lesson)
    expect(game.board.size).toBe(9)
    for (const p of lesson.highlight ?? []) expect(isOnBoard(game.board, p)).toBe(true)
    expect(lesson.steps.length).toBeGreaterThan(0)
  })

  it.each(LESSONS.map((l) => [l.id, l] as const))('%s:每一步都能按正确答案走通', (_id, lesson) => {
    let game = setUp(lesson)
    for (const step of lesson.steps) {
      if (step.kind === 'select') {
        expect(step.targets.length).toBeGreaterThan(0)
        for (const p of step.targets) expect(getCell(game.board, p)).toBeNull()
        continue
      }
      if (step.expectReject) {
        expect(play(game, step.expectReject.point)).toEqual({ ok: false, reason: step.expectReject.reason })
      }
      for (const hint of step.hints ?? []) expect(isOnBoard(game.board, hint.point)).toBe(true)

      if (step.accept === 'any-legal') {
        const result = play(game, firstLegal(game))
        expect(result.ok).toBe(true)
        if (result.ok) game = result.state
      } else if (step.accept.length > 0) {
        for (const p of step.accept) expect(play(game, p).ok).toBe(true)
        const result = play(game, step.accept[0])
        if (result.ok) game = result.state
      } else {
        expect(step.expectReject).toBeDefined()
      }
    }
  })

  it('第 2 课的目标点就是圈起来那块棋的全部气', () => {
    const lesson = LESSONS.find((l) => l.id === 'liberties')!
    const step = lesson.steps[0]
    if (step.kind !== 'select') throw new Error('关卡定义变了')
    const group = getGroup(setUp(lesson).board, lesson.highlight![0])!
    expect(group.stones).toHaveLength(lesson.highlight!.length)
    expect([...step.targets].sort(byPoint)).toEqual([...group.liberties].sort(byPoint))
  })

  it('第 3 课的正确落点确实提子', () => {
    const lesson = LESSONS.find((l) => l.id === 'capture')!
    const step = lesson.steps[0]
    if (step.kind !== 'place' || step.accept === 'any-legal') throw new Error('关卡定义变了')
    const result = play(setUp(lesson), step.accept[0])
    expect(result.ok && result.state.history[0].kind === 'play' && result.state.history[0].captured.length).toBe(1)
  })

  it('第 4 课的两个标记点一个是禁入点,一个能下', () => {
    const lesson = LESSONS.find((l) => l.id === 'suicide')!
    const game = setUp(lesson)
    const [forbidden, allowed] = lesson.highlight!
    expect(play(game, forbidden)).toEqual({ ok: false, reason: 'suicide' })
    expect(play(game, allowed).ok).toBe(true)
  })
})
