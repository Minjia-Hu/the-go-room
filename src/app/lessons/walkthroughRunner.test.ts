import { describe, expect, it } from 'vitest'
import { getCell, getGroup, scoreGame, toPoint } from '../../engine'
import { WALK_MOVES, WALK_QUESTIONS } from '../../content/walkthrough'
import { emptyRegion } from './endgameRunner'
import { answerWalk, nextWalkKey, startWalk, walkPositions, walkStep, walkView } from './walkthroughRunner'

describe('完整教学棋谱', () => {
  it('从空棋盘合法重放 67 次落子和两次停手，实际发生一次提子', () => {
    const positions = walkPositions()
    expect(positions).toHaveLength(70)
    expect(positions[0].board.cells.every((cell) => cell === null)).toBe(true)
    expect(getGroup(positions[17].board, { x: 1, y: 1 })?.liberties).toEqual([{ x: 2, y: 1 }])
    expect(positions[19].history.at(-1)).toMatchObject({ captured: [{ x: 1, y: 1 }] })
    expect(positions[67].phase).toBe('playing')
    expect(positions[68].consecutivePasses).toBe(1)
    expect(positions[69].phase).toBe('scoring')
    expect(positions[69].history.filter((move) => move.kind === 'play').flatMap((move) => move.captured)).toEqual([{ x: 1, y: 1 }])
    for (const state of positions) for (let i = 0; i < 81; i++) {
      const group = getGroup(state.board, toPoint(state.board, i))
      if (group) expect(group.liberties.length).toBeGreaterThan(0)
    }
  })
  it('终局无公共空点，双方只有一大块且各有多个分离内部空区，真实比分白胜 6.5', () => {
    const { board } = walkPositions().at(-1)!
    const score = scoreGame(board, [], 7.5)
    expect(score).toMatchObject({ black: 41, white: 40, winner: 'white', margin: 6.5 })
    expect(score.ownership.every((owner) => owner !== null)).toBe(true)
    for (const color of ['black', 'white'] as const) {
      const stones = board.cells.flatMap((cell, index) => cell === color ? [toPoint(board, index)] : [])
      const group = getGroup(board, stones[0])!
      expect(group.stones).toHaveLength(stones.length)
      const eyes = new Set(group.liberties.map((point) => emptyRegion(board, point).map((p) => p.y * 9 + p.x).sort((a, b) => a - b).join(',')))
      expect(eyes.size).toBeGreaterThanOrEqual(2)
      group.liberties.forEach((point) => expect(getCell(board, point)).toBeNull())
    }
    expect(board.cells.filter((cell) => cell === 'black')).toHaveLength(34)
    expect(board.cells.filter((cell) => cell === 'white')).toHaveLength(32)
  })
  it('关键问题会拦住跳转，错误回答不能通过，完成全部问题才能结束课程', () => {
    let run = startWalk()
    expect(walkStep(run, WALK_MOVES.length).step).toBe(0)
    expect(answerWalk(run, 1).answered).toEqual([])
    for (const question of WALK_QUESTIONS) {
      run = walkStep(run, question.step)
      expect(run.step).toBe(question.step)
      expect(walkView(run).done).toBe(false)
      run = answerWalk(run, question.answer)
    }
    expect(walkView(run).done).toBe(true)
    expect(walkStep(run, 17).answered).toHaveLength(6)
    expect(nextWalkKey(walkStep(run, 0)).step).toBe(6)
    expect(startWalk().answered).toEqual([])
  })
})
