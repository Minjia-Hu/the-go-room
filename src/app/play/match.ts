import { createGame, getGroup, pass, play, toPoint, toggleDeadGroup } from '../../engine'
import type { GameState, Point, RejectReason } from '../../engine'
import type { AiMove } from '../../ai'

export interface Match {
  /** 因双方约定而追加的末尾停手数；省略表示自然连续停手。 */
  readonly agreedPasses?: 1 | 2
  readonly game: GameState
  readonly dead: readonly Point[]
  readonly message: string | null
  readonly notices: readonly string[]
  readonly seen: readonly ('ko' | 'pass' | 'scoring')[]
}

export const REJECTIONS: Record<RejectReason, string> = {
  occupied: '这里已经有棋子了，请选一个空的交叉点。',
  suicide: '这里是禁入点：落子后没有气，也提不掉对方的子。',
  'repeated-position': '这一步会让盘面重复，不能下。遇到劫时，要先在别处落子。',
  'off-board': '请下在棋盘内的交叉点上。',
  'game-over': '双方已经停一手，请先标记死子，再确认数子。',
}

export function createMatch(): Match {
  return { game: createGame(), dead: [], message: null, notices: [], seen: [] }
}

function advance(match: Match, game: GameState): Match {
  const seen = [...match.seen]
  const notices: string[] = []
  const last = game.history.at(-1)
  function explain(key: Match['seen'][number], text: string) {
    if (!seen.includes(key)) { seen.push(key); notices.push(text) }
  }
  if (last?.kind === 'play' && last.isKo) {
    explain('ko', '这里形成了劫。不能立即回提，让盘面回到之前的样子；先在别处下一手。')
  }
  if (last?.kind === 'pass') {
    explain('pass', '停一手就是这回合不落子。双方连续停一手，便进入终局数子。')
  }
  if (game.phase === 'scoring') {
    explain('scoring', '双方都停一手了。先标记无法逃出的死子，移除后按活子与围住的空点数子，白方再加 7.5。')
  }
  return { ...match, game, message: null, notices: [...match.notices, ...notices], seen }
}

export function humanMove(match: Match, point: Point | null): Match {
  if (match.game.phase !== 'playing' || match.game.toPlay !== 'black') return match
  const result = point === null ? pass(match.game) : play(match.game, point)
  return result.ok ? advance(match, result.state) : { ...match, message: REJECTIONS[result.reason] }
}

/** 电脑非法返回时停一手；调用者负责报告日志。 */
export function computerMove(match: Match, move: AiMove): { match: Match; invalid: boolean } {
  if (match.game.phase !== 'playing' || match.game.toPlay !== 'white') return { match, invalid: false }
  const result = move.kind === 'pass' ? pass(match.game) : play(match.game, move.point)
  if (result.ok) return { match: advance(match, result.state), invalid: false }
  const fallback = pass(match.game)
  return { match: fallback.ok ? advance(match, fallback.state) : match, invalid: true }
}

export function markDead(match: Match, point: Point): Match {
  return match.game.phase === 'scoring'
    ? { ...match, dead: toggleDeadGroup(match.game.board, match.dead, point) }
    : match
}

export function atariStones(game: GameState): Point[] {
  const visited = new Set<string>()
  const points: Point[] = []
  for (let i = 0; i < game.board.cells.length; i++) {
    const p = toPoint(game.board, i)
    if (visited.has(`${p.x},${p.y}`)) continue
    const group = getGroup(game.board, p)
    if (!group) continue
    for (const stone of group.stones) visited.add(`${stone.x},${stone.y}`)
    if (group.liberties.length === 1) points.push(...group.stones)
  }
  return points
}
