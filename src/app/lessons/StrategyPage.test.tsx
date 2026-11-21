// @vitest-environment jsdom
import { openCatalog } from './openCatalog.test-helper'
import { useState } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LearningPage } from './LearningPage'
import { createLearningSession } from './learningSession'

afterEach(cleanup)
const onPlay = vi.fn()
function Harness() {
  const [session, setSession] = useState(createLearningSession)
  return <LearningPage session={session} onChange={setSession} onPlay={onPlay} />
}
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }))
// 首页卷目一次只展开一卷：先点开书脊，再点其中的课程。
const chapter = (title: string) => fireEvent.click(screen.getByRole('button', { name: new RegExp(`卷：${title}$`) }))
const seeTwo = () => click('看白棋回应')
const seeFour = () => { click('看白棋回应'); click('看黑棋继续下'); click('看白棋回应') }

describe('九路策略课程界面', () => {
  it('三课完整对照、原因回答与陪练入口，回答错误不能继续', () => {
    onPlay.mockClear()
    const { container } = render(<Harness />)
    chapter('九路策略入门'); click('1. 先救棋，还是去占地？')
    click('交叉点 4,5'); seeTwo()
    expect(screen.queryByRole('heading', { name: '比较之后，哪句话解释了原因？' })).toBeNull()
    click(/^B · 先去远处落子/); seeTwo()
    expect(container.querySelectorAll('[data-mark="captured"]')).toHaveLength(2)
    click('棋盘哪里空，就先下哪里')
    expect(screen.queryByRole('button', { name: '继续下一课' })).toBeNull()
    click('先检查自己的棋是否有马上被提的危险'); click('继续下一课')
    for (const option of [/^A · 角上补一手/, /^B · 边上补一手/, /^C · 中腹补一手/]) { click(option); seeTwo() }
    expect(screen.getByText('图中黑子：12 颗。这圈边界围住 4 个空点。')).toBeTruthy()
    click('角上的棋永远不会被吃')
    expect(screen.getByRole('status').textContent).toContain('也可能被吃')
    click('棋盘边线能替棋子挡住一面或两面'); click('继续下一课')
    click(/^A · 继续追右上白棋/); seeFour()
    expect(container.querySelectorAll('[data-mark="captured"]')).toHaveLength(2)
    click(/^B · 先保护左下黑棋/); seeFour()
    expect(screen.getByText(/当前整块 4 颗，共 4 口气/)).toBeTruthy()
    click('只要让对手逃跑，就已经得分了')
    expect(screen.queryByRole('button', { name: '带着这三点去陪练' })).toBeNull()
    click('追了两手还没吃到，自己的两颗却被提走了')
    expect(onPlay).not.toHaveBeenCalled()
    click('带着这三点去陪练')
    expect(onPlay).toHaveBeenCalledOnce()
  })
  it('切回章节保留变化、比较记录；重来只重置当前课', () => {
    render(<Harness />)
    chapter('九路策略入门'); click('1. 先救棋，还是去占地？'); click(/^A · 先接出黑棋/); seeTwo()
    openCatalog(); chapter('九路策略入门'); click('2. 为什么从角和边开始？')
    click(/^C · 中腹补一手/); seeTwo()
    openCatalog(); chapter('九路策略入门'); click('1. 先救棋，还是去占地？')
    expect(screen.getByText(/已看完 1 \/ 2 种结果/)).toBeTruthy()
    click('回到落子前')
    expect(screen.getByLabelText('标记 A')).toBeTruthy()
    click('重来本课')
    expect(screen.getByText(/已看完 0 \/ 2 种结果/)).toBeTruthy()
    openCatalog(); chapter('九路策略入门'); click('2. 为什么从角和边开始？')
    expect(screen.getByText(/已看完 1 \/ 3 种结果/)).toBeTruthy()
  })
  it('终局课程完成后能进入策略第一课', () => {
    render(<Harness />)
    chapter('围地与终局'); click('4. 停一手以后，怎样结束这一盘')
    click('我停一手（黑）'); click('白棋也停一手'); click('交叉点 1,1'); click('确认死子并数子')
    click('学习九路策略')
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('先救棋，还是去占地？')
  })
})
