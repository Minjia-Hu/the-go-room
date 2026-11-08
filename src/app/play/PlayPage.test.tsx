// @vitest-environment jsdom
import { StrictMode, useState } from 'react'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { chooseMove } from '../../ai'
import { createGame, parseBoard } from '../../engine'
import { PlayPage } from './PlayPage'
import { computerMove, createMatch, humanMove } from './match'
import type { Match } from './match'
import { createPlaySession } from './session'

vi.mock('../../ai', async (importOriginal) => ({ ...await importOriginal<typeof import('../../ai')>(), chooseMove: vi.fn() }))
const ai = vi.mocked(chooseMove)
function Harness({ initial = createMatch(), finish = () => {} }: { initial?: Match; finish?: (match: Match) => void }) {
  const [session, setSession] = useState(() => ({ ...createPlaySession(42), match: initial }))
  return <PlayPage session={session} onChange={setSession} onFinish={finish} coaching={false} onCoachingChange={() => {}} />
}
const click = (x: number, y: number) => fireEvent.click(screen.getByRole('button', { name: `交叉点 ${x},${y}` }))
const tick = (ms = 350) => act(() => { vi.advanceTimersByTime(ms) })
beforeEach(() => { vi.useFakeTimers(); ai.mockReset(); ai.mockReturnValue({ kind: 'pass' }) })
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks() })

describe('对局页', () => {
  it('严格模式下电脑只下一手，思考时不能抢下或停一手', () => {
    ai.mockReturnValue({ kind: 'play', point: { x: 3, y: 3 } })
    const { container } = render(<StrictMode><Harness /></StrictMode>)
    click(4, 4)
    expect(screen.getByRole('button', { name: '停一手' }).hasAttribute('disabled')).toBe(true)
    click(0, 0)
    tick()
    expect(ai).toHaveBeenCalledTimes(1)
    expect(container.querySelectorAll('[data-stone]')).toHaveLength(2)
    expect(screen.getByText('已下 2 手')).toBeTruthy()
    click(4, 4)
    expect(screen.getByRole('alert').textContent).toContain('已经有棋子')
  })

  it('卸载会取消待执行的电脑回合', () => {
    const { unmount } = render(<Harness />)
    click(4, 4)
    unmount()
    tick()
    expect(ai).not.toHaveBeenCalled()
  })

  it('重新开始需要确认，并取消旧局电脑回合', () => {
    const { container } = render(<Harness />)
    click(4, 4)
    fireEvent.click(screen.getByRole('button', { name: '重新开始' }))
    tick()
    expect(ai).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '确认重新开始' }))
    tick()
    expect(container.querySelectorAll('[data-stone]')).toHaveLength(0)
    expect(screen.getByText('已下 0 手')).toBeTruthy()
  })

  it('取消重开后继续电脑回合', () => {
    render(<Harness />)
    click(4, 4)
    fireEvent.click(screen.getByRole('button', { name: '重新开始' }))
    fireEvent.click(screen.getByRole('button', { name: '继续这盘' }))
    tick()
    expect(ai).toHaveBeenCalledTimes(1)
  })

  it('电脑非法落子或抛异常会停一手并记日志', () => {
    const log = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(<Harness />)
    ai.mockReturnValueOnce({ kind: 'play', point: { x: 4, y: 4 } })
    click(4, 4)
    tick()
    expect(log).toHaveBeenCalledTimes(1)
    ai.mockImplementationOnce(() => { throw new Error('failed') })
    click(4, 5)
    tick()
    expect(log).toHaveBeenCalledTimes(2)
    expect(screen.getByText('已下 4 手')).toBeTruthy()
  })

  it('死子按整块切换，确认交出最终局面和标记', () => {
    let match = { ...createMatch(), game: createGame({ board: parseBoard(['XX.', '...', '...']) }) }
    match = computerMove(humanMove(match, null), { kind: 'pass' }).match
    const finish = vi.fn()
    const { container } = render(<Harness initial={match} finish={finish} />)
    click(0, 0)
    expect(container.querySelectorAll('[data-mark="dead"]')).toHaveLength(2)
    click(1, 0)
    expect(container.querySelectorAll('[data-mark="dead"]')).toHaveLength(0)
    click(1, 0)
    fireEvent.click(screen.getByRole('button', { name: '确认数子，进入复盘' }))
    expect(finish.mock.calls[0][0].dead).toHaveLength(2)
    expect(ai).not.toHaveBeenCalled()
  })

  it('提子位置标记会消失，叫吃标记可切换', () => {
    const initial = { ...createMatch(), game: createGame({ board: parseBoard(['.XO..', 'XO...', '.....', '.....', '.....']), toPlay: 'white' }) }
    const match = computerMove(initial, { kind: 'play', point: { x: 0, y: 0 } }).match
    const { container } = render(<Harness initial={match} />)
    expect(container.querySelectorAll('[data-mark="captured"]')).toHaveLength(1)
    fireEvent.click(screen.getByRole('checkbox', { name: '显示只剩一口气的棋块' }))
    expect(container.querySelectorAll('[data-mark="ring"]').length).toBeGreaterThan(0)
    tick(1200)
    expect(container.querySelectorAll('[data-mark="captured"]')).toHaveLength(0)
  })
})


describe('主动数子', () => {
  it('确认前不改变盘面；可取消、标死子后返回原局面，且不调用电脑选点', () => {
    ai.mockReturnValue({ kind: 'play', point: { x: 3, y: 3 } })
    const finish = vi.fn()
    const { container } = render(<StrictMode><Harness finish={finish} /></StrictMode>)
    click(4, 4)
    expect(screen.getByRole('button', { name: '提出结束并数子' }).hasAttribute('disabled')).toBe(true)
    tick()
    const press = (name: string) => fireEvent.click(screen.getByRole('button', { name }))
    press('提出结束并数子')
    click(0, 0)
    expect(screen.getByText('已下 2 手')).toBeTruthy()
    press('继续下棋')
    expect(screen.queryByRole('button', { name: '确认数子，进入复盘' })).toBeNull()
    press('提出结束并数子'); press('双方同意，开始数子'); tick()
    expect(screen.getByText('已下 4 手')).toBeTruthy()
    expect(ai).toHaveBeenCalledTimes(1)
    click(4, 4)
    expect(container.querySelectorAll('[data-mark="dead"]')).toHaveLength(1)
    press('返回继续下')
    expect(screen.getByText('已下 2 手')).toBeTruthy()
    expect(container.querySelectorAll('[data-mark="dead"]')).toHaveLength(0)
    expect(container.querySelectorAll('[data-stone]')).toHaveLength(2)
    expect(finish).not.toHaveBeenCalled()
    press('提出结束并数子'); press('双方同意，开始数子'); press('确认数子，进入复盘')
    expect(finish).toHaveBeenCalledTimes(1)
    expect(finish.mock.calls[0][0].agreedPasses).toBe(2)
    expect(finish.mock.calls[0][0].dead).toEqual([])
  })
  it('仅在玩家停手而电脑实际落子后提示可提出数子', () => {
    ai.mockReturnValue({ kind: 'play', point: { x: 3, y: 3 } })
    render(<Harness />)
    expect(screen.queryByText(/你停了一手，电脑选择继续/)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '停一手' }))
    expect(screen.queryByText(/你停了一手，电脑选择继续/)).toBeNull()
    tick()
    expect(screen.getByText(/你停了一手，电脑选择继续/)).toBeTruthy()
    click(4, 4)
    expect(screen.queryByText(/你停了一手，电脑选择继续/)).toBeNull()
  })
  it('电脑跟停后不显示继续落子的提示，自然终局也能返回', () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: '停一手' })); tick()
    expect(screen.queryByText(/你停了一手，电脑选择继续/)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '返回继续下' }))
    expect(screen.getByText('已下 0 手')).toBeTruthy()
  })
})
