// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createBoard, parseBoard } from '../../engine'
import { Board } from './Board'
import { pointLabel, starPoints } from './geometry'

afterEach(cleanup)

describe('starPoints', () => {
  it('9 路有四个三三和天元', () => {
    expect(starPoints(9)).toEqual([
      { x: 2, y: 2 },
      { x: 6, y: 2 },
      { x: 2, y: 6 },
      { x: 6, y: 6 },
      { x: 4, y: 4 },
    ])
  })

  it('5 路没有星位', () => {
    expect(starPoints(5)).toEqual([])
  })
})

describe('Board', () => {
  it('键盘可落子，禁用时不触发且不进入 Tab 顺序', () => {
    const onPointClick = vi.fn()
    const { rerender } = render(<Board board={createBoard(9)} onPointClick={onPointClick} />)
    const point = screen.getByRole('button', { name: pointLabel({ x: 0, y: 0 }) })
    expect(point.getAttribute('tabindex')).toBe('0')
    fireEvent.keyDown(point, { key: 'Enter' })
    fireEvent.keyDown(point, { key: ' ' })
    expect(onPointClick).toHaveBeenCalledTimes(2)
    rerender(<Board board={createBoard(9)} disabled onPointClick={onPointClick} />)
    fireEvent.keyDown(point, { key: 'Enter' })
    expect(point.getAttribute('tabindex')).toBe('-1')
    expect(onPointClick).toHaveBeenCalledTimes(2)
  })
  it('每个交叉点都是一个可点的按钮', () => {
    render(<Board board={createBoard(9)} />)
    expect(screen.getAllByRole('button')).toHaveLength(81)
    expect(screen.getByRole('button', { name: pointLabel({ x: 0, y: 0 }) })).toBeTruthy()
  })

  it('按盘面画出黑白子', () => {
    const { container } = render(<Board board={parseBoard(['X.', '.O'])} />)
    const black = container.querySelectorAll('[data-stone="black"]')
    const white = container.querySelectorAll('[data-stone="white"]')
    expect(black).toHaveLength(1)
    expect(black[0].getAttribute('data-x')).toBe('0')
    expect(black[0].getAttribute('data-y')).toBe('0')
    expect(white).toHaveLength(1)
    expect(white[0].getAttribute('data-x')).toBe('1')
    expect(white[0].getAttribute('data-y')).toBe('1')
  })

  it('点交叉点时回调坐标', () => {
    const onPointClick = vi.fn()
    render(<Board board={createBoard(9)} onPointClick={onPointClick} />)
    fireEvent.click(screen.getByRole('button', { name: pointLabel({ x: 3, y: 5 }) }))
    expect(onPointClick).toHaveBeenCalledWith({ x: 3, y: 5 })
  })

  it('disabled 时点了没反应', () => {
    const onPointClick = vi.fn()
    render(<Board board={createBoard(9)} disabled onPointClick={onPointClick} />)
    fireEvent.click(screen.getByRole('button', { name: pointLabel({ x: 3, y: 5 }) }))
    expect(onPointClick).not.toHaveBeenCalled()
  })

  it('画出标记和最后一手', () => {
    const { container } = render(
      <Board
        board={parseBoard(['X..', '...', '...'])}
        lastMove={{ x: 0, y: 0 }}
        marks={[
          { point: { x: 0, y: 0 }, kind: 'ring' },
          { point: { x: 1, y: 1 }, kind: 'dot' },
          { point: { x: 2, y: 2 }, kind: 'selected' },
        ]}
      />,
    )
    expect(container.querySelectorAll('[data-mark="ring"]')).toHaveLength(1)
    expect(container.querySelectorAll('[data-mark="dot"]')).toHaveLength(1)
    expect(container.querySelectorAll('[data-mark="selected"]')).toHaveLength(1)
    expect(container.querySelectorAll('[data-mark="last"]')).toHaveLength(1)
  })

  it('悬停在空点上预览棋子,悬停在棋子上不预览', () => {
    const { container } = render(<Board board={parseBoard(['X..', '...', '...'])} ghostColor="black" />)
    fireEvent.mouseEnter(screen.getByRole('button', { name: pointLabel({ x: 1, y: 1 }) }))
    expect(container.querySelectorAll('[data-ghost="black"]')).toHaveLength(1)
    fireEvent.mouseEnter(screen.getByRole('button', { name: pointLabel({ x: 0, y: 0 }) }))
    expect(container.querySelectorAll('[data-ghost]')).toHaveLength(0)
  })
})
