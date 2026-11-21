import { describe, expect, it } from 'vitest'
import { LESSONS } from '../../content/lessons'
import { SURVIVAL_SCENES } from '../../content/survival'
import { INDEPENDENT_SCENES } from '../../content/independent'
import { ENDGAME_LESSONS } from '../../content/endgame'
import { STRATEGY_LESSONS } from '../../content/strategy'
import { WALK_MOVES, WALK_QUESTIONS } from '../../content/walkthrough'
import { createLearningSession, openLearningUnit, restoreLearningSession } from './learningSession'
import { continueLearningUnit, emptyLearningProgress, LEARNING_KEY, LEARNING_UNITS, parseLearningProgress, readLearningProgress, recordLearningProgress, writeLearningProgress } from './learningProgress'
import { clickPoint, startLesson } from './lessonRunner'
import { choosePracticePoint, chooseReason, confirmPractice, practiceHint, startSurvival } from './survivalRunner'
import { answerIndependent, confirmIndependent, independentHint, independentPoint, startIndependent } from './independentRunner'
import type { IndependentRun } from './independentRunner'
import { countHint, startEndgame, submitCount } from './endgameRunner'
import { answerSequence, sequenceStep } from './ruleSequence'
import { answerStrategy, chooseStrategy, startStrategy, strategyStep } from './strategyRunner'
import { answerWalk, startWalk, walkStep } from './walkthroughRunner'

function completeIndependent(run: IndependentRun): IndependentRun {
  const selected = independentPoint(independentPoint(run, run.scene.target), run.scene.example)
  return answerIndependent(confirmIndependent(selected), { capture: 0, connect: 1, extend: 2 }[run.scene.kind])
}
const unit = (id: string) => LEARNING_UNITS.find((entry) => entry.id === id)!

describe('学习记录的完成依据', () => {
  it('目录 ID 唯一，直接打开后面的课或跳过只记录位置，不伪造完成', () => {
    expect(new Set(LEARNING_UNITS.map((entry) => entry.id)).size).toBe(35)
    const session = openLearningUnit(createLearningSession(), unit('rules/ko'))
    const progress = recordLearningProgress(session.progress, session)
    expect(progress.completed).toEqual({})
    expect(progress.lastVisited).toBe('rules/ko')
    const home = { ...session, page: 'home' as const }
    expect(recordLearningProgress(progress, home)).toBe(progress)
  })
  it('规则课完成后保存，下一课中途刷新只恢复位置；不保存中途盘面或答案', () => {
    const base = createLearningSession()
    const first = { ...base, page: 'rules' as const, rules: { index: 0, run: clickPoint(base.rules.run, { x: 4, y: 4 }) } }
    const completed = recordLearningProgress(base.progress, first)
    expect(completed.completed).toEqual({ 'rules/place': 'guided' })
    expect(continueLearningUnit(completed)?.id).toBe('rules/liberties')
    const second = { ...first, rules: { index: 1, run: clickPoint(startLesson(LESSONS[1]), { x: 3, y: 4 }) } }
    const progress = recordLearningProgress(completed, second)
    const raw = JSON.stringify(progress)
    expect(Object.keys(JSON.parse(raw)).sort()).toEqual(['completed', 'lastVisited', 'version'])
    const restored = restoreLearningSession(parseLearningProgress(raw)!)
    expect(restored.rules.index).toBe(1)
    expect(restored.rules.run.selected).toEqual([])
    expect(restored.rules.run.stepIndex).toBe(0)
    expect(restored.progress.completed).toEqual(completed.completed)
  })
  it('生存题区分引导、自己完成、提示与演示，重做保留最好记录', () => {
    const base = createLearningSession()
    let guided = choosePracticePoint(base.runs[0], { x: 4, y: 4 })
    guided = choosePracticePoint(guided, { x: 4, y: 5 })
    const own = startSurvival(SURVIVAL_SCENES[1])
    const solve = (run: typeof own) => choosePracticePoint(choosePracticePoint(run, { x: 0, y: 3 }), { x: 0, y: 5 })
    let progress = recordLearningProgress(base.progress, { ...base, runs: [guided, solve(practiceHint(own))] })
    expect(progress.completed).toEqual({ 'survival/danger-guided': 'guided', 'survival/danger-check': 'hint' })
    progress = recordLearningProgress(progress, { ...base, runs: [solve(own)] })
    expect(progress.completed['survival/danger-check']).toBe('independent')
    expect(recordLearningProgress(progress, { ...base, runs: [own] }).completed).toBe(progress.completed)
    expect(recordLearningProgress(progress, { ...base, runs: [solve(practiceHint(own))] }).completed).toBe(progress.completed)
    const demo = practiceHint(practiceHint(practiceHint(startSurvival(SURVIVAL_SCENES[5]))))
    const demoDone = confirmPractice(demo)
    expect(demoDone.stage).toBe('done')
    expect(recordLearningProgress(progress, { ...base, runs: [demoDone] }).completed['survival/connect-check']).toBe('demo')
  })
  it('独立练习须完成原因回答，提示和重试分别记录，后来独立完成可升级', () => {
    const base = createLearningSession()
    const initial = startIndependent(INDEPENDENT_SCENES[0])
    const pending = confirmIndependent(independentPoint(independentPoint(initial, initial.scene.target), initial.scene.example))
    expect(recordLearningProgress(base.progress, { ...base, independentRuns: [pending] }).completed).toEqual({})
    const assisted = completeIndependent(independentHint(initial))
    const retry = completeIndependent(independentPoint(initial, { x: 8, y: 8 }))
    let progress = recordLearningProgress(base.progress, { ...base, independentRuns: [assisted] })
    expect(progress.completed['independent/extend-1']).toBe('hint')
    progress = recordLearningProgress(progress, { ...base, independentRuns: [retry] })
    expect(progress.completed['independent/extend-1']).toBe('retry')
    progress = recordLearningProgress(progress, { ...base, independentRuns: [completeIndependent(initial)] })
    expect(progress.completed['independent/extend-1']).toBe('independent')
  })
  it('慢镜头、数子提示、策略与整盘讲解只在各自完成条件满足后记录', () => {
    const base = createLearningSession()
    const sequence = answerSequence(sequenceStep(base.sequence, 3), true)
    let count = countHint(startEndgame(ENDGAME_LESSONS[1]))
    for (const input of ['28', '8', '27', '8']) count = submitCount({ ...count, input })
    let strategy = startStrategy(STRATEGY_LESSONS[0])
    for (const [index, choice] of strategy.lesson.choices.entries()) strategy = strategyStep(chooseStrategy(strategy, index), choice.moves.length)
    strategy = answerStrategy(strategy, strategy.lesson.reasons.findIndex((reason) => reason.correct))
    let walk = startWalk()
    for (const question of WALK_QUESTIONS) walk = answerWalk(walkStep(walk, question.step), question.answer)
    walk = walkStep(walk, WALK_MOVES.length)
    const progress = recordLearningProgress(base.progress, { ...base, sequence, endgameRuns: [count], strategyRuns: [strategy], walk })
    expect(progress.completed).toEqual({ 'rule-sequence/one-eye': 'guided', 'endgame/count': 'hint', 'strategy/urgent': 'guided', 'walkthrough/full-game': 'guided' })
    const restored = restoreLearningSession({ ...progress, lastVisited: 'walkthrough/full-game' })
    expect(restored.page).toBe('independent')
    expect(restored.walk).toEqual(startWalk())
  })
  it('不同章节刷新都只恢复对应题目，全部完成后可回看最近一课', () => {
    for (const entry of LEARNING_UNITS) {
      const progress = { ...emptyLearningProgress(), lastVisited: entry.id }
      const session = restoreLearningSession(progress)
      expect(session.page).toBe(entry.page)
      expect(recordLearningProgress(progress, session)).toBe(progress)
    }
    const completed = Object.fromEntries(LEARNING_UNITS.map((entry) => [entry.id, 'guided' as const]))
    expect(continueLearningUnit({ version: 1, completed, lastVisited: 'independent/connect-2' })?.id).toBe('independent/connect-2')
  })
})

describe('学习记录存储', () => {
  it('未知课程安全忽略，损坏、未来版本和无效完成方式不会恢复为已完成', () => {
    expect(parseLearningProgress(JSON.stringify({ version: 1, completed: { 'old-course': 'guided', 'rules/place': 'guided' }, lastVisited: 'old-course' })))
      .toEqual({ version: 1, completed: { 'rules/place': 'guided' }, lastVisited: null })
    for (const value of ['bad', 'null', '{}', JSON.stringify({ version: 2, completed: {}, lastVisited: null }), JSON.stringify({ version: 1, completed: [], lastVisited: null }), JSON.stringify({ version: 1, completed: { 'rules/place': 'toString' }, lastVisited: null })]) expect(parseLearningProgress(value)).toBeNull()
  })
  it('单独存储学习记录，读写异常可降级且不触碰棋谱', () => {
    const entries = new Map([['the-go-room.games.v1', 'existing games']])
    const storage = { getItem: (key: string) => entries.get(key) ?? null, setItem: (key: string, value: string) => { entries.set(key, value) } }
    const progress = { ...emptyLearningProgress(), lastVisited: 'survival/eyes-check' }
    expect(writeLearningProgress(storage, progress)).toBe(true)
    expect(entries.has(LEARNING_KEY)).toBe(true)
    expect(readLearningProgress(storage)).toEqual({ progress, message: null })
    expect(writeLearningProgress(storage, emptyLearningProgress())).toBe(true)
    expect(entries.get('the-go-room.games.v1')).toBe('existing games')
    const blocked = { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('full') } }
    expect(readLearningProgress(blocked).message).toContain('无法读取')
    expect(writeLearningProgress(blocked, progress)).toBe(false)
    expect(readLearningProgress({ ...storage, getItem: () => '{bad' }).message).toContain('已损坏')
  })
})


describe('生存检验题的完成等级', () => {
  it.each(SURVIVAL_SCENES.filter((scene) => !scene.guided))('$id 错后完成记重试，提示优先，独立重做可升级', (scene) => {
    const base = createLearningSession()
    const initial = startSurvival(scene)
    const solve = (run: typeof initial) => {
      if (scene.kind === 'danger') return choosePracticePoint(choosePracticePoint(run, scene.target), scene.examples[0])
      if (scene.kind === 'eyes') {
        for (const point of scene.eyes!) run = choosePracticePoint(run, point)
        return chooseReason(run, true)
      }
      return confirmPractice(choosePracticePoint(run, scene.examples[0]))
    }
    const failed = scene.kind === 'escape' || scene.kind === 'connect'
      ? confirmPractice(choosePracticePoint(initial, scene.wrongMove!))
      : choosePracticePoint(initial, { x: 8, y: 8 })
    const id = `survival/${scene.id}`
    const record = (run: typeof initial) => recordLearningProgress(base.progress, { ...base, runs: [solve(run)] })
    const retry = record(failed)
    expect(retry.completed[id]).toBe('retry')
    expect(record(practiceHint(failed)).completed[id]).toBe('hint')
    expect(record(practiceHint(practiceHint(practiceHint(failed)))).completed[id]).toBe('demo')
    const independent = recordLearningProgress(retry, { ...base, runs: [solve(initial)] })
    expect(independent.completed[id]).toBe('independent')
    expect(recordLearningProgress(independent, { ...base, runs: [solve(failed)] })).toBe(independent)
  })
})

it('吃子六个单元紧接生存课，版本 1 的 29 个旧 ID 原样读取并可续读', () => {
  const start = LEARNING_UNITS.findIndex(({ id }) => id === 'survival/eyes-check') + 1
  expect(LEARNING_UNITS.slice(start, start + 7).map(({ id }) => id)).toEqual([
    'capture/direction-guided', 'capture/direction-check', 'capture/double-guided', 'capture/double-check',
    'capture/ladder-guided', 'capture/ladder-check', 'endgame/territory',
  ])
  const oldUnits = LEARNING_UNITS.filter(({ id }) => !id.startsWith('capture/'))
  expect(oldUnits).toHaveLength(29)
  const old = { ...emptyLearningProgress(), lastVisited: 'survival/eyes-check',
    completed: Object.fromEntries(oldUnits.map(({ id }) => [id, 'guided' as const])) }
  const progress = parseLearningProgress(JSON.stringify(old))!
  expect(progress).toEqual(old)
  expect(continueLearningUnit(progress)?.id).toBe('capture/direction-guided')
  expect(restoreLearningSession(progress)).toMatchObject({ page: 'capture', captureIndex: 0 })
})
