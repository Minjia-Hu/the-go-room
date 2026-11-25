import { describe, expect, it } from 'vitest'
import { createGame, getCell, getGroup, parseBoard, play } from '../../engine'
import type { Point } from '../../engine'
import { CAPTURE_SCENES } from '../../content/capture'
import { captureCompletion, captureHint, capturePoint, captureReply, captureReplay, connectionFrames, startCapture, undoCapture } from './captureRunner'

const point = (name: string): Point => ({ x: name.charCodeAt(0) - 65, y: Number(name[1]) - 1 })
const chase = (rows: readonly string[], white: boolean) => createGame({ board: parseBoard(rows), toPlay: white ? 'white' : 'black' })
const white = (...rows: string[]) => chase(rows, true)
const direction = () => startCapture(CAPTURE_SCENES[0])
const check = () => startCapture(CAPTURE_SCENES[1])

describe('白棋应对', () => {
  it('先反提与目标相邻、只剩一气的黑棋，即使自己也能逃', () => {
    const game = white('.....', '.O.O.', '.XOX.', '.O.O.', '.....')
    const extend = play(game, point('C2'))
    if (!extend.ok) throw new Error(extend.reason)
    expect(getGroup(extend.state.board, point('C3'))!.liberties.length).toBeGreaterThanOrEqual(2)
    expect(captureReply(game, [point('C3')])).toEqual(point('A3'))
  })
  it('多个相邻黑块可提时优先最大，再按棋块扫描顺序', () => {
    const largest = white('.....', '.O.OO', '.XOXX', '.O.O.', '.....')
    expect(captureReply(largest, [point('C3')])).toEqual(point('E4'))
    const tied = white('.....', '.O.O.', '.XOX.', '.O.O.', '.....')
    expect(captureReply(tied, [point('C3')])).toEqual(point('A3'))
  })
  it('延伸选择气最多的落点，同分取较早的交叉点', () => {
    expect(captureReply(white('.....', '.XO..', '..X..', '.....', '.....'), [point('C2')])).toEqual(point('D2'))
    expect(captureReply(white('.....', '.....', '..O..', '.....', '.....'), [point('C3')])).toEqual(point('C2'))
  })
  it('只对气最少的目标试延伸，相连目标即使重复传入也一致', () => {
    const game = white('XOX..', 'X....', '..OO.', '.....', '.....')
    expect(captureReply(game, [point('C3'), point('D3'), point('B1')])).toEqual(point('B2'))
    expect(captureReply(game, [point('C3'), point('D3')])).toEqual(captureReply(game, [point('D3')]))
  })
  it('没有合法的两气延伸就停手，过滤全局同形候选', () => {
    const run = direction()
    const called = play(run.game, run.scene.solution[0])
    if (!called.ok) throw new Error(called.reason)
    expect(captureReply(called.state, run.scene.targets)).toBeNull()
    const game = white('.....', '.XO..', '..X..', '.....', '.....')
    const repeat = play(game, point('D2'))
    if (!repeat.ok) throw new Error(repeat.reason)
    const blocked = { ...game, positionKeys: [...game.positionKeys, ...repeat.state.positionKeys.slice(-1)] }
    expect(captureReply(blocked, [point('C2')])).toEqual(point('C1'))
  })
})

describe('追吃棋形', () => {
  it.each([
    ['direction-guided', '提掉了这颗白棋。'],
    ['ladder-check', '提掉了 9 颗白棋。'],
  ])('%s reports the stones captured by the finishing move', (id, message) => {
    const scene = CAPTURE_SCENES.find((item) => item.id === id)!
    expect(scene.solution.reduce(capturePoint, startCapture(scene)).message).toBe(message)
  })
  it.each(CAPTURE_SCENES)('$id 正解在限手内得子，错手让白棋逃出', (scene) => {
    const start = startCapture(scene)
    const groups = scene.targets.map((target) => getGroup(start.game.board, target))
    expect(groups.every((g) => g?.color === 'white' && g.liberties.length === 2)).toBe(true)
    const call = play(start.game, scene.solution[0])
    if (!call.ok) throw new Error(call.reason)
    for (const target of scene.targets) expect(getGroup(call.state.board, target)?.liberties).toHaveLength(scene.wrongFollowUp ? 2 : 1)
    const run = scene.solution.reduce(capturePoint, start)
    expect(run.stage).toBe('done')
    expect(run.moves).toBeLessThanOrEqual(scene.maxMoves)
    expect(scene.targets.some((target) => getCell(run.game.board, target) === null)).toBe(true)

    const wrong = captureReplay(scene, 'wrong')
    const wrongMoves = 1 + (scene.wrongFollowUp?.length ?? 0)
    expect(wrong.run).toMatchObject({ stage: 'failed', failure: 'escape', moves: wrongMoves, mistakes: 1 })
    expect(wrong.run.game.history).toHaveLength(wrongMoves * 2)
    expect(wrong.frames).toHaveLength(wrongMoves * 2 + 1)
    if (scene.targets.length === 2) {
      const first = capturePoint(start, scene.solution[0])
      expect(first.stage).toBe('active')
      expect(first.game.history.at(-1)?.kind).toBe('play')
      expect(scene.targets.map((target) => getGroup(first.game.board, target)!.liberties.length).sort()).toEqual([1, 2])
    }
  })

  it.each([['ladder-guided', 5, 'G1'], ['ladder-check', 2, 'F5']] as const)('%s 有接应时连上并逃出', (id, rounds, helper) => {
    const scene = CAPTURE_SCENES.find((scene) => scene.id === id)!
    const contrast = startCapture(scene, scene.contrastRows)
    expect(getGroup(contrast.game.board, scene.targets[0])?.liberties).toHaveLength(2)
    const replay = captureReplay(scene, 'contrast')
    expect(replay.run).toMatchObject({ stage: 'failed', failure: 'escape', moves: rounds })
    expect(replay.frames).toHaveLength(2 * rounds + 1)
    const group = getGroup(replay.run.game.board, scene.targets[0])!
    expect(group.stones).toContainEqual(point(helper))
    expect(group.liberties).toHaveLength(3)
  })
})

describe('追吃回合', () => {
  it('非法点不消耗手数；合法的非解法也由白棋现算；可撤回整对落子', () => {
    const start = direction()
    const invalid = capturePoint(start, start.scene.targets[0])
    expect(invalid).toMatchObject({ moves: 0, mistakes: 1, rounds: [] })
    expect(invalid.game).toBe(start.game)
    expect(invalid.message).toContain('这里已经有棋子')
    const wrong = capturePoint(invalid, start.scene.wrongFirst)
    expect(wrong.game.history[1]).toMatchObject({ color: 'white', point: point('C4') })
    expect(wrong.mistakes).toBe(2)
    const undone = undoCapture(wrong)
    expect(undone).toMatchObject({ stage: 'active', moves: 0, mistakes: 2, rounds: [] })
    expect(undone.game).toBe(start.game)
    expect(undoCapture(undone)).toBe(undone)
  })

  it('最后一手提到先判胜；白反提和逃出优先于手数用完', () => {
    const start = direction()
    const win = start.scene.solution.reduce(capturePoint, start)
    expect(win.stage).toBe('done')
    expect(win.moves).toBe(start.scene.maxMoves)
    expect(undoCapture(win)).toBe(win)
    const short = startCapture({ ...start.scene, maxMoves: 1 })
    expect(capturePoint(short, start.scene.solution[0]).failure).toBe('budget')
    expect(capturePoint(short, start.scene.wrongFirst).failure).toBe('escape')

    const danger = startCapture({ ...start.scene, maxMoves: 1, targets: [point('C3')],
      rows: ['.........', '.O.O.....', '.XOX.....', '.O.O.....', '.........', '.........', '.........', '.........', '.........'] })
    expect(capturePoint(danger, point('I9'))).toMatchObject({ stage: 'failed', failure: 'countercapture', mistakes: 1 })
  })

  it('完成方式依次区分演示、提示、引导、重试、独立', () => {
    const guided = direction()
    const solo = check()
    const solve = (run: typeof solo) => run.scene.solution.reduce(capturePoint, run)
    expect(captureCompletion(solve(solo))).toBe('independent')
    expect(captureCompletion(solve(undoCapture(capturePoint(solo, solo.scene.wrongFirst))))).toBe('retry')
    expect(captureCompletion(solve(guided))).toBe('guided')
    expect(captureCompletion(solve(captureHint(guided)))).toBe('hint')
    const demo = captureHint(captureHint(captureHint(guided)))
    expect(demo).toMatchObject({ stage: 'done', hint: 3, assisted: true })
    expect(captureCompletion(demo)).toBe('demo')
  })
})

it.each([['connection-guided', 3], ['connection-check', 4]] as const)('%s 硬接合法，整块只剩一气，下一手一起被提', (id, count) => {
  const scene = CAPTURE_SCENES.find(scene => scene.id === id)!
  const [attack, connect, captured] = connectionFrames(scene)
  expect(captureReply(attack, scene.targets)).toBeNull()
  expect(getGroup(attack.board, scene.targets[0])!.stones).toHaveLength(1)
  const group = getGroup(connect.board, scene.connection!)!
  expect(group.stones).toHaveLength(count)
  expect(group.stones).toContainEqual(scene.targets[0])
  expect(group.liberties).toHaveLength(1)
  for (const stone of group.stones) expect(getCell(captured.board, stone)).toBeNull()
  expect(captured.history.at(-1)).toMatchObject({ kind: 'play', color: 'black', point: group.liberties[0], captured: expect.arrayContaining([...group.stones]) })
})
