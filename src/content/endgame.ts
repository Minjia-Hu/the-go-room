import type { Color, Point } from '../engine'

export interface RuleSequenceScene {
  readonly id: string
  readonly title: string
  readonly rows: readonly string[]
  readonly point: Point
  readonly otherEye?: Point
  readonly target: Point
}

export const RULE_SEQUENCE_SCENES: readonly RuleSequenceScene[] = [
  { id: 'one-eye', title: '只剩一只眼：为什么白棋可以下？',
    rows: ['.........', '.........', '.OOOOOOO.', '.OXXXXXO.', '.OX.XXXO.', '.OXXXXXO.', '.OOOOOOO.', '.........', '.........'],
    point: { x: 3, y: 4 }, target: { x: 2, y: 3 } },
  { id: 'two-eyes', title: '两只眼：为什么同一个位置不能下？',
    rows: ['.........', '.........', '.OOOOOOO.', '.OXXXXXO.', '.OX.X.XO.', '.OXXXXXO.', '.OOOOOOO.', '.........', '.........'],
    point: { x: 3, y: 4 }, otherEye: { x: 5, y: 4 }, target: { x: 2, y: 3 } },
]

export interface TerritoryQuestion { readonly point: Point; readonly label: string; readonly expected: Color | null }
export type EndgameLessonId = 'territory' | 'count' | 'komi' | 'ending'
export interface EndgameLesson { readonly id: EndgameLessonId; readonly title: string; readonly intro: string }

/** 双方已确认其余棋子都活着的教学终局；中央空区接触双方。 */
export const SCORING_ROWS = ['XXXX.OOOO', 'X..X.O..O', 'XXXX.OOOO', 'X..X.O..O', 'XXXX..OOO', 'X..X.O..O', 'XXXX.OOOO', 'X..X.O..O', 'XXXX.OOOO'] as const
export const ENDING_ROWS = ['XXXX.OOOO', 'XO.X.O..O', ...SCORING_ROWS.slice(2)] as const
export const AGREED_DEAD: Point = { x: 1, y: 1 }
export const DEAD_CAPTURE: Point = { x: 2, y: 1 }
export const CONTINUE_POINT: Point = { x: 4, y: 0 }
export const TERRITORY_QUESTIONS: readonly TerritoryQuestion[] = [
  { point: { x: 1, y: 1 }, label: 'A', expected: 'black' },
  { point: { x: 6, y: 1 }, label: 'B', expected: 'white' },
  { point: { x: 4, y: 4 }, label: 'C', expected: null },
]
export const ENDGAME_LESSONS: readonly EndgameLesson[] = [
  { id: 'territory', title: '围住的空点属于谁', intro: '这是一张双方已结束、确认棋子都活着的教学盘面。沿相连的空点找边界：只接触黑棋的空区归黑，只接触白棋的归白；同时接触双方的都不算。棋盘边缘也能帮助围地。' },
  { id: 'count', title: '棋子和围住的空点都计分', intro: '本项目按中国规则数子。先数盘上活着的棋子，再数围住的空点，两者相加。被提走的棋子不再另外加一次分。这里没有待移除的死子。' },
  { id: 'komi', title: '白棋为什么加 7.5 分', intro: '黑棋先下，白棋得到后手补偿，叫“贴目”。本项目在结算时给白棋加 7.5 分；棋盘上不用再放棋子。半分还能避免平局。' },
  { id: 'ending', title: '停一手以后，怎样结束这一盘', intro: '当双方觉得没有需要继续下的地方，可以停一手。只有双方连续停一手，才进入数子。然后确认死子、移除它们，再计算活子与空点。这里使用固定教学局面。' },
]
