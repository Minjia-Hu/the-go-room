import { describe, expect, it } from 'vitest'
import { getCell, getGroup, neighbors, toIndex } from '../../engine'
import { STRATEGY_LESSONS } from '../../content/strategy'
import { emptyRegion } from './endgameRunner'
import { answerStrategy, chooseStrategy, startStrategy, strategyPoint, strategyPositions, strategyStep, strategyView } from './strategyRunner'

describe('策略课棋形核验', () => {
  it('七条固定变化的每一手都合法、黑白交替，不改变初始盘面', () => {
    for (const lesson of STRATEGY_LESSONS) for (const choice of lesson.choices) {
      const positions = strategyPositions(choice)
      expect(positions).toHaveLength(choice.moves.length + 1)
      expect(positions[0].history).toEqual([])
      for (let i = 1; i < positions.length; i++) {
        expect(positions[i].history).toHaveLength(i)
        expect(positions[i].history.at(-1)).toMatchObject({ kind: 'play', color: i % 2 ? 'black' : 'white', point: choice.moves[i - 1].point })
        for (let y = 0; y < 9; y++) for (let x = 0; x < 9; x++) {
          const group = getGroup(positions[i].board, { x, y })
          if (group) expect(group.liberties.length).toBeGreaterThan(0)
        }
      }
      expect(getCell(positions[0].board, choice.moves[0].point)).toBeNull()
      expect(positions[0].history).toEqual([])
    }
  })
  it('先救棋保住原来的两颗并增加气；去远处时确实被提两颗', () => {
    const lesson = STRATEGY_LESSONS[0]
    expect(strategyView(startStrategy(lesson)).group?.liberties).toHaveLength(1)
    const rescue = strategyView(strategyStep(chooseStrategy(startStrategy(lesson), 0), 2))
    expect(rescue.remaining).toHaveLength(2)
    expect(rescue.group?.stones).toHaveLength(3)
    expect(rescue.group?.liberties).toHaveLength(2)
    expect(rescue.capturedBlack).toBe(0)
    const far = strategyView(strategyStep(chooseStrategy(startStrategy(lesson), 1), 2))
    expect(far.remaining).toHaveLength(0)
    expect(far.capturedBlack).toBe(2)
    expect(getCell(far.game.board, { x: 6, y: 6 })).toBe('black')
  })
  it('角、边、中腹从开放缺口变为同样四空点，边界分别为 5、8、12 子', () => {
    STRATEGY_LESSONS[1].choices.forEach((choice, index) => {
      const positions = strategyPositions(choice)
      const area = choice.area!
      expect(emptyRegion(positions[0].board, area[0]).length).toBeGreaterThan(4)
      for (const state of positions.slice(1)) {
        const region = emptyRegion(state.board, area[0])
        expect(region).toHaveLength(4)
        expect(region).toEqual(expect.arrayContaining([...area]))
        const regionIndexes = new Set(region.map((point) => toIndex(state.board, point)))
        for (const point of region) for (const next of neighbors(state.board, point)) {
          if (!regionIndexes.has(toIndex(state.board, next))) expect(getCell(state.board, next)).toBe('black')
        }
        expect(state.board.cells.filter((color) => color === 'black')).toHaveLength([5, 8, 12][index])
        expect(getGroup(state.board, choice.moves[0].point)?.stones).toHaveLength([5, 8, 12][index])
      }
    })
  })
  it('追两手没有提白却丢两黑；先保护的路线保留目标并增至四气', () => {
    const lesson = STRATEGY_LESSONS[2]
    const chase = chooseStrategy(startStrategy(lesson), 0)
    const escaped = strategyView(strategyStep(chase, 2))
    expect(getGroup(escaped.game.board, { x: 6, y: 2 })?.liberties).toHaveLength(3)
    const chased = strategyView(strategyStep(chase, 4))
    expect(chased.capturedWhite).toBe(0)
    expect(chased.capturedBlack).toBe(2)
    expect(chased.remaining).toHaveLength(0)
    const protectedView = strategyView(strategyStep(chooseStrategy(startStrategy(lesson), 1), 4))
    expect(protectedView.capturedBlack).toBe(0)
    expect(protectedView.remaining).toHaveLength(2)
    expect(protectedView.group?.stones).toHaveLength(4)
    expect(protectedView.group?.liberties).toHaveLength(4)
  })
})

describe('策略课进度', () => {
  it('只看黑棋落子不能完成比较，全部看完仍须答对原因', () => {
    let run = startStrategy(STRATEGY_LESSONS[0])
    expect(answerStrategy(run, 1)).toBe(run)
    run = chooseStrategy(run, 0)
    expect(run.step).toBe(1)
    expect(run.seen).toEqual([])
    run = strategyStep(run, 2)
    expect(run.seen).toEqual([0])
    expect(answerStrategy(run, 1)).toBe(run)
    run = strategyStep(chooseStrategy(run, 1), 2)
    expect(run.done).toBe(false)
    expect(answerStrategy(run, 0).done).toBe(false)
    expect(answerStrategy(run, 1).done).toBe(true)
    expect(answerStrategy(run, 99)).toBe(run)
  })
  it('切换与回看保留比较记录，重复看不重复计数，重新开始清空本课', () => {
    let run = strategyStep(chooseStrategy(startStrategy(STRATEGY_LESSONS[2]), 0), 4)
    run = strategyStep(strategyStep(run, 0), 4)
    expect(run.seen).toEqual([0])
    run = chooseStrategy(run, 1)
    expect(run.step).toBe(1)
    expect(run.seen).toEqual([0])
    expect(startStrategy(run.lesson)).toMatchObject({ seen: [], step: 0, choiceIndex: null, done: false })
  })
  it('棋盘只允许选候选点；已经开始变化时不能偷偷落子', () => {
    const initial = startStrategy(STRATEGY_LESSONS[0])
    expect(strategyPoint(initial, { x: 0, y: 0 }).choiceIndex).toBeNull()
    const run = strategyPoint(initial, { x: 6, y: 6 })
    expect(run.choiceIndex).toBe(1)
    expect(strategyPoint(run, { x: 4, y: 5 })).toBe(run)
    expect(chooseStrategy(run, -1)).toBe(run)
    expect(strategyStep(run, NaN)).toBe(run)
  })
  it('独立围地棋形的候选点只作用在当前图，不混入另一张棋盘', () => {
    let run = chooseStrategy(startStrategy(STRATEGY_LESSONS[1]), 2)
    run = strategyStep(run, 0)
    const board = strategyView(run).game.board
    expect(strategyPoint(run, { x: 2, y: 1 }).choiceIndex).toBe(2)
    expect(strategyView(strategyPoint(run, { x: 2, y: 1 })).game.board).toEqual(board)
    run = strategyPoint(run, { x: 3, y: 2 })
    expect(run.step).toBe(1)
    expect(strategyView(run).blackStones).toBe(12)
  })
})
