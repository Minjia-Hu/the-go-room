import type { Completion } from './learningProgress'
import { createGame, getGroup, parseBoard, play, samePoint } from '../../engine'
import type { GameState, Point } from '../../engine'
import type { SurvivalScene } from '../../content/survivalTypes'
import { analyzeAction } from '../coaching/analysis'
import type { ActionAnalysis } from '../coaching/analysis'
import { targetSurvives } from '../coaching/suggestions'
import { explainAction } from '../coaching/explanations'

export interface SurvivalRun {
  readonly scene: SurvivalScene
  readonly game: GameState
  readonly selected: readonly Point[]
  readonly stage: 'group' | 'liberty' | 'move' | 'eyes' | 'reason' | 'done'
  readonly hint: number
  readonly assisted: boolean
  readonly mistakes: number
  readonly solved: readonly Point[]
  readonly preview: ActionAnalysis | null
  readonly view: 'before' | 'after' | 'reply' | 'contrast-before' | 'contrast'
  readonly message: string | null
}

export function startSurvival(scene: SurvivalScene): SurvivalRun {
  return { scene, game: createGame({ board: parseBoard(scene.rows), toPlay: scene.kind === 'eyes' ? 'white' : 'black' }), selected: [],
    stage: scene.kind === 'danger' ? 'group' : scene.kind === 'eyes' ? 'eyes' : 'move', hint: scene.guided ? 1 : 0,
    assisted: false, mistakes: 0, solved: [], preview: null, view: 'before', message: null }
}

export function choosePracticePoint(run: SurvivalRun, p: Point): SurvivalRun {
  if (run.stage === 'done' || run.stage === 'reason') return run
  if (run.stage === 'group') {
    const group = getGroup(run.game.board, run.scene.target)!
    const message = run.scene.id === 'danger-guided'
      ? '找到了。它的三面都被白棋堵住了。'
      : group.stones.length === 1
        ? '找到了。现在点出这颗黑棋最后一口气。'
        : '找到了。现在点出这整块棋最后的一口气。斜着的空点不算。'
    return group.stones.some((s) => samePoint(s, p))
      ? { ...run, selected: group.stones, stage: 'liberty', message }
      : { ...run, mistakes: run.mistakes + 1, message: '再看看哪块黑棋只剩一个上下左右紧挨着的空点。请点那块棋。' }
  }
  if (run.stage === 'liberty') {
    const group = getGroup(run.game.board, run.scene.target)!
    if (group.liberties.some((s) => samePoint(s, p))) {
      const message = group.stones.length === 1
        ? '这颗黑棋只剩 A 这一口气。白棋下在 A，就能把它提走。'
        : `这 ${group.stones.length} 颗黑棋连在一起，共用 A 这一口气。白棋占住 A，整块就被提走。下面看看两种选择的后果。`
      return { ...run, selected: [...group.stones, p], stage: 'done', message }
    }
    const diagonal = run.scene.id === 'danger-guided'
      && Math.abs(p.x - run.scene.target.x) === 1 && Math.abs(p.y - run.scene.target.y) === 1
    return { ...run, mistakes: run.mistakes + 1, message: diagonal
      ? '你点的是斜角。沿这颗黑棋的上、下、左、右，再找一个空点。'
      : group.stones.length === 1
        ? '这里不是它最后的气。找找上下左右紧挨着这颗黑棋的空点。'
        : '这里不是它最后的气。气必须是上下左右紧挨着整块棋的空点。' }
  }
  if (run.stage === 'eyes') {
    if (!run.scene.eyes?.some((s) => samePoint(s, p))) return { ...run, mistakes: run.mistakes + 1, message: '找同一块黑棋围住的内部空点；外面的空点和黑棋本身不算眼。' }
    const result = play(run.game, p)
    if (result.ok) throw new Error('两眼课的固定棋形不符合预期')
    const selected = run.selected.some((s) => samePoint(s, p)) ? run.selected : [...run.selected, p]
    return { ...run, selected, stage: selected.length === 2 ? 'reason' : 'eyes', message: '白棋下不进去：它自己没有气，又提不掉还留着另一口气的黑棋。每次试下都从原图开始。' }
  }
  const preview = analyzeAction(run.game, p)
  return { ...run, preview, mistakes: run.mistakes + (preview.ok ? 0 : 1), view: preview.ok ? 'after' : 'before', message: explainAction(preview) }
}

export function confirmPractice(run: SurvivalRun): SurvivalRun {
  const a = run.preview
  if (run.stage !== 'move' || !a?.ok || !a.point) return run
  const targets = getGroup(run.game.board, run.scene.target)!.stones
  if (!targetSurvives(a.after, targets)) {
    return { ...run, mistakes: run.mistakes + 1, message: `这一步可以下，但还没有解决本题的危险。${explainAction(a)}你可以看白棋怎样提，再重新选点。` }
  }
  if (run.scene.kind === 'connect' && a.connected < 2) return { ...run, mistakes: run.mistakes + 1, message: '这一步暂时解除了危险，但本题要练习把两块黑棋连起来。请再找一个能连接的点。' }
  const solved = run.solved.some((p) => samePoint(p, a.point!)) ? run.solved : [...run.solved, a.point]
  const complete = !run.scene.guided || run.scene.kind !== 'escape' || run.scene.examples.every((p) => solved.some((s) => samePoint(p, s)))
  return { ...run, solved, stage: complete ? 'done' : 'move', message: `这一步暂时救出了原来的黑棋。${explainAction(a)}${complete ? '' : '再从同一起点试另一种方法：延伸或提掉白棋。'}` }
}

export function chooseReason(run: SurvivalRun, correct: boolean): SurvivalRun {
  if (run.stage !== 'reason') return run
  return correct ? { ...run, stage: 'done', message: '对。白棋一次只能填一处，黑棋还有另一口气，白棋自己却没气。这里是同一完整棋块围住的两个真眼；不能把任意两个空点都当作两眼。' }
    : { ...run, mistakes: run.mistakes + 1, message: '不是棋子多就安全。想想：白棋试着填一个眼时，黑棋还有没有另一口气？' }
}

export function practiceHint(run: SurvivalRun): SurvivalRun {
  const hint = Math.min(3, run.hint + 1)
  let next: SurvivalRun = { ...run, hint, assisted: run.assisted || hint === 3, message: run.scene.hints[hint - 1] }
  if (hint !== 3) return next
  if (run.scene.kind === 'danger') {
    next = { ...next, stage: 'group' }
    next = choosePracticePoint(next, run.scene.target)
    return choosePracticePoint(next, getGroup(run.game.board, run.scene.target)!.liberties[0])
  }
  if (run.scene.kind === 'eyes') {
    for (const p of run.scene.eyes!) next = choosePracticePoint(next, p)
    return next
  }
  for (const p of run.scene.examples) next = confirmPractice(choosePracticePoint(next, p))
  return next
}

export function practiceBoard(run: SurvivalRun): GameState {
  if ((run.view === 'contrast' || run.view === 'contrast-before') && run.scene.contrastRows) {
    const start = createGame({ board: parseBoard(run.scene.contrastRows), toPlay: 'white' })
    if (run.view === 'contrast-before') return start
    const result = play(start, run.scene.eyes![0])
    return result.ok ? result.state : start
  }
  if (!run.preview?.ok || run.view === 'before') return run.game
  if (run.view === 'reply') return run.preview.dangers[0]?.capture?.after ?? run.preview.after
  return run.preview.after
}

/** 统一页面和学习记录的完成方式。引导题开场自带的提示不计入辅助。 */
export function survivalCompletion(run: SurvivalRun): Completion {
  if (run.assisted) return 'demo'
  if (run.hint > (run.scene.guided ? 1 : 0)) return 'hint'
  if (run.scene.guided) return 'guided'
  return run.mistakes > 0 ? 'retry' : 'independent'
}
