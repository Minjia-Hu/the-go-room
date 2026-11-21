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
interface HarnessProps { readonly id: string; readonly isLast?: boolean; readonly nextLabel?: string; readonly onNext?: () => void; readonly onNextChapter?: () => void }
function Harness({ id, isLast = false, nextLabel, onNext = vi.fn(), onNextChapter }: HarnessProps) {
  const [run, setRun] = useState(() => startSurvival(scene(id)))
  return <SurvivalPage run={run} onChange={setRun} onNext={onNext} isLast={isLast} nextLabel={nextLabel} onNextChapter={onNextChapter} />
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
    expect(container.querySelector('.board-primary .step-intro')).toBeNull()
    point(0, 5)
    expect(screen.getByText('独立完成')).toBeTruthy()
    expect(solid(container)).toEqual(['下一课 →'])
    expect(folded('看看对照').open).toBe(false)
  })

  it('找出路引导题：试下后才有“确认这一步”，确认一种后显示比较进度', () => {
    const { container } = render(<Harness id="escape-guided" />)
    point(4, 5)
    expect(screen.getByText('第 2 步 / 共 2 步 · 看后果，再确认')).toBeTruthy()
    expect(solid(container)).toEqual(['确认这一步'])
    click('确认这一步')
    expect(screen.getByText('第 1 步 / 共 2 步 · 选点试下')).toBeTruthy()
    expect(screen.getByText('已比较 1 / 2 种')).toBeTruthy()
    expect(solid(container)).toEqual([])
    point(4, 2); click('确认这一步')
    expect(screen.getByText('跟着引导完成')).toBeTruthy()
    expect(solid(container)).toEqual(['换个局面，自己试试 →'])
  })

  it('两只眼：说出原因时没有主按钮，对照收在折叠里', () => {
    const { container } = render(<Harness id="eyes-guided" />)
    point(3, 4)
    expect(screen.getByText('第 2 步 / 共 3 步 · 试第二个眼')).toBeTruthy()
    point(5, 4)
    expect(screen.getByText('第 3 步 / 共 3 步 · 说出原因')).toBeTruthy()
    expect(solid(container)).toEqual([])
    expect(folded('看看对照').open).toBe(false)
  })

  it('最后一题：主按钮去吃子卷，陪练为次要；练习去向单独传入', () => {
    const onNextChapter = vi.fn()
    const onPlay = vi.fn()
    const nextLabel = '下一章 · 吃掉对方的棋 →'
    const { container } = render(<Harness id="eyes-check" isLast nextLabel={nextLabel} onNextChapter={onNextChapter} onNext={onPlay} />)
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
  return <LearningPage session={session} onChange={setSession} onPlay={vi.fn()} />
}

describe('生存课程去向', () => {
  const chapter = (title: string) => fireEvent.click(screen.getByRole('button', { name: new RegExp(`卷：${title}$`) }))
  it('每道检验题完成后写明下一课，底部跳题链接降为次要', () => {
    const { container } = render(<LearningHarness />)
    chapter('保住自己的棋'); click('3. 把分开的棋连起来')
    click('交叉点 4,4'); click('确认这一步')
    expect(screen.getByRole('button', { name: '换个局面，自己试试 →' })).toBeTruthy()
    click('换个局面，自己试试 →')
    click('交叉点 4,4'); click('确认这一步')
    expect(screen.getByRole('button', { name: '下一课 · 两个小空点为什么能保命 →' })).toBeTruthy()
    expect(container.querySelector('.learning-toolbar--quiet')!.textContent).toContain('先跳过这一题')
  })
})
