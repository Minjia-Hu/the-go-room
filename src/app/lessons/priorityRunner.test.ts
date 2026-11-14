import { describe, expect, it } from 'vitest'
import { PRIORITY_SCENES } from '../../content/practiceExtras'
import { answerPriority, choosePriority, confirmPriority, priorityHint, priorityVariation, priorityView, startPriority } from './priorityRunner'

describe('先后判断', () => {
  it.each(PRIORITY_SCENES)('$id 需要先确认再解释，比较不污染原图，失败可重新选', (scene) => {
    const initial = startPriority(scene)
    expect(confirmPriority(initial)).toBe(initial)
    expect(answerPriority(initial, scene.reasonAnswer)).toBe(initial)
    const wrongIndex = (scene.answer + 1) % scene.choices.length
    const trial = choosePriority(initial, wrongIndex)
    expect(trial.mistakes).toBe(0)
    expect(confirmPriority({ ...trial, view: 'before' })).toMatchObject({ stage: 'choose', mistakes: 0 })
    const wrong = confirmPriority(trial)
    expect(wrong).toMatchObject({ stage: 'choose', view: 'reply', mistakes: 1 })
    expect(priorityView(wrong).marks.filter((mark) => mark.kind === 'captured').length).toBeGreaterThan(0)
    const rightTrial = choosePriority(wrong, scene.answer)
    expect(priorityView(rightTrial).game.history).toHaveLength(1)
    const pending = confirmPriority(rightTrial)
    expect(pending.stage).toBe('reason')
    const wrongReason = answerPriority(pending, (scene.reasonAnswer + 1) % scene.reasons.length)
    expect(wrongReason).toMatchObject({ stage: 'reason', mistakes: 2 })
    const done = answerPriority(wrongReason, scene.reasonAnswer)
    expect(done.stage).toBe('done')
    expect(done.game).toBe(initial.game)
    expect(initial.game.history).toEqual([])
    expect(choosePriority(done, wrongIndex)).toBe(done)
    expect(startPriority(scene)).toMatchObject({ mistakes: 0, help: 0, selected: null })
  })
  it('提示标出目标但不代答，非法选项不推进，原图与回应可来回对照', () => {
    const run = startPriority(PRIORITY_SCENES[0])
    expect(priorityView(run).marks.every((mark) => mark.kind === 'label')).toBe(true)
    const hinted = priorityHint(run)
    expect(hinted).toMatchObject({ help: 1, stage: 'choose', selected: null })
    expect(priorityView(hinted).marks.some((mark) => mark.kind === 'target')).toBe(true)
    expect(choosePriority(run, -1)).toBe(run)
    expect(priorityVariation(run, 20)).toBeNull()
    const trial = choosePriority(run, 1)
    expect(priorityView({ ...trial, view: 'before' }).game).toBe(run.game)
    expect(priorityView({ ...trial, view: 'reply' }).game.history).toHaveLength(2)
  })
})
