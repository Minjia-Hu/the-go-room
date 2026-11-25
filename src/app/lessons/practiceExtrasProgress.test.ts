import { answerDefense, chooseDefense, defenseStep } from './ladderDefenseRunner'
import { describe, expect, it } from 'vitest'
import { createLearningSession, restoreLearningSession } from './learningSession'
import { continueLearningUnit, emptyLearningProgress, LEARNING_UNITS, parseLearningProgress, recordLearningProgress } from './learningProgress'
import { PRACTICE_ITEMS, nextPracticeItem, openPracticeItem } from './practiceCatalog'
import { choosePracticePoint } from './survivalRunner'
import { answerIndependent, confirmIndependent, independentPoint } from './independentRunner'
import { answerPriority, choosePriority, confirmPriority, priorityHint } from './priorityRunner'

const extras = PRACTICE_ITEMS.filter((item) => item.id.startsWith('practice/'))
describe('专项练习进度与课程隔离', () => {
  it.each(extras)('$id 可完成并刷新保存，不改课程位置或课程数量', (item) => {
    const progress = { ...emptyLearningProgress(), lastVisited: 'rules/ko' }
    let session = restoreLearningSession(progress)
    const oldPage = session.page
    if (item.source === 'danger') {
      const run = session.practiceDangerRuns[item.index]
      const done = choosePracticePoint(choosePracticePoint(run, run.scene.target), run.scene.examples[0])
      session = { ...session, practiceDangerRuns: session.practiceDangerRuns.map((r, i) => i === item.index ? done : r) }
    } else if (item.source === 'rescue') {
      const run = session.practiceRescueRuns[item.index]
      const done = answerIndependent(confirmIndependent(independentPoint(independentPoint(run, run.scene.target), run.scene.example)), { extend: 2, capture: 0, connect: 1 }[run.scene.kind])
      session = { ...session, practiceRescueRuns: session.practiceRescueRuns.map((r, i) => i === item.index ? done : r) }
    } else if (item.source === 'ladder-defense') {
      const run = session.ladderDefenseRuns[item.index]
      const select = chooseDefense(run, run.scene.answer)
      const showing = run.scene.choices[run.scene.answer].moves.reduce((r) => defenseStep(r, 1), select)
      expect(recordLearningProgress(progress, { ...session, ladderDefenseRuns: [showing] }, { visit: false }).completed).toEqual({})
      const pending = { ...session, ladderDefenseRuns: session.ladderDefenseRuns.map((r, i) => i === item.index ? showing : r) }
      expect(openPracticeItem(pending, item)).toBe(pending)
      const done = answerDefense(showing, run.scene.reasonAnswer)
      session = { ...session, ladderDefenseRuns: session.ladderDefenseRuns.map((r, i) => i === item.index ? done : r) }
    } else {
      const run = session.priorityRuns[item.index]
      const done = answerPriority(confirmPriority(choosePriority(run, run.scene.answer)), run.scene.reasonAnswer)
      session = { ...session, priorityRuns: session.priorityRuns.map((r, i) => i === item.index ? done : r) }
    }
    const saved = recordLearningProgress(progress, session, { visit: false })
    expect(saved.completed).toEqual({ [item.id]: 'independent' })
    expect(saved.lastVisited).toBe('rules/ko')
    expect(parseLearningProgress(JSON.stringify(saved))).toEqual(saved)
    expect(LEARNING_UNITS).toHaveLength(39)
    expect(LEARNING_UNITS.some((unit) => unit.id === item.id)).toBe(false)
    const reopened = openPracticeItem({ ...session, progress: saved }, item)
    expect(reopened.page).toBe(oldPage)
    expect(reopened.progress).toBe(saved)
    if (item.source === 'ladder-defense') expect(reopened.ladderDefenseRuns[item.index].selected).toBeNull()
    expect(recordLearningProgress(saved, reopened, { visit: false })).toBe(saved)
  })
  it('先后判断须解释后才记录，提示优先于重试，独立重做升级且不降级', () => {
    const session = createLearningSession()
    const run = session.priorityRuns[0]
    const id = `practice/${run.scene.id}`
    const pending = confirmPriority(choosePriority(run, run.scene.answer))
    expect(recordLearningProgress(session.progress, { ...session, priorityRuns: [pending] }, { visit: false }).completed).toEqual({})
    const solve = (value: typeof run) => answerPriority(confirmPriority(choosePriority(value, value.scene.answer)), value.scene.reasonAnswer)
    const wrong = confirmPriority(choosePriority(run, 1))
    const record = (value: typeof run) => recordLearningProgress(session.progress, { ...session, priorityRuns: [solve(value)] }, { visit: false })
    expect(record(wrong).completed[id]).toBe('retry')
    expect(record(priorityHint(wrong)).completed[id]).toBe('hint')
    const independent = record(run)
    expect(recordLearningProgress(independent, { ...session, priorityRuns: [solve(wrong)] }, { visit: false })).toBe(independent)
    expect(continueLearningUnit(independent)).toBeUndefined()
  })
  it('十道旧题全完成后，新题仍可推荐；新记录不影响课程全完成判断', () => {
    const old = PRACTICE_ITEMS.filter((item) => !item.id.startsWith('practice/'))
    const progress = { ...emptyLearningProgress(), completed: Object.fromEntries(old.map((item) => [item.id, 'independent' as const])) }
    expect(nextPracticeItem(progress)?.id.startsWith('practice/')).toBe(true)
    const parsed = parseLearningProgress(JSON.stringify(progress))!
    expect(parsed).toEqual(progress)
    expect(restoreLearningSession(parsed).practiceDangerRuns[0].stage).toBe('group')
  })
})
