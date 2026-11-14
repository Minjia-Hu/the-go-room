import { describe, expect, it } from 'vitest'
import { SURVIVAL_SCENES } from '../../content/survival'
import { INDEPENDENT_SCENES } from '../../content/independent'
import { createLearningSession, restoreLearningSession } from './learningSession'
import { emptyLearningProgress, LEARNING_UNITS, recordLearningProgress } from './learningProgress'
import type { Completion } from './learningProgress'
import { PRACTICE_GROUPS, PRACTICE_ITEMS, nextPracticeItem, openPracticeItem } from './practiceCatalog'
import { choosePracticePoint } from './survivalRunner'

const allIndependent = Object.fromEntries(PRACTICE_ITEMS.map((item) => [item.id, 'independent' as Completion]))
describe('practice catalog', () => {
  it('keeps ten course exercises and adds twelve practice-only scenes, in six groups', () => {
    expect(PRACTICE_ITEMS).toHaveLength(22)
    expect(new Set(PRACTICE_ITEMS.map((item) => item.id)).size).toBe(22)
    expect(PRACTICE_GROUPS.map((group) => PRACTICE_ITEMS.filter((item) => item.group === group).length)).toEqual([3, 5, 4, 5, 1, 4])
    for (const item of PRACTICE_ITEMS.filter((item) => item.source === 'survival' || item.source === 'independent')) {
      expect(LEARNING_UNITS.find((unit) => unit.id === item.id)).toMatchObject({ page: item.source, index: item.index })
      const scene = item.source === 'survival' ? SURVIVAL_SCENES[item.index] : INDEPENDENT_SCENES[item.index]
      expect(item.id).toBe(`${item.source}/${scene.id}`)
      if (item.source === 'survival') expect(SURVIVAL_SCENES[item.index].guided).toBe(false)
      expect(LEARNING_UNITS).toContain(item.related)
    }
  })
  it('links capture rescue to the lesson that compares capture and extension', () => {
    expect(PRACTICE_ITEMS.filter((item) => item.group === '提子').map((item) => item.related.id)).toEqual(Array(4).fill('survival/escape-guided'))
  })
  it('skips independent completions, wraps, and still recommends assisted attempts', () => {
    const progress = { ...emptyLearningProgress(), completed: allIndependent }
    expect(nextPracticeItem(progress)).toBeUndefined()
    for (const mode of ['hint', 'retry', 'demo'] as const) {
      const partial = { ...progress, completed: { ...allIndependent, [PRACTICE_ITEMS[0].id]: mode } }
      expect(nextPracticeItem(partial, PRACTICE_ITEMS[9].id)).toBe(PRACTICE_ITEMS[0])
      expect(nextPracticeItem(partial, PRACTICE_ITEMS[0].id)).toBe(PRACTICE_ITEMS[0])
    }
    expect(nextPracticeItem(emptyLearningProgress(), PRACTICE_ITEMS[0].id)).toBe(PRACTICE_ITEMS[1])
    expect(nextPracticeItem(emptyLearningProgress(), 'unknown')).toBe(PRACTICE_ITEMS[0])
  })
  it('preserves unfinished attempts and resets only the completed run', () => {
    const item = PRACTICE_ITEMS[0]
    let session = createLearningSession()
    const run = choosePracticePoint(session.runs[item.index], { x: 0, y: 3 })
    session = { ...session, runs: session.runs.map((old, index) => index === item.index ? run : old) }
    expect(openPracticeItem(session, item)).toBe(session)
    session = { ...session, runs: session.runs.map((old, index) => index === item.index ? choosePracticePoint(old, { x: 0, y: 5 }) : old) }
    const reopened = openPracticeItem(session, item)
    expect(reopened.runs[item.index].stage).toBe('group')
    expect(reopened.runs[0]).toBe(session.runs[0])
    expect(reopened.page).toBe(session.page)
    expect(reopened.progress).toBe(session.progress)
  })
  it('does not move lastVisited even when restore selected a different next lesson', () => {
    const progress = { ...emptyLearningProgress(), completed: { 'rules/place': 'guided' as const }, lastVisited: 'rules/place' }
    const session = restoreLearningSession(progress)
    expect(session.rules.index).toBe(1)
    expect(recordLearningProgress(progress, session, { visit: false })).toBe(progress)
    expect(recordLearningProgress(progress, session).lastVisited).toBe('rules/liberties')
  })
})
