// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { chooseMove } from '../ai'
import { App } from './App'
import { pageFromHash } from './router'
import { readGames, STORAGE_KEY } from './replay/records'
import { COACHING_KEY } from './play/preferences'

vi.mock('../ai', async (importOriginal) => ({ ...await importOriginal<typeof import('../ai')>(), chooseMove: vi.fn() }))

// Node 25 也暴露 localStorage；当前 Vitest 保留它，需显式使用 jsdom 的浏览器存储。
beforeAll(() => {
  const environment = globalThis as unknown as { jsdom: { window: Window } }
  vi.stubGlobal('localStorage', environment.jsdom.window.localStorage)
})
afterAll(() => vi.unstubAllGlobals())

describe('pageFromHash', () => {
  it('认识三个页面', () => {
    expect(pageFromHash('#/lessons')).toBe('lessons')
    expect(pageFromHash('#/play')).toBe('play')
    expect(pageFromHash('#/replay')).toBe('replay')
  })

  it('空的或不认识的 hash 回到教学页', () => {
    expect(pageFromHash('')).toBe('lessons')
    expect(pageFromHash('#/nowhere')).toBe('lessons')
  })
})

describe('对局到复盘的完整路径', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    window.localStorage.clear()
    window.localStorage.setItem(COACHING_KEY, JSON.stringify({ version: 1, enabled: false }))
    window.location.hash = '#/play'
    vi.mocked(chooseMove).mockReset().mockReturnValue({ kind: 'pass' })
  })
  afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers() })
  const tick = () => act(() => { vi.advanceTimersByTime(350) })

  function finish() {
    fireEvent.click(screen.getByRole('button', { name: '停一手' }))
    const confirm = screen.queryByRole('button', { name: '确认停一手' })
    if (confirm) fireEvent.click(confirm)
    tick()
    fireEvent.click(screen.getByRole('button', { name: '确认数子，进入复盘' }))
  }

  it('未确认试下不进入约定结束棋谱，保存刷新后仍说明约定与死子依据', () => {
    window.localStorage.setItem(COACHING_KEY, JSON.stringify({ version: 1, enabled: true }))
    const { unmount } = render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '交叉点 4,4' }))
    expect(screen.getByRole('button', { name: '下在这里' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '提出结束并数子' }))
    expect(screen.queryByRole('button', { name: '下在这里' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '双方同意，开始数子' }))
    fireEvent.click(screen.getByRole('button', { name: '确认数子，进入复盘' }))
    const record = readGames(window.localStorage)[0]
    expect(record.moves).toEqual([{ kind: 'pass' }, { kind: 'pass' }])
    expect(record.agreedPasses).toBe(2)
    expect(chooseMove).not.toHaveBeenCalled()
    unmount(); render(<App />)
    expect(screen.getByText(/本盘由双方同意数子结束/)).toBeTruthy()
    expect(screen.getByText(/结果依据你确认的死子标记计算/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '上一步' }))
    expect(screen.getByText('黑方按约定停一手，双方同意数子。')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '跳到开头' }))
    expect(screen.getByText('开局：空棋盘，黑先。')).toBeTruthy()
  })

  it('确认数子后自动进入复盘并保存，重新挂载仍可回看', () => {
    const { unmount } = render(<App />)
    finish()
    expect(window.location.hash).toBe('#/replay')
    expect(screen.getByText('白方胜，领先 7.5')).toBeTruthy()
    expect(screen.getByText('第 2 / 2 手')).toBeTruthy()
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)!).games).toHaveLength(1)
    unmount()
    render(<App />)
    expect(screen.getByText('白方胜，领先 7.5')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '去对局' }))
    expect(screen.getByText('已下 0 手')).toBeTruthy()
  })

  it('没有 randomUUID 时也能保存，同一时刻完成两盘不会覆盖棋谱', () => {
    const originalCrypto = globalThis.crypto
    vi.stubGlobal('crypto', {})
    try {
      vi.setSystemTime(new Date('2026-11-02T00:00:00Z'))
      render(<App />)
      finish()
      expect(screen.getByText('白方胜，领先 7.5')).toBeTruthy()
      fireEvent.click(screen.getByRole('button', { name: '去对局' }))
      vi.setSystemTime(new Date('2026-11-02T00:00:00Z'))
      finish()
      const games = JSON.parse(window.localStorage.getItem(STORAGE_KEY)!).games
      expect(games).toHaveLength(2)
      expect(games[0].id).not.toBe(games[1].id)
    } finally {
      vi.stubGlobal('crypto', originalCrypto)
    }
  })

  it('切页保留对局，离开时取消电脑回合，返回后继续', () => {
    const { container } = render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '交叉点 4,4' }))
    fireEvent.click(screen.getByRole('button', { name: '教学' }))
    tick()
    expect(chooseMove).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '对局' }))
    expect(container.querySelectorAll('[data-stone="black"]')).toHaveLength(1)
    tick()
    expect(chooseMove).toHaveBeenCalledTimes(1)
    expect(screen.getByText('已下 2 手')).toBeTruthy()
  })

  it('存储写入失败仍可复盘，并明确提示刷新将丢失', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
    render(<App />)
    finish()
    expect(screen.getByRole('alert').textContent).toContain('刷新或关闭页面后本次棋谱会丢失')
    expect(screen.getByText('白方胜，领先 7.5')).toBeTruthy()
  })

  it('localStorage 访问本身被禁止仍能完成一盘', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => { throw new Error('disabled') })
    render(<App />)
    finish()
    expect(screen.getByRole('alert').textContent).toContain('棋谱未能保存')
  })

  it('损坏历史不会影响开始新对局', () => {
    window.localStorage.setItem(STORAGE_KEY, '{broken')
    window.location.hash = '#/replay'
    render(<App />)
    expect(screen.getByText(/还没有已完成的棋谱/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '去对局' }))
    finish()
    expect(screen.getByText('白方胜，领先 7.5')).toBeTruthy()
  })
})

describe('App', () => {
  beforeEach(() => {
    window.location.hash = ''
  })
  afterEach(cleanup)

  it('默认显示教学页和三个导航按钮', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('The Go Room')
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('一子一气')
    expect(screen.getByRole('button', { name: '教学' }).getAttribute('aria-current')).toBe('page')
    expect(screen.getByRole('button', { name: '对局' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '复盘' })).toBeTruthy()
  })

  it('点导航切换页面并写入 hash', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '对局' }))
    expect(window.location.hash).toBe('#/play')
    expect(screen.getByRole('button', { name: '对局' }).getAttribute('aria-current')).toBe('page')
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('对局')
  })
})

describe('默认陪练的应用闭环', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    window.localStorage.clear()
    window.location.hash = '#/play'
    vi.mocked(chooseMove).mockReset().mockReturnValue({ kind: 'pass' })
  })
  afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers() })
  const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }))
  // 首页卷目一次只展开一卷：先点开书脊，再点其中的课程。
  const chapter = (title: string) => fireEvent.click(screen.getByRole('button', { name: new RegExp(`卷：${title}$`) }))
  const tick = () => act(() => { vi.advanceTimersByTime(350) })
  it('预览换页不提交，确认后切页保留并继续 AI；课程状态也保留', () => {
    render(<App />)
    click('交叉点 4,4'); click('教学'); tick(); click('对局')
    expect(screen.getByText('已下 0 手')).toBeTruthy()
    expect(screen.queryByRole('button', { name: '下在这里' })).toBeNull()
    click('交叉点 4,4'); click('下在这里'); click('教学'); tick()
    expect(chooseMove).not.toHaveBeenCalled()
    chapter('保住自己的棋'); click('1. 认出哪块棋危险'); click('交叉点 4,4')
    click('对局'); tick()
    expect(screen.getByText('已下 2 手')).toBeTruthy()
    click('教学')
    expect(document.activeElement).toBe(screen.getByRole('button', { name: '学 · 课程卷目' }))
    click('继续学习')
    expect(screen.getByText('点出它最后一口气。')).toBeTruthy()
    click('教学')
    expect(document.activeElement).toBe(screen.getByRole('button', { name: '学 · 课程卷目' }))
    expect(screen.getAllByRole('button', { name: /^第.卷：/ })).toHaveLength(6)
    click('继续学习')
    expect(screen.getByText('点出它最后一口气。')).toBeTruthy()
  })
  it('实际提子可重试，存档只包含重试后保留的正式动作', () => {
    render(<App />)
    for (const [human, white] of [ [[4,4],[4,3]], [[0,0],[3,4]], [[0,1],[5,4]], [[0,2],[4,5]] ]) {
      vi.mocked(chooseMove).mockReturnValueOnce({ kind: 'play', point: { x: white[0], y: white[1] } })
      click(`交叉点 ${human[0]},${human[1]}`); click('下在这里'); tick()
    }
    click('被吃前'); click('退回这一回合重试')
    expect(screen.getByText('已下 6 手')).toBeTruthy()
    click('交叉点 4,5'); click('下在这里'); tick()
    click('停一手'); click('确认停一手')
    click('确认数子，进入复盘')
    const saved = readGames(window.localStorage)
    expect(saved).toHaveLength(1)
    expect(saved[0].moves).toHaveLength(9)
    expect(saved[0].moves).not.toContainEqual({ kind: 'play', point: { x: 0, y: 2 } })
    expect(Object.keys(saved[0]).sort()).toEqual(['dead','endedAt','id','moves'])
    expect(screen.queryByRole('button', { name: '退回这一回合重试' })).toBeNull()
  })
  it('关闭偏好可保存；写失败保留本次设置并与棋谱提示区分', () => {
    const { unmount } = render(<App />)
    fireEvent.click(screen.getByRole('checkbox', { name: /新手陪练/ }))
    expect(JSON.parse(window.localStorage.getItem(COACHING_KEY)!).enabled).toBe(false)
    unmount(); render(<App />)
    expect((screen.getByRole('checkbox', { name: /新手陪练/ }) as HTMLInputElement).checked).toBe(false)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('full') })
    fireEvent.click(screen.getByRole('checkbox', { name: /新手陪练/ }))
    expect(screen.getByText('本次设置已生效，刷新后可能恢复默认。')).toBeTruthy()
    expect((screen.getByRole('checkbox', { name: /新手陪练/ }) as HTMLInputElement).checked).toBe(true)
  })
})
