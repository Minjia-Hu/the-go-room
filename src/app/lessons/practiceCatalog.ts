import { LADDER_DEFENSE_SCENES } from '../../content/ladderDefense'
import { CAPTURE_SCENES } from '../../content/capture'
import { startLadderDefense } from './ladderDefenseRunner'
import { PRACTICE_DANGER_SCENES, PRACTICE_RESCUE_SCENES, PRIORITY_SCENES } from '../../content/practiceExtras'
import { startPriority } from './priorityRunner'
import { SURVIVAL_SCENES } from '../../content/survival'
import { INDEPENDENT_SCENES } from '../../content/independent'
import { LEARNING_UNITS } from './learningProgress'
import type { LearningProgress, LearningUnit } from './learningProgress'
import type { LearningSession } from './learningSession'
import { startSurvival } from './survivalRunner'
import { startIndependent } from './independentRunner'

export const PRACTICE_GROUPS = ['认危险', '找出路', '提子', '连接', '两只眼', '先后判断', '别被吃'] as const
export interface PracticeItem {
  readonly id: string
  readonly group: typeof PRACTICE_GROUPS[number]
  readonly source: 'survival' | 'independent' | 'danger' | 'rescue' | 'priority' | 'ladder-defense'
  readonly index: number
  readonly title: string
  readonly relatedTitle: string
  readonly related: LearningUnit
}
function related(id: string): LearningUnit {
  const unit = LEARNING_UNITS.find((item) => item.id === (id.includes('/') ? id : `survival/${id}-guided`))
  if (!unit) throw new Error(`Missing practice explanation: ${id}`)
  return unit
}
const survivalGroups = { danger: '认危险', escape: '找出路', connect: '连接', eyes: '两只眼' } as const
const independentGroups = { extend: '找出路', capture: '提子', connect: '连接' } as const
const independentTitles = { extend: '延伸', capture: '提子', connect: '连接' } as const
const items: Omit<PracticeItem, 'relatedTitle'>[] = [
  ...SURVIVAL_SCENES.flatMap((scene, index) => scene.guided ? [] : [{
    id: `survival/${scene.id}`, group: survivalGroups[scene.kind], source: 'survival' as const,
    index, title: scene.title, related: related(scene.kind),
  }]),
  ...INDEPENDENT_SCENES.map((scene, index) => ({
    id: `independent/${scene.id}`, group: independentGroups[scene.kind], source: 'independent' as const,
    index, title: `${independentTitles[scene.kind]} · 第 ${INDEPENDENT_SCENES.slice(0, index + 1).filter((other) => other.kind === scene.kind).length} 题`,
    // 这两题练的是提子救棋；找出路一课实际比较了延伸与提子两种救法。
    related: related(scene.kind === 'connect' ? 'connect' : 'escape'),
  })),
  ...PRACTICE_DANGER_SCENES.map((scene, index) => ({ id: `practice/${scene.id}`, group: '认危险' as const, source: 'danger' as const, index, title: scene.title, related: related('danger') })),
  ...PRACTICE_RESCUE_SCENES.map((scene, index) => ({ id: `practice/${scene.id}`, group: independentGroups[scene.kind], source: 'rescue' as const, index, title: scene.title, related: related(scene.kind === 'connect' ? 'connect' : 'escape') })),
  ...PRIORITY_SCENES.map((scene, index) => ({ id: `practice/${scene.id}`, group: '先后判断' as const, source: 'priority' as const, index, title: scene.title, related: related(scene.related) })),
  ...LADDER_DEFENSE_SCENES.map((scene, index) => ({
    id: `practice/${scene.id}`, group: '别被吃' as const, source: 'ladder-defense' as const,
    index, title: scene.title, related: related('capture/ladder-guided'),
  })),
]
export const PRACTICE_ITEMS: readonly PracticeItem[] = PRACTICE_GROUPS.flatMap((group) => items.filter((item) => item.group === group).map((item) => ({ ...item, relatedTitle: item.related.page === 'survival' ? SURVIVAL_SCENES[item.related.index].title : item.related.page === 'capture' ? CAPTURE_SCENES[item.related.index].title : item.related.title })))

/** 从当前题之后循环寻找；用过帮助的题仍值得再练。 */
export function nextPracticeItem(progress: LearningProgress, afterId?: string): PracticeItem | undefined {
  const after = PRACTICE_ITEMS.findIndex((item) => item.id === afterId)
  const ordered = [...PRACTICE_ITEMS.slice(after + 1), ...PRACTICE_ITEMS.slice(0, after + 1)]
  return ordered.find((item) => progress.completed[item.id] !== 'independent')
}

/** 只重新开始已做完的 run，保留未完成尝试、课程位置和最好记录。 */
export function openPracticeItem(session: LearningSession, item: PracticeItem): LearningSession {
  if (item.source === 'survival') {
    if (session.runs[item.index].stage !== 'done') return session
    return { ...session, runs: session.runs.map((run, index) => index === item.index ? startSurvival(run.scene) : run) }
  }
  if (item.source === 'danger') {
    if (session.practiceDangerRuns[item.index].stage !== 'done') return session
    return { ...session, practiceDangerRuns: session.practiceDangerRuns.map((run, index) => index === item.index ? startSurvival(run.scene) : run) }
  }
  if (item.source === 'rescue') {
    if (session.practiceRescueRuns[item.index].stage !== 'done') return session
    return { ...session, practiceRescueRuns: session.practiceRescueRuns.map((run, index) => index === item.index ? startIndependent(run.scene) : run) }
  }
  if (item.source === 'ladder-defense') {
    const current = session.ladderDefenseRuns[item.index]
    if (current.stage !== 'done') return session
    return { ...session, ladderDefenseRuns: session.ladderDefenseRuns.map((run, index) => index === item.index ? startLadderDefense(run.scene) : run) }
  }
  if (item.source === 'priority') {
    if (session.priorityRuns[item.index].stage !== 'done') return session
    return { ...session, priorityRuns: session.priorityRuns.map((run, index) => index === item.index ? startPriority(run.scene) : run) }
  }
  if (session.independentRuns[item.index].stage !== 'done') return session
  return { ...session, independentRuns: session.independentRuns.map((run, index) => index === item.index ? startIndependent(run.scene) : run) }
}
