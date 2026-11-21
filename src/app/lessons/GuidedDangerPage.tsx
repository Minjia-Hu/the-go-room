import { useState } from 'react'
import { getGroup } from '../../engine'
import { Board } from '../board/Board'
import type { BoardMark } from '../board/marks'
import { analyzeAction } from '../coaching/analysis'
import { LessonFeedback } from './LessonFeedback'
import { choosePracticePoint, practiceBoard, practiceHint, startSurvival } from './survivalRunner'
import type { SurvivalRun } from './survivalRunner'

interface Props {
  run: SurvivalRun
  onChange: (run: SurvivalRun) => void
  onNext: () => void
}

export function GuidedDangerPage({ run, onChange, onNext }: Props) {
  const [comparing, setComparing] = useState(false)
  const [variation, setVariation] = useState<'escape' | 'ignore' | null>(null)
  const done = run.stage === 'done'
  const findingStone = run.stage === 'group'
  const shown = variation ? practiceBoard({
    ...run, preview: analyzeAction(run.game, variation === 'escape' ? run.scene.examples[0] : run.scene.wrongMove!),
    view: variation === 'escape' ? 'after' : 'reply',
  }) : run.game
  const target = getGroup(shown.board, run.scene.target)
  const marks: BoardMark[] = []
  if (target && (!findingStone || run.hint >= 2)) {
    for (const point of target.stones) marks.push({ point, kind: 'target' })
    if (done || run.hint >= 2) {
      for (const point of target.liberties) marks.push({ point, kind: 'liberty' })
      if (target.liberties.length === 1) marks.push({ point: target.liberties[0], kind: 'label', text: 'A' })
    }
  }
  const last = shown.history.at(-1)
  if (last?.kind === 'play') {
    for (const point of last.captured) marks.push({ point, kind: 'captured' })
  }
  const step = findingStone ? '第一步 · 找棋' : '第二步 · 找气'
  const resultPrefix = run.assisted ? '演示完成。' : run.hint >= 2 ? '借助提示完成。' : '找对了。'
  const feedback = done ? `${resultPrefix}${run.message ?? ''}` : run.message
  const comparisonFeedback = variation === 'ignore'
    ? '黑棋下在远处，白棋随即占住最后一口气，提走了中央黑棋。'
    : '黑棋向下接出，两颗棋现在有三口气。白棋一手提不走了。'
  return <section className="page page--with-board board-flow danger-study">
    <header className="board-task">
      <p className="eyebrow">第 {run.scene.course} 课 · 一起练习</p>
      <h2>{run.scene.title}</h2>
      {!done && <div className="danger-task">
        <span className="danger-step">{step}</span>
        <p className="turn">{findingStone ? '点一颗你觉得快被吃掉的黑棋。' : '点出它最后一口气。'}</p>
      </div>}
    </header>
    <div className="board-frame">
      <Board board={shown.board} marks={marks} disabled={done}
        lastMove={last?.kind === 'play' ? last.point : null}
        onPointClick={(point) => onChange(choosePracticePoint(run, point))} />
    </div>
    <div className="board-primary">
      {feedback ? <LessonFeedback message={feedback} /> : <p className="muted">看看每颗黑棋，上下左右还剩几个空点？</p>}
      {done ? <>
        <button className="text-button" aria-expanded={comparing} onClick={() => {
          setVariation(null)
          setComparing(!comparing)
        }}>比较两种走法 <span aria-hidden="true">{comparing ? '▴' : '▾'}</span></button>
        {comparing && <>
          <div className="actions">
            <button className="button button--ghost" aria-pressed={variation === 'ignore'} onClick={() => setVariation('ignore')}>下在远处</button>
            <button className="button button--ghost" aria-pressed={variation === 'escape'} onClick={() => setVariation('escape')}>接住黑棋</button>
            {variation && <button className="text-button" onClick={() => setVariation(null)}>回看原图</button>}
          </div>
          {variation && <LessonFeedback message={comparisonFeedback} />}
        </>}
        <div className="actions"><button className="button danger-next" onClick={onNext}>下一题：在棋盘边上找危险的黑棋 →</button></div>
        <div className="restart"><button className="text-button" onClick={() => {
          setVariation(null)
          setComparing(false)
          onChange(startSurvival(run.scene))
        }}>重来这一题</button></div>
      </> : <button className="text-button hint-button" onClick={() => onChange(practiceHint(run))}>
        {run.hint >= 2 ? '看演示' : '给点提示'}
      </button>}
    </div>
  </section>
}
