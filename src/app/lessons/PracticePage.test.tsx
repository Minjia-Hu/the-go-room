// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../App'
import { pageFromHash } from '../router'
import { INDEPENDENT_SCENES } from '../../content/independent'
import { LEARNING_KEY, emptyLearningProgress } from './learningProgress'
import type { Completion } from './learningProgress'
import { PRACTICE_ITEMS } from './practiceCatalog'

beforeAll(() => {
  const environment = globalThis as unknown as { jsdom: { window: Window } }
  vi.stubGlobal('localStorage', environment.jsdom.window.localStorage)
})
afterAll(() => vi.unstubAllGlobals())
beforeEach(() => { window.localStorage.clear(); window.location.hash = '#/practice' })
afterEach(() => { cleanup(); vi.restoreAllMocks() })
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }))
const point = (x: number, y: number) => click(`交叉点 ${x},${y}`)
const stored = () => JSON.parse(window.localStorage.getItem(LEARNING_KEY)!)
const finishExtend = () => {
  const scene = INDEPENDENT_SCENES[0]
  point(scene.target.x, scene.target.y); point(scene.example.x, scene.example.y)
  click('确认这一手'); click('因为与原棋块相连，整块接触到更多空点')
}
const allIndependent = Object.fromEntries(PRACTICE_ITEMS.map((item) => [item.id, 'independent' as Completion]))

describe('practice hub', () => {
  it('routes directly to the list with an accessible fourth navigation item', () => {
    expect(pageFromHash('#/practice')).toBe('practice')
    render(<App />)
    const nav = screen.getByRole('navigation', { name: '主导航' })
    expect(within(nav).getAllByRole('button').map((button) => button.textContent)).toEqual(['学', '练', '弈', '复'])
    expect(screen.getByRole('button', { name: '练习' }).getAttribute('aria-current')).toBe('page')
    expect(screen.getByRole('button', { name: '练习' }).title).toBe('练习')
    expect(screen.getAllByRole('listitem')).toHaveLength(10)
  })
  it('uses per-kind numbering consistently in the list and exercise, with short explanation titles', () => {
    render(<App />)
    for (const title of ['延伸 · 第 2 题', '提子 · 第 1 题', '提子 · 第 2 题', '连接 · 第 2 题']) {
      click(title)
      expect(screen.getByRole('heading', { name: title })).toBeTruthy()
      expect(screen.queryByText(/共六题/)).toBeNull()
      click('返回练习')
    }
    const entry = screen.getByRole('button', { name: '提子 · 第 1 题' }).closest('li')!
    expect(within(entry).getByRole('button', { name: '相关讲解：给自己的棋找出路' })).toBeTruthy()
  })
  it('records independent completion in the shared catalog without moving restored course position', () => {
    window.localStorage.setItem(LEARNING_KEY, JSON.stringify({ ...emptyLearningProgress(), completed: { 'rules/place': 'guided' }, lastVisited: 'rules/place' }))
    render(<App />)
    click('来一道还没独立完成的题'); point(0, 3); point(0, 5)
    expect(stored().completed['survival/danger-check']).toBe('independent')
    expect(stored().lastVisited).toBe('rules/place')
    click('下一道练习')
    expect(screen.getByRole('heading', { name: '往外伸，真的救出来了吗' })).toBeTruthy()
    expect(window.location.hash).toBe('#/practice')
    click('返回练习'); click('教学')
    // Restore selected liberties; practice must leave this session.page and index intact.
    expect(screen.getByRole('heading', { name: '第 2 关:气' })).toBeTruthy()
    click('返回章节'); click('第贰卷：保住自己的棋')
    const entry = screen.getByRole('button', { name: '自己试试：换到边上，自己找一找' }).parentElement!
    expect(within(entry).getByText('独立完成')).toBeTruthy()
    click('自己试试：换到边上，自己找一找'); click('下一课')
    expect(screen.getByRole('heading', { name: '给自己的棋找出路' })).toBeTruthy()
    click('返回章节')
    expect(screen.getByRole('button', { name: '第贰卷：保住自己的棋' })).toBeTruthy()
  })
  it.each(['hint', 'retry'] as const)('keeps %s completions eligible, preserves unfinished attempts, and resets finished attempts', (mode) => {
    const completed = { ...allIndependent }
    delete completed['independent/extend-1']
    window.localStorage.setItem(LEARNING_KEY, JSON.stringify({ ...emptyLearningProgress(), completed }))
    render(<App />)
    click('来一道还没独立完成的题')
    if (mode === 'hint') click('给我一点思路')
    else point(8, 8)
    click('返回练习'); click('延伸 · 第 1 题')
    expect(screen.getByText(mode === 'hint' ? /本次提示：1 次/ : /需要重试的判断：1 次/)).toBeTruthy()
    finishExtend()
    expect(stored().completed['independent/extend-1']).toBe(mode)
    expect(stored().lastVisited).toBeNull()
    click('返回练习')
    const entry = screen.getByRole('button', { name: '延伸 · 第 1 题' }).closest('li')!
    expect(within(entry).getByText(mode === 'hint' ? '借助提示完成' : '重试后完成')).toBeTruthy()
    click('来一道还没独立完成的题')
    if (mode === 'hint') click('给我一点思路')
    else point(8, 8)
    finishExtend(); click('下一道练习')
    expect(screen.getByText('第一步：找危险棋块')).toBeTruthy()
    expect(screen.getByText(/本次提示：0 次 · 需要重试的判断：0 次/)).toBeTruthy()
    finishExtend()
    expect(stored().completed['independent/extend-1']).toBe('independent')
    click('返回练习列表')
    expect(screen.getByRole('button', { name: '去弈下一盘' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: '来一道还没独立完成的题' })).toBeNull()
  })
  it('retains best completion on redo and shares unfinished runs with the course', () => {
    render(<App />)
    click('来一道还没独立完成的题'); point(0, 3)
    click('返回练习'); click('教学')
    click('第贰卷：保住自己的棋'); click('自己试试：换到边上，自己找一找')
    expect(screen.getByText('点出这整块黑棋最后的一口气。')).toBeTruthy()
    point(0, 5)
    click('练习'); click('换到边上，自己找一找')
    expect(screen.getByText('点出你觉得有危险的一块黑棋。')).toBeTruthy()
    click('提醒我看哪里'); point(0, 3); point(0, 5)
    expect(stored().completed['survival/danger-check']).toBe('independent')
    click('下一道练习')
    expect(screen.getByRole('heading', { name: '往外伸，真的救出来了吗' })).toBeTruthy()
  })
  it('opens the verified explanation in lessons and intentionally updates its position', () => {
    render(<App />)
    const capture = screen.getByRole('button', { name: '提子 · 第 1 题' }).closest('li')!
    fireEvent.click(within(capture).getByRole('button', { name: /相关讲解/ }))
    expect(window.location.hash).toBe('#/lessons')
    expect(screen.getByRole('button', { name: '教学' }).getAttribute('aria-current')).toBe('page')
    expect(screen.getByRole('heading', { name: '给自己的棋找出路' })).toBeTruthy()
    expect(stored().lastVisited).toBe('survival/escape-guided')
  })
  it('reloads the practice list with saved results but no unfinished board', () => {
    let view = render(<App />)
    click('来一道还没独立完成的题'); point(0, 3); point(0, 5); click('下一道练习')
    view.unmount(); view = render(<App />)
    expect(screen.getByRole('heading', { name: '练 · 自己判断' })).toBeTruthy()
    expect(screen.getByText('1 / 10')).toBeTruthy()
    expect(screen.queryByRole('button', { name: '交叉点 0,0' })).toBeNull()
    click('来一道还没独立完成的题')
    expect(screen.getByRole('heading', { name: '往外伸，真的救出来了吗' })).toBeTruthy()
    view.unmount()
  })
  it('reports storage failure without losing the current completion', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('full') })
    render(<App />)
    click('来一道还没独立完成的题'); point(0, 3); point(0, 5); click('返回练习')
    expect(screen.getByRole('alert').textContent).toContain('未能保存')
    expect(screen.getByText('1 / 10')).toBeTruthy()
  })
})
