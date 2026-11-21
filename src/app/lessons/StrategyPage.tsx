import { LessonFeedback } from './LessonFeedback'
import { STRATEGY_LESSONS } from '../../content/strategy'
import { Board } from '../board/Board'
import { BoardLayout } from '../board/BoardLayout'
import { answerStrategy, chooseStrategy, startStrategy, strategyPoint, strategyStep, strategyView } from './strategyRunner'
import type { StrategyRun } from './strategyRunner'

interface Props { readonly run: StrategyRun; readonly onChange: (run: StrategyRun) => void; readonly onNext: () => void; readonly isLast: boolean; readonly onWalk?: () => void }
export function StrategyPage({ run, onChange, onNext, isLast, onWalk }: Props) {
  const { lesson } = run
  const view = strategyView(run)
  const course = STRATEGY_LESSONS.findIndex((entry) => entry.id === lesson.id) + 1
  const allSeen = run.seen.length === lesson.choices.length
  return <BoardLayout
      legend={<p className="small">{lesson.id === 'edges' ? '只比较围地形状与用子，不表示已做活或已经得到分数' : '橙圈：目标黑块 · 小空心圈：气 · 虚线小圈：刚被提走的位置'}</p>}
      feedback={run.message && <LessonFeedback message={run.message} />}
      heading={<><p className="eyebrow">第 {course} 课 · 共三课</p><h2>{lesson.title}</h2><p className="turn">{run.done ? "这一课完成，可以回看不同走法。" : allSeen ? "比较结果，再选出原因。" : run.choiceIndex === null ? lesson.id === 'edges' ? "比较角、边和中腹，看看围同样的空点用了多少棋。" : "先数目标棋块的气，再选择一手比较。" : `正在看 ${view.choice.letter} 变化，第 ${run.step} / ${view.choice.moves.length} 手。`}</p></>}
      board={<>
      <p className="figure-number">{run.choiceIndex === null ? '先观察' : `${view.choice.letter} 变化，第 ${run.step} / ${view.choice.moves.length} 手`}</p>
      <Board board={view.game.board} marks={view.marks} disabled={run.step > 0} onPointClick={(point) => onChange(strategyPoint(run, point))} />
      <p className="board-caption">{lesson.id === 'edges' ? `独立对照图：${view.choice.label.replace('补一手', '')} · 圆点是${run.step === 0 ? '准备围住' : '围住'}的四个空点` : '固定教学变化 · 你执黑，双方按示例交替落子'}</p>
    </>}
      primary={<>{run.choiceIndex !== null && <p className="board-brief">{view.original ? view.group ? `目标棋块现在有 ${view.group.liberties.length} 口气，原来的 ${view.original.stones.length} 颗黑子还剩 ${view.remaining.length} 颗。` : "目标黑棋已被提走，看看哪里失去了最后一口气。" : `图中有 ${view.blackStones} 颗黑子。${run.step ? "补上缺口后，围住了四个空点。" : "先找到边界的缺口。"}`}</p>}
        {run.choiceIndex !== null && <div className="actions">
        <button className="button button--ghost" disabled={run.step === 0} onClick={() => onChange(strategyStep(run, run.step - 1))}>上一步</button>
        <button className="button" disabled={view.atEnd} onClick={() => onChange(strategyStep(run, run.step + 1))}>{view.atEnd ? '这条变化已看完' : run.step === 0 ? '看黑棋落子' : run.step % 2 ? '看白棋回应' : '看黑棋继续下'}</button>
        <button className="text-button" disabled={run.step === 0} onClick={() => onChange(strategyStep(run, 0))}>回到落子前</button>
      </div>}
        <div className="strategy-choices" aria-label="选择要比较的走法">{lesson.choices.map((choice, index) => <button key={choice.id} className="button button--ghost" aria-pressed={run.choiceIndex === index} onClick={() => onChange(chooseStrategy(run, index))}><span>{choice.letter} · {choice.label}</span><small>{run.seen.includes(index) ? '已看完' : '试试这一步'}</small></button>)}</div></>}
    >
      <p className="muted">{lesson.intro}</p>
      {lesson.id === 'edges' && <p className="small">切换选项会换到另一张独立棋形，从该图补一手开始；不是在同一盘棋里搬动棋子。</p>}
      <div className="strategy-observation" aria-live="polite">
        <p className="eyebrow">{run.step === 0 ? '落子之前' : `第 ${run.step} 手 · ${run.step % 2 ? '黑棋' : '白棋'}${run.step === 3 ? '继续下' : '落子'}`}</p>
        <p>{view.explanation}</p>
        {view.original ? <p className="small">原来 {view.original.stones.length} 颗目标黑子，仍在盘上 {view.remaining.length} 颗。{view.group ? `当前整块 ${view.group.stones.length} 颗，共 ${view.group.liberties.length} 口气。` : '目标棋块已被提走。'}<br />这条变化已提白子 {view.capturedWhite} 颗、提黑子 {view.capturedBlack} 颗。</p>
          : <p className="small">图中黑子：{view.blackStones} 颗。{run.step === 0 ? '缺口还未补上。' : '这圈边界围住 4 个空点。'}</p>}
      </div>
      {view.atEnd && <p className="message message--hint">{view.choice.conclusion}</p>}
      <p className="small strategy-progress">已看完 {run.seen.length} / {lesson.choices.length} 种结果。{!allSeen && '每种走法都看到最后，再比较原因。'}</p>
      {allSeen && !run.done && <div className="study-question"><h3>比较之后，哪句话解释了原因？</h3><div className="reason-choices">{lesson.reasons.map((reason, index) => <button key={reason.text} className="button button--ghost" onClick={() => onChange(answerStrategy(run, index))}>{reason.text}</button>)}</div></div>}
      {run.done && <div className="study-question"><h3>这一课带走什么</h3><p>{lesson.takeaway}</p><div className="actions next-lesson">{isLast && onWalk && <button className="button" onClick={onWalk}>看一盘完整九路讲解</button>}<button className={isLast && onWalk ? 'button button--ghost' : 'button'} onClick={onNext}>{isLast ? '带着这三点去陪练' : '继续下一课'}</button></div></div>}
      <p className="small strategy-footnote">这里演示一种可能的回应，不是唯一走法，也不代表最佳手。比较的是当前变化的具体后果。</p>
      <div className="restart"><button className="text-button" onClick={() => onChange(startStrategy(lesson))}>重来本课</button></div>
    </BoardLayout>
}
