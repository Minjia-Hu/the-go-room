import { useState } from 'react'
import type { Lesson } from '../../content/lessons'
import { Board } from '../board/Board'
import { clickPoint, currentStep, isLessonDone, lessonMarks, startLesson } from './lessonRunner'
import type { RuleProgress } from './learningSession'

export interface LessonPageProps {
  readonly lessons: readonly Lesson[]
  /** 最后一关完成后用户点"去对局"时调用。 */
  readonly onFinish: () => void
  readonly progress?: RuleProgress
  readonly onProgress?: (progress: RuleProgress) => void
  readonly onSurvival?: () => void
}

export function LessonPage({ lessons, onFinish, progress, onProgress, onSurvival }: LessonPageProps) {
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
    <section className="page page--with-board">
      <Board
        board={run.game.board}
        lastMove={run.lastMove}
        marks={lessonMarks(run)}
        ghostColor={step?.kind === 'place' ? run.game.toPlay : null}
        disabled={done}
        onPointClick={(p) => update({ index, run: clickPoint(run, p) })}
      />
      <div className="panel">
        <ol className="progress" aria-label="教学进度">
          {lessons.map((l, i) => (
            <li
              key={l.id}
              className={
                i < index ? 'progress__step progress__step--done' : i === index ? 'progress__step progress__step--current' : 'progress__step'
              }
              aria-current={i === index ? 'step' : undefined}
            />
          ))}
        </ol>
        <h2>{lesson.title}</h2>
        <p className="muted">{lesson.intro}</p>
        {step && <p>{step.goal}</p>}
        {run.message && (
          <p className={`message message--${run.message.kind}`} role="status">
            {run.message.text}
          </p>
        )}
        <p>
          {done && !isLast && (
            <button type="button" className="button" onClick={() => goTo(index + 1)}>
              下一关
            </button>
          )}
          {done && isLast && (
            <>
              {onSurvival && <button type="button" className="button" onClick={onSurvival}>练习保住自己的棋</button>}{' '}
              <button type="button" className={onSurvival ? 'button button--ghost' : 'button'} onClick={onFinish}>
                {onSurvival ? '直接开始陪练' : '去对局'}
              </button>
            </>
          )}{' '}
          <button type="button" className="button button--ghost" onClick={() => goTo(index)}>
            重来这一关
          </button>
        </p>
      </div>
    </section>
  )
}
