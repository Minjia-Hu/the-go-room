// @vitest-environment jsdom
import { StrictMode, useState } from 'react'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { chooseMove } from '../../ai'
import { createGame, parseBoard } from '../../engine'
import { PlayPage } from './PlayPage'
import { createPlaySession } from './session'
import type { PlaySession } from './session'

vi.mock('../../ai', async (importOriginal) => ({ ...await importOriginal<typeof import('../../ai')>(), chooseMove: vi.fn() }))
const ai = vi.mocked(chooseMove)
function Harness({ initial = createPlaySession(42) }: { initial?: PlaySession }) {
  const [session, setSession] = useState(initial)
  const [coaching, setCoaching] = useState(true)
  return <PlayPage session={session} onChange={setSession} onFinish={() => {}} coaching={coaching} onCoachingChange={setCoaching} />
}
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }))
const point = (x: number, y: number) => click(`交叉点 ${x},${y}`)
const tick = () => act(() => { vi.advanceTimersByTime(350) })
beforeEach(() => { vi.useFakeTimers(); ai.mockReset().mockReturnValue({ kind: 'pass' }) })
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks() })
describe('陪练交互', () => {
  it('默认试下不走棋，确认仅下一手；取消不消耗回合', () => {
    render(<StrictMode><Harness /></StrictMode>)
    point(4, 4); tick()
    expect(ai).not.toHaveBeenCalled()
    expect(screen.getByText('已下 0 手')).toBeTruthy()
    click('重新选点')
    expect(screen.queryByRole('button', { name: '下在这里' })).toBeNull()
    point(3, 3); click('下在这里'); tick()
    expect(ai).toHaveBeenCalledTimes(1)
    expect(screen.getByText('已下 2 手')).toBeTruthy()
    point(3, 3)
    expect(screen.getByLabelText('陪练提示').textContent).toContain('这块黑棋有 1 颗棋')
  })
  it('逐级提示不自动落子，点建议仍需确认；关陪练清除预览', () => {
    render(<Harness />)
    click('给我一点提示'); click('看一个可尝试的点'); click('试试这个点')
    expect(screen.getByText('已下 0 手')).toBeTruthy()
    fireEvent.click(screen.getByRole('checkbox', { name: /新手陪练/ }))
    expect(screen.queryByText('试下中，尚未落子')).toBeNull()
    point(4, 4); tick()
    expect(screen.getByText('已下 2 手')).toBeTruthy()
  })
  it('危险应手演示不是真实落子，返回后可以重新选点', () => {
    const base = createPlaySession(42)
    const initial = { ...base, match: { ...base.match, game: createGame({ board: parseBoard(['.....', '..O..', '.OXO.', '.....', '.....']) }) } }
    render(<Harness initial={initial} />)
    point(0, 0); click('看白棋怎样提'); tick()
    expect(ai).not.toHaveBeenCalled()
    expect(screen.getByText('已下 0 手')).toBeTruthy()
    expect(screen.queryByRole('button', { name: '下在这里' })).toBeNull()
    click('返回试下'); click('重新选点'); point(2, 3)
    expect(screen.getByLabelText('陪练提示').textContent).toContain('从 1 口气变成 3 口气')
  })
  it('提子对照保留、禁止落子，重试撤回整回合且只撤一次', () => {
    const base = createPlaySession(42)
    const initial = { ...base, match: { ...base.match, game: createGame({ board: parseBoard(['.....', '..O..', '.OXO.', '.....', '.....']) }) } }
    ai.mockReturnValue({ kind: 'play', point: { x: 2, y: 3 } })
    const { container } = render(<Harness initial={initial} />)
    point(0, 0); click('下在这里'); tick()
    expect(screen.getByLabelText('看懂这次提子')).toBeTruthy()
    expect(container.querySelectorAll('[data-stone="black"]')).toHaveLength(1)
    click('被吃前')
    expect(container.querySelectorAll('[data-stone="black"]')).toHaveLength(2)
    point(4, 4)
    expect(screen.queryByRole('button', { name: '下在这里' })).toBeNull()
    click('退回这一回合重试')
    expect(screen.getByText('已下 0 手')).toBeTruthy()
    expect(container.querySelectorAll('[data-stone="black"]')).toHaveLength(1)
    expect(screen.getByRole('button', { name: '退回这一回合重试' }).hasAttribute('disabled')).toBe(true)
  })
  it('停一手需要确认，进入数子后仍可重试', () => {
    render(<Harness />)
    click('停一手'); tick()
    expect(ai).not.toHaveBeenCalled()
    click('确认停一手'); tick()
    expect(screen.getByText('终局 · 标记死子')).toBeTruthy()
    click('退回这一回合重试')
    expect(screen.getByText('已下 0 手')).toBeTruthy()
  })
  it('新的非法选择清除旧确认，不能误提交之前的预览', () => {
    const base = createPlaySession(42)
    const initial = { ...base, match: { ...base.match, game: createGame({ board: parseBoard(['.O.', 'O..', '...']) }) } }
    render(<Harness initial={initial} />)
    point(2, 2)
    expect(screen.getByRole('button', { name: '下在这里' })).toBeTruthy()
    point(0, 0)
    expect(screen.queryByRole('button', { name: '下在这里' })).toBeNull()
    expect(screen.getByLabelText('陪练提示').textContent).toContain('禁入点')
  })
  it('同时两块危险时，对照演示对应用户选中的那一块', () => {
    const base = createPlaySession(42)
    const initial = { ...base, match: { ...base.match, game: createGame({ board: parseBoard(['.O.....', 'OXO....', '.......', '.....O.', '....OXO', '.......', '.......']) }) } }
    const { container } = render(<Harness initial={initial} />)
    point(6, 6); click('查看第 2 块 · 1 子'); click('看白棋怎样提')
    expect(container.querySelector('[data-stone="black"][data-x="1"][data-y="1"]')).toBeTruthy()
    expect(container.querySelector('[data-stone="black"][data-x="5"][data-y="4"]')).toBeNull()
    expect(screen.getByText('已下 0 手')).toBeTruthy()
  })
})
