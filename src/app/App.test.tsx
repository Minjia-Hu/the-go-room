// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { App } from './App'
import { pageFromHash } from './router'

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

describe('App', () => {
  beforeEach(() => {
    window.location.hash = ''
  })
  afterEach(cleanup)

  it('默认显示教学页和三个导航按钮', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('The Go Room')
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
