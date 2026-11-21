import { createGame, getCell, getGroup, inspectPlay, neighbors, parseBoard, pass, play, toIndex } from '../../engine'
import type { Color, GameState, Group, Point } from '../../engine'
import type { CaptureScene } from '../../content/capture'
import { REJECTIONS } from '../play/match'
import type { Completion } from './learningProgress'

interface TargetGroup {
  readonly anchor: Point
  readonly first: number
  readonly group: Group
}

function groupsAt(state: GameState, anchors: readonly Point[], color: Color): TargetGroup[] {
  const found = new Map<number, TargetGroup>()
  for (const anchor of anchors) {
    if (getCell(state.board, anchor) !== color) continue
    const group = getGroup(state.board, anchor)!
    const first = Math.min(...group.stones.map((stone) => toIndex(state.board, stone)))
    if (!found.has(first)) found.set(first, { anchor, first, group })
  }
  return [...found.values()]
}

/** 同一块白棋只参与一次应对。先反提，再从气最少的目标找能多出气的落点。 */
export function captureReply(state: GameState, targets: readonly Point[]): Point | null {
  const whites = groupsAt(state, targets, 'white')
  const adjacent = whites.flatMap(({ group }) => group.stones.flatMap((p) => neighbors(state.board, p)))
  const captures = groupsAt(state, adjacent, 'black')
    .filter(({ group }) => group.liberties.length === 1)
    .sort((a, b) => b.group.stones.length - a.group.stones.length || a.first - b.first)
  for (const { group } of captures) {
    const point = group.liberties[0]
    if (play(state, point).ok) return point
  }
  const fewest = Math.min(...whites.map(({ group }) => group.liberties.length))
  let best: { readonly point: Point; readonly liberties: number } | null = null
  for (const { anchor, group } of whites) {
    if (group.liberties.length !== fewest) continue
    for (const point of group.liberties) {
      const trial = play(state, point)
      if (!trial.ok) continue
      const liberties = getGroup(trial.state.board, anchor)!.liberties.length
      if (liberties < 2) continue
      if (!best || liberties > best.liberties ||
        (liberties === best.liberties && toIndex(state.board, point) < toIndex(state.board, best.point))) {
        best = { point, liberties }
      }
    }
  }
  return best?.point ?? null
}

interface CaptureRound {
  readonly before: GameState
  readonly black: GameState
  readonly white?: GameState
}
export type CaptureFailure = 'countercapture' | 'escape' | 'budget'
export interface CaptureRun {
  readonly scene: CaptureScene
  readonly origin: GameState
  readonly game: GameState
  readonly rounds: readonly CaptureRound[]
  readonly moves: number
  readonly stage: 'active' | 'failed' | 'done'
  readonly failure: CaptureFailure | null
  readonly mistakes: number
  readonly hint: number
  readonly assisted: boolean
  readonly message: string | null
}
const FAILURES: Record<CaptureFailure, string> = {
  countercapture: '白棋反过来吃掉了你的棋。',
  escape: '白棋逃出去了。',
  budget: '手数用完了，白棋还没被吃掉。',
}

export function startCapture(scene: CaptureScene, rows = scene.rows): CaptureRun {
  const game = createGame({ board: parseBoard(rows) })
  return { scene, origin: game, game, rounds: [], moves: 0, stage: 'active', failure: null,
    mistakes: 0, hint: scene.guided ? 1 : 0, assisted: false, message: null }
}

export function capturePoint(run: CaptureRun, point: Point): CaptureRun {
  if (run.stage !== 'active') return run
  const { result: black, captured } = inspectPlay(run.game, point)
  if (!black.ok) return { ...run, mistakes: run.mistakes + 1, message: REJECTIONS[black.reason] }
  const moves = run.moves + 1
  const round = { before: run.game, black: black.state }
  if (run.scene.targets.some((target) => getCell(black.state.board, target) !== 'white')) {
    return { ...run, game: black.state, rounds: [...run.rounds, round], moves, stage: 'done', message: captured.length === 1 ? '提掉了这颗白棋。' : `提掉了 ${captured.length} 颗白棋。` }
  }

  const reply = captureReply(black.state, run.scene.targets)
  const white = reply ? play(black.state, reply) : pass(black.state)
  if (!white.ok) throw new Error(`白棋应手非法：${run.scene.id}（${white.reason}）`)
  const last = white.state.history.at(-1)
  const escaped = groupsAt(white.state, run.scene.targets, 'white').some(({ group }) => group.liberties.length >= 3)
  const failure = last?.kind === 'play' && last.captured.length > 0 ? 'countercapture'
    : escaped ? 'escape' : moves >= run.scene.maxMoves ? 'budget' : null
  return { ...run, game: white.state, rounds: [...run.rounds, { ...round, white: white.state }], moves,
    stage: failure ? 'failed' : 'active', failure, mistakes: run.mistakes + (failure ? 1 : 0),
    message: failure ? FAILURES[failure] : reply ? '白棋已应对。再看看目标白棋的气。' : '白棋已经逃不掉了，提掉它。' }
}

export function undoCapture(run: CaptureRun): CaptureRun {
  const round = run.rounds.at(-1)
  if (!round || run.stage === 'done') return run
  return { ...run, game: round.before, rounds: run.rounds.slice(0, -1), moves: run.moves - 1,
    stage: 'active', failure: null, message: '已退回上一对黑白落子。' }
}

export type CaptureReplayKind = 'solution' | 'wrong' | 'contrast'

/** 每条变化从自己的原图重放。帧包含黑白每个着手及停手。 */
export function captureReplay(scene: CaptureScene, kind: CaptureReplayKind) {
  const rows = kind === 'contrast' ? scene.contrastRows : scene.rows
  if (!rows) throw new Error(`缺少征子对照：${scene.id}`)
  const moves = kind === 'wrong' ? [scene.wrongFirst] : scene.solution
  const run = moves.reduce(capturePoint, startCapture(scene, rows))
  const frames = [run.origin, ...run.rounds.flatMap((round) => round.white ? [round.black, round.white] : [round.black])]
  return { run, frames }
}

export function captureHint(run: CaptureRun): CaptureRun {
  if (run.stage !== 'active') return run
  const hint = run.hint + 1
  if (hint < 3) return { ...run, hint, message: run.scene.hints[hint - 1] }
  const demo = captureReplay(run.scene, 'solution').run
  if (demo.stage !== 'done') throw new Error(`演示未完成：${run.scene.id}`)
  return { ...demo, hint: 3, mistakes: run.mistakes, assisted: true }
}

export function captureCompletion(run: CaptureRun): Completion {
  if (run.assisted) return 'demo'
  if (run.hint > (run.scene.guided ? 1 : 0)) return 'hint'
  if (run.scene.guided) return 'guided'
  return run.mistakes > 0 ? 'retry' : 'independent'
}
