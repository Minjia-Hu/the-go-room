import { createGame, getGroup, parseBoard, play } from '../../engine'
import type { GameState } from '../../engine'
import type { PriorityScene } from '../../content/practiceExtras'
import type { BoardMark } from '../board/marks'

export interface PriorityRun {
  readonly scene: PriorityScene
  readonly game: GameState
  readonly selected: number | null
  readonly stage: 'choose' | 'reason' | 'done'
  readonly view: 'before' | 'after' | 'reply'
  readonly help: number
  readonly mistakes: number
  readonly message: string | null
}
export function startPriority(scene: PriorityScene): PriorityRun {
  return { scene, game: createGame({ board: parseBoard(scene.rows) }), selected: null, stage: 'choose', view: 'before', help: 0, mistakes: 0, message: null }
}
/** 每次比较都从题目原图重放，两个选择不串成一盘。 */
export function priorityVariation(run: PriorityRun, index: number) {
  const choice = run.scene.choices[index]
  if (!choice) return null
  const first = play(run.game, choice.point)
  if (!first.ok) throw new Error(`Invalid priority trial: ${run.scene.id}`)
  const response = play(first.state, choice.reply)
  if (!response.ok) throw new Error(`Invalid priority reply: ${run.scene.id}`)
  return { after: first.state, reply: response.state }
}
export function choosePriority(run: PriorityRun, index: number): PriorityRun {
  if (run.stage !== 'choose' || !run.scene.choices[index]) return run
  const trial = priorityVariation(run, index)!
  const group = getGroup(trial.after.board, run.scene.target)
  const move = trial.after.history.at(-1)!
  const captured = move.kind === 'play' ? move.captured.length : 0
  return { ...run, selected: index, view: 'after', message: `试下后目标黑块有 ${group?.liberties.length ?? 0} 口气，提掉白棋 ${captured} 颗。你决定这样下吗？` }
}
export function confirmPriority(run: PriorityRun): PriorityRun {
  if (run.stage !== 'choose' || run.selected === null || run.view !== 'after') return run
  const correct = run.selected === run.scene.answer
  return { ...run, stage: correct ? 'reason' : 'choose', view: 'reply', mistakes: run.mistakes + (correct ? 0 : 1),
    message: `${run.scene.choices[run.selected].feedback}${correct ? '再选出这样下的原因。' : '可以回看黑棋这一手，再试另一个选择。'}` }
}
export function answerPriority(run: PriorityRun, index: number): PriorityRun {
  if (run.stage !== 'reason' || !run.scene.reasons[index]) return run
  if (index !== run.scene.reasonAnswer) return { ...run, mistakes: run.mistakes + 1, message: '再对照棋盘：这一手有没有给目标黑块增加气？白棋能否下一手把它提走？吃过子、接出过，都不等于永远安全或已经赢棋。' }
  return { ...run, stage: 'done', message: `对。${run.scene.takeaway}` }
}
export function priorityHint(run: PriorityRun): PriorityRun {
  if (run.stage === 'done') return run
  return { ...run, help: run.help + 1, message: run.scene.hint }
}
export function priorityView(run: PriorityRun) {
  const trial = run.selected === null ? null : priorityVariation(run, run.selected)
  const game = trial && run.view !== 'before' ? trial[run.view] : run.game
  const marks: BoardMark[] = []
  const target = getGroup(game.board, run.scene.target)
  if (run.help > 0 || run.selected !== null) {
    target?.stones.forEach((point) => marks.push({ point, kind: 'target' }))
    target?.liberties.forEach((point) => marks.push({ point, kind: 'liberty' }))
  }
  if (run.view === 'before') run.scene.choices.forEach((choice, index) => marks.push({ point: choice.point, kind: 'label', text: String.fromCharCode(65 + index) }))
  const last = game.history.at(-1)
  if (last?.kind === 'play') {
    marks.push({ point: last.point, kind: 'preview' })
    last.captured.forEach((point) => marks.push({ point, kind: 'captured' }))
  }
  return { game, marks }
}
