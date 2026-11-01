// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ReplayPage } from './ReplayPage'
import type { SavedGame } from './records'

afterEach(cleanup)
const record: SavedGame = {
  id: 'first', endedAt: '2026-11-01T12:00:00Z', dead: [],
  moves: [{ kind: 'play', point: { x: 1, y: 0 } }, { kind: 'play', point: { x: 0, y: 0 } }, { kind: 'play', point: { x: 0, y: 1 } }, { kind: 'pass' }, { kind: 'pass' }],
}
const noop = () => {}

describe('复盘页', () => {
  it('逐区域高亮不混入另一方，得分等于手工数出的活子加空点', () => {
    const split: SavedGame = { ...record, moves: [
      ...Array.from({ length: 9 }, (_, y) => [
        { kind: 'play' as const, point: { x: 2, y } },
        { kind: 'play' as const, point: { x: 6, y } },
      ]).flat(), { kind: 'pass' }, { kind: 'pass' },
    ] }
    const { container } = render(<ReplayPage games={[split]} selectedId={null} onSelect={noop} onPlay={noop} storageMessage={null} />)
    expect(container.querySelectorAll('[data-mark="black-area"]')).toHaveLength(27)
    expect(container.querySelectorAll('[data-mark="white-area"]')).toHaveLength(27)
    fireEvent.click(screen.getByRole('button', { name: /黑方区域/ }))
    expect(container.querySelectorAll('[data-mark="black-area"]')).toHaveLength(27)
    expect(container.querySelectorAll('[data-mark="white-area"]')).toHaveLength(0)
    expect(screen.getByText('白方胜，领先 7.5')).toBeTruthy()
    expect(screen.getByRole('button', { name: /黑方区域/ }).textContent).toContain('9 子 + 18 空')
  })
  it('初始在末尾显示结果，逐步回看提子和停一手', () => {
    const { container } = render(<ReplayPage games={[record]} selectedId={null} onSelect={noop} onPlay={noop} storageMessage={null} />)
    expect(screen.getByRole('region', { name: '数子结果' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '下一步' }).hasAttribute('disabled')).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: '跳到开头' }))
    expect(container.querySelectorAll('[data-stone]')).toHaveLength(0)
    expect(screen.queryByRole('region', { name: '数子结果' })).toBeNull()
    for (let i = 0; i < 2; i++) fireEvent.click(screen.getByRole('button', { name: '下一步' }))
    expect(container.querySelectorAll('[data-stone]')).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: '下一步' }))
    expect(screen.getByRole('status').textContent).toContain('白方被提 1 子')
    expect(container.querySelectorAll('[data-mark="captured"]')).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: '下一步' }))
    expect(screen.getByRole('status').textContent).toBe('白方停一手。')
    fireEvent.click(screen.getByRole('button', { name: '跳到结尾' }))
    expect(screen.getByRole('region', { name: '数子结果' })).toBeTruthy()
    expect(container.querySelectorAll('[data-mark="black-area"]')).toHaveLength(81)
  })

  it('死子在结果盘面被移除，历史盘面仍保留；区域可选', () => {
    const withDead = { ...record, dead: [{ x: 1, y: 0 }] }
    const { container } = render(<ReplayPage games={[withDead]} selectedId={null} onSelect={noop} onPlay={noop} storageMessage={null} />)
    expect(container.querySelectorAll('[data-stone]')).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: /黑方区域/ }))
    expect(screen.getByRole('button', { name: /黑方区域/ }).getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: '上一步' }))
    expect(container.querySelectorAll('[data-stone]')).toHaveLength(2)
  })

  it('切换棋谱回到末尾，空历史提供入口', () => {
    const select = vi.fn()
    const play = vi.fn()
    const other = { ...record, id: 'second', moves: [{ kind: 'pass' as const }, { kind: 'pass' as const }] }
    const props = { games: [record, other], selectedId: record.id, onSelect: select, onPlay: play, storageMessage: null }
    const { rerender } = render(<ReplayPage {...props} />)
    fireEvent.click(screen.getByRole('button', { name: '跳到开头' }))
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'second' } })
    expect(select).toHaveBeenCalledWith('second')
    rerender(<ReplayPage {...props} selectedId="second" />)
    expect(screen.getByText('第 2 / 2 手')).toBeTruthy()
    rerender(<ReplayPage {...props} games={[]} />)
    expect(screen.getByText(/还没有已完成的棋谱/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '去对局' }))
    expect(play).toHaveBeenCalledTimes(1)
  })
})
