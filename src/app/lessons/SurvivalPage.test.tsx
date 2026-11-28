// @vitest-environment jsdom
import { useState } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SURVIVAL_SCENES } from '../../content/survival'
import { LearningPage } from './LearningPage'
import { createLearningSession } from './learningSession'
import { SurvivalPage } from './SurvivalPage'
import { startSurvival } from './survivalRunner'

afterEach(cleanup)
const scene = (id: string) => SURVIVAL_SCENES.find((s) => s.id === id)!
interface HarnessProps { readonly id: string; readonly onPlay?: () => void; readonly nextLabel?: string; readonly onNext?: () => void; readonly onTry?: () => void }
function Harness({ id, onPlay, nextLabel = '下一课 →', onNext = vi.fn(), onTry }: HarnessProps) {
  const [run, setRun] = useState(() => startSurvival(scene(id)))
  return <SurvivalPage run={run} onChange={setRun} onNext={onNext} onPlay={onPlay} nextLabel={nextLabel} onTry={onTry} />
}
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }))
const point = (x: number, y: number) => click(`交叉点 ${x},${y}`)
/** 主操作区里的实心主按钮（不含 ghost 与文字链接）。 */
const solid = (container: HTMLElement) => [...container.querySelectorAll('.board-primary .button:not(.button--ghost)')].map((b) => b.textContent)
const folded = (summary: string) => screen.getByText(summary).closest('details')!

describe('生存课分步布局', () => {
  it('认危险：开场显示引言与第 1 步，讲解默认收起；完成后只有一个主按钮', () => {
    const { container } = render(<Harness id="danger-check" />)
    expect(screen.getByText('第 1 步 / 共 2 步 · 找棋')).toBeTruthy()
    expect(container.querySelector('.board-primary .step-intro')!.textContent).toBe(scene('danger-check').intro)
    expect(folded('讲解与图例').open).toBe(false)
    expect(solid(container)).toEqual([])
    point(0, 3)
    expect(screen.getByText('第 2 步 / 共 2 步 · 找气')).toBeTruthy()
    expect(container.querySelectorAll('[data-mark="target"]')).toHaveLength(2)
    expect(container.querySelector('[data-mark="liberty"], [aria-label="标记 A"]')).toBeNull()
    expect(container.querySelector('.board-primary .step-intro')).toBeNull()
    point(0, 5)
    expect(screen.getByLabelText('标记 A')).toBeTruthy()
    expect(screen.getByText('独立完成')).toBeTruthy()
    expect(solid(container)).toEqual(['下一课 →'])
    expect(folded('看看对照').open).toBe(false)
  })

  it('找出路引导题：落子即判断，比较两种不同救法后完成', () => {
    const { container } = render(<Harness id="escape-guided" />)
    expect(container.querySelector('.board-primary .step-intro')).toBeNull()
    expect(screen.getByText('从同一个局面试两种救法。先点一个空点，救出中央的黑棋。')).toBeTruthy()
    point(4, 5)
    expect(screen.queryByRole('button', { name: '确认这一步' })).toBeNull()
    expect(screen.queryByRole('button', { name: '下之后' })).toBeNull()
    click('下之前')
    expect(screen.queryByRole('button', { name: '下之前' })).toBeNull()
    click('下之后')
    point(4, 5)
    expect(screen.getByText('已比较 1 / 2 种')).toBeTruthy()
    expect(solid(container)).toEqual([])
    point(4, 2)
    expect(screen.getByText('跟着引导完成')).toBeTruthy()
    expect(solid(container)).toEqual(['下一课 →'])
  })

  it('两只眼：说出原因时没有主按钮，对照收在折叠里', () => {
    const { container } = render(<Harness id="eyes-guided" />)
    point(3, 4)
    expect(screen.getByText('第 2 步 / 共 3 步 · 试第二个眼')).toBeTruthy()
    point(5, 4)
    expect(screen.getByText('第 3 步 / 共 3 步 · 说出原因')).toBeTruthy()
    expect(solid(container)).toEqual([])
    const question = screen.getByText('为什么白棋下不进这两个眼？')
    expect(question.nextElementSibling?.querySelectorAll('button')).toHaveLength(2)
    expect(screen.queryByRole('status')).toBeNull()
    click('因为黑棋比白棋多')
    expect(screen.getByRole('status').textContent).toContain('想想')
    click('白棋一次只能填一个，另一个还在')
    expect(screen.getByRole('status').textContent).toContain('黑棋还有另一口气')
    expect(folded('看看对照').open).toBe(false)
  })

  it('最后一题：主按钮去吃子卷，陪练为次要；练习去向单独传入', () => {
    const onNextChapter = vi.fn()
    const onPlay = vi.fn()
    const nextLabel = '下一章 · 吃掉对方的棋 →'
    const { container } = render(<Harness id="eyes-check" nextLabel={nextLabel} onNext={onNextChapter} onPlay={onPlay} />)
    point(4, 3); point(4, 5); click('白棋一次只能填一个，另一个还在')
    expect(solid(container)).toEqual([nextLabel])
    expect(screen.getByRole('button', { name: '开始我的陪练' }).className).toContain('button--ghost')
    click(nextLabel)
    expect(onNextChapter).toHaveBeenCalledOnce()
    click('开始我的陪练')
    expect(onPlay).toHaveBeenCalledOnce()
    cleanup()
    const practice = render(<Harness id="danger-check" nextLabel="下一道练习" />)
    point(0, 3); point(0, 5)
    expect(solid(practice.container)).toEqual(['下一道练习'])
    expect(screen.queryByRole('button', { name: '开始我的陪练' })).toBeNull()
  })
})

function LearningHarness() {
  const [session, setSession] = useState(createLearningSession)
  return <LearningPage onPractice={() => {}} session={session} onChange={setSession} onPlay={vi.fn()} />
}

describe('生存课程去向', () => {
  const chapter = (title: string) => fireEvent.click(screen.getByRole('button', { name: new RegExp(`卷：${title}$`) }))
  it('每道检验题完成后写明下一课，底部跳题链接降为次要', () => {
    const { container } = render(<LearningHarness />)
    chapter('保住自己的棋'); click('3. 把分开的棋连起来（连接）')
    click('交叉点 4,4')
    expect(screen.getByRole('status').textContent).toContain('两块黑棋连在一起，有 5 口气')
    expect(screen.getByRole('button', { name: '下一课 · 两个小空点为什么能保命（两眼活棋） →' })).toBeTruthy()
    click('自己试试')
    click('交叉点 4,4')
    expect(screen.getByRole('button', { name: '下一课 · 两个小空点为什么能保命（两眼活棋） →' })).toBeTruthy()
    expect(container.querySelector('.learning-toolbar--quiet')!.textContent).toContain('先跳过这一题')
  })
})
