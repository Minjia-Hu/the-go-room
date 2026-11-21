import { describe, expect, it } from 'vitest'
import { getGroup } from '../../engine'
import { SURVIVAL_SCENES } from '../../content/survival'
import { awaitingConfirm, survivalNextLabel, survivalSteps } from './survivalSteps'
import { choosePracticePoint, chooseReason, confirmPractice, practiceHint, startSurvival, survivalCompletion } from './survivalRunner'

const scene = (id: string) => SURVIVAL_SCENES.find((s) => s.id === id)!

describe('完成方式', () => {
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

describe('步骤表', () => {
  it('认危险：找棋 → 找气 → 完成', () => {
    let run = startSurvival(scene('danger-check'))
    expect(survivalSteps(run)).toMatchObject({ current: 1, total: 2, label: '找棋', task: '点出你觉得有危险的一块黑棋。', done: false })
    run = choosePracticePoint(run, run.scene.target)
    expect(survivalSteps(run)).toMatchObject({ current: 2, total: 2, label: '找气', task: '点出这整块黑棋最后的一口气。' })
    run = choosePracticePoint(run, getGroup(run.game.board, run.scene.target)!.liberties[0])
    expect(survivalSteps(run)).toMatchObject({ current: 2, total: 2, label: '独立完成', done: true })
    expect(survivalSteps(run).task).toBeUndefined()
  })

  it('连接：选点试下 → 看后果，再确认', () => {
    let run = startSurvival(scene('connect-check'))
    expect(survivalSteps(run)).toMatchObject({ current: 1, total: 2, label: '选点试下' })
    run = choosePracticePoint(run, run.scene.examples[0])
    expect(awaitingConfirm(run)).toBe(true)
    expect(survivalSteps(run)).toMatchObject({ current: 2, total: 2, label: '看后果，再确认' })
    expect(survivalSteps(confirmPractice(run)).done).toBe(true)
  })

  it('找出路引导题：确认一种后回到第一步，并显示比较进度', () => {
    const start = startSurvival(scene('escape-guided'))
    let run = confirmPractice(choosePracticePoint(start, start.scene.examples[0]))
    expect(run.stage).toBe('move')
    expect(awaitingConfirm(run)).toBe(false)
    expect(survivalSteps(run)).toMatchObject({ current: 1, label: '选点试下', progress: '已比较 1 / 2 种', task: '从同一起点再试另一种办法：延伸，或提掉白棋。' })
    run = choosePracticePoint(run, start.scene.examples[1])
    expect(survivalSteps(run)).toMatchObject({ current: 2, progress: '已比较 1 / 2 种' })
    run = confirmPractice(run)
    expect(survivalSteps(run)).toMatchObject({ done: true, label: '跟着引导完成' })
    expect(survivalSteps(run).progress).toBeUndefined()
  })

  it('两只眼：第一个眼 → 第二个眼 → 说出原因', () => {
    let run = startSurvival(scene('eyes-check'))
    expect(survivalSteps(run)).toMatchObject({ current: 1, total: 3, label: '试第一个眼' })
    run = choosePracticePoint(run, run.scene.eyes![0])
    expect(survivalSteps(run)).toMatchObject({ current: 2, total: 3, label: '试第二个眼' })
    run = choosePracticePoint(run, run.scene.eyes![1])
    expect(survivalSteps(run)).toMatchObject({ current: 3, total: 3, label: '说出原因', task: '为什么白棋下不进这两个眼？' })
    run = chooseReason(chooseReason(run, false), true)
    expect(survivalSteps(run)).toMatchObject({ done: true, label: '重试后完成' })
  })

  it('借助提示或演示完成时保留重来建议', () => {
    const start = startSurvival(scene('danger-check'))
    const hinted = practiceHint(start)
    const viaHint = choosePracticePoint(choosePracticePoint(hinted, start.scene.target), getGroup(start.game.board, start.scene.target)!.liberties[0])
    expect(survivalSteps(viaHint)).toMatchObject({ label: '借助提示完成', task: '可以重来一次，不看提示试试。' })
    const viaDemo = practiceHint(practiceHint(practiceHint(start)))
    expect(survivalSteps(viaDemo)).toMatchObject({ label: '跟着演示完成', task: '可以重来一次，自己找答案。' })
  })
})

describe('下一步去向', () => {
  it('引导题去检验题，检验题写明下一课标题，最后一题交给页面', () => {
    expect(survivalNextLabel(2)).toBe('换个局面，自己试试 →')
    expect(survivalNextLabel(1)).toBe('下一课 · 给自己的棋找出路 →')
    expect(survivalNextLabel(3)).toBe('下一课 · 把分开的棋连起来 →')
    expect(survivalNextLabel(SURVIVAL_SCENES.length - 1)).toBeUndefined()
  })
})
