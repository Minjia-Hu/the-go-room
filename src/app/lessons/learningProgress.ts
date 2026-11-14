import { LESSONS } from '../../content/lessons'
import { SURVIVAL_SCENES } from '../../content/survival'
import { ENDGAME_LESSONS, RULE_SEQUENCE_SCENES } from '../../content/endgame'
import { STRATEGY_LESSONS } from '../../content/strategy'
import { INDEPENDENT_SCENES } from '../../content/independent'
import { WALK_MOVES, WALK_QUESTIONS } from '../../content/walkthrough'
import type { LearningSession } from './learningSession'
import { isLessonDone } from './lessonRunner'

export const LEARNING_KEY = 'the-go-room.learning.v1'
export type Completion = 'guided' | 'independent' | 'retry' | 'hint' | 'demo'
export const COMPLETION_LABELS: Record<Completion, string> = {
  guided: '跟着引导完成', independent: '独立完成', retry: '重试后完成', hint: '借助提示完成', demo: '跟着演示完成',
}
export interface LearningUnit {
  readonly id: string
  readonly page: Exclude<LearningSession['page'], 'home'>
  readonly index: number
  readonly title: string
}
/** 持久化使用带章节前缀的稳定 ID，不保存数组位置、棋盘或答案。 */
export const LEARNING_UNITS: readonly LearningUnit[] = [
  ...LESSONS.map((lesson, index) => ({ id: `rules/${lesson.id}`, page: 'rules' as const, index, title: lesson.title })),
  ...RULE_SEQUENCE_SCENES.map((scene, index) => ({ id: `rule-sequence/${scene.id}`, page: 'rule-sequence' as const, index, title: scene.title })),
  ...SURVIVAL_SCENES.map((scene, index) => ({ id: `survival/${scene.id}`, page: 'survival' as const, index, title: `生存练习 ${scene.course} · ${scene.guided ? '一起练习' : '自己试试'}：${scene.title}` })),
  ...ENDGAME_LESSONS.map((lesson, index) => ({ id: `endgame/${lesson.id}`, page: 'endgame' as const, index, title: lesson.title })),
  ...STRATEGY_LESSONS.map((lesson, index) => ({ id: `strategy/${lesson.id}`, page: 'strategy' as const, index, title: lesson.title })),
  { id: 'walkthrough/full-game', page: 'walkthrough', index: 0, title: '一盘九路，从头到尾' },
  ...INDEPENDENT_SCENES.map((scene, index) => ({ id: `independent/${scene.id}`, page: 'independent' as const, index, title: `独立练习 · 第 ${index + 1} 题` })),
]
export interface LearningProgress {
  readonly version: 1
  readonly completed: Readonly<Record<string, Completion>>
  readonly lastVisited: string | null
}
export function emptyLearningProgress(): LearningProgress { return { version: 1, completed: {}, lastVisited: null } }
export function currentLearningUnit(session: LearningSession): LearningUnit | undefined {
  const index = session.page === 'rules' ? session.rules.index : session.page === 'survival' ? session.sceneIndex
    : session.page === 'rule-sequence' ? session.sequence.sceneIndex : session.page === 'endgame' ? session.endgameIndex
      : session.page === 'strategy' ? session.strategyIndex : session.page === 'independent' ? session.independentIndex : 0
  return LEARNING_UNITS.find((unit) => unit.page === session.page && unit.index === index)
}
const RANK: Record<Completion, number> = { demo: 0, hint: 1, guided: 2, retry: 2, independent: 3 }

/** 只记录已达到课程完成条件的结果；跳过与重做都不会抹去以前的最好记录。 */
export function recordLearningProgress(progress: LearningProgress, session: LearningSession, options: { readonly visit?: boolean } = {}): LearningProgress {
  let completed = progress.completed
  function record(id: string, mode: Completion) {
    if (completed[id] === undefined || RANK[mode] > RANK[completed[id]]) completed = { ...completed, [id]: mode }
  }
  if (isLessonDone(session.rules.run)) record(`rules/${session.rules.run.lesson.id}`, 'guided')
  session.sequence.solved.forEach((index) => record(`rule-sequence/${RULE_SEQUENCE_SCENES[index].id}`, 'guided'))
  session.runs.forEach((run) => {
    if (run.stage === 'done') record(`survival/${run.scene.id}`, run.assisted ? 'demo'
      : run.hint > (run.scene.guided ? 1 : 0) ? 'hint' : run.scene.guided ? 'guided' : 'independent')
  })
  session.endgameRuns.forEach((run) => { if (run.done) record(`endgame/${run.lesson.id}`, run.assisted ? 'hint' : 'guided') })
  session.strategyRuns.forEach((run) => { if (run.done) record(`strategy/${run.lesson.id}`, 'guided') })
  if (session.walk.furthest === WALK_MOVES.length && WALK_QUESTIONS.every((question) => session.walk.answered.includes(question.step))) record('walkthrough/full-game', 'guided')
  session.independentRuns.forEach((run) => {
    if (run.stage === 'done') record(`independent/${run.scene.id}`, run.help > 0 ? 'hint' : run.mistakes > 0 ? 'retry' : 'independent')
  })
  const lastVisited = options.visit === false ? progress.lastVisited : currentLearningUnit(session)?.id ?? progress.lastVisited
  return completed === progress.completed && lastVisited === progress.lastVisited ? progress : { version: 1, completed, lastVisited }
}

/** 未完成则回到该题；已完成则从后面寻找下一道未完成题，全部完成后回看最近一课。 */
export function continueLearningUnit(progress: LearningProgress): LearningUnit | undefined {
  const last = LEARNING_UNITS.findIndex((unit) => unit.id === progress.lastVisited)
  if (last < 0) return Object.keys(progress.completed).length ? LEARNING_UNITS.find((unit) => !progress.completed[unit.id]) : undefined
  if (!progress.completed[LEARNING_UNITS[last].id]) return LEARNING_UNITS[last]
  const ordered = [...LEARNING_UNITS.slice(last + 1), ...LEARNING_UNITS.slice(0, last)]
  return ordered.find((unit) => !progress.completed[unit.id]) ?? LEARNING_UNITS[last]
}

function object(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value) }
export function parseLearningProgress(raw: string): LearningProgress | null {
  try {
    if (raw.length > 50000) return null
    const value: unknown = JSON.parse(raw)
    if (!object(value) || value.version !== 1 || !object(value.completed)
      || (value.lastVisited !== null && typeof value.lastVisited !== 'string')) return null
    const completed: Record<string, Completion> = {}
    for (const unit of LEARNING_UNITS) {
      const mode = value.completed[unit.id]
      if (mode === undefined) continue
      if (typeof mode !== 'string' || !Object.hasOwn(COMPLETION_LABELS, mode)) return null
      completed[unit.id] = mode as Completion
    }
    return { version: 1, completed, lastVisited: LEARNING_UNITS.some((unit) => unit.id === value.lastVisited) ? value.lastVisited as string : null }
  } catch { return null }
}
interface LearningStorage { getItem(key: string): string | null; setItem(key: string, value: string): void }
export function readLearningProgress(storage: LearningStorage): { progress: LearningProgress; message: string | null } {
  try {
    const raw = storage.getItem(LEARNING_KEY)
    if (raw === null) return { progress: emptyLearningProgress(), message: null }
    const progress = parseLearningProgress(raw)
    if (progress) return { progress, message: null }
    return { progress: emptyLearningProgress(), message: '学习记录格式不兼容或已损坏，暂时从头开始；仍可正常学习。' }
  } catch {
    return { progress: emptyLearningProgress(), message: '无法读取此浏览器的学习记录，本次仍可正常学习。' }
  }
}
export function writeLearningProgress(storage: LearningStorage, progress: LearningProgress): boolean {
  try { storage.setItem(LEARNING_KEY, JSON.stringify(progress)); return true } catch { return false }
}
