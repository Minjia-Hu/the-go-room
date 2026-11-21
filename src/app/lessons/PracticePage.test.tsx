// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../App'
import { pageFromHash } from '../router'
import { INDEPENDENT_SCENES } from '../../content/independent'
import { LEARNING_KEY, LEARNING_UNITS, emptyLearningProgress } from './learningProgress'
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
  const shared = PRACTICE_ITEMS.filter((item) => item.source === 'survival' || item.source === 'independent')
  it('shows the practice group and shared caption on all course exercises', () => {
    render(<App />)
    for (const item of shared) {
      click(item.title)
      expect(screen.getByText(`练 · ${item.group} · 课程里的检验题`)).toBeTruthy()
      expect(screen.getByText('换个局面，自己判断')).toBeTruthy()
      click('返回练习')
    }
  })
  it('names the matching course unit in a shared completion record', () => {
    window.localStorage.setItem(LEARNING_KEY, JSON.stringify({ ...emptyLearningProgress(), completed: allIndependent }))
    render(<App />)
    for (const item of shared) {
      click(item.title)
      const unit = LEARNING_UNITS.find((entry) => entry.id === item.id)!
      expect(screen.getByLabelText('已记录的学习结果').textContent).toBe(
        `你在课程「${unit.title}」做过这道题：独立完成。可以再练一次，保留最好的一次记录。`)
      click('返回练习')
    }
  })
  it('labels only the ten course exercises in the practice list', () => {
    render(<App />)
    expect(screen.getAllByText('课程题')).toHaveLength(10)
    for (const item of shared) {
      const row = screen.getByRole('button', { name: item.title }).closest('li')!
      expect(within(row).getByText('课程题')).toBeTruthy()
    }
  })
  it('routes directly to the list with an accessible fourth navigation item', () => {
    expect(pageFromHash('#/practice')).toBe('practice')
    render(<App />)
    const nav = screen.getByRole('navigation', { name: '主导航' })
    expect(within(nav).getAllByRole('button').map((button) => button.textContent)).toEqual(['学', '练', '弈', '复'])
    expect(screen.getByRole('button', { name: '练习' }).getAttribute('aria-current')).toBe('page')
    expect(screen.getByRole('button', { name: '练习' }).title).toBe('练习')
    expect(screen.getAllByRole('listitem')).toHaveLength(24)
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
    expect(screen.getByRole('heading', { name: '边上三颗棋，共用几口气' })).toBeTruthy()
    expect(window.location.hash).toBe('#/practice')
    click('返回练习'); click('教学')
    // Restore selected liberties; practice must leave this session.page and index intact.
    expect(screen.getByRole('heading', { name: '第 2 关:气' })).toBeTruthy()
    click('返回章节'); click('第贰卷：保住自己的棋')
    const entry = screen.getByRole('button', { name: '自己试试：换到边上，自己找一找' }).parentElement!
    expect(within(entry).getByText('独立完成')).toBeTruthy()
    click('自己试试：换到边上，自己找一找'); click('下一课 · 给自己的棋找出路 →')
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
    expect(screen.getByRole('heading', { name: '边上三颗棋，共用几口气' })).toBeTruthy()
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
    expect(screen.getByText('1 / 24')).toBeTruthy()
    expect(screen.queryByRole('button', { name: '交叉点 0,0' })).toBeNull()
    click('来一道还没独立完成的题')
    expect(screen.getByRole('heading', { name: '边上三颗棋，共用几口气' })).toBeTruthy()
    view.unmount()
  })
  it('reports storage failure without losing the current completion', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('full') })
    render(<App />)
    click('来一道还没独立完成的题'); point(0, 3); point(0, 5); click('返回练习')
    expect(screen.getByRole('alert').textContent).toContain('未能保存')
    expect(screen.getByText('1 / 24')).toBeTruthy()
  })
})


it('生存题答错后保留重试记录和推荐资格，独立重做才升级，课程位置保持不变', () => {
  window.localStorage.setItem(LEARNING_KEY, JSON.stringify({ ...emptyLearningProgress(), lastVisited: 'rules/ko',
    // 其他题已独立完成，只留认危险题检验推荐行为。
    completed: Object.fromEntries(Object.entries(allIndependent).filter(([id]) => id !== 'survival/danger-check')),
  }))
  render(<App />)
  click('来一道还没独立完成的题'); point(8, 8)
  click('返回练习'); click('换到边上，自己找一找')
  point(0, 3); point(0, 5)
  expect(stored().completed['survival/danger-check']).toBe('retry')
  expect(stored().lastVisited).toBe('rules/ko')
  click('返回练习')
  expect(screen.getByText('重试后完成')).toBeTruthy()
  click('来一道还没独立完成的题'); point(0, 3); point(0, 5)
  expect(stored().completed['survival/danger-check']).toBe('independent')
  expect(stored().lastVisited).toBe('rules/ko')
  click('返回练习列表')
  expect(screen.getByText('24 / 24')).toBeTruthy()
  expect(screen.queryByRole('button', { name: '来一道还没独立完成的题' })).toBeNull()
})

it('先后判断展示真实回应，必须解释原因才记录，刷新保留且不计入课程完成数', () => {
  render(<App />)
  click('能吃一颗，要先吃吗')
  click('B · 先提右下的一颗白棋')
  expect(screen.queryByText(/已有记录：/)).toBeNull()
  click('确认这个选择')
  expect(screen.getByRole('status').textContent).toContain('左边三颗仍只剩一口气')
  expect(document.querySelectorAll('[data-mark="captured"]')).toHaveLength(3)
  click('看原图'); click('A · 先接出左边黑棋'); click('确认这个选择')
  expect(stored()?.completed['practice/priority-save-or-capture']).toBeUndefined()
  click('黑棋接出后永远不会被吃')
  expect(screen.getByRole('status').textContent).toContain('都不等于永远安全')
  click('接出增加了危险黑块的气，先避免三颗棋被提')
  expect(stored().completed['practice/priority-save-or-capture']).toBe('retry')
  expect(stored().lastVisited).toBeNull()
  click('返回练习')
  expect(screen.getByText('重试后完成')).toBeTruthy()
  cleanup(); render(<App />)
  expect(screen.getByText('重试后完成')).toBeTruthy()
  click('教学')
  expect(screen.getByRole('heading', { name: '已完成 0 / 35 个课程与练习' })).toBeTruthy()
  expect(screen.queryByRole('button', { name: '继续学习' })).toBeNull()
})

it('新增认危险与救棋入口完成后保存，相关讲解仍回原课程', () => {
  render(<App />)
  click('边上三颗棋，共用几口气'); point(0, 3); point(0, 5)
  expect(stored().completed['practice/danger-edge-three']).toBe('independent')
  click('返回练习'); click('角上的三颗棋')
  point(0, 0); point(0, 2); click('确认这一手'); click('因为与原棋块相连，整块接触到更多空点')
  expect(stored().completed['practice/extend-corner']).toBe('independent')
  expect(stored().lastVisited).toBeNull()
  click('返回练习')
  const item = screen.getByRole('button', { name: '白棋能追，自己能等吗' }).closest('li')!
  fireEvent.click(within(item).getByRole('button', { name: '相关讲解：什么时候先不追了？' }))
  expect(screen.getByRole('heading', { name: '什么时候先不追了？' })).toBeTruthy()
  expect(stored().lastVisited).toBe('strategy/chase')
})

it('别被吃两题按顺序推荐，全部独立完成后返回练习列表', () => {
  const ids = ['practice/ladder-defense-no-help', 'practice/ladder-defense-with-help']
  window.localStorage.setItem(LEARNING_KEY, JSON.stringify({ ...emptyLearningProgress(), lastVisited: 'rules/ko',
    completed: Object.fromEntries(Object.entries(allIndependent).filter(([id]) => !ids.includes(id))),
  }))
  render(<App />)
  const group = screen.getByRole('region', { name: '别被吃' })
  expect(within(group).getByRole('heading').textContent).toBe('柒别被吃')
  click('路上没有接应')
  click('B · 在别处下'); click('下一手'); click('下一手')
  expect(stored().completed[ids[0]]).toBeUndefined()
  click('一路没有接应，继续逃会让更多棋被提')
  expect(stored().completed[ids[0]]).toBe('independent')
  click('下一道练习')
  expect(screen.getByRole('heading', { name: '路上有接应' })).toBeTruthy()
  click('A · 继续逃')
  for (let i = 0; i < 9; i++) click('下一手')
  click('沿这条路线能连到接应的黑棋，多出气')
  expect(stored().completed[ids[1]]).toBe('independent')
  expect(stored().lastVisited).toBe('rules/ko')
  click('返回练习列表')
  expect(screen.getByText('24 / 24')).toBeTruthy()
})
