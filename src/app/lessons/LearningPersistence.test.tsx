// @vitest-environment jsdom
import { openCatalog } from './openCatalog.test-helper'
import { StrictMode } from 'react'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../App'
import { CAPTURE_SCENES } from '../../content/capture'
import { INDEPENDENT_SCENES } from '../../content/independent'
import { COACHING_KEY } from '../play/preferences'
import { STORAGE_KEY } from '../replay/records'
import { emptyLearningProgress, LEARNING_KEY } from './learningProgress'

vi.mock('../../ai', async (importOriginal) => ({ ...await importOriginal<typeof import('../../ai')>(), chooseMove: () => ({ kind: 'pass' }) }))
beforeAll(() => {
  const environment = globalThis as unknown as { jsdom: { window: Window } }
  vi.stubGlobal('localStorage', environment.jsdom.window.localStorage)
})
afterAll(() => vi.unstubAllGlobals())
beforeEach(() => { window.localStorage.clear(); window.location.hash = '#/lessons'; vi.useFakeTimers() })
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers() })
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }))
// 首页卷目一次只展开一卷：先点开书脊，再点其中的课程。
const chapter = (title: string) => fireEvent.click(screen.getByRole('button', { name: new RegExp(`卷：${title}$`) }))
const point = (x: number, y: number) => click(`交叉点 ${x},${y}`)
const stored = () => JSON.parse(window.localStorage.getItem(LEARNING_KEY)!)

describe('学习进度跨刷新', () => {
  it('两个慢镜头可跨刷新分别完成，最后仍能进入下一章', () => {
    let view = render(<App />)
    chapter('认识规则'); click('慢镜头 只剩一只眼：为什么白棋可以下？')
    for (let i = 0; i < 3; i++) click('下一步')
    click('先提对方没气的棋，再检查自己的气')
    view.unmount(); view = render(<App />)
    expect(screen.getByRole('heading', { name: '两只眼：为什么同一个位置不能下？' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '比较一只眼 · 已完成' })).toBeTruthy()
    for (let i = 0; i < 3; i++) click('下一步')
    click('先提对方没气的棋，再检查自己的气')
    expect(stored().completed).toEqual({ 'rule-sequence/one-eye': 'guided', 'rule-sequence/two-eyes': 'guided' })
    click('学习围地与终局')
    expect(screen.getByRole('heading', { name: '围住的空点属于谁' })).toBeTruthy()
  })
  it('严格模式下保存真实完成结果，刷新定位未完成题且从头开始，首页可以继续', () => {
    let view = render(<StrictMode><App /></StrictMode>)
    click('从第一课开始'); point(4, 4); click('下一关'); point(3, 4)
    expect(stored().completed).toEqual({ 'rules/place': 'guided' })
    expect(stored().lastVisited).toBe('rules/liberties')
    expect(view.container.querySelectorAll('[data-mark="selected"]')).toHaveLength(1)
    view.unmount(); view = render(<StrictMode><App /></StrictMode>)
    expect(screen.getByRole('heading', { name: '第 2 关:气' })).toBeTruthy()
    expect(view.container.querySelectorAll('[data-mark="selected"]')).toHaveLength(0)
    expect(view.container.querySelectorAll('.progress__step--done')).toHaveLength(1)
    openCatalog()
    expect(screen.getByRole('heading', { name: '已完成 1 / 35 个课程与练习' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '第 1 关:落子' }).getAttribute('aria-description')).toBe('跟着引导完成')
    click('继续学习')
    expect(screen.getByRole('heading', { name: '第 2 关:气' })).toBeTruthy()
  })
  it('跳到后面的课没有虚假完成标记，演示完成可升级为独立完成', () => {
    const { container } = render(<App />)
    click('第 5 关:劫')
    expect(container.querySelectorAll('.progress__step--done')).toHaveLength(0)
    openCatalog(); chapter('保住自己的棋'); click('练习 竖着也能连接')
    click('提醒我看哪里'); click('标出相关棋块和气'); click('演示一种做法')
    expect(stored().completed['survival/connect-check']).toBe('demo')
    click('重来这一题')
    expect(stored().completed['survival/connect-check']).toBe('demo')
    point(4, 4); click('确认这一步')
    expect(stored().completed['survival/connect-check']).toBe('independent')
    openCatalog()
    expect(screen.getByRole('button', { name: '练习 竖着也能连接' }).getAttribute('aria-description')).toBe('独立完成')
  })
  it('六道独立题跨多次刷新累积完成，提示和重试不会被冒充为独立完成', () => {
    let view = render(<App />)
    chapter('从看懂到自己下'); click('独立练习 第 1 题')
    for (const [index, scene] of INDEPENDENT_SCENES.entries()) {
      if (index === 0) click('给我一点思路')
      if (index === 1) point(8, 8)
      point(scene.target.x, scene.target.y); point(scene.example.x, scene.example.y)
      click('确认这一手')
      expect(stored().completed[`independent/${scene.id}`]).toBeUndefined()
      click(scene.kind === 'capture' ? '因为提走白棋，空出位置，目标黑块的气增加了' : scene.kind === 'connect' ? '因为直线连成同一块，可以共用整块的气' : '因为与原棋块相连，整块接触到更多空点')
      expect(stored().completed[`independent/${scene.id}`]).toBe(index === 0 ? 'hint' : index === 1 ? 'retry' : 'independent')
      if (index < 5) {
        view.unmount(); view = render(<App />)
        expect(screen.getByText('第一步：找危险棋块')).toBeTruthy()
        expect(view.container.querySelectorAll('[data-mark]')).toHaveLength(0)
      }
    }
    expect(screen.getByRole('button', { name: '去陪练试试' })).toBeTruthy()
    openCatalog()
    expect(screen.getByRole('heading', { name: '已完成 6 / 35 个课程与练习' })).toBeTruthy()
    // 回到首页时展开的是下一课所在的卷，这里手动展开第陆卷查看记录。
    chapter('从看懂到自己下')
    for (let n = 1; n <= 6; n++) {
      const entry = screen.getByRole('button', { name: `独立练习 第 ${n} 题` })
      expect(entry.textContent).toContain('✓')
      expect(entry.getAttribute('aria-description')).toBe(n === 1 ? '借助提示完成' : n === 2 ? '重试后完成' : '独立完成')
    }
  })
})

describe('清除与存储降级', () => {
  it('清除须确认，仅清学习记录与位置，不影响棋谱、正在下的棋和设置', () => {
    const archive = JSON.stringify({ version: 1, games: [{ id: 'saved', endedAt: '2026-11-08T00:00:00Z', moves: [{ kind: 'pass' }, { kind: 'pass' }], dead: [] }] })
    const preference = JSON.stringify({ version: 1, enabled: false })
    window.localStorage.setItem(STORAGE_KEY, archive)
    window.localStorage.setItem(COACHING_KEY, preference)
    const view = render(<App />)
    click('对局'); point(4, 4); act(() => vi.advanceTimersByTime(350))
    click('教学'); click('从第一课开始'); point(4, 4); openCatalog()
    click('清除学习记录'); click('保留记录')
    expect(stored().completed['rules/place']).toBe('guided')
    click('清除学习记录')
    fireEvent.click(within(screen.getByRole('group', { name: '确认清除学习记录' })).getByRole('button', { name: '确认清除学习记录' }))
    expect(stored()).toEqual(emptyLearningProgress())
    expect(screen.queryByRole('button', { name: '继续学习' })).toBeNull()
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(archive)
    expect(window.localStorage.getItem(COACHING_KEY)).toBe(preference)
    click('对局'); expect(screen.getByText('已下 2 手')).toBeTruthy()
    click('教学'); view.unmount(); render(<App />)
    expect(screen.getByRole('heading', { name: '已完成 0 / 35 个课程与练习' })).toBeTruthy()
  })
  it('损坏或未来版本不在初始化时覆盖，提示后仍可以继续学习', () => {
    for (const raw of ['{bad', JSON.stringify({ version: 99, completed: {}, lastVisited: null })]) {
      window.localStorage.setItem(LEARNING_KEY, raw)
      const view = render(<App />)
      expect(screen.getByRole('alert').textContent).toContain('格式不兼容或已损坏')
      expect(window.localStorage.getItem(LEARNING_KEY)).toBe(raw)
      click('从第一课开始'); point(4, 4)
      expect(stored().completed).toEqual({ 'rules/place': 'guided' })
      expect(screen.queryByRole('alert')).toBeNull()
      view.unmount()
    }
  })
  it('保存或清除写入失败时本次仍生效，并明确刷新可能恢复旧记录', () => {
    const original = { ...emptyLearningProgress(), completed: { 'rules/place': 'guided' }, lastVisited: 'rules/liberties' }
    window.localStorage.setItem(LEARNING_KEY, JSON.stringify(original))
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
    const view = render(<App />)
    openCatalog(); click('清除学习记录'); click('确认清除学习记录')
    expect(screen.getByRole('heading', { name: '已完成 0 / 35 个课程与练习' })).toBeTruthy()
    expect(screen.getByRole('alert').textContent).toContain('恢复旧记录')
    click('从第一课开始'); point(4, 4)
    expect(screen.getByRole('button', { name: '下一关' })).toBeTruthy()
    expect(stored()).toEqual(original)
    view.unmount(); render(<App />)
    expect(screen.getByRole('heading', { name: '第 2 关:气' })).toBeTruthy()
  })
  it('浏览器禁止访问存储时不阻止学习', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => { throw new Error('blocked') })
    render(<App />)
    expect(screen.getByRole('alert').textContent).toContain('无法读取')
    click('从第一课开始'); point(4, 4)
    expect(screen.getByRole('button', { name: '下一关' })).toBeTruthy()
    expect(screen.getByRole('alert').textContent).toContain('未能保存')
  })
})

describe('首页卷目跟随学习位置', () => {
  it('完成一课后回到首页：展开下一课所在的卷，标出已读与续读', () => {
    const { container } = render(<App />)
    click('第 1 关:落子'); point(4, 4); openCatalog()
    expect(screen.getByRole('button', { name: '第壹卷：认识规则' }).getAttribute('aria-expanded')).toBe('true')
    expect(container.querySelector('[aria-current="step"]')?.textContent).toContain('第 2 关:气')
    expect(screen.getByRole('button', { name: '第 1 关:落子' }).textContent).toContain('✓')
  })
})

it('完成生存末题可进入吃子卷并续读，吃子末题去终局或陪练', () => {
  let view = render(<App />)
  chapter('保住自己的棋'); click('练习 自己解释两只眼')
  point(4, 3); point(4, 5); click('白棋一次只能填一个，另一个还在')
  click('下一章 · 吃掉对方的棋 →')
  expect(screen.getByRole('heading', { name: '关住白棋的出路' })).toBeTruthy()
  expect(stored().lastVisited).toBe('capture/direction-guided')
  point(2, 3)
  expect(stored().completed['capture/direction-guided']).toBeUndefined()
  view.unmount(); view = render(<App />)
  expect(screen.getByRole('heading', { name: '关住白棋的出路' })).toBeTruthy()
  expect(screen.getByText('追吃中 · 已下 0 手 / 最多 2 手')).toBeTruthy()
  point(2, 3); point(2, 1)
  expect(stored().completed['capture/direction-guided']).toBe('guided')
  view.unmount(); render(<App />)
  expect(screen.getByRole('heading', { name: '赶向有黑棋的一边' })).toBeTruthy()

  openCatalog(); chapter('吃掉对方的棋'); click('练习 换个方向征白棋')
  for (const move of CAPTURE_SCENES[5].solution) point(move.x, move.y)
  expect(stored().completed['capture/ladder-check']).toBe('independent')
  click('学习围地与终局 →')
  expect(screen.getByRole('heading', { name: '围住的空点属于谁' })).toBeTruthy()
  openCatalog(); chapter('吃掉对方的棋'); click('练习 换个方向征白棋')
  click('开始我的陪练')
  expect(screen.getByRole('heading', { name: '对局' })).toBeTruthy()
})

it('练征子防守不会移动续读位置，点相关讲解才进入征子引导题', () => {
  window.location.hash = '#/practice'
  window.localStorage.setItem(LEARNING_KEY, JSON.stringify({ ...emptyLearningProgress(), lastVisited: 'rules/ko' }))
  render(<App />)
  click('路上没有接应')
  click('B · 在别处下'); click('下一手')
  expect(stored().lastVisited).toBe('rules/ko')
  click('练习')
  const entry = screen.getByRole('region', { name: '别被吃' })
  fireEvent.click(within(entry).getByRole('button', { name: '相关讲解：沿着台阶追到边上' }))
  expect(screen.getByRole('heading', { name: '沿着台阶追到边上' })).toBeTruthy()
  expect(stored().lastVisited).toBe('capture/ladder-guided')
})
