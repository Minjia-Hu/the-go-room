// @vitest-environment jsdom
import { useState } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { LearningPage } from './LearningPage'
import { createLearningSession } from './learningSession'

afterEach(cleanup)
function Harness() {
  const [session, setSession] = useState(createLearningSession)
  return <LearningPage onPractice={() => {}} session={session} onChange={setSession} onPlay={() => {}} />
}
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }))
const stones = (container: HTMLElement) => container.querySelectorAll('[data-stone]').length

describe('首页：一子一气与卷目', () => {
  it('首页棋盘可以直接下：接在 A 有三口气，可对照下之前，再练一次回到原题', () => {
    const { container } = render(<Harness />)
    expect(screen.getByRole('heading', { level: 2, name: '一子一气' })).toBeTruthy()
    expect(stones(container)).toBe(4)
    click('交叉点 4,5')
    expect(screen.getByText('接上了，三口气！')).toBeTruthy()
    expect(container.querySelectorAll('[data-mark="liberty"]')).toHaveLength(3)
    click('对照下之前')
    expect(screen.getByText('下之前：只有一口气')).toBeTruthy()
    expect(stones(container)).toBe(4)
    click('再练一次')
    expect(screen.getByText(/现在就试/)).toBeTruthy()
  })

  it('下在 B 还是一口气；看白棋应对后整块被提走，可以换到 A', () => {
    const { container } = render(<Harness />)
    click('交叉点 6,6')
    expect(screen.getByText('还是只有一口气')).toBeTruthy()
    click('看白棋应对')
    expect(screen.getByText('白棋占 A，黑棋被提走')).toBeTruthy()
    expect(container.querySelector('[data-stone][data-x="4"][data-y="4"]')).toBeNull()
    expect(container.querySelector('[data-mark="captured"]')).not.toBeNull()
    click('换到 A 再试')
    expect(screen.getByText('接上了，三口气！')).toBeTruthy()
  })

  it('A、B 以外的点只提醒，不落子；提示标出那一口气', () => {
    const { container } = render(<Harness />)
    click('交叉点 0,0')
    expect(screen.getByText(/先比较 A 和 B/)).toBeTruthy()
    expect(stones(container)).toBe(4)
    click('给我一点提示')
    expect(container.querySelectorAll('[data-mark="liberty"]')).toHaveLength(1)
  })

  it('卷目一次展开一卷：默认第壹卷，点书脊换到另一卷', () => {
    render(<Harness />)
    const first = screen.getByRole('button', { name: '第壹卷：认识规则' })
    expect(first.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByRole('button', { name: '第 1 关:落子' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: '1. 认出哪块棋危险' })).toBeNull()
    click('第贰卷：保住自己的棋')
    expect(first.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByRole('button', { name: '第 1 关:落子' })).toBeNull()
    expect(screen.getByRole('button', { name: '1. 认出哪块棋危险' })).toBeTruthy()
    expect([...screen.getByRole('region', { name: '课程卷目' }).querySelectorAll('.scroll__spine')].map((spine) => spine.getAttribute('aria-label'))).toEqual([
      '第壹卷：认识规则', '第贰卷：保住自己的棋', '第叁卷：吃掉对方的棋',
      '第肆卷：围地与终局', '第伍卷：九路策略入门', '第陆卷：从看懂到自己下',
    ])
    click('第叁卷：吃掉对方的棋')
    for (const name of ['1. 关住白棋的出路', '练习 赶向有黑棋的一边', '2. 一手叫吃两块棋',
      '练习 别只叫吃一块', '3. 沿着台阶追到边上', '练习 换个方向征白棋']) {
      expect(screen.getByRole('button', { name })).toBeTruthy()
    }
    expect(screen.getByRole('heading', { name: '学' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '去下一盘九路棋' })).toBeTruthy()
  })
})
