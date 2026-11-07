import type { GameState, Point } from '../../engine'
import { analyzeAction } from '../coaching/analysis'
import type { ActionAnalysis } from '../coaching/analysis'
import { commitHuman } from './session'
import type { PlaySession } from './session'
export interface MovePreview { readonly source: GameState; readonly point: Point | null; readonly analysis: ActionAnalysis }
export function previewMove(game: GameState, point: Point | null): MovePreview | null {
  if (game.phase !== 'playing' || game.toPlay !== 'black') return null
  return { source: game, point, analysis: analyzeAction(game, point) }
}
export function confirmPreview(session: PlaySession, preview: MovePreview | null): PlaySession {
  if (!preview?.analysis.ok || session.match.game !== preview.source) return session
  return commitHuman(session, preview.point)
}
