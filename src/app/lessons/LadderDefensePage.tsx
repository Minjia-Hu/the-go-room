import { Board } from '../board/Board'
import { BoardLayout } from '../board/BoardLayout'
import type { BoardMark } from '../board/marks'
import { LessonFeedback } from './LessonFeedback'
import { COMPLETION_LABELS } from './learningProgress'
import { answerDefense, chooseDefense, defenseCompletion, defenseHint, defenseStep, defenseView, startLadderDefense } from './ladderDefenseRunner'
import type { LadderDefenseRun } from './ladderDefenseRunner'
import { getGroup } from '../../engine'

interface Props {
  readonly run: LadderDefenseRun
  readonly onChange: (run: LadderDefenseRun) => void
  readonly onNext: () => void
  readonly nextLabel: string
}

export function LadderDefensePage({ run, onChange, onNext, nextLabel }: Props) {
  const { scene } = run
  const shown = defenseView(run)
  const last = shown.history.at(-1)
  const length = run.selected === null ? 0 : scene.choices[run.selected].moves.length
  const group = getGroup(shown.board, scene.target)
  const marks: BoardMark[] = [
    ...(group?.stones.map((point): BoardMark => ({ point, kind: 'target' })) ?? []),
    ...(group?.liberties.map((point): BoardMark => ({ point, kind: 'liberty' })) ?? []),
    ...(last?.kind === 'play' ? last.captured.map((point): BoardMark => ({ point, kind: 'captured' })) : []),
  ]
  const done = run.stage === 'done'
  const task = run.stage === 'reason' ? '选出这条走法合适的原因。' : run.selected === null
    ? '选择继续逃或在别处下，比较接下来的局面。'
    : run.step === length ? '可以回看走法，或换一个选择。' : '点「下一手」，看黑白双方怎样下。'
  const label = done ? COMPLETION_LABELS[defenseCompletion(run)]
    : run.stage === 'reason' ? '第三步 · 说出原因' : run.selected === null ? '第一步 · 选走法' : '第二步 · 看变化'
  return <BoardLayout
    heading={<>
      <p className="eyebrow">别被吃 · 你执黑</p>
      <h2>{scene.title}</h2>
      <div className="step-task">
        <p className="step-label">{label}</p>
        {!done && <p className="turn">{task}</p>}
      </div>
    </>}
    board={<>
      <Board board={shown.board} marks={marks} disabled lastMove={last?.kind === 'play' ? last.point : null} />
      <p className="board-caption">{run.step === 0 ? '题目原图 · 你执黑'
        : `第 ${run.step} / ${length} 手 · ${last?.color === 'white' ? '白棋' : '黑棋'}落子`}</p>
    </>}
    feedback={run.message && <LessonFeedback message={run.message} />}
    primary={<>
      {run.selected === null && !run.message && <p className="step-intro">{scene.intro}</p>}
      {!done && <div className="actions priority-options">
        <button className="button button--ghost" aria-pressed={run.selected === 0} onClick={() => onChange(chooseDefense(run, 0))}>A · {scene.choices[0].label}</button>
        <button className="button button--ghost" aria-pressed={run.selected === 1} onClick={() => onChange(chooseDefense(run, 1))}>B · {scene.choices[1].label}</button>
      </div>}
      {run.selected !== null && <div className="actions">
        <button className="text-button" disabled={run.step === 0} onClick={() => onChange(defenseStep(run, -1))}>上一手</button>
        <button className="button button--ghost" disabled={run.step === length} onClick={() => onChange(defenseStep(run, 1))}>下一手</button>
      </div>}
      {run.stage === 'reason' && <div className="reason-choices">
        {scene.reasons.map((reason, index) => <button key={reason} className="button button--ghost"
          onClick={() => onChange(answerDefense(run, index))}>{reason}</button>)}
      </div>}
      {!done && <button className="text-button hint-button" onClick={() => onChange(defenseHint(run))}>给我一点思路</button>}
      {done && <div className="actions next-lesson"><button className="button" onClick={onNext}>{nextLabel}</button></div>}
    </>}
  >
    <details className="step-notes">
      <summary>讲解与图例</summary>
      <p className="muted">从同一张原图比较两种固定走法。这里展示的是局部结果。</p>
      <p className="small">圈：目标黑棋 · 空心圈：气 · 虚线小圈：被提走的位置</p>
    </details>
    <div className="restart"><button className="text-button" onClick={() => onChange(startLadderDefense(scene))}>重做这一题</button></div>
  </BoardLayout>
}
