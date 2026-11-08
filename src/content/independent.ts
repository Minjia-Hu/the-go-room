import type { Point } from '../engine'

export interface IndependentScene {
  readonly id: string
  readonly kind: 'extend' | 'capture' | 'connect'
  readonly rows: readonly string[]
  readonly target: Point
  readonly example: Point
  readonly partner?: Point
  readonly focus?: Point
}

export const INDEPENDENT_SCENES: readonly IndependentScene[] = [
  { id: 'extend-1', kind: 'extend',
    rows: [".X.....O.", ".......O.", "...OO....", "..OXXO...", "..OX.....", "...O.....", ".........", "......XX.", "........."],
    target: { x: 3, y: 3 },
    example: { x: 4, y: 4 },
  },
  { id: 'capture-1', kind: 'capture',
    rows: [".........", ".X.......", "....XOX..", "....OXO..", "....O.O..", ".........", "XX.......", ".......O.", "........."],
    target: { x: 5, y: 3 },
    example: { x: 5, y: 1 },
    focus: { x: 5, y: 2 },
  },
  { id: 'connect-1', kind: 'connect',
    rows: [".......O.", ".X.......", ".........", "..O.X....", ".OX.X....", ".OXO.....", "..O......", ".......X.", "........."],
    target: { x: 2, y: 4 },
    example: { x: 3, y: 4 },
    partner: { x: 4, y: 4 },
  },
  { id: 'extend-2', kind: 'extend',
    rows: ["X........", ".XX......", ".........", ".....O...", ".....XO..", "...OXXO..", "....OO...", ".O.......", ".O.....X."],
    target: { x: 5, y: 5 },
    example: { x: 4, y: 4 },
  },
  { id: 'capture-2', kind: 'capture',
    rows: ["..X.O....", "..X....X.", ".........", ".........", "....OOX..", ".....XO..", "....OOX..", ".O.......", "........."],
    target: { x: 5, y: 5 },
    example: { x: 7, y: 5 },
    focus: { x: 6, y: 5 },
  },
  { id: 'connect-2', kind: 'connect',
    rows: ["O........", ".X.......", "......O..", ".....OXO.", "....X.XO.", "....X.O..", ".........", ".......X.", ".O......."],
    target: { x: 6, y: 4 },
    example: { x: 5, y: 4 },
    partner: { x: 4, y: 4 },
  },
]
