import { describe, expect, it } from 'vitest'
import { getGroup } from '../../engine'
import { SURVIVAL_SCENES } from '../../content/survival'
import { choosePracticePoint, chooseReason, practiceHint, startSurvival, survivalCompletion } from './survivalRunner'

describe('完成方式', () => {
  const scene = (id: string) => SURVIVAL_SCENES.find((s) => s.id === id)!
  const finishDanger = (run: ReturnType<typeof startSurvival>) => {
    const next = choosePracticePoint(run, run.scene.target)
    return choosePracticePoint(next, getGroup(run.game.board, run.scene.target)!.liberties[0])
  }
  it('检验题：独立、重试、提示、演示依次区分', () => {
    const start = startSurvival(scene('danger-check'))
    expect(survivalCompletion(finishDanger(start))).toBe('independent')
    expect(survivalCompletion(finishDanger(choosePracticePoint(start, { x: 8, y: 8 })))).toBe('retry')
    expect(survivalCompletion(finishDanger(practiceHint(start)))).toBe('hint')
    expect(survivalCompletion(practiceHint(practiceHint(practiceHint(start))))).toBe('demo')
  })
  it('引导题起始自带一级提示，不算借助提示', () => {
    let run = startSurvival(scene('eyes-guided'))
    for (const p of run.scene.eyes!) run = choosePracticePoint(run, p)
    expect(survivalCompletion(chooseReason(run, true))).toBe('guided')
  })
})
