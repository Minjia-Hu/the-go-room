import { createGame, getCell, parseBoard, play, samePoint } from '../../engine'
import type { GameState, Point } from '../../engine'
import type { Lesson, LessonStep, PlaceStep, SelectStep } from '../../content/lessons'
import { marksForPoints } from '../board/marks'
import type { BoardMark } from '../board/marks'

export interface LessonMessage {
  readonly kind: 'hint' | 'success'
  readonly text: string
}

/** 一个关卡的进行状态。所有函数都返回新对象,不修改传入的对象。 */
export interface LessonRun {
  readonly lesson: Lesson
  readonly game: GameState
  /** 当前步骤下标;等于步骤总数时表示本关完成。 */
  readonly stepIndex: number
  /** select 步骤里用户已点出的点。 */
  readonly selected: readonly Point[]
  readonly message: LessonMessage | null
  readonly lastMove: Point | null
}

/**
 * 从关卡定义建立初始局面。
 * 准备手不合法说明关卡数据写错了,这是开发期错误,直接抛出。
 */
export function startLesson(lesson: Lesson): LessonRun {
  let game = createGame({ board: parseBoard(lesson.rows), toPlay: lesson.toPlay })
  let lastMove: Point | null = null
  for (const move of lesson.setupMoves ?? []) {
    const result = play(game, move)
    if (!result.ok) {
      throw new Error(`关卡 ${lesson.id} 的准备手 ${move.x},${move.y} 不合法:${result.reason}`)
    }
    game = result.state
    lastMove = move
  }
  return { lesson, game, stepIndex: 0, selected: [], message: null, lastMove }
}

export function currentStep(run: LessonRun): LessonStep | null {
  return run.lesson.steps[run.stepIndex] ?? null
}

export function isLessonDone(run: LessonRun): boolean {
  return run.stepIndex >= run.lesson.steps.length
}

/** 当前要画在棋盘上的标记:关卡的高亮点,加上 select 步骤里已选的点。 */
export function lessonMarks(run: LessonRun): BoardMark[] {
  return [
    ...marksForPoints(run.game.board, run.lesson.highlight ?? []),
    ...marksForPoints(run.game.board, run.selected, 'selected'),
  ]
}

function includesPoint(points: readonly Point[], p: Point): boolean {
  return points.some((q) => samePoint(q, p))
}

function advance(run: LessonRun, patch: Partial<LessonRun>, success: string): LessonRun {
  return {
    ...run,
    ...patch,
    stepIndex: run.stepIndex + 1,
    selected: [],
    message: { kind: 'success', text: success },
  }
}

function hint(run: LessonRun, text: string): LessonRun {
  return { ...run, message: { kind: 'hint', text } }
}

function handlePlace(run: LessonRun, step: PlaceStep, p: Point): LessonRun {
  const result = play(run.game, p)

  if (step.expectReject && samePoint(step.expectReject.point, p)) {
    if (!result.ok && result.reason === step.expectReject.reason) {
      return advance(run, {}, step.success)
    }
  }

  if (!result.ok) {
    return hint(run, step.rejectHints?.[result.reason] ?? step.fallbackHint)
  }

  const accepted = step.accept === 'any-legal' || includesPoint(step.accept, p)
  if (!accepted) {
    const specific = step.hints?.find((h) => samePoint(h.point, p))
    return hint(run, specific?.text ?? step.fallbackHint)
  }

  return advance(run, { game: result.state, lastMove: p }, step.success)
}

function handleSelect(run: LessonRun, step: SelectStep, p: Point): LessonRun {
  if (getCell(run.game.board, p) !== null || !includesPoint(step.targets, p)) {
    return hint(run, step.wrongHint)
  }
  const selected = includesPoint(run.selected, p)
    ? run.selected.filter((q) => !samePoint(q, p))
    : [...run.selected, p]
  const complete = step.targets.every((t) => includesPoint(selected, t))
  if (complete) {
    const next = advance(run, {}, step.success)
    // 整关完成后保留答案，方便对照成功说明；进入下一步时仍清空。
    return isLessonDone(next) ? { ...next, selected } : next
  }
  return { ...run, selected, message: null }
}

/** 用户点了棋盘上的一个点。关卡已完成时原样返回。 */
export function clickPoint(run: LessonRun, p: Point): LessonRun {
  const step = currentStep(run)
  if (step === null) return run
  return step.kind === 'place' ? handlePlace(run, step, p) : handleSelect(run, step, p)
}
