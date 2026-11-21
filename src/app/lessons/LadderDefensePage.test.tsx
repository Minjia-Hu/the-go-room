// @vitest-environment jsdom
import { useState } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LADDER_DEFENSE_SCENES } from '../../content/ladderDefense'
import { LadderDefensePage } from './LadderDefensePage'
import { startLadderDefense } from './ladderDefenseRunner'

afterEach(cleanup)
function Harness({ index, next }: { index: number; next: () => void }) {
  const [run, setRun] = useState(() => startLadderDefense(LADDER_DEFENSE_SCENES[index]))
  return <LadderDefensePage run={run} onChange={setRun} onNext={next} nextLabel="下一道练习" />
}
const button = (name: string) => screen.getByRole('button', { name })
const click = (name: string) => fireEvent.click(button(name))
const stone = (x: number, y: number) => document.querySelector(`[data-stone][data-x="${x}"][data-y="${y}"]`)?.getAttribute('data-stone')

describe('别被吃练习', () => {
  it.each([[0, 'B · 在别处下'], [1, 'A · 继续逃']] as const)('第 %i 题逐手看过正确分支且答对原因才继续', (index, label) => {
    const next = vi.fn()
    const scene = LADDER_DEFENSE_SCENES[index]
    render(<Harness index={index} next={next} />)
    click(label)
    const first = scene.choices[scene.answer].moves[0]
    expect(stone(first.x, first.y)).toBeUndefined()
    click('下一手')
    expect(stone(first.x, first.y)).toBe('black')
    click('上一手')
    expect(stone(first.x, first.y)).toBeUndefined()
    expect(screen.queryByRole('button', { name: scene.reasons[scene.reasonAnswer] })).toBeNull()
    for (const _ of scene.choices[scene.answer].moves) click('下一手')
    expect(screen.getByRole('status').textContent).toContain(index ? '3 口气' : '1 颗黑棋')
    click(scene.reasons[1 - scene.reasonAnswer])
    expect(screen.queryByRole('button', { name: '下一道练习' })).toBeNull()
    click(scene.reasons[scene.reasonAnswer])
    click('下一道练习')
    expect(next).toHaveBeenCalledOnce()
  })

  it('从另一种选择开始会恢复原图，浏览错误分支不会提交练习', () => {
    render(<Harness index={0} next={vi.fn()} />)
    click('A · 继续逃')
    click('下一手')
    expect(stone(4, 3)).toBe('black')
    click('B · 在别处下')
    expect(stone(4, 3)).toBeUndefined()
    expect(stone(4, 4)).toBe('black')
    expect(screen.queryByRole('button', { name: '下一道练习' })).toBeNull()
  })
})
