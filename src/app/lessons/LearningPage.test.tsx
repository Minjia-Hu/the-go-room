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
  return <LearningPage session={session} onChange={setSession} onPlay={vi.fn()} />
}
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }))
// 首页卷目一次只展开一卷：先点开书脊，再点其中的课程。
const chapter = (title: string) => fireEvent.click(screen.getByRole('button', { name: new RegExp(`卷：${title}$`) }))
describe('生存章节界面', () => {
  it('第五关显示当前步骤，完成后可直接进入生存章节第一课', () => {
    render(<Harness />)
    click('第 5 关:劫')
    expect(screen.getByText('第 1 步 / 共 2 步')).toBeTruthy()
    click('交叉点 4,3')
    expect(screen.getByText('第 2 步 / 共 2 步')).toBeTruthy()
    expect(screen.queryByRole('button', { name: '下一章 · 保住自己的棋 →' })).toBeNull()
    click('交叉点 0,0')
    click('下一章 · 保住自己的棋 →')
    expect(screen.getByRole('heading', { name: '认出哪块棋危险' })).toBeTruthy()
  })
  it('认险、对照和检验题连贯，返回章节保留练习', () => {
    render(<Harness />)
    chapter('保住自己的棋'); click('1. 认出哪块棋危险')
    click('交叉点 4,4'); click('交叉点 5,5')
    expect(screen.getByRole('status').textContent).toContain('你点的是斜角')
    click('交叉点 4,5')
    expect(screen.getByRole('status').textContent).toContain('这颗黑棋只剩 A 这一口气')
    expect(screen.queryByRole('button', { name: '下在远处' })).toBeNull()
    click('比较两种走法'); click('下在远处')
    expect(screen.getByText(/提走了中央黑棋/)).toBeTruthy()
    click('下一题：在棋盘边上找危险的黑棋 →')
    expect(screen.getByRole('heading', { level: 2 }).textContent).toContain('边上')
    click('交叉点 0,3')
    openCatalog()
    chapter('保住自己的棋'); click('1. 认出哪块棋危险')
    expect(screen.getByRole('status').textContent).toContain('这颗黑棋只剩 A 这一口气')
  })
  it('卷内目录标出当前题，跳课和收起目录都保留答题步骤', () => {
    render(<Harness />)
    chapter('保住自己的棋'); click('练习 换到边上，自己找一找')
    click('交叉点 0,3')
    const toggle = screen.getByText('卷贰 · 保住自己的棋')
    fireEvent.click(toggle)
    const directory = screen.getByRole('navigation', { name: '卷贰目录' })
    expect(directory.querySelectorAll('[role="group"]')).toHaveLength(4)
    expect(directory.querySelector('[aria-current="step"]')?.textContent).toContain('换到边上，自己找一找')
    fireEvent.keyDown(toggle, { key: 'Escape' })
    expect(toggle.closest('details')?.open).toBe(false)
    expect(screen.getByText('第 2 步 / 共 2 步 · 找气')).toBeTruthy()
    fireEvent.click(toggle); click('2. 给自己的棋找出路')
    expect(toggle.closest('details')?.open).toBe(false)
    expect(screen.getByRole('heading', { name: '给自己的棋找出路' })).toBeTruthy()
    fireEvent.click(toggle); click(/^自己试试.*换到边上，自己找一找$/)
    expect(screen.getByText('第 2 步 / 共 2 步 · 找气')).toBeTruthy()
  })
  it('两眼需要自己选原因，一眼对照可以查看', () => {
    const { container } = render(<Harness />)
    chapter('保住自己的棋'); click('4. 两个小空点为什么能保命')
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
