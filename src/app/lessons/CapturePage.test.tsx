// @vitest-environment jsdom
import { useState } from 'react'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CAPTURE_SCENES } from '../../content/capture'
import { CapturePage } from './CapturePage'
import { startCapture } from './captureRunner'

afterEach(() => { cleanup(); vi.useRealTimers() })
function Harness({ index = 0, next = vi.fn(), play, nextLabel = '下一题' }: {
  index?: number; next?: () => void; play?: () => void; nextLabel?: string
}) {
  const [run, setRun] = useState(() => startCapture(CAPTURE_SCENES[index]))
  return <CapturePage run={run} onChange={setRun} onNext={next} nextLabel={nextLabel} onPlay={play} />
}
const button = (name: string) => screen.getByRole('button', { name })
const click = (name: string) => fireEvent.click(button(name))
const point = (x: number, y: number) => click(`交叉点 ${x},${y}`)
const solid = () => [...document.querySelectorAll('.board-primary .button:not(.button--ghost)')].map((e) => e.textContent)
const stone = (x: number, y: number) => document.querySelector(`[data-stone][data-x="${x}"][data-y="${y}"]`)?.getAttribute('data-stone')

describe('追吃页面', () => {
  it('直接下错会看到真实白应，失败时只突出退回，撤销恢复两手', () => {
    render(<Harness />)
    expect(screen.getByText('追吃中 · 已下 0 手 / 最多 2 手')).toBeTruthy()
    const notes = screen.getByText('讲解与图例').closest('details')!
    expect(notes.open).toBe(false)
    expect(solid()).toEqual([])
    point(2, 1)
    expect(stone(2, 1)).toBe('black')
    expect(stone(2, 3)).toBe('white')
    expect(screen.getByText('这次没吃到')).toBeTruthy()
    expect(screen.getByRole('status').textContent).toBe('白棋逃出去了。')
    expect(button('交叉点 0,0').getAttribute('aria-disabled')).toBe('true')
    expect(solid()).toEqual(['退回一手'])
    click('退回一手')
    expect(stone(2, 1)).toBeUndefined()
    expect(stone(2, 3)).toBeUndefined()
    expect(screen.getByText('追吃中 · 已下 0 手 / 最多 2 手')).toBeTruthy()
  })

  it('完成后没有撤销，下一题按钮调用传入的去向', () => {
    const next = vi.fn()
    render(<Harness next={next} />)
    point(2, 3); point(2, 1)
    expect(stone(2, 2)).toBeUndefined()
    expect(screen.getByText('跟着引导完成')).toBeTruthy()
    expect(screen.queryByRole('button', { name: '退回一手' })).toBeNull()
    expect(solid()).toEqual(['下一题'])
    click('下一题')
    expect(next).toHaveBeenCalledOnce()
  })

  it('文字提示、标棋和逐手演示都从真实题目得到，演示记单独的完成方式', () => {
    vi.useFakeTimers()
    render(<Harness index={1} />)
    click('提醒我看哪里')
    expect(screen.getByRole('status').textContent).toContain(CAPTURE_SCENES[1].hints[0])
    expect(document.querySelectorAll('[data-mark="target"]')).toHaveLength(0)
    click('标出目标白棋和气')
    expect(document.querySelectorAll('[data-mark="target"]')).toHaveLength(1)
    expect(document.querySelectorAll('[data-mark="liberty"]')).toHaveLength(2)
    click('演示一种做法')
    expect(stone(6, 0)).toBe('white')
    act(() => vi.advanceTimersByTime(500))
    expect(stone(6, 1)).toBe('black')
    act(() => vi.advanceTimersByTime(3000))
    expect(stone(6, 0)).toBeUndefined()
    expect(screen.getByText('跟着演示完成')).toBeTruthy()
  })

  it('征子对照从各自原图逐手回放，结束得到失败说明，回去保留正解', () => {
    const scene = CAPTURE_SCENES[4]
    render(<Harness index={4} />)
    for (const move of scene.solution) point(move.x, move.y)
    const comparison = screen.getByText('看看对照').closest('details')!
    expect(comparison.open).toBe(false)
    comparison.open = true
    click('如果先从另一边叫吃')
    expect(stone(4, 4)).toBe('white')
    click('下一手'); click('下一手')
    expect(stone(4, 5)).toBe('white')
    expect(screen.getByRole('status').textContent).toContain('白棋逃出去了')
    click('如果路上有白子')
    expect(stone(6, 0)).toBe('white')
    for (let i = 0; i < 10; i++) click('下一手')
    expect(stone(6, 1)).toBe('white')
    expect(screen.getByRole('status').textContent).toContain('白棋逃出去了')
    expect(screen.getByRole('status').textContent).toContain('连上了路上的白棋，现在有 3 口气')
    click('上一手')
    expect(stone(6, 1)).toBeUndefined()
    click('回看原图')
    expect(stone(6, 0)).toBe('white')
    click('返回解题结果')
    expect(stone(4, 4)).toBeUndefined()
    expect(screen.getByText('跟着引导完成')).toBeTruthy()
  })

  it('末题以终局为主操作，并保留单独的陪练去向', () => {
    const scoring = vi.fn()
    const play = vi.fn()
    render(<Harness index={5} next={scoring} nextLabel="学习围地与终局 →" play={play} />)
    for (const move of CAPTURE_SCENES[5].solution) point(move.x, move.y)
    expect(solid()).toEqual(['学习围地与终局 →'])
    expect(button('开始我的陪练').className).toContain('button--ghost')
    click('学习围地与终局 →'); click('开始我的陪练')
    expect(scoring).toHaveBeenCalledOnce()
    expect(play).toHaveBeenCalledOnce()
  })
})
