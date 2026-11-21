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

describe('课程答错反馈', () => {
  it.each([
    ['认识规则', '第 2 关:气', '上下左右'],
    ['保住自己的棋', '1. 认出哪块棋危险', '上下左右'],
    ['围地与终局', '1. 围住的空点属于谁', '棋子本身不是空点'],
    ['九路策略入门', '1. 先救棋，还是去占地？', '候选点'],
    ['从看懂到自己下', '独立练习 第 1 题', '不是空点或白棋'],
  ])('%s · %s 的解释留在棋盘主要操作区，不藏进详情', (chapter, lesson, reason) => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`卷：${chapter}$`) }))
    fireEvent.click(screen.getByRole('button', { name: lesson }))
    fireEvent.click(screen.getByRole('button', { name: '交叉点 0,0' }))
    const feedback = screen.getByRole('status')
    expect(feedback.textContent).toContain(reason)
    expect(feedback.closest('.board-primary')).not.toBeNull()
    expect(feedback.closest('details')).toBeNull()
  })
})
