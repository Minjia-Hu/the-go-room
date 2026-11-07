import { createGame, getCell, getGroup, parseBoard, play, samePoint } from '../../engine'
import type { GameState, Point } from '../../engine'
import { STRATEGY_LESSONS } from '../../content/strategy'
import type { StrategyChoice, StrategyLesson } from '../../content/strategy'
import type { BoardMark } from '../board/marks'

export interface StrategyRun {
  readonly lesson: StrategyLesson
  readonly choiceIndex: number | null
  readonly step: number
  readonly seen: readonly number[]
  readonly done: boolean
  readonly message: string | null
}
export function startStrategy(lesson: StrategyLesson): StrategyRun {
  return { lesson, choiceIndex: null, step: 0, seen: [], done: false, message: null }
}
export function createStrategyRuns(): readonly StrategyRun[] { return STRATEGY_LESSONS.map(startStrategy) }

/** 只重放固定教学变化；这些预设局面不会交给正式棋谱存储。 */
export function strategyPositions(choice: StrategyChoice): readonly GameState[] {
  const positions = [createGame({ board: parseBoard(choice.rows) })]
  for (const move of choice.moves) {
    const result = play(positions.at(-1)!, move.point)
    if (!result.ok) throw new Error(`Invalid strategy example ${choice.id}: ${result.reason}`)
    positions.push(result.state)
  }
  return positions
}
export function chooseStrategy(run: StrategyRun, choiceIndex: number): StrategyRun {
  if (!Number.isInteger(choiceIndex) || !run.lesson.choices[choiceIndex]) return run
  return { ...run, choiceIndex, step: 1, message: null }
}
export function strategyStep(run: StrategyRun, requested: number): StrategyRun {
  if (run.choiceIndex === null || !Number.isInteger(requested)) return run
  const last = run.lesson.choices[run.choiceIndex].moves.length
  const step = Math.max(0, Math.min(last, requested))
  return { ...run, step, message: null, seen: step === last ? [...new Set([...run.seen, run.choiceIndex])] : run.seen }
}
export function strategyPoint(run: StrategyRun, point: Point): StrategyRun {
  if (run.choiceIndex !== null && run.step > 0) return run
  const choices = run.lesson.choices
  // 角、边、中腹是独立棋形，棋盘上只响应当前图的缺口。
  const index = run.lesson.id === 'edges' ? run.choiceIndex ?? 0 : choices.findIndex((choice) => samePoint(choice.moves[0].point, point))
  if (index < 0 || !samePoint(choices[index].moves[0].point, point)) return { ...run, message: '这道练习只比较标出的候选点。请点字母，或用右侧按钮选择。' }
  return chooseStrategy(run, index)
}
export function answerStrategy(run: StrategyRun, index: number): StrategyRun {
  if (run.done || run.seen.length !== run.lesson.choices.length) return run
  const reason = run.lesson.reasons[index]
  if (!reason) return run
  return { ...run, done: reason.correct, message: reason.feedback }
}
export function strategyView(run: StrategyRun) {
  const choice = run.lesson.choices[run.choiceIndex ?? 0]
  const positions = strategyPositions(choice)
  const game = positions[run.step]
  const original = choice.target ? getGroup(positions[0].board, choice.target)! : null
  const remaining = original?.stones.filter((point) => getCell(game.board, point) === 'black') ?? []
  const group = remaining.length ? getGroup(game.board, remaining[0]) : null
  const marks: BoardMark[] = []
  group?.stones.forEach((point) => marks.push({ point, kind: 'target' }))
  group?.liberties.forEach((point) => marks.push({ point, kind: 'liberty' }))
  choice.area?.forEach((point) => marks.push({ point, kind: 'selected' }))
  if (run.step === 0) {
    const candidates = run.lesson.id === 'edges' ? [choice] : run.lesson.choices
    candidates.forEach((candidate) => marks.push({ point: candidate.moves[0].point, kind: 'label', text: candidate.letter }))
  }
  const last = game.history.at(-1)
  if (last?.kind === 'play') {
    marks.push({ point: last.point, kind: 'preview' })
    last.captured.forEach((point) => marks.push({ point, kind: 'captured' }))
  }
  const captures = (color: 'black' | 'white') => game.history.reduce((sum, move) => sum + (move.kind === 'play' && move.color === color ? move.captured.length : 0), 0)
  return {
    choice, game, marks, original, remaining, group,
    capturedWhite: captures('black'), capturedBlack: captures('white'),
    blackStones: game.board.cells.filter((cell) => cell === 'black').length,
    explanation: run.step === 0 ? run.lesson.id === 'edges' ? '先观察准备围住的四个圆点。字母标出缺口，补好后再看边界用了多少颗棋。' : '先数圈出的黑块还有几口气，再决定这一手。点棋盘上的字母或选择下面的走法。' : choice.moves[run.step - 1].explanation,
    atEnd: run.choiceIndex !== null && run.step === choice.moves.length,
  }
}
