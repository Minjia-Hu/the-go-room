import { describe, expect, it } from 'vitest'
import { createGame, getCell, getGroup, parseBoard, play, toPoint } from '../engine'
import { SURVIVAL_SCENES } from './survival'
import { analyzeAction, threats } from '../app/coaching/analysis'
import { targetSurvives } from '../app/coaching/suggestions'

describe('八个生存场景', () => {
  it('恰好四课，每课例题与检验题各一，没有起始零气块', () => {
    expect(SURVIVAL_SCENES).toHaveLength(8)
    for (let course = 1; course <= 4; course++) expect(SURVIVAL_SCENES.filter((s) => s.course === course).map((s) => s.guided)).toEqual([true, false])
    for (const scene of SURVIVAL_SCENES) for (const rows of [scene.rows, ...(scene.contrastRows ? [scene.contrastRows] : [])]) {
      const board = parseBoard(rows)
      expect(board.size).toBe(9)
      board.cells.forEach((c, i) => { if (c) expect(getGroup(board, toPoint(board, i))!.liberties.length).toBeGreaterThan(0) })
    }
  })
  for (const scene of SURVIVAL_SCENES.filter((s) => s.kind !== 'eyes')) {
    it(`${scene.id} 的正确路径真的保住原目标，典型错误仍有危险`, () => {
      const game = createGame({ board: parseBoard(scene.rows) })
      const targets = getGroup(game.board, scene.target)!.stones
      expect(threats(game).some((g) => g.stones.some((p) => p.x === scene.target.x && p.y === scene.target.y))).toBe(true)
      for (const point of scene.examples) {
        const a = analyzeAction(game, point)
        expect(a.ok && targetSurvives(a.after, targets)).toBe(true)
        if (scene.kind === 'connect') expect(a.ok && a.connected).toBeGreaterThanOrEqual(2)
      }
      const wrong = analyzeAction(game, scene.wrongMove!)
      expect(wrong.ok && targetSurvives(wrong.after, targets)).toBe(false)
      if (wrong.ok) for (const d of wrong.dangers) expect(d.capture?.after.board.cells.filter((c) => c === 'black').length).toBeLessThan(wrong.after.board.cells.filter((c) => c === 'black').length)
    })
  }
  for (const scene of SURVIVAL_SCENES.filter((s) => s.kind === 'eyes')) {
    it(`${scene.id} 两眼入内为自杀，一眼对照确实能提`, () => {
      const game = createGame({ board: parseBoard(scene.rows), toPlay: 'white' })
      for (const eye of scene.eyes!) expect(play(game, eye)).toEqual({ ok: false, reason: 'suicide' })
      expect(getGroup(game.board, scene.target)!.liberties).toHaveLength(2)
      if (scene.contrastRows) {
        const contrast = createGame({ board: parseBoard(scene.contrastRows), toPlay: 'white' })
        const result = play(contrast, scene.eyes![0])
        expect(result.ok && getCell(result.state.board, scene.target)).toBeNull()
      }
    })
  }
})
