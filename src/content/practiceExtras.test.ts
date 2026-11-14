import { describe, expect, it } from 'vitest'
import { createGame, getCell, getGroup, parseBoard, play, samePoint, toPoint } from '../engine'
import type { GameState } from '../engine'
import { PRACTICE_DANGER_SCENES, PRACTICE_RESCUE_SCENES, PRIORITY_SCENES } from './practiceExtras'
import { independentTrial, startIndependent } from '../app/lessons/independentRunner'

function initial(rows: readonly string[], target: { x: number; y: number }): GameState {
  const game = createGame({ board: parseBoard(rows) })
  const danger = new Set<string>()
  game.board.cells.forEach((cell, index) => {
    const group = getGroup(game.board, toPoint(game.board, index))
    if (group) expect(group.liberties.length).toBeGreaterThan(0)
    if (cell === 'black' && group?.liberties.length === 1) danger.add(group.stones.map((p) => p.y * 9 + p.x).sort((a, b) => a - b).join(','))
  })
  expect(danger.size).toBe(1)
  expect(getGroup(game.board, target)?.liberties).toHaveLength(1)
  return game
}

describe('新增专项局面由引擎验证', () => {
  it.each(PRACTICE_DANGER_SCENES)('$id 唯一危险黑块，忽略会被提，接出可增加气', (scene) => {
    const game = initial(scene.rows, scene.target)
    expect(getGroup(game.board, scene.target)!.liberties[0]).toEqual(scene.examples[0])
    const ignored = play(game, scene.wrongMove!)
    expect(ignored.ok).toBe(true)
    if (!ignored.ok) return
    const reply = play(ignored.state, scene.examples[0])
    expect(reply.ok).toBe(true)
    if (reply.ok) expect(getCell(reply.state.board, scene.target)).toBeNull()
    const rescue = play(game, scene.examples[0])
    expect(rescue.ok).toBe(true)
    if (rescue.ok) expect(getGroup(rescue.state.board, scene.target)!.liberties.length).toBeGreaterThanOrEqual(2)
  })
  it.each(PRACTICE_RESCUE_SCENES)('$id 可合法解除危险，提子和连接符合目标', (scene) => {
    initial(scene.rows, scene.target)
    const trial = independentTrial(startIndependent(scene), scene.example)
    expect(trial.result.ok).toBe(true)
    expect(trial.meetsGoal).toBe(true)
    expect(trial.group!.liberties.length).toBeGreaterThanOrEqual(2)
    if (scene.kind === 'capture') expect(trial.captured).toBe(2)
    if (scene.partner) expect(trial.group!.stones.some((point) => samePoint(point, scene.partner!))).toBe(true)
  })
  it.each(PRIORITY_SCENES)('$id 两条变化合法，错误选择确实丢掉原黑块，正确选择保留', (scene) => {
    const game = initial(scene.rows, scene.target)
    const original = getGroup(game.board, scene.target)!.stones
    for (const [index, choice] of scene.choices.entries()) {
      const first = play(game, choice.point)
      expect(first.ok).toBe(true)
      if (!first.ok) continue
      const response = play(first.state, choice.reply)
      expect(response.ok).toBe(true)
      if (!response.ok) continue
      if (index === scene.answer) {
        expect(original.every((point) => getCell(response.state.board, point) === 'black')).toBe(true)
        expect(getGroup(first.state.board, scene.target)!.liberties.length).toBeGreaterThanOrEqual(2)
      } else {
        expect(getGroup(first.state.board, scene.target)!.liberties).toHaveLength(1)
        expect(original.every((point) => getCell(response.state.board, point) === null)).toBe(true)
      }
    }
  })
  it('吃一颗丢三颗与伸一颗仍被提的文字有实际提子记录支持', () => {
    const scene = PRIORITY_SCENES[0]
    const result = play(createGame({ board: parseBoard(scene.rows) }), scene.choices[1].point)
    expect(result.ok && result.state.history.at(-1)).toMatchObject({ captured: [expect.any(Object)] })
    if (result.ok) {
      const reply = play(result.state, scene.choices[1].reply)
      expect(reply.ok && reply.state.history.at(-1)).toMatchObject({ captured: expect.any(Array) })
      if (reply.ok) {
        const last = reply.state.history.at(-1)!
        expect(last.kind === 'play' && last.captured.length).toBe(3)
      }
    }
    for (const [index, badPoint] of [[2, { x: 2, y: 2 }], [3, { x: 7, y: 0 }]] as const) {
      const trial = independentTrial(startIndependent(PRACTICE_RESCUE_SCENES[index]), badPoint)
      expect(trial.meetsGoal).toBe(false)
      expect(trial.reply).not.toBeNull()
    }
  })
})
