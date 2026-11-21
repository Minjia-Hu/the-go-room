import { describe, expect, it } from 'vitest'
import { getGroup, samePoint, toPoint } from '../../engine'
import { INDEPENDENT_SCENES } from '../../content/independent'
import { SURVIVAL_SCENES } from '../../content/survival'
import { answerIndependent, confirmIndependent, independentHint, independentPoint, independentTrial, independentView, startIndependent } from './independentRunner'

describe('换棋形独立练习', () => {
  it('六个初始局面无答案标记，每题恰有一块黑棋只有一气且存在合法解法', () => {
    expect(INDEPENDENT_SCENES).toHaveLength(6)
    for (const scene of INDEPENDENT_SCENES) {
      const run = startIndependent(scene)
      expect(independentView(run).marks).toEqual([])
      const danger = new Set<string>()
      run.game.board.cells.forEach((cell, index) => {
        const group = getGroup(run.game.board, toPoint(run.game.board, index))
        if (group) expect(group.liberties.length).toBeGreaterThan(0)
        if (cell === 'black' && group?.liberties.length === 1) danger.add(group.stones.map((p) => p.y * 9 + p.x).sort((a, b) => a - b).join(','))
      })
      expect(danger.size).toBe(1)
      expect(getGroup(run.game.board, scene.target)?.liberties).toHaveLength(1)
      const solved = independentTrial(run, scene.example)
      expect(solved.result.ok).toBe(true)
      expect(solved.meetsGoal).toBe(true)
      expect(solved.group!.liberties.length).toBeGreaterThanOrEqual(2)
      if (scene.kind === 'capture') expect(solved.captured).toBeGreaterThan(0)
      if (scene.partner) expect(solved.group!.stones.some((point) => samePoint(point, scene.partner!))).toBe(true)
      expect(run.game.history).toEqual([])
    }
  })
  it('先找到危险再选点，安全棋块不会被当成答案', () => {
    const run = startIndependent(INDEPENDENT_SCENES[0])
    expect(independentPoint(run, { x: 1, y: 0 })).toMatchObject({ stage: 'find', mistakes: 1 })
    expect(independentPoint(run, { x: 0, y: 8 })).toMatchObject({ stage: 'find', mistakes: 1 })
    expect(independentPoint(run, { x: -1, y: 0 })).toBe(run)
    const found = independentPoint(run, { x: 3, y: 4 })
    expect(found.stage).toBe('move')
    expect(found.mistakes).toBe(0)
    expect(found.message).toContain('这 3 颗黑棋连成一块')
  })
  it('向外伸仍只有一气时不算成功，白棋回应会实际提掉目标与新子', () => {
    let run = startIndependent(INDEPENDENT_SCENES[1])
    run = independentPoint(run, run.scene.target)
    expect(run.message).toContain('这颗黑棋只剩一口气')
    run = independentPoint(run, { x: 5, y: 4 })
    const trial = independentTrial(run, run.point!)
    expect(trial.result.ok).toBe(true)
    expect(trial.meetsGoal).toBe(false)
    expect(trial.reply?.history.at(-1)).toMatchObject({ captured: expect.arrayContaining([{ x: 5, y: 3 }, { x: 5, y: 4 }]) })
    run = confirmIndependent(run)
    expect(run.stage).toBe('move')
    expect(run.mistakes).toBe(1)
    const replyView = { ...run, view: 'reply' as const }
    expect(independentPoint(replyView, run.scene.example)).toBe(replyView)
    expect(confirmIndependent(replyView)).toBe(replyView)
    expect(independentView(replyView).marks.filter((mark) => mark.kind === 'captured')).toHaveLength(2)
  })
  it('合法候选按实际结果接受，不只核对预设答案坐标', () => {
    const original = SURVIVAL_SCENES.find((scene) => scene.id === 'escape-guided')!
    const run = startIndependent({ id: 'multiple-solutions', kind: 'extend', rows: original.rows, target: original.target, example: original.examples[0] })
    expect(independentTrial(run, { x: 4, y: 5 }).meetsGoal).toBe(true)
    expect(independentTrial(run, { x: 4, y: 2 }).meetsGoal).toBe(true)
    expect(independentTrial(run, { x: 0, y: 0 }).meetsGoal).toBe(false)
  })
  it('每题都要确认试下并选对原因；原图、试下与重试不改正式起点', () => {
    for (const scene of INDEPENDENT_SCENES) {
      let run = startIndependent(scene)
      const initial = run.game
      expect(answerIndependent(run, 0)).toBe(run)
      run = independentPoint(run, scene.target)
      run = independentPoint(run, scene.example)
      expect(run.stage).toBe('move')
      expect(confirmIndependent({ ...run, view: 'before' }).stage).toBe('move')
      run = confirmIndependent(run)
      expect(run.stage).toBe('reason')
      const correct = { capture: 0, connect: 1, extend: 2 }[scene.kind]
      const wrong = answerIndependent(run, (correct + 1) % 3)
      expect(wrong.stage).toBe('reason')
      expect(wrong.mistakes).toBe(1)
      run = answerIndependent(run, correct)
      expect(run.stage).toBe('done')
      expect(run.game).toBe(initial)
      expect(independentView(run).completion).toBe('本次未用提示完成')
    }
  })
  it('提示主动请求且分级，辅助与重试完成不会伪装成初次独立完成', () => {
    let run = startIndependent(INDEPENDENT_SCENES[0])
    run = independentHint(run)
    expect(run.help).toBe(1)
    expect(independentView(run).marks).toEqual([])
    run = independentHint(run)
    expect(independentView(run).marks.some((mark) => mark.kind === 'target')).toBe(true)
    expect(independentHint(run)).toBe(run)
    run = answerIndependent(confirmIndependent(independentPoint(independentPoint(run, run.scene.target), run.scene.example)), 2)
    expect(independentView(run).completion).toBe('借助提示完成')
    expect(independentView({ ...run, help: 0, mistakes: 1 }).completion).toBe('本次重试后完成')
    expect(startIndependent(run.scene)).toMatchObject({ help: 0, mistakes: 0, stage: 'find', point: null })
  })
})
