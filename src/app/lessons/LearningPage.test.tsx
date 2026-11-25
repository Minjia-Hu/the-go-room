// @vitest-environment jsdom
import { openCatalog } from './openCatalog.test-helper'
import { useState } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LearningPage } from './LearningPage'
import { createLearningSession } from './learningSession'

afterEach(cleanup)
function Harness() {
  const [session, setSession] = useState(createLearningSession)
  return <LearningPage onPractice={() => {}} session={session} onChange={setSession} onPlay={vi.fn()} />
}
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }))
// 首页卷目一次只展开一卷：先点开书脊，再点其中的课程。
const chapter = (title: string) => fireEvent.click(screen.getByRole('button', { name: new RegExp(`卷：${title}$`) }))
describe('生存章节界面', () => {
  it('第五课显示当前步骤，完成后可直接进入生存章节第一课', () => {
    render(<Harness />)
    click('5. 劫')
    expect(screen.getByText('第 1 步 / 共 2 步')).toBeTruthy()
    click('交叉点 4,3')
    expect(screen.getByText('第 2 步 / 共 2 步')).toBeTruthy()
    expect(screen.queryByRole('button', { name: '下一章 · 保住自己的棋 →' })).toBeNull()
    click('交叉点 0,0')
    click('下一章 · 保住自己的棋 →')
    expect(screen.getByRole('heading', { name: '认出哪块棋危险' })).toBeTruthy()
  })
  it('第一课先独立观察，再按需读提示、看标记，点错黑棋立即解释', () => {
    const { container } = render(<Harness />)
    chapter('保住自己的棋'); click('1. 认出哪块棋危险（被叫吃）')
    const hint = '看看每颗黑棋，上下左右还剩几个空点？'
    expect(screen.queryByText(hint)).toBeNull()
    click('交叉点 1,1')
    expect(screen.getByRole('status').textContent).toContain('4 口气')
    click('给点提示')
    expect(screen.getByRole('status').textContent).toContain(hint)
    expect(container.querySelector('[data-mark="target"]')).toBeNull()
    click('标出棋块和气')
    expect(container.querySelector('[data-mark="target"]')).toBeTruthy()
    click('看演示'); click('下一课 · 给自己的棋找出路（长气） →')
    expect(screen.getByRole('heading', { name: '给自己的棋找出路' })).toBeTruthy()
  })
  it('认险、对照和检验题连贯，返回章节保留练习', () => {
    render(<Harness />)
    chapter('保住自己的棋'); click('1. 认出哪块棋危险（被叫吃）')
    click('交叉点 4,4'); click('交叉点 5,5')
    expect(screen.getByRole('status').textContent).toContain('你点的是斜角')
    click('交叉点 4,5')
    expect(screen.getByRole('status').textContent).toContain('这颗黑棋只剩 A 这一口气')
    expect(screen.queryByRole('button', { name: '下在远处' })).toBeNull()
    click('比较两种走法'); click('下在远处')
    expect(screen.getByText(/提走了中央黑棋/)).toBeTruthy()
    click('自己试试')
    expect(screen.getByRole('heading', { level: 2 }).textContent).toContain('边上')
    click('交叉点 0,3')
    openCatalog()
    chapter('保住自己的棋'); click('1. 认出哪块棋危险（被叫吃）')
    expect(screen.getByRole('status').textContent).toContain('这颗黑棋只剩 A 这一口气')
  })
  it('卷内目录标出当前题，跳课和收起目录都保留答题步骤', () => {
    render(<Harness />)
    chapter('保住自己的棋'); click('1. 认出哪块棋危险（被叫吃）')
    fireEvent.click(screen.getByText('卷贰 · 保住自己的棋')); click(/^自己试试.*换到边上，自己找一找$/)
    click('交叉点 0,3')
    const toggle = screen.getByText('卷贰 · 保住自己的棋')
    expect(toggle.closest('details')?.open).toBe(true)
    const directory = screen.getByRole('navigation', { name: '卷贰目录' })
    expect(directory.querySelectorAll('[role="group"]')).toHaveLength(4)
    expect(directory.querySelector('[aria-current="step"]')?.textContent).toContain('换到边上，自己找一找')
    fireEvent.click(toggle)
    expect(toggle.closest('details')?.open).toBe(false)
    expect(screen.getByText('第 2 步 / 共 2 步 · 找气')).toBeTruthy()
    fireEvent.click(toggle); click('2. 给自己的棋找出路（长气）')
    expect(toggle.closest('details')?.open).toBe(true)
    expect(screen.getByRole('heading', { name: '给自己的棋找出路' })).toBeTruthy()
    click(/^自己试试.*换到边上，自己找一找$/)
    expect(screen.getByText('第 2 步 / 共 2 步 · 找气')).toBeTruthy()
  })
  it('卷叁展开后可以连续切课，点红色卷名才收起', () => {
    render(<Harness />)
    chapter('吃掉对方的棋'); click('2. 一手叫吃两块棋（双打吃）')
    const toggle = screen.getByText('卷叁 · 吃掉对方的棋')
    fireEvent.click(toggle)
    click('3. 沿着台阶追到边上（征吃）')
    const menu = screen.getByRole('navigation', { name: '卷叁目录' })
    const current = menu.querySelector('[aria-current="step"]')!
    expect(current.firstElementChild?.textContent).toBe('3. 沿着台阶追到边上')
    expect(current.querySelector('.course-index__term')?.textContent).toBe('征吃')
    click('4. 先封住出路（枷吃）')
    const heading = screen.getByRole('heading', { name: '先封住出路' })
    const note = heading.parentElement!.querySelector('details')!
    const summary = note.querySelector('summary')!
    expect(summary.textContent).toBe('枷吃')
    expect(note.open).toBe(false)
    fireEvent.click(summary)
    expect(note.open).toBe(true)
    expect(note.textContent).toContain('先从外围封住一块棋的出路')
    expect(toggle.closest('details')?.open).toBe(true)
    fireEvent.click(toggle)
    expect(toggle.closest('details')?.open).toBe(false)
  })
  it('两眼需要自己选原因，一眼对照可以查看', () => {
    const { container } = render(<Harness />)
    chapter('保住自己的棋'); click('4. 两个小空点为什么能保命（两眼活棋）')
    click('交叉点 3,4'); click('交叉点 5,4')
    click('因为黑棋比白棋多')
    expect(screen.getByRole('status').textContent).toContain('不是棋子多')
    click('只剩一个眼时')
    expect(container.querySelectorAll('[data-mark="label"]')).toHaveLength(1)
    expect(screen.queryByLabelText('标记 B')).toBeNull()
    click('白棋填最后一气')
    expect(container.querySelectorAll('[data-mark="label"]')).toHaveLength(0)
    click('回到两眼原图')
    click('白棋一次只能填一个，另一个还在')
    expect(screen.getByRole('status').textContent).toContain('两个真眼')
  })
})
