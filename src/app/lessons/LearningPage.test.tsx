// @vitest-environment jsdom
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
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }))
// 首页卷目一次只展开一卷：先点开书脊，再点其中的课程。
const chapter = (title: string) => fireEvent.click(screen.getByRole('button', { name: new RegExp(`卷：${title}$`) }))
describe('生存章节界面', () => {
  it('认险、对照和检验题连贯，返回章节保留练习', () => {
    render(<Harness />)
    chapter('保住自己的棋'); click('1. 认出哪块棋危险')
    click('交叉点 4,4'); click('交叉点 4,5')
    expect(screen.getByRole('status').textContent).toContain('共用 A')
    click('如果去远处下')
    expect(screen.getByText('演示：白棋可能这样应对')).toBeTruthy()
    click('换个局面自己试试')
    expect(screen.getByRole('heading', { level: 2 }).textContent).toContain('边上')
    click('交叉点 0,3')
    click('返回章节'); chapter('保住自己的棋'); click('1. 认出哪块棋危险')
    expect(screen.getByText(/完成了。看懂原因/)).toBeTruthy()
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
