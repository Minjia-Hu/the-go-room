// @vitest-environment jsdom
import { openCatalog } from './openCatalog.test-helper'
import { useState } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { INDEPENDENT_SCENES } from '../../content/independent'
import { WALK_QUESTIONS } from '../../content/walkthrough'
import { LearningPage } from './LearningPage'
import { createLearningSession } from './learningSession'

afterEach(cleanup)
const onPlay = vi.fn()
function Harness() {
  const [session, setSession] = useState(createLearningSession)
  return <LearningPage onPractice={() => {}} session={session} onChange={setSession} onPlay={onPlay} />
}
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }))
// 首页卷目一次只展开一卷：先点开书脊，再点其中的课程。
const chapter = (title: string) => fireEvent.click(screen.getByRole('button', { name: new RegExp(`卷：${title}$`) }))
const point = (x: number, y: number) => click(`交叉点 ${x},${y}`)

describe('整盘讲解与独立练习界面', () => {
  it('从空棋盘讲到真实终局，跳节点不能绕过问题，完成后进入无标记练习', () => {
    const { container } = render(<Harness />)
    chapter('从看懂到自己下'); click('一盘九路，从头到尾')
    expect(container.querySelectorAll('[data-stone]')).toHaveLength(0)
    click('到下一讲解点')
    expect(screen.getByRole('status').textContent).toContain('先回答')
    click('先追着吃白棋，其他都不看')
    expect(screen.getByRole('status').textContent).toContain('再想一想')
    for (const question of WALK_QUESTIONS) {
      let guard = 0
      while (!screen.queryByRole('heading', { name: question.title }) && guard++ < 20) click('到下一讲解点')
      expect(screen.getByRole('heading', { name: question.title })).toBeTruthy()
      click(question.options[question.answer])
    }
    expect(screen.getByText('白方最终：40 + 7.5 = 47.5 分')).toBeTruthy()
    expect(screen.getByText('白方胜，领先 6.5 分。黑棋提过一颗，也不代表最终获胜。')).toBeTruthy()
    click('自己做六道练习')
    expect(container.querySelectorAll('[data-mark]')).toHaveLength(0)
    expect(screen.getByText('第一步：找危险棋块')).toBeTruthy()
  })
  it('六题均需找到目标、确认合法解法和原因；仅最后完成后进入陪练', () => {
    onPlay.mockClear()
    render(<Harness />)
    chapter('从看懂到自己下'); click('独立练习 第 1 题')
    for (const [index, scene] of INDEPENDENT_SCENES.entries()) {
      point(scene.target.x, scene.target.y)
      point(scene.example.x, scene.example.y)
      click('确认这一手')
      const correct = scene.kind === 'capture' ? '因为提走白棋，空出位置，目标黑块的气增加了' : scene.kind === 'connect' ? '因为直线连成同一块，可以共用整块的气' : '因为与原棋块相连，整块接触到更多空点'
      click(correct)
      expect(screen.getByText('本次未用提示完成')).toBeTruthy()
      if (index < 5) click('下一道独立练习')
    }
    expect(onPlay).not.toHaveBeenCalled()
    click('去陪练试试')
    expect(onPlay).toHaveBeenCalledOnce()
  })
  it('错误回应可以回原图重试，提示和已答问题跨页保留', () => {
    render(<Harness />)
    chapter('从看懂到自己下'); click('一盘九路，从头到尾'); click('先考虑角边和自己的发展方向'); click('到下一讲解点')
    openCatalog(); chapter('从看懂到自己下'); click('独立练习 第 1 题'); click('第 2 题')
    click('给我一点思路'); click('标出需要观察的棋块')
    point(5, 3); point(5, 4); click('确认这一手'); click('看白棋怎样提')
    expect((screen.getByRole('button', { name: '确认这一手' }) as HTMLButtonElement).disabled).toBe(true)
    click('回到原图重试'); point(5, 1); click('确认这一手')
    click('因为只要吃过棋，这盘就赢了')
    expect(screen.queryByRole('button', { name: '下一道独立练习' })).toBeNull()
    click('因为提走白棋，空出位置，目标黑块的气增加了')
    expect(screen.getByText('借助提示完成')).toBeTruthy()
    openCatalog(); chapter('从看懂到自己下'); click('一盘九路，从头到尾')
    expect(screen.getByText(/关键问题：已答对 1 \/ 6 个/)).toBeTruthy()
    openCatalog(); chapter('从看懂到自己下'); click('独立练习 第 2 题')
    expect(screen.getByText('借助提示完成')).toBeTruthy()
    click('重做这一题')
    expect(screen.getByText('第一步：找危险棋块')).toBeTruthy()
  })
})
