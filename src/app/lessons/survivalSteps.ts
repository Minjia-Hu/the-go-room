import { getGroup, samePoint } from '../../engine'
import { SURVIVAL_SCENES } from '../../content/survival'
import { COMPLETION_LABELS } from './learningProgress'
import { survivalCompletion } from './survivalRunner'
import type { SurvivalRun } from './survivalRunner'

/** 生存课当前处在第几步。只从现有状态推导，不改变状态机。 */
export interface SurvivalStep {
  readonly current: number
  readonly total: number
  readonly label: string
  readonly task?: string
  readonly progress?: string
  readonly done: boolean
}

const TOTAL = { danger: 2, escape: 2, connect: 2, eyes: 3 } as const

/** 试下合法、且这个点还没被确认为本题解法时，才需要“确认这一步”。 */
export function awaitingConfirm(run: SurvivalRun): boolean {
  const point = run.preview?.ok ? run.preview.point : null
  return run.stage === 'move' && !!point && !run.solved.some((p) => samePoint(p, point))
}

export function survivalSteps(run: SurvivalRun): SurvivalStep {
  const { scene } = run
  const total = TOTAL[scene.kind]
  if (run.stage === 'done') {
    const mode = survivalCompletion(run)
    const task = mode === 'demo' ? '可以重来一次，自己找答案。' : mode === 'hint' ? '可以重来一次，不看提示试试。' : undefined
    return { current: total, total, label: COMPLETION_LABELS[mode], task, done: true }
  }
  if (scene.kind === 'danger') {
    if (run.stage === 'group') return { current: 1, total, label: '找棋', task: '点出你觉得有危险的一块黑棋。', done: false }
    const single = getGroup(run.game.board, scene.target)!.stones.length === 1
    return { current: 2, total, label: '找气', task: single ? '点出这颗黑棋最后的一口气。' : '点出这整块黑棋最后的一口气。', done: false }
  }
  if (scene.kind === 'eyes') {
    if (run.stage === 'reason') return { current: 3, total, label: '说出原因', task: '为什么白棋下不进这两个眼？', done: false }
    return run.selected.length === 0
      ? { current: 1, total, label: '试第一个眼', task: '替白棋点一个黑棋围住的内部空点，看看能不能下。', done: false }
      : { current: 2, total, label: '试第二个眼', task: '再点另一个内部空点试试。', done: false }
  }
  const progress = scene.kind === 'escape' && scene.guided && run.solved.length > 0
    ? `已比较 ${run.solved.length} / ${scene.examples.length} 种` : undefined
  if (awaitingConfirm(run)) return { current: 2, total, label: '看后果，再确认', task: '比较下之前和下之后，能解除危险就确认这一步。', progress, done: false }
  return { current: 1, total, label: '选点试下',
    task: progress ? '从同一起点再试另一种办法：延伸，或提掉白棋。' : '点一个空点试下，看看目标黑棋的气会怎样变化。', progress, done: false }
}

/** 课程中完成一题后主按钮的文案；最后一题返回 undefined，由页面显示终局与陪练两个去向。 */
export function survivalNextLabel(index: number): string | undefined {
  const scene = SURVIVAL_SCENES[index]
  const next = SURVIVAL_SCENES[index + 1]
  if (!scene || !next) return undefined
  return scene.guided ? '换个局面，自己试试 →' : `下一课 · ${next.title} →`
}
