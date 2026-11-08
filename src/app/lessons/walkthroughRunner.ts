import { createGame, getGroup, pass, play, scoreGame, toPoint } from '../../engine'
import { WALK_CHAPTERS, WALK_KEY_STEPS, WALK_MOVES, WALK_QUESTIONS } from '../../content/walkthrough'
import type { BoardMark } from '../board/marks'

export interface WalkRun { readonly step: number; readonly furthest: number; readonly answered: readonly number[]; readonly message: string | null }
export function startWalk(): WalkRun { return { step: 0, furthest: 0, answered: [], message: null } }
export function walkPositions() {
  const positions = [createGame()]
  WALK_MOVES.forEach((move, index) => {
    const last = positions.at(-1)!
    const result = move.point ? play(last, move.point) : pass(last)
    if (!result.ok) throw new Error(`Invalid walkthrough move ${index + 1}: ${result.reason}`)
    positions.push(result.state)
  })
  return positions
}
const POSITIONS = walkPositions()
export function walkStep(run: WalkRun, requested: number): WalkRun {
  if (!Number.isInteger(requested)) return run
  const desired = Math.max(0, Math.min(WALK_MOVES.length, requested))
  const gate = WALK_QUESTIONS.find((question) => question.step <= desired && !run.answered.includes(question.step))
  const step = Math.min(desired, gate?.step ?? desired)
  return { ...run, step, furthest: Math.max(run.furthest, step), message: desired > step ? '先回答这一处的关键问题，再往后看。' : null }
}
export function nextWalkKey(run: WalkRun): WalkRun { return walkStep(run, WALK_KEY_STEPS.find((step) => step > run.step) ?? WALK_MOVES.length) }
export function answerWalk(run: WalkRun, index: number): WalkRun {
  const question = WALK_QUESTIONS.find((entry) => entry.step === run.step)
  if (!question || !question.options[index]) return run
  return { ...run, answered: index === question.answer ? [...new Set([...run.answered, run.step])] : run.answered, message: `${index === question.answer ? '对。' : '再想一想。'}${question.feedback}` }
}
export function walkView(run: WalkRun) {
  const game = POSITIONS[run.step]
  const chapter = WALK_CHAPTERS.findLast((entry) => entry.start <= run.step)!
  const last = game.history.at(-1)
  const marks: BoardMark[] = []
  if (run.step === 17) getGroup(game.board, { x: 1, y: 1 })?.stones.forEach((point) => marks.push({ point, kind: 'target' }))
  if (last?.kind === 'play') last.captured.forEach((point) => marks.push({ point, kind: 'captured' }))
  const score = game.phase === 'scoring' ? scoreGame(game.board, [], game.komi) : null
  if (score) score.ownership.forEach((owner, index) => { if (owner) marks.push({ point: toPoint(game.board, index), kind: `${owner}-area` }) })
  const blackStones = game.board.cells.filter((color) => color === 'black').length
  const whiteStones = game.board.cells.filter((color) => color === 'white').length
  return { game, chapter, last, marks, score, blackStones, whiteStones, question: WALK_QUESTIONS.find((entry) => entry.step === run.step), done: run.answered.length === WALK_QUESTIONS.length && run.step === WALK_MOVES.length }
}
