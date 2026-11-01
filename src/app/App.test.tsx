// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { chooseMove } from '../ai'
import { App } from './App'
import { pageFromHash } from './router'
import { STORAGE_KEY } from './replay/records'

vi.mock('../ai', () => ({ chooseMove: vi.fn() }))

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
    window.location.hash = '#/play'
    vi.mocked(chooseMove).mockReset().mockReturnValue({ kind: 'pass' })
  })
  afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers() })
  const tick = () => act(() => { vi.advanceTimersByTime(350) })

  function finish() {
    fireEvent.click(screen.getByRole('button', { name: '停一手' }))
    tick()
    fireEvent.click(screen.getByRole('button', { name: '确认数子，进入复盘' }))
  }

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
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('第 1 关:落子')
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
