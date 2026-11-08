import { describe, expect, it } from 'vitest'
import { createGame, pass, play } from '../../engine'
import type { Point } from '../../engine'
import { agreeToScore, commitHuman, createPlaySession, takeComputerTurn } from '../play/session'
import { createMatch } from '../play/match'
import { MAX_GAMES, moveDescription, prependGame, readGames, replayRecord, saveRecord, STORAGE_KEY, writeGames } from './records'
import type { GameStorage } from './records'

function finished(points: readonly (Point | null)[]) {
  let game = createGame()
  for (const point of points) {
    const result = point ? play(game, point) : pass(game)
    if (!result.ok) throw new Error(result.reason)
    game = result.state
  }
  return saveRecord({ ...createMatch(), game }, 'game-1', '2026-11-01T12:00:00.000Z')
}
const capture = () => finished([{ x: 1, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 1 }, null, null])

describe('棋谱重放', () => {
  it('重建提子前后盘面与事件，停一手也占一帧', () => {
    const replay = replayRecord(capture())!
    expect(replay.frames).toHaveLength(6)
    expect(replay.frames[0].board.cells.every((cell) => cell === null)).toBe(true)
    expect(replay.frames[2].board.cells[0]).toBe('white')
    expect(replay.frames[3].board.cells[0]).toBeNull()
    expect(moveDescription(replay.frames[3].history.at(-1))).toContain('黑方提了 1 子，白方被提 1 子')
    expect(moveDescription(replay.frames[4].history.at(-1))).toBe('白方停一手。')
    expect(replay.frames.at(-1)?.phase).toBe('scoring')
  })

  it('重建劫事件', () => {
    const record = finished([{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 8, y: 8 }, { x: 0, y: 0 }, null, null])
    expect(moveDescription(replayRecord(record)!.frames[6].history.at(-1))).toContain('形成劫')
  })

  it('拒绝非法动作、未结束对局、终局后的动作与损坏元数据', () => {
    for (const record of [
      null, { ...capture(), endedAt: 'bad' }, { ...capture(), moves: [] },
      { ...capture(), moves: [{ kind: 'play', point: { x: 9, y: 0 } }] },
      { ...capture(), moves: [{ kind: 'play', point: { x: 0.5, y: 0 } }] },
      { ...capture(), moves: [...capture().moves, { kind: 'pass' }] },
      { ...capture(), moves: [{ kind: 'play', point: { x: 1, y: 0 } }, ...capture().moves] },
      { ...capture(), dead: [{ x: 0, y: 0 }] },
    ]) expect(replayRecord(record)).toBeNull()
  })

  it('死子必须是完整棋块且不可重复', () => {
    const record = finished([{ x: 0, y: 0 }, { x: 8, y: 8 }, { x: 1, y: 0 }, null, null])
    const dead = [{ x: 0, y: 0 }, { x: 1, y: 0 }]
    expect(replayRecord({ ...record, dead })).not.toBeNull()
    expect(replayRecord({ ...record, dead: dead.slice(0, 1) })).toBeNull()
    expect(replayRecord({ ...record, dead: [...dead, dead[0]] })).toBeNull()
  })
})

describe('本地棋谱存储', () => {
  it('保存并读取，去重且最多保留 10 盘', () => {
    let games = [capture()]
    for (let i = 0; i < 12; i++) games = prependGame(games, { ...capture(), id: String(i) })
    games = prependGame(games, games[0])
    expect(games).toHaveLength(MAX_GAMES)
    expect(games[0].id).toBe('11')
    let raw: string | null = null
    const storage: GameStorage = { getItem: () => raw, setItem: (key, value) => { expect(key).toBe(STORAGE_KEY); raw = value } }
    expect(writeGames(storage, games)).toBe(true)
    expect(readGames(storage)).toEqual(games)
  })

  it('坏数据、错误版本、非法棋谱和重复 id 当作无历史', () => {
    for (const raw of ['bad json', 'null', '{}', JSON.stringify({ version: 2, games: [] }), JSON.stringify({ version: 1, games: [{}] }), JSON.stringify({ version: 1, games: [capture(), capture()] })]) {
      expect(readGames({ getItem: () => raw, setItem: () => {} })).toEqual([])
    }
  })

  it('读取和写入异常不向界面抛错', () => {
    const storage = { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('full') } }
    expect(readGames(storage)).toEqual([])
    expect(writeGames(storage, [capture()])).toBe(false)
  })
})


describe('约定结束的棋谱兼容', () => {
  it('保存并重放两种约定结束，读取后保留来源；旧棋谱不增加字段', () => {
    const initial = createPlaySession(9)
    const whitePassed = takeComputerTurn(commitHuman(initial, { x: 4, y: 4 }), () => ({ kind: 'pass' })).session
    for (const session of [initial, whitePassed]) {
      const ended = agreeToScore(session)
      const record = saveRecord(ended.match, 'agreed', '2026-11-08T12:00:00Z')
      const restored = readGames({ getItem: () => JSON.stringify({ version: 1, games: [record] }), setItem: () => {} })
      expect(restored).toEqual([record])
      expect(restored[0].agreedPasses).toBe(ended.match.agreedPasses)
      expect(replayRecord(restored[0])?.frames.at(-1)).toEqual(ended.match.game)
    }
    expect(replayRecord(capture())?.record).toEqual(capture())
    expect(capture()).not.toHaveProperty('agreedPasses')
  })
  it('拒绝无效约定标记，不能把普通落子伪装成约定停手', () => {
    const record = capture() // 末尾是白停、黑停，只有最后黑停可来自提议。
    expect(replayRecord({ ...record, agreedPasses: 1 })).not.toBeNull()
    for (const agreedPasses of [0, 2, 3, '1', null]) {
      expect(replayRecord({ ...record, agreedPasses })).toBeNull()
    }
  })
})
