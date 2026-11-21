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
  return <LearningPage onPractice={() => {}} session={session} onChange={setSession} onPlay={onPlay} />
}
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }))
// 首页卷目一次只展开一卷：先点开书脊，再点其中的课程。
const chapter = (title: string) => fireEvent.click(screen.getByRole('button', { name: new RegExp(`卷：${title}$`) }))
function number(value: string) {
  fireEvent.change(screen.getByRole('spinbutton'), { target: { value } })
  click('核对答案')
}

describe('规则慢镜头与终局课程界面', () => {
  it('每一步都展示盘面变化，两个原因回答正确才完成，切页保留进度', () => {
    const { container } = render(<Harness />)
    chapter('认识规则'); click('慢镜头 只剩一只眼：为什么白棋可以下？')
    expect(container.querySelectorAll('[data-stone="black"]')).toHaveLength(14)
    click('下一步')
    expect(screen.getByText(/尚未判定合法，不是正式落子/)).toBeTruthy()
    expect(container.querySelectorAll('[data-stone="black"]')).toHaveLength(14)
    click('下一步')
    expect(container.querySelectorAll('[data-stone="black"]')).toHaveLength(0)
    click('下一步')
    click('只要周围都是黑棋，白棋就会被吃')
    expect(screen.queryByRole('button', { name: '再比较另一种棋形' })).toBeNull()
    click('先提对方没气的棋，再检查自己的气')
    click('再比较另一种棋形')
    click('下一步'); click('下一步'); click('下一步')
    expect(container.querySelectorAll('[data-stone="black"]')).toHaveLength(13)
    expect(container.querySelector('[data-stone="white"][data-x="3"][data-y="4"]')).toBeNull()
    click('先提对方没气的棋，再检查自己的气')
    openCatalog(); chapter('认识规则'); click('慢镜头 两只眼：为什么同一个位置不能下？')
    click('学习围地与终局')
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('围住的空点属于谁')
  })
  it('归属、数子、贴目、终局的完整路径；不会把教学结果当正式对局', () => {
    onPlay.mockClear()
    render(<Harness />)
    chapter('围地与终局'); click('1. 围住的空点属于谁')
    expect((screen.getByRole('button', { name: '归黑方' }) as HTMLButtonElement).disabled).toBe(true)
    click('交叉点 1,1'); click('归白方')
    expect(screen.getByRole('status').textContent).toContain('只接触黑棋')
    click('归黑方'); click('交叉点 6,1'); click('归白方'); click('交叉点 4,4'); click('双方都不算')
    click('继续下一课')
    number('27')
    expect(screen.getByRole('status').textContent).toContain('还不对')
    click('帮我数一遍')
    number('28'); number('8'); number('27'); number('8')
    expect(screen.getByText(/借助提示完成。可以重来一次/)).toBeTruthy()
    click('继续下一课')
    number('42.5'); click('黑方赢')
    expect(screen.getByRole('status').textContent).toContain('要比较贴目后的分数')
    click('白方赢'); click('继续下一课')
    click('我停一手（黑）'); click('看看白棋继续下会怎样')
    expect(screen.getByText('连续停手：0 / 2 · 轮到黑棋')).toBeTruthy()
    click('我停一手（黑）'); click('白棋也停一手')
    click('确认死子并数子')
    expect(screen.getByRole('status').textContent).toContain('没有标记')
    click('为什么这颗白棋是死子？')
    expect((screen.getByRole('button', { name: '确认死子并数子' }) as HTMLButtonElement).disabled).toBe(true)
    click('回到标记死子'); click('交叉点 1,1'); click('确认死子并数子')
    expect(screen.getByText('白方胜，领先 7.5 分。')).toBeTruthy()
    expect(onPlay).not.toHaveBeenCalled()
    click('开始一盘陪练')
    expect(onPlay).toHaveBeenCalledOnce()
  })
  it('从两眼课进入慢镜头，返回后保留两眼题进度；重来仅重置当前课', () => {
    render(<Harness />)
    chapter('保住自己的棋'); click('4. 两个小空点为什么能保命')
    click('交叉点 3,4'); click('交叉点 5,4')
    click('分步看：为什么不算自杀？')
    openCatalog(); chapter('保住自己的棋'); click('4. 两个小空点为什么能保命')
    expect(screen.getByText('为什么白棋下不进这两个眼？')).toBeTruthy()
    openCatalog(); chapter('围地与终局'); click('3. 白棋为什么加 7.5 分')
    number('42.5')
    openCatalog(); chapter('围地与终局'); click('3. 白棋为什么加 7.5 分')
    expect(screen.getByRole('button', { name: '白方赢' })).toBeTruthy()
    click('重来本课')
    expect(screen.getByRole('spinbutton')).toBeTruthy()
    expect(screen.queryByRole('button', { name: '白方赢' })).toBeNull()
  })
})
