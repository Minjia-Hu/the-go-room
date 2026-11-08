import { WALK_CHAPTERS, WALK_MOVES, WALK_QUESTIONS } from '../../content/walkthrough'
import { Board } from '../board/Board'
import { BoardLayout } from '../board/BoardLayout'
import { answerWalk, nextWalkKey, startWalk, walkStep, walkView } from './walkthroughRunner'
import type { WalkRun } from './walkthroughRunner'

interface Props { readonly run: WalkRun; readonly onChange: (run: WalkRun) => void; readonly onPractice: () => void }
export function WalkthroughPage({ run, onChange, onPractice }: Props) {
  const view = walkView(run)
  const questionDone = view.question && run.answered.includes(view.question.step)
  return <BoardLayout
      heading={<><p className="eyebrow">完整九路讲解 / 第 {run.step} 手</p><h2>{view.chapter.title}</h2><p className="turn">{view.question && !questionDone ? view.question.title : "观察这一手的变化，再继续往下看。"}</p></>}
      board={<>
      <p className="figure-number">一盘九路，从头到尾 / 第 {run.step} / {WALK_MOVES.length} 手</p>
      <Board board={view.game.board} marks={view.marks} lastMove={view.last?.kind === 'play' ? view.last.point : null} disabled />
      <p className="board-caption">{view.score ? '双方已连续停手 · 无待移除死子 · 底色为最终归属' : '从空棋盘重放 · 可逐手查看，也可跳到下一讲解点'}</p>
      <p className="board-caption">圈：最后落子或关注棋块 · 虚线小圈：刚被提走的位置</p>
    </>}
      primary={<><p className="board-brief">{run.step === 0 ? "先从角和边发展，遇到危险就回头处理。" : WALK_MOVES[run.step - 1].note}</p>
        <div className="actions">
        <button className="button button--ghost" disabled={run.step === 0} onClick={() => onChange(walkStep(run, run.step - 1))}>上一手</button>
        <button className="button button--ghost" disabled={run.step === WALK_MOVES.length} onClick={() => onChange(walkStep(run, run.step + 1))}>下一手</button>
        <button className="button" disabled={run.step === WALK_MOVES.length} onClick={() => onChange(nextWalkKey(run))}>到下一讲解点</button>
      </div>
      </>}
    >
      <p className="muted">{view.chapter.intro}</p>
      {run.step === 0 && <p className="small">这是一盘为教学编排的完整示范局，包含明确指出的失误，方便看清因果。它不是高手棋谱，实战不必照搬每一步。</p>}
      <div className="walk-chapters" aria-label="整盘讲解阶段">{WALK_CHAPTERS.map((chapter, index) => <button key={chapter.start} className="button button--ghost" disabled={chapter.start > run.furthest} aria-pressed={view.chapter.start === chapter.start} onClick={() => onChange(walkStep(run, chapter.start))}>{index + 1}. {chapter.title.split('：')[0]}</button>)}</div>
      {view.score && <div className="study-score" aria-label="示范局计分明细">
        <div><span>黑方盘面</span><strong>{view.score.black}</strong><small>{view.blackStones} 颗活子 + {view.score.black - view.blackStones} 个空点</small></div>
        <div><span>白方盘面</span><strong>{view.score.white}</strong><small>{view.whiteStones} 颗活子 + {view.score.white - view.whiteStones} 个空点</small></div>
        <p>白方最终：{view.score.white} + {view.score.komi} = {view.score.white + view.score.komi} 分</p>
        {questionDone && <p className="turn">白方胜，领先 {view.score.margin} 分。黑棋提过一颗，也不代表最终获胜。</p>}
      </div>}
      {view.question && !questionDone && <div className="study-question"><h3>{view.question.title}</h3><div className="reason-choices">{view.question.options.map((option, index) => <button className="button button--ghost" key={option} onClick={() => onChange(answerWalk(run, index))}>{option}</button>)}</div></div>}
      {questionDone && <p className="small">这一处的关键问题已答对，可以继续或回看。</p>}
      {run.message && <p className="message message--hint" role="status">{run.message}</p>}
      <p className="small strategy-progress">关键问题：已答对 {run.answered.length} / {WALK_QUESTIONS.length} 个。跳转也需要先回答途中的关键问题。</p>
      {view.done && <div className="study-question"><h3>把一盘棋串起来</h3><p>开局先发展；中盘检查危险、连接自己的棋；安定后整理边界；最后收公共点、双方停手、确认死子再数分。接下来换一张没有标记的棋盘，自己判断。</p><button className="button" onClick={onPractice}>自己做六道练习</button></div>}
      <div className="restart"><button className="text-button" onClick={() => onChange(startWalk())}>重新学习这盘棋</button></div>
    </BoardLayout>
}
