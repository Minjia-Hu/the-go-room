import { SURVIVAL_SCENES } from '../../content/survival'
import { INDEPENDENT_SCENES } from '../../content/independent'
import { LEARNING_UNITS } from './learningProgress'
import type { LearningProgress, LearningUnit } from './learningProgress'
import type { LearningSession } from './learningSession'
import { startSurvival } from './survivalRunner'
import { startIndependent } from './independentRunner'

export const PRACTICE_GROUPS = ['认危险', '找出路', '提子', '连接', '两只眼'] as const
export interface PracticeItem {
  readonly id: string
  readonly group: typeof PRACTICE_GROUPS[number]
  readonly source: 'survival' | 'independent'
  readonly index: number
  readonly title: string
  readonly relatedTitle: string
  readonly related: LearningUnit
}
function related(id: string): LearningUnit {
  const unit = LEARNING_UNITS.find((item) => item.id === `survival/${id}-guided`)
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
]
export const PRACTICE_ITEMS: readonly PracticeItem[] = PRACTICE_GROUPS.flatMap((group) => items.filter((item) => item.group === group).map((item) => ({ ...item, relatedTitle: SURVIVAL_SCENES[item.related.index].title })))

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
  if (session.independentRuns[item.index].stage !== 'done') return session
  return { ...session, independentRuns: session.independentRuns.map((run, index) => index === item.index ? startIndependent(run.scene) : run) }
}
