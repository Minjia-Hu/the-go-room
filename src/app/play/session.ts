import { chooseMove, nextRandom } from '../../ai'
import type { AiMove, Rng } from '../../ai'
import type { GameState, Point } from '../../engine'
import { computerMove, createMatch, humanMove } from './match'
import type { Match } from './match'

export interface CaptureReview { readonly before: GameState; readonly after: GameState }
interface PlaySnapshot {
  readonly match: Match
  readonly rngState: number
  readonly undo: { readonly match: Match; readonly rngState: number } | null
  readonly captureReview: CaptureReview | null
  readonly lastBefore: GameState | null
}
export interface PlaySession extends PlaySnapshot {
  readonly scoringReturn: PlaySnapshot | null
}
function snapshot(session: PlaySession): PlaySnapshot {
  return { match: session.match, rngState: session.rngState, undo: session.undo,
    captureReview: session.captureReview, lastBefore: session.lastBefore }
}
export function createPlaySession(seed: number): PlaySession {
  return { match: createMatch(), rngState: seed >>> 0, undo: null, captureReview: null, lastBefore: null, scoringReturn: null }
}
export function commitHuman(session: PlaySession, point: Point | null): PlaySession {
  const match = humanMove(session.match, point)
  if (match.game === session.match.game) return match === session.match ? session : { ...session, match }
  return { ...session, match, undo: { match: session.match, rngState: session.rngState }, captureReview: null, lastBefore: session.match.game,
    scoringReturn: point === null ? snapshot(session) : null }
}
export function takeComputerTurn(session: PlaySession, choose: (game: GameState, rng: Rng) => AiMove = chooseMove): { session: PlaySession; error: boolean } {
  const before = session.match.game
  if (before.phase !== 'playing' || before.toPlay !== 'white') return { session, error: false }
  let rngState = session.rngState
  let error = false
  let move: AiMove
  try {
    move = choose(before, () => { const next = nextRandom(rngState); rngState = next.state; return next.value })
  } catch { error = true; move = { kind: 'pass' } }
  const result = computerMove(session.match, move)
  error ||= result.invalid
  const after = result.match.game
  const last = after.history.at(-1)
  return { error, session: { ...session, match: result.match, rngState: error ? session.rngState : rngState,
    scoringReturn: after.phase === 'scoring' ? session.scoringReturn : null,
    lastBefore: before, captureReview: last?.kind === 'play' && last.captured.length ? { before, after } : null } }
}
export function retryRound(session: PlaySession): PlaySession {
  if (!session.undo || (session.match.game.phase === 'playing' && session.match.game.toPlay === 'white')) return session
  return { ...session, ...session.undo, undo: null, captureReview: null, lastBefore: null, scoringReturn: null }
}

/** 陪练约定接受数子，不调用选点策略，也不推断死活。用合法停手保持棋谱可重放。 */
export function agreeToScore(session: PlaySession): PlaySession {
  if (session.match.game.phase !== 'playing' || session.match.game.toPlay !== 'black') return session
  let match = humanMove(session.match, null)
  const agreedPasses = match.game.phase === 'scoring' ? 1 : 2
  if (agreedPasses === 2) match = computerMove(match, { kind: 'pass' }).match
  return { ...session, match: { ...match, agreedPasses }, scoringReturn: snapshot(session),
    undo: { match: session.match, rngState: session.rngState }, captureReview: null, lastBefore: null }
}

export function resumeAfterScoring(session: PlaySession): PlaySession {
  if (session.match.game.phase !== 'scoring' || !session.scoringReturn) return session
  return { ...session.scoringReturn, scoringReturn: null }
}
