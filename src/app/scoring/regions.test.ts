import { expect, it } from 'vitest'
import { parseBoard } from '../../engine'
import { scoringView } from './regions'

it('逐区域分开活子和空点，双方接触的中间空点不计', () => {
  const view = scoringView(parseBoard(['.X.O.', '.X.O.', '.X.O.', '.X.O.', '.X.O.']), [], 7.5)
  expect(view.score).toMatchObject({ black: 10, white: 10, winner: 'white', margin: 7.5 })
  expect(view.regions.map(({ color, stones, territory }) => ({ color, stones, territory }))).toEqual([
    { color: 'black', stones: 5, territory: 5 }, { color: 'white', stones: 5, territory: 5 },
  ])
})

it('死子位置变为空点，原盘面保持不变', () => {
  const board = parseBoard(['.X.O.', '.X.O.', 'OX.O.', '.X.O.', '.X.O.'])
  const view = scoringView(board, [{ x: 0, y: 2 }], 7.5)
  expect(view.cleared.cells[10]).toBeNull()
  expect(board.cells[10]).toBe('white')
  expect(view.regions[0]).toMatchObject({ stones: 5, territory: 5 })
})
