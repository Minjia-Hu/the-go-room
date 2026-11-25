import { getGroup } from '../../engine'
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

export function survivalSteps(run: SurvivalRun): SurvivalStep {
  const { scene } = run
  const compareRescues = scene.kind === 'escape' && scene.guided
  const total = scene.kind === 'eyes' ? 3 : scene.kind === 'danger' || compareRescues ? 2 : 1
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
  const progress = compareRescues && run.solved.length > 0
    ? `已比较 ${run.solved.length} / ${scene.examples.length} 种` : undefined
  return { current: progress ? 2 : 1, total, label: '选点试下',
    task: progress ? '回到原来的局面，试试另一种救法。'
      : compareRescues ? '从同一个局面试两种救法。先点一个空点，救出中央的黑棋。'
      : scene.kind === 'connect' ? '下一颗黑棋，把两块黑棋连起来。' : '点一个空点，救出危险的黑棋。', progress, done: false }
}
