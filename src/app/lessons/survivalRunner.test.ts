import { describe, expect, it } from 'vitest'
import { getGroup } from '../../engine'
import { SURVIVAL_SCENES } from '../../content/survival'
import { choosePracticePoint, chooseReason, practiceBoard, practiceHint, startSurvival } from './survivalRunner'

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
    } else for (const p of scene.examples) run = choosePracticePoint(run, p)
    expect(run.stage).toBe('done')
    expect(run.assisted).toBe(false)
    expect(run.game).toBe(origin)
    expect(origin.history).toEqual([])
  })
  it('典型错误可演示，重新选点仍从原图开始；展示答案标记辅助完成', () => {
    const scene = SURVIVAL_SCENES[3]
    let run = choosePracticePoint(startSurvival(scene), scene.wrongMove!)
    expect(run.stage).toBe('move')
    const reply = practiceBoard({ ...run, view: 'reply' })
    expect(reply.history).toHaveLength(2)
    expect(run.game.history).toEqual([])
    run = practiceHint(practiceHint(practiceHint(run)))
    expect(run.stage).toBe('done')
    expect(run.assisted).toBe(true)
  })
})

describe('生存练习的重试依据', () => {
  it('认错棋块、点错气分别计入重试，完成后点击不再改变记录', () => {
    let run = choosePracticePoint(startSurvival(SURVIVAL_SCENES[1]), { x: 8, y: 8 })
    run = choosePracticePoint(run, run.scene.target)
    run = choosePracticePoint(run, { x: 8, y: 8 })
    run = choosePracticePoint(run, { x: 0, y: 5 })
    expect(run.stage).toBe('done')
    expect(run.mistakes).toBe(2)
    expect(choosePracticePoint(run, { x: 8, y: 8 })).toBe(run)
  })
  it('每次落子立即判定，未救出或落子非法各算一次重试', () => {
    const initial = startSurvival(SURVIVAL_SCENES[3])
    const trial = choosePracticePoint(initial, initial.scene.wrongMove!)
    expect(trial.stage).toBe('move')
    expect(trial.mistakes).toBe(1)
    const finished = choosePracticePoint(trial, initial.scene.examples[0])
    expect(finished.stage).toBe('done')
    expect(finished.mistakes).toBe(1)
    expect(choosePracticePoint(initial, initial.scene.target).mistakes).toBe(1)
  })
  it('连接题走错后保留重试次数，重新开始清零', () => {
    const initial = startSurvival(SURVIVAL_SCENES[5])
    const failed = choosePracticePoint(initial, initial.scene.wrongMove!)
    const finished = choosePracticePoint(failed, initial.scene.examples[0])
    expect(finished.stage).toBe('done')
    expect(finished.mistakes).toBe(1)
    expect(startSurvival(finished.scene).mistakes).toBe(0)
  })
  it('两眼题点错位置与答错原因计入重试，正确的白棋禁入演示不算错误', () => {
    let run = choosePracticePoint(startSurvival(SURVIVAL_SCENES[7]), { x: 8, y: 8 })
    for (const p of run.scene.eyes!) run = choosePracticePoint(run, p)
    expect(run.mistakes).toBe(1)
    run = chooseReason(chooseReason(run, false), true)
    expect(run.stage).toBe('done')
    expect(run.mistakes).toBe(2)
  })
})
