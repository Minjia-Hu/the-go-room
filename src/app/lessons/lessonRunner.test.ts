import { describe, expect, it } from 'vitest'
import { getCell } from '../../engine'
import { LESSONS } from '../../content/lessons'
import type { Lesson } from '../../content/lessons'
import { clickPoint, currentStep, isLessonDone, lessonMarks, startLesson } from './lessonRunner'

function lesson(id: string): Lesson {
  return LESSONS.find((l) => l.id === id)!
}

describe('startLesson', () => {
  it('按关卡定义建立局面,准备手已经下好', () => {
    const run = startLesson(lesson('ko'))
    expect(getCell(run.game.board, { x: 3, y: 3 })).toBe('white')
    expect(getCell(run.game.board, { x: 4, y: 3 })).toBeNull()
    expect(run.game.toPlay).toBe('black')
    expect(run.lastMove).toEqual({ x: 3, y: 3 })
    expect(run.stepIndex).toBe(0)
    expect(isLessonDone(run)).toBe(false)
  })

  it('准备手不合法时抛出明确错误', () => {
    const broken: Lesson = { ...lesson('place'), id: 'broken', setupMoves: [{ x: 0, y: 0 }, { x: 0, y: 0 }] }
    expect(() => startLesson(broken)).toThrow(/broken/)
  })

  it('高亮点有子画圈,空点画点', () => {
    const run = startLesson(lesson('suicide'))
    expect(lessonMarks(run)).toEqual([
      { point: { x: 2, y: 2 }, kind: 'dot' },
      { point: { x: 5, y: 6 }, kind: 'dot' },
    ])
    expect(lessonMarks(startLesson(lesson('capture')))).toEqual([{ point: { x: 4, y: 4 }, kind: 'ring' }])
  })
})

describe('place 步骤', () => {
  it('任意合法点算对,落子生效,本关完成', () => {
    const run = clickPoint(startLesson(lesson('place')), { x: 4, y: 4 })
    expect(getCell(run.game.board, { x: 4, y: 4 })).toBe('black')
    expect(run.lastMove).toEqual({ x: 4, y: 4 })
    expect(run.message?.kind).toBe('success')
    expect(isLessonDone(run)).toBe(true)
  })

  it('下错点时盘面不变,给出提示', () => {
    const start = startLesson(lesson('capture'))
    const run = clickPoint(start, { x: 0, y: 0 })
    expect(run.game).toBe(start.game)
    expect(run.message).toEqual({ kind: 'hint', text: '找一找白子紧挨着的空点,它只剩一个了。' })
    expect(run.stepIndex).toBe(0)
  })

  it('下对点时提子生效', () => {
    const run = clickPoint(startLesson(lesson('capture')), { x: 5, y: 4 })
    expect(getCell(run.game.board, { x: 4, y: 4 })).toBeNull()
    expect(run.message?.kind).toBe('success')
  })

  it('被引擎拒绝时按原因给提示', () => {
    const run = clickPoint(startLesson(lesson('suicide')), { x: 2, y: 2 })
    expect(run.message?.kind).toBe('hint')
    expect(run.message?.text).toContain('禁入点')
    expect(run.stepIndex).toBe(0)
  })

  it('没有针对性提示的拒绝用 fallbackHint', () => {
    const start = startLesson(lesson('capture'))
    const run = clickPoint(start, { x: 4, y: 4 })
    expect(run.message).toEqual({ kind: 'hint', text: '找一找白子紧挨着的空点,它只剩一个了。' })
  })

  it('expectReject:撞上预期的拒绝就完成本步', () => {
    const start = startLesson(lesson('ko'))
    const run = clickPoint(start, { x: 4, y: 3 })
    expect(run.game).toBe(start.game)
    expect(run.message?.kind).toBe('success')
    expect(run.stepIndex).toBe(1)
    expect(currentStep(run)?.goal).toBe('在别处下一手。')
  })

  it('expectReject:下在别处只给提示', () => {
    const run = clickPoint(startLesson(lesson('ko')), { x: 0, y: 0 })
    expect(run.message).toEqual({ kind: 'hint', text: '先试试在刚被提子的位置提回去。' })
    expect(run.stepIndex).toBe(0)
  })

  it('劫关卡走完两步', () => {
    let run = clickPoint(startLesson(lesson('ko')), { x: 4, y: 3 })
    run = clickPoint(run, { x: 0, y: 0 })
    expect(getCell(run.game.board, { x: 0, y: 0 })).toBe('black')
    expect(isLessonDone(run)).toBe(true)
  })
})

describe('select 步骤', () => {
  const targets = [
    { x: 3, y: 4 },
    { x: 6, y: 4 },
    { x: 5, y: 3 },
    { x: 4, y: 5 },
    { x: 5, y: 5 },
  ]

  it('点中目标点会记为已选,并画成 selected', () => {
    const run = clickPoint(startLesson(lesson('liberties')), targets[0])
    expect(run.selected).toEqual([targets[0]])
    expect(run.message).toBeNull()
    expect(lessonMarks(run)).toContainEqual({ point: targets[0], kind: 'selected' })
  })

  it('再点一次取消', () => {
    let run = clickPoint(startLesson(lesson('liberties')), targets[0])
    run = clickPoint(run, targets[0])
    expect(run.selected).toEqual([])
  })

  it('点错的点或棋子给提示,已选的不丢', () => {
    let run = clickPoint(startLesson(lesson('liberties')), targets[0])
    run = clickPoint(run, { x: 0, y: 0 })
    expect(run.message?.kind).toBe('hint')
    expect(run.selected).toEqual([targets[0]])
    run = clickPoint(run, { x: 4, y: 4 })
    expect(run.message?.kind).toBe('hint')
  })

  it('全部点出后完成', () => {
    let run = startLesson(lesson('liberties'))
    for (const t of targets) run = clickPoint(run, t)
    expect(run.message?.kind).toBe('success')
    expect(isLessonDone(run)).toBe(true)
    expect(run.selected).toEqual(targets)
    expect(lessonMarks(run).filter((mark) => mark.kind === 'selected')).toHaveLength(5)
    expect(startLesson(lesson('liberties')).selected).toEqual([])
  })

  it('多步骤关卡完成选择步骤后不会把标记带入下一步', () => {
    const source = lesson('liberties')
    const multi: Lesson = { ...source, steps: [...source.steps, lesson('place').steps[0]] }
    let run = startLesson(multi)
    for (const target of targets) run = clickPoint(run, target)
    expect(isLessonDone(run)).toBe(false)
    expect(run.selected).toEqual([])
  })
})

describe('clickPoint', () => {
  it('关卡完成后再点没有变化', () => {
    const done = clickPoint(startLesson(lesson('place')), { x: 4, y: 4 })
    expect(clickPoint(done, { x: 0, y: 0 })).toBe(done)
  })
})
