import { LessonFeedback } from './LessonFeedback'
import { Board } from '../board/Board'
import { BoardLayout } from '../board/BoardLayout'
import { answerIndependent, confirmIndependent, independentHint, independentPoint, independentReasons, independentView, startIndependent } from './independentRunner'
import type { IndependentRun } from './independentRunner'

interface Props { readonly practiceTitle?: string; readonly nextLabel?: string; readonly run: IndependentRun; readonly index: number; readonly onChange: (run: IndependentRun) => void; readonly onNext: () => void; readonly allDone: boolean }
export function IndependentPage({ run, index, onChange, onNext, allDone, nextLabel, practiceTitle }: Props) {
  const view = independentView(run)
  const goal = run.scene.kind === 'capture' ? '试着用提子帮助目标黑棋，让它至少有两口气。' : run.scene.kind === 'connect' ? '把目标黑棋直线连接到旁边另一块黑棋，让整块至少有两口气。' : '选一手让目标黑块至少有两口气，先处理眼前危险。'
  return <BoardLayout
      legend={<p className="small">{view.marks.length ? '橙圈：关注棋块 · 小空心圈：气 · 虚线小圈：被提走的位置' : '不按棋子多少判断危险，要数整块棋的气'}</p>}
      feedback={run.message && <LessonFeedback message={run.message} />}
      heading={<><p className="eyebrow">{practiceTitle ? '自己判断 · 独立练习' : `独立练习 / 第 ${index + 1} 题，共六题`}</p><h2>{practiceTitle ?? '这次，自己找出一手'}</h2><p className="turn">{run.stage === 'find' ? '第一步：找危险棋块' : run.stage === 'move' ? '第二步：试下、看后果，再确认' : run.stage === 'reason' ? '第三步：解释这一手为什么有用' : view.completion}</p></>}
      board={<>
      <p className="figure-number">{practiceTitle ?? `换个棋形，自己判断 / 第 ${index + 1} / 6 题`}</p>
      <Board board={view.game.board} marks={view.marks} disabled={run.stage === 'reason' || run.stage === 'done' || run.view === 'reply'} ghostColor={run.stage === 'move' && run.view !== 'reply' ? 'black' : null} onPointClick={(point) => onChange(independentPoint(run, point))} />
      <p className="board-caption">{run.view === 'reply' ? '反例演示：白棋占住最后一气，目标黑棋被提走' : run.point && run.view === 'after' ? '试下结果 · 从题目原图计算，不写正式棋谱' : run.stage === 'find' && run.help < 2 ? '初始不标答案 · 先自己找危险的黑棋' : '题目原图 · 你执黑'}</p>
    </>}
      primary={view.trial?.result.ok && <>{(!run.message || run.view === "reply") && <p className="board-brief">{run.view === "reply" ? "白棋填住最后一口气，提走了目标黑棋。回到原图再试。" : `试下后目标有 ${view.trial.group?.liberties.length ?? 0} 口气，提走 ${view.trial.captured} 颗白棋。${view.trial.meetsGoal ? "这手完成了本题目标。" : "这手还没有完成本题目标。"}`}</p>}<div className="actions">
        {run.stage === 'move' && <><button className="button" disabled={run.view !== 'after'} onClick={() => onChange(confirmIndependent(run))}>确认这一手</button><button className="text-button" onClick={() => onChange({ ...run, point: null, view: 'before', message: null })}>回到原图重试</button></>}</div><div className="actions">
        <button className="button button--ghost" onClick={() => onChange({ ...run, view: 'before' })}>看原图</button>
        <button className="button button--ghost" onClick={() => onChange({ ...run, view: 'after' })}>看试下结果</button>
        {view.trial.reply && <button className="button button--ghost" onClick={() => onChange({ ...run, view: 'reply' })}>看白棋怎样提</button>}
      </div></>}
    >
      <p className="muted">{run.stage === 'find' ? '先点出只有一口气的黑棋。棋盘上还有其他黑棋，别只看哪块旁边白棋最多。相连的整块选任意一颗都可以。' : goal}</p>
      {run.stage === 'reason' && <div className="reason-choices">{independentReasons(run).map((reason, reasonIndex) => <button key={reason} className="button button--ghost" onClick={() => onChange(answerIndependent(run, reasonIndex))}>{reason}</button>)}</div>}
      {(run.stage === 'find' || run.stage === 'move') && run.help < 2 && <button className="text-button hint-button" onClick={() => onChange(independentHint(run))}>{run.help === 0 ? '给我一点思路' : '标出需要观察的棋块'}</button>}
      <p className="small strategy-progress">本次提示：{run.help} 次 · 需要重试的判断：{run.mistakes} 次。练习会保留这些记录，帮助区分自己判断和借助提示。</p>
      {run.stage === 'done' && <div className="study-question"><p>{run.help > 0 ? '这次用过提示。下次可以换题，先自己找，再决定是否需要帮助。' : '这次完成了找危险、试下和解释。换一个方向或棋形，再看看能否自己判断。'}</p><button className="button" onClick={onNext}>{nextLabel ?? (allDone ? '去陪练试试' : index === 5 ? '回到未完成的题' : '下一道独立练习')}</button></div>}
      <div className="restart"><button className="text-button" onClick={() => onChange(startIndependent(run.scene))}>重做这一题</button></div>
    </BoardLayout>
}
