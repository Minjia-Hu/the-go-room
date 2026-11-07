import { ENDGAME_LESSONS, TERRITORY_QUESTIONS } from '../../content/endgame'
import { Board } from '../board/Board'
import { answerTerritory, answerWinner, confirmEnding, countHint, countQuestion, endgameView, endingDemo, endingTurn, lessonScore, selectEndgame, startEndgame, submitCount } from './endgameRunner'
import type { EndgameRun } from './endgameRunner'

interface Props { readonly run: EndgameRun; readonly onChange: (run: EndgameRun) => void; readonly onNext: () => void; readonly isLast: boolean }
export function EndgamePage({ run, onChange, onNext, isLast }: Props) {
  const { lesson, done } = run
  const view = endgameView(run)
  const result = lessonScore(run)
  const { score } = result
  const course = ENDGAME_LESSONS.findIndex((entry) => entry.id === lesson.id) + 1
  const canPick = !done && !run.demo && (lesson.id === 'territory' || (lesson.id === 'ending' && run.game.phase === 'scoring'))
  const showTotal = (done && lesson.id !== 'territory') || lesson.id === 'komi'
  const showKomi = (lesson.id === 'komi' && run.step > 0) || (lesson.id === 'ending' && done)
  const numberQuestion = !done && (lesson.id === 'count' || (lesson.id === 'komi' && run.step === 0))
  const inputLabel = lesson.id === 'count' ? `${countQuestion(run).label}有多少？` : '白方加上贴目后是多少分？'
  return <section className="page page--with-board">
    <div>
      <p className="figure-number">围地与终局 / 第 {course} 课</p>
      <Board board={view.board} marks={view.marks} disabled={!canPick} onPointClick={(point) => onChange(selectEndgame(run, point))} />
      <p className={`board-caption${run.demo ? ' board-caption--notice' : ''}`}>{run.demo ? '独立提子演示 · 不改变本题的停手记录和死子标记' : lesson.id === 'ending' ? done ? '已移除约定的死子 · 按剩余棋子与空点数子' : '教学局面 · 圈出的白子待双方确认，其余棋子已确认活着' : '已确认活棋的教学终局 · 中盘不能照颜色直接判定归属'}</p>
      <p className="board-caption">{lesson.id === 'count' && !done ? '棋子上的圈：本次要数的活子 · 空心小圈：本次要数的空点' : lesson.id === 'ending' && !done ? '橙圈：本题死子 · 叉号：已标记移除 · 虚线小圈：演示中被提的位置' : '深色底：黑方归属 · 浅色底：白方归属 · 字母：当前观察的空区'}</p>
    </div>
    <div className="panel">
      <p className="eyebrow">围地与终局 / 第 {course} 课，共四课</p>
      <h2>{lesson.title}</h2><p className="muted">{lesson.intro}</p>
      {lesson.id === 'territory' && !done && <div className="study-question">
        <h3>先点 {TERRITORY_QUESTIONS[run.step].label} 所在的空区，再判断归属</h3>
        <p className="small">选中后会标出整片相连的空点。只看这片空区的边界，不看谁的棋更多。</p>
        <div className="actions">{(['black', 'white', null] as const).map((owner) => <button key={owner ?? 'neutral'} className="button button--ghost" disabled={!run.picked} onClick={() => onChange(answerTerritory(run, owner))}>{owner === 'black' ? '归黑方' : owner === 'white' ? '归白方' : '双方都不算'}</button>)}</div>
      </div>}
      {numberQuestion && <form className="study-question" onSubmit={(event) => { event.preventDefault(); onChange(submitCount(run)) }}>
        {lesson.id === 'count' && <p className="eyebrow">分开数 / {run.step + 1} · 4</p>}
        <label className="study-input-label" htmlFor="study-number">{inputLabel}</label>
        <p className="small">{lesson.id === 'count' ? '沿每一行数当前标出的交叉点。只数这一类，每个点数一次。' : `白方盘面 ${score.white} 分，再加 ${score.komi} 分。`}</p>
        <div className="study-input-row"><input id="study-number" type="number" inputMode={lesson.id === 'komi' ? 'decimal' : 'numeric'} min="0" step={lesson.id === 'komi' ? '0.5' : '1'} value={run.input} onChange={(event) => onChange({ ...run, input: event.target.value })} /><button className="button" type="submit">核对答案</button></div>
        {lesson.id === 'count' && <button className="text-button hint-button" type="button" onClick={() => onChange(countHint(run))}>帮我数一遍</button>}
      </form>}
      {lesson.id === 'komi' && run.step === 1 && !done && <div className="study-question"><h3>比较最终分数，谁赢了？</h3><div className="actions"><button className="button button--ghost" onClick={() => onChange(answerWinner(run, 'black'))}>黑方赢</button><button className="button button--ghost" onClick={() => onChange(answerWinner(run, 'white'))}>白方赢</button></div></div>}
      {lesson.id === 'ending' && !done && <div className="study-question">
        <p className="turn">{run.game.phase === 'playing' ? `连续停手：${run.game.consecutivePasses} / 2 · 轮到${run.game.toPlay === 'black' ? '黑' : '白'}棋` : '双方连续停手完成 · 现在确认死子'}</p>
        {run.game.phase === 'playing' ? <div className="actions">{run.game.toPlay === 'black' ? <button className="button" onClick={() => onChange(endingTurn(run, 'black-pass'))}>我停一手（黑）</button> : <><button className="button" onClick={() => onChange(endingTurn(run, 'white-pass'))}>白棋也停一手</button><button className="button button--ghost" onClick={() => onChange(endingTurn(run, 'white-play'))}>看看白棋继续下会怎样</button></>}</div> : <>
          <p>{run.demo ? '演示中，黑棋填住白子最后的一口气，就把它提走了。如果这颗白子自己向右延伸，也会没有气，而且提不掉黑棋，因此无法靠那一手逃生。本题其余白棋无法接应它，双方确认它是死子。' : '点圈出的白子标记死子；再点一次可以取消。只有这颗是本题约定的死子，被围住并不一定会死。'}</p>
          <div className="actions"><button className="button button--ghost" aria-pressed={run.demo} onClick={() => onChange(endingDemo(run))}>{run.demo ? '回到标记死子' : '为什么这颗白棋是死子？'}</button><button className="button" disabled={run.demo} onClick={() => onChange(confirmEnding(run))}>确认死子并数子</button></div>
        </>}
      </div>}
      {run.message && <p className="message message--hint" role="status">{run.message}</p>}
      {showTotal && <div className="study-score" aria-label="计分明细">
        <div><span>黑方盘面</span><strong>{score.black}</strong><small>{result.blackStones.length} 颗活子 + {result.blackEmpty.length} 个空点</small></div>
        <div><span>白方盘面</span><strong>{score.white}</strong><small>{result.whiteStones.length} 颗活子 + {result.whiteEmpty.length} 个空点</small></div>
        <p>{showKomi ? `白方最终：${score.white} + ${score.komi} = ${score.white + score.komi} 分` : lesson.id === 'count' ? '这里先看盘面分。下一课再加上白方的贴目。' : `白方另加 ${score.komi} 分贴目；棋盘上不用增加棋子。`}</p>
        {done && showKomi && <p className="turn">{score.winner === 'black' ? '黑' : '白'}方胜，领先 {score.margin} 分。</p>}
      </div>}
      {done && <><p className="small">{run.assisted ? '借助提示完成。可以重来一次，自己数数。' : '本课完成。再看一眼棋盘，把原因和结果连起来。'}</p><button className="button next-lesson" onClick={onNext}>{isLast ? '开始一盘陪练' : '继续下一课'}</button></>}
      <div className="restart"><button className="text-button" onClick={() => onChange(startEndgame(lesson))}>重来本课</button></div>
    </div>
  </section>
}
