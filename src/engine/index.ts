export * from './types'
export {
  boardKey,
  createBoard,
  getCell,
  isOnBoard,
  neighbors,
  opponent,
  parseBoard,
  samePoint,
  toIndex,
  toPoint,
} from './board'
export { getGroup } from './groups'
export { createGame, inspectPlay, pass, play } from './game'
export type { GameOptions, PlayInspection } from './game'
export { scoreGame, toggleDeadGroup } from './scoring'
