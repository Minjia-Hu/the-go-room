import { describe, expect, it } from 'vitest'
import { getCell, getGroup } from '../../engine'
import { LADDER_DEFENSE_SCENES } from '../../content/ladderDefense'
import { answerDefense, chooseDefense, defenseCompletion, defenseHint, defenseStep, defenseView, startLadderDefense } from './ladderDefenseRunner'

describe('征子防守固定回放', () => {
  it.each([[0, 0, 14, 8], [0, 1, 2, 1], [1, 0, 9, 0], [1, 1, 2, 1]] as const)(
    '题 %i 选项 %i 的 %i 步合法，结束时提掉 %i 颗',
    (sceneIndex, choice, turns, captured) => {
      const scene = LADDER_DEFENSE_SCENES[sceneIndex]
      const initial = startLadderDefense(scene)
      expect(getGroup(defenseView(initial).board, scene.target)?.liberties).toHaveLength(1)
      let run = chooseDefense(initial, choice)
      for (let i = 0; i < turns; i++) {
        expect(run.stage).toBe('choose')
        expect(run.mistakes).toBe(0)
        expect(answerDefense(run, scene.reasonAnswer)).toBe(run)
        run = defenseStep(run, 1)
        expect(defenseView(run).history.at(-1)).toMatchObject({ point: scene.choices[choice].moves[i], color: i % 2 ? 'white' : 'black' })
      }
      const game = defenseView(run)
      expect(game.history).toHaveLength(turns)
      const last = game.history.at(-1)
      if (last?.kind !== 'play') throw new Error('固定变化最后一步必须实际落子')
      expect(last.captured).toHaveLength(captured)
      if (captured) expect(getCell(game.board, scene.target)).toBeNull()
      else {
        const target = getGroup(game.board, scene.target)!
        expect(target.stones).toContainEqual({ x: 6, y: 0 })
        expect(target.stones).toHaveLength(7)
        expect(target.liberties).toHaveLength(3)
      }
      if (choice === 1) expect(getCell(game.board, { x: 0, y: 8 })).toBe('black')
      expect(run.stage).toBe(choice === scene.answer ? 'reason' : 'choose')
      expect(run.mistakes).toBe(choice === scene.answer ? 0 : 1)
      expect(defenseStep(defenseStep(run, -1), 1).mistakes).toBe(run.mistakes)
    },
  )

  it('选对后还要解释原因，错误及取提示改变完成方式', () => {
    const scene = LADDER_DEFENSE_SCENES[0]
    const start = startLadderDefense(scene)
    const finish = (run: typeof start) => defenseStep(defenseStep(chooseDefense(run, 1), 1), 1)
    const answer = (run: typeof start) => answerDefense(run, scene.reasonAnswer)
    const ready = finish(start)
    expect(answer(ready).stage).toBe('done')
    expect(defenseCompletion(answer(ready))).toBe('independent')
    const wrong = answerDefense(ready, 1 - scene.reasonAnswer)
    expect(wrong).toMatchObject({ stage: 'reason', mistakes: 1 })
    expect(defenseCompletion(answer(wrong))).toBe('retry')
    expect(defenseCompletion(answer(finish(defenseHint(wrong))))).toBe('hint')
  })
})
