import { describe, expect, it } from 'vitest'
import { createRng, nextRandom } from '../../ai'
import { createGame, parseBoard } from '../../engine'
import { commitHuman, createPlaySession, retryRound, takeComputerTurn } from './session'
import { confirmPreview, previewMove } from './preview'

describe('陪练回合', () => {
  it('纯随机步骤与旧生成器序列一致，回退后相同选择重现同一应手', () => {
    const rng = createRng(42)
    let state = 42
    for (let i = 0; i < 20; i++) { const next = nextRandom(state); expect(next.value).toBe(rng()); state = next.state }
    const original = createPlaySession(42)
    const first = takeComputerTurn(commitHuman(original, { x: 4, y: 4 })).session
    const restored = retryRound(first)
    expect(restored.match).toBe(original.match)
    expect(restored.rngState).toBe(42)
    expect(retryRound(restored)).toBe(restored)
    const repeated = takeComputerTurn(commitHuman(restored, { x: 4, y: 4 })).session
    expect(repeated.match.game).toEqual(first.match.game)
    expect(repeated.rngState).toBe(first.rngState)
  })
  it('预览不走棋、不消耗随机；失效或重复确认不会追加行棋', () => {
    const initial = createPlaySession(7)
    const preview = previewMove(initial.match.game, { x: 4, y: 4 })
    expect(initial.match.game.history).toHaveLength(0)
    const committed = confirmPreview(initial, preview)
    expect(committed.match.game.history).toHaveLength(1)
    expect(confirmPreview(committed, preview)).toBe(committed)
    expect(retryRound(committed)).toBe(committed)
    expect(committed.rngState).toBe(7)
  })
  it('终局前可退回，恢复规则说明、同形历史、连续停一手和死子', () => {
    const initial = createPlaySession(9)
    const ended = takeComputerTurn(commitHuman(initial, null), () => ({ kind: 'pass' })).session
    expect(ended.match.game.phase).toBe('scoring')
    expect(retryRound(ended).match).toEqual(initial.match)
    expect(retryRound(ended).match.game.positionKeys).toEqual(initial.match.game.positionKeys)
  })
  it('白棋停后黑棋停直接终局，只撤回最新黑棋回合', () => {
    const round = takeComputerTurn(commitHuman(createPlaySession(9), { x: 4, y: 4 }), () => ({ kind: 'pass' })).session
    const ended = commitHuman(round, null)
    expect(ended.match.game.phase).toBe('scoring')
    expect(retryRound(ended).match).toBe(round.match)
  })
  it('提子保存前后盘面，重试回到整回合前；异常应手不消耗种子', () => {
    const base = createPlaySession(5)
    const initial = { ...base, match: { ...base.match, game: createGame({ board: parseBoard(['.....', '..O..', '.OXO.', '.....', '.....']) }) } }
    const pending = commitHuman(initial, { x: 0, y: 0 })
    const captured = takeComputerTurn(pending, () => ({ kind: 'play', point: { x: 2, y: 3 } })).session
    expect(captured.captureReview?.before).toBe(pending.match.game)
    expect(captured.captureReview?.after.board.cells.filter((c) => c === 'black')).toHaveLength(1)
    expect(retryRound(captured).match).toBe(initial.match)
    const failed = takeComputerTurn(pending, (_game, rng) => { rng(); throw new Error('failure') })
    expect(failed.error).toBe(true)
    expect(failed.session.rngState).toBe(5)
  })
})
