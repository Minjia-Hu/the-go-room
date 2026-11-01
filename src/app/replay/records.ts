import { createGame, getCell, getGroup, pass, play, samePoint } from '../../engine'
import type { GameState, MoveRecord, Point } from '../../engine'
import type { Match } from '../play/match'

export const STORAGE_KEY = 'the-go-room.games.v1'
export const MAX_GAMES = 10
type StoredMove = { readonly kind: 'play'; readonly point: Point } | { readonly kind: 'pass' }
export interface SavedGame {
  readonly id: string
  readonly endedAt: string
  readonly moves: readonly StoredMove[]
  readonly dead: readonly Point[]
}
export interface GameReplay {
  readonly record: SavedGame
  readonly frames: readonly GameState[]
}
export interface GameStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

/** 第一版的存档固定为 9 路、黑先、空盘、贴 7.5。事件由引擎重建。 */
export function saveRecord(match: Match, id: string, endedAt: string): SavedGame {
  return {
    id, endedAt,
    moves: match.game.history.map((move) => move.kind === 'pass' ? { kind: 'pass' } : { kind: 'play', point: move.point }),
    dead: [...match.dead],
  }
}

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
function point(value: unknown): value is Point {
  return object(value) && typeof value.x === 'number' && typeof value.y === 'number'
    && Number.isInteger(value.x) && Number.isInteger(value.y)
    && value.x >= 0 && value.x < 9 && value.y >= 0 && value.y < 9
}

/** 不信任存储中的动作、事件或得分；重放每手并检查死子来自完整棋块。 */
export function replayRecord(value: unknown): GameReplay | null {
  if (!object(value) || typeof value.id !== 'string' || !value.id || value.id.length > 200
    || typeof value.endedAt !== 'string' || !Number.isFinite(Date.parse(value.endedAt))
    || !Array.isArray(value.moves) || value.moves.length > 5000 || !Array.isArray(value.dead)
    || value.dead.length > 81) return null
  let game = createGame()
  const frames = [game]
  const moves: StoredMove[] = []
  for (const move of value.moves) {
    if (!object(move)) return null
    if (move.kind !== 'pass' && (move.kind !== 'play' || !point(move.point))) return null
    const action: StoredMove = move.kind === 'pass' ? { kind: 'pass' } : { kind: 'play', point: { ...(move.point as Point) } }
    const result = action.kind === 'pass' ? pass(game) : play(game, action.point)
    if (!result.ok) return null
    game = result.state
    frames.push(game)
    moves.push(action)
  }
  if (game.phase !== 'scoring') return null
  const dead: Point[] = []
  for (const item of value.dead) {
    if (!point(item) || getCell(game.board, item) === null || dead.some((p) => samePoint(p, item))) return null
    dead.push({ x: item.x, y: item.y })
  }
  for (const p of dead) {
    if (!getGroup(game.board, p)!.stones.every((stone) => dead.some((d) => samePoint(d, stone)))) return null
  }
  return { record: { id: value.id, endedAt: value.endedAt, moves, dead }, frames }
}

export function readGames(storage: GameStorage): SavedGame[] {
  try {
    const text = storage.getItem(STORAGE_KEY)
    if (!text) return []
    const data: unknown = JSON.parse(text)
    if (!object(data) || data.version !== 1 || !Array.isArray(data.games) || data.games.length > MAX_GAMES) return []
    const games: SavedGame[] = []
    for (const entry of data.games) {
      const replay = replayRecord(entry)
      if (!replay || games.some((game) => game.id === replay.record.id)) return []
      games.push(replay.record)
    }
    return games
  } catch { return [] }
}

export function prependGame(games: readonly SavedGame[], record: SavedGame): SavedGame[] {
  return [record, ...games.filter((game) => game.id !== record.id)].slice(0, MAX_GAMES)
}

export function writeGames(storage: GameStorage, games: readonly SavedGame[]): boolean {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, games: games.slice(0, MAX_GAMES) }))
    return true
  } catch { return false }
}

export function moveDescription(move: MoveRecord | undefined): string {
  if (!move) return '开局：空棋盘，黑先。'
  const side = move.color === 'black' ? '黑方' : '白方'
  if (move.kind === 'pass') return `${side}停一手。`
  const events = [`${side}落在第 ${move.point.x + 1} 列、第 ${move.point.y + 1} 行。`]
  if (move.captured.length) events.push(`${side}提了 ${move.captured.length} 子，${move.color === 'black' ? '白方' : '黑方'}被提 ${move.captured.length} 子。`)
  if (move.isKo) events.push('形成劫，不能立即回提。')
  return events.join(' ')
}
