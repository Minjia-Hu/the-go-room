import { chooseMove, nextRandom } from '../../ai'
import type { AiMove, Rng } from '../../ai'
import type { GameState, Point } from '../../engine'
import { computerMove, createMatch, humanMove } from './match'
import type { Match } from './match'

export interface CaptureReview { readonly before: GameState; readonly after: GameState }
export interface PlaySession {
  readonly match: Match
  readonly rngState: number
  readonly undo: { readonly match: Match; readonly rngState: number } | null
  readonly captureReview: CaptureReview | null
  readonly lastBefore: GameState | null
}
export function createPlaySession(seed: number): PlaySession {
  return { match: createMatch(), rngState: seed >>> 0, undo: null, captureReview: null, lastBefore: null }
}
export function commitHuman(session: PlaySession, point: Point | null): PlaySession {
  const match = humanMove(session.match, point)
  if (match.game === session.match.game) return match === session.match ? session : { ...session, match }
  return { ...session, match, undo: { match: session.match, rngState: session.rngState }, captureReview: null, lastBefore: session.match.game }
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
    lastBefore: before, captureReview: last?.kind === 'play' && last.captured.length ? { before, after } : null } }
}
export function retryRound(session: PlaySession): PlaySession {
  if (!session.undo || (session.match.game.phase === 'playing' && session.match.game.toPlay === 'white')) return session
  return { ...session, ...session.undo, undo: null, captureReview: null, lastBefore: null }
}
