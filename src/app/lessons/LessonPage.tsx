import { LessonFeedback } from './LessonFeedback'
import { useState } from 'react'
import type { Lesson } from '../../content/lessons'
import { Board } from '../board/Board'
import { BoardLayout } from '../board/BoardLayout'
import { clickPoint, currentStep, isLessonDone, lessonMarks, startLesson } from './lessonRunner'
import type { RuleProgress } from './learningSession'
export interface LessonPageProps {
  readonly lessons: readonly Lesson[]
  /** 最后一课完成后用户点"去对局"时调用。 */
  readonly onFinish: () => void
  readonly progress?: RuleProgress
  readonly onProgress?: (progress: RuleProgress) => void
  readonly onSurvival?: () => void
  readonly onRuleSequence?: () => void
  readonly completedIds?: readonly string[]
}
export function LessonPage({ lessons, onFinish, progress, onProgress, onSurvival, onRuleSequence, completedIds }: LessonPageProps) {
  const [local, setLocal] = useState<RuleProgress>(() => ({ index: 0, run: startLesson(lessons[0]) }))
  const { index, run } = progress ?? local
  const update = onProgress ?? setLocal
  const lesson = lessons[index]
  const step = currentStep(run)
  const done = isLessonDone(run)
  const isLast = index === lessons.length - 1
  function goTo(next: number) {
    update({ index: next, run: startLesson(lessons[next]) })
  }
  return (
    <BoardLayout
      feedback={run.message && <LessonFeedback message={run.message?.text ?? null} kind={run.message?.kind} />}
      heading={<>
        <p className="eyebrow">第 {index + 1} 课</p>
        <h2>{lesson.title}</h2>
        {step ? (
          <div className="step-task">
            <p className="step-label">第 {run.stepIndex + 1} 步 / 共 {lesson.steps.length} 步</p>
            <p className="turn">{step.goal}</p>
          </div>
        ) : <p className="turn">这一课完成了，看看原因再继续。</p>}
      </>}
      board={<>
        <Board
          board={run.game.board}
          lastMove={run.lastMove}
          marks={lessonMarks(run)}
          ghostColor={step?.kind === 'place' ? run.game.toPlay : null}
          disabled={done}
          onPointClick={(p) => update({ index, run: clickPoint(run, p) })}
        />
        <p className="board-caption">9 路棋盘 · 从一个小局面开始</p>
      </>}
    >
        <ol className="progress" aria-label="教学进度">
          {lessons.map((l, i) => (
            <li
              key={l.id}
              className={
                i === index ? 'progress__step progress__step--current' : (completedIds ? completedIds.includes(l.id) : i < index) ? 'progress__step progress__step--done' : 'progress__step'
              }
              aria-current={i === index ? 'step' : undefined}
            />
          ))}
        </ol>
        <p className="muted">{lesson.intro}</p>
        {lesson.id === 'suicide' && onRuleSequence && <button className="text-button" onClick={onRuleSequence}>对照看：一只眼和两只眼</button>}

        <p>
          {done && !isLast && (
            <button type="button" className="button" onClick={() => goTo(index + 1)}>
              下一课
            </button>
          )}
          {done && isLast && (
            <>
              {onSurvival && <button type="button" className="button" onClick={onSurvival}>下一章 · 保住自己的棋 →</button>}{' '}
              <button type="button" className={onSurvival ? 'button button--ghost' : 'button'} onClick={onFinish}>
                {onSurvival ? '直接开始陪练' : '去对局'}
              </button>
            </>
          )}{' '}
          <button type="button" className="button button--ghost" onClick={() => goTo(index)}>
            重来本课
          </button>
        </p>
      </BoardLayout>
  )
}
