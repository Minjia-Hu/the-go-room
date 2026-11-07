import { describe, expect, it } from 'vitest'
import { getGroup } from '../../engine'
import { SURVIVAL_SCENES } from '../../content/survival'
import { choosePracticePoint, chooseReason, confirmPractice, practiceBoard, practiceHint, startSurvival } from './survivalRunner'

describe('生存练习推进', () => {
  for (const scene of SURVIVAL_SCENES) it(`${scene.id} 可独立完成，起始棋局不被演示污染`, () => {
    let run = startSurvival(scene)
    const origin = run.game
    if (scene.kind === 'danger') {
      run = choosePracticePoint(run, scene.target)
      run = choosePracticePoint(run, getGroup(origin.board, scene.target)!.liberties[0])
    } else if (scene.kind === 'eyes') {
      for (const p of scene.eyes!) run = choosePracticePoint(run, p)
      expect(chooseReason(run, false).stage).toBe('reason')
      run = chooseReason(run, true)
    } else for (const p of scene.examples) run = confirmPractice(choosePracticePoint(run, p))
    expect(run.stage).toBe('done')
    expect(run.assisted).toBe(false)
    expect(run.game).toBe(origin)
    expect(origin.history).toEqual([])
  })
  it('典型错误可演示，重新选点仍从原图开始；展示答案标记辅助完成', () => {
    const scene = SURVIVAL_SCENES[3]
    let run = confirmPractice(choosePracticePoint(startSurvival(scene), scene.wrongMove!))
    expect(run.stage).toBe('move')
    const reply = practiceBoard({ ...run, view: 'reply' })
    expect(reply.history).toHaveLength(2)
    expect(run.game.history).toEqual([])
    run = practiceHint(practiceHint(practiceHint(run)))
    expect(run.stage).toBe('done')
    expect(run.assisted).toBe(true)
  })
})
