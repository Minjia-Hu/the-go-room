// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LESSONS } from '../../content/lessons'
import { pointLabel } from '../board/geometry'
import { LessonPage } from './LessonPage'

afterEach(cleanup)

function click(x: number, y: number) {
  fireEvent.click(screen.getByRole('button', { name: pointLabel({ x, y }) }))
}

describe('LessonPage', () => {
  it('数气过关后保留五口气供对照，重来时清除', () => {
    const { container } = render(<LessonPage lessons={[LESSONS[1]]} onFinish={() => {}} />)
    for (const [x, y] of [[3, 4], [6, 4], [5, 3], [4, 5], [5, 5]]) click(x, y)
    expect(screen.getByRole('status').textContent).toContain('5 口气')
    expect(container.querySelectorAll('[data-mark="selected"]')).toHaveLength(5)
    fireEvent.click(screen.getByRole('button', { name: '重来这一关' }))
    expect(container.querySelectorAll('[data-mark="selected"]')).toHaveLength(0)
  })
  it('显示第一关的标题、说明和任务', () => {
    render(<LessonPage lessons={LESSONS} onFinish={() => {}} />)
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('第 1 关:落子')
    expect(screen.getByText(LESSONS[0].intro)).toBeTruthy()
    expect(screen.getByText('在棋盘上任意一个交叉点下一颗黑子。')).toBeTruthy()
    expect(screen.queryByRole('button', { name: '下一关' })).toBeNull()
  })

  it('完成一关后出现成功提示和下一关按钮', () => {
    render(<LessonPage lessons={LESSONS} onFinish={() => {}} />)
    click(4, 4)
    expect(screen.getByRole('status').textContent).toContain('这就是落子')
    fireEvent.click(screen.getByRole('button', { name: '下一关' }))
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('第 2 关:气')
  })

  it('下错时显示提示,可以重来这一关', () => {
    render(<LessonPage lessons={[LESSONS[2]]} onFinish={() => {}} />)
    click(0, 0)
    expect(screen.getByRole('status').textContent).toContain('找一找白子紧挨着的空点')
    click(5, 4)
    expect(screen.getByRole('status').textContent).toContain('白子的最后一口气没了,被提走了')
    fireEvent.click(screen.getByRole('button', { name: '重来这一关' }))
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('最后一关完成后点"去对局"触发回调', () => {
    const onFinish = vi.fn()
    render(<LessonPage lessons={[LESSONS[0]]} onFinish={onFinish} />)
    click(4, 4)
    fireEvent.click(screen.getByRole('button', { name: '去对局' }))
    expect(onFinish).toHaveBeenCalledTimes(1)
  })
})
