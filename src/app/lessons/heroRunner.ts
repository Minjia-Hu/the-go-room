import { createGame, getCell, getGroup, parseBoard, play } from '../../engine'
import type { Board, GameState, Point } from '../../engine'
import type { BoardMark } from '../board/marks'

/** 首页「一子一气」：中间黑棋只剩 A 一口气，比较接在 A 与下在远处 B 的后果。 */
export const HERO_TARGET: Point = { x: 4, y: 4 }
export const HERO_POINTS = { a: { x: 4, y: 5 }, b: { x: 6, y: 6 } } as const
export type HeroChoice = keyof typeof HERO_POINTS

export interface HeroRun {
  readonly choice: HeroChoice | null
  /** after：落子后；before：同一题落子前；reply：下 B 之后白棋占 A。 */
  readonly view: 'after' | 'before' | 'reply'
  readonly hint: boolean
  /** 点了 A、B 以外的交叉点时给出的提醒。 */
  readonly notice: string | null
}

const START = createGame({
  board: parseBoard(['.........', '.........', '.........', '....O....', '...OXO...', '.........', '.........', '.........', '.........']),
})

function mustPlay(state: GameState, point: Point): GameState {
  const result = play(state, point)
  if (!result.ok) throw new Error('首页练习的固定棋形不符合预期')
  return result.state
}

export function startHero(): HeroRun {
  return { choice: null, view: 'after', hint: false, notice: null }
}

export function chooseHeroPoint(run: HeroRun, point: Point): HeroRun {
  const choice = (Object.keys(HERO_POINTS) as HeroChoice[]).find((key) => HERO_POINTS[key].x === point.x && HERO_POINTS[key].y === point.y)
  if (!choice) return { ...run, notice: '这一题先比较 A 和 B 两个点：哪一手能让带圈的黑棋多出气？' }
  return { ...run, choice, view: 'after', notice: null }
}

export function heroBoard(run: HeroRun): Board {
  if (!run.choice || run.view === 'before') return START.board
  const placed = mustPlay(START, HERO_POINTS[run.choice])
  // 白棋占住黑棋最后的气；落子顺序与提子都由引擎判定。
  if (run.choice === 'b' && run.view === 'reply') return mustPlay(placed, HERO_POINTS.a).board
  return placed.board
}

/** 带圈黑棋当前的气；被提走时返回 null。 */
export function heroLiberties(run: HeroRun): readonly Point[] | null {
  return getGroup(heroBoard(run), HERO_TARGET)?.liberties ?? null
}

export function heroMarks(run: HeroRun): BoardMark[] {
  const board = heroBoard(run)
  const group = getGroup(board, HERO_TARGET)
  if (!group) return [{ point: HERO_TARGET, kind: 'captured' }]
  const marks: BoardMark[] = [{ point: HERO_TARGET, kind: 'target' }]
  if (run.hint || (run.choice && run.view !== 'before')) marks.push(...group.liberties.map((point) => ({ point, kind: 'liberty' as const })))
  for (const key of Object.keys(HERO_POINTS) as HeroChoice[]) {
    const point = HERO_POINTS[key]
    if (getCell(board, point) === null) marks.push({ point, kind: 'label', text: key.toUpperCase() })
  }
  return marks
}
