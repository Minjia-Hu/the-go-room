import { Board } from '../board/Board'
import { BoardLayout } from '../board/BoardLayout'
import { LessonFeedback } from './LessonFeedback'
import { answerPriority, choosePriority, confirmPriority, priorityHint, priorityView, startPriority } from './priorityRunner'
import type { PriorityRun } from './priorityRunner'

interface Props { readonly run: PriorityRun; readonly onChange: (run: PriorityRun) => void; readonly onNext: () => void; readonly nextLabel: string }
export function PriorityPage({ run, onChange, onNext, nextLabel }: Props) {
  const view = priorityView(run)
  return <BoardLayout
    heading={<><p className="eyebrow">先后判断 · 你执黑</p><h2>{run.scene.title}</h2><p className="turn">{run.stage === 'choose' ? '先选一种下法，试下后再确认。' : run.stage === 'reason' ? '这手为什么有用？选出原因。' : '完成了。换个局面，再判断先做什么。'}</p></>}
    board={<><p className="figure-number">比较两种选择</p><Board board={view.game.board} marks={view.marks} disabled ghostColor={null} onPointClick={() => {}} /><p className="board-caption">{run.view === 'before' ? '题目原图 · 选择 A 或 B 比较' : run.view === 'after' ? (run.stage === 'choose' ? '黑棋试下一手 · 尚未确认' : '回看黑棋这一手') : '白棋回应 · 这是一条可能的变化'}</p></>}
    feedback={run.message && <LessonFeedback message={run.message} />}
    primary={<>
      {run.stage === 'choose' && run.selected !== null && <div className="actions"><button className="button" disabled={run.view !== 'after'} onClick={() => onChange(confirmPriority(run))}>确认这个选择</button></div>}
      {run.stage === 'choose' && <div className="actions priority-options">{run.scene.choices.map((choice, index) => <button key={choice.label} className="button button--ghost" aria-pressed={run.selected === index} onClick={() => onChange(choosePriority(run, index))}>{String.fromCharCode(65 + index)} · {choice.label}</button>)}
      </div>}
      {run.selected !== null && <div className="actions">
        {run.view !== 'before' && <button className="text-button" onClick={() => onChange({ ...run, view: 'before' })}>看原图</button>}
        {run.view !== 'after' && <button className="text-button" onClick={() => onChange({ ...run, view: 'after' })}>看黑棋这一手</button>}
        {run.view !== 'reply' && (run.stage !== 'choose' || run.mistakes > 0) && <button className="text-button" onClick={() => onChange({ ...run, view: 'reply' })}>看白棋回应</button>}
      </div>}
      {run.stage === 'reason' && <div className="reason-choices">{run.scene.reasons.map((reason, index) => <button key={reason} className="button button--ghost" onClick={() => onChange(answerPriority(run, index))}>{reason}</button>)}</div>}
      {run.stage === 'done' && <button className="button" onClick={onNext}>{nextLabel}</button>}
    </>}
    legend={<p className="small">字母：候选落点 · 圈：目标黑块与气 · 虚线：被提走的位置</p>}
  >
    <p className="muted">每次都从同一原图比较。先看自己的棋是否有危险，再考虑提子、追子或向远处发展。本题只比较这两条局部变化，不代表整盘最佳手。</p>
    {run.stage !== 'done' && <button className="text-button" onClick={() => onChange(priorityHint(run))}>给我一点思路</button>}
    <p className="small">本次提示：{run.help} 次 · 需要重试的判断：{run.mistakes} 次。</p>
    <div className="restart"><button className="text-button" onClick={() => onChange(startPriority(run.scene))}>重做这一题</button></div>
  </BoardLayout>
}
