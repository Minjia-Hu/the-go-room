import { LessonFeedback } from './LessonFeedback'
import { RULE_SEQUENCE_SCENES } from '../../content/endgame'
import { Board } from '../board/Board'
import { BoardLayout } from '../board/BoardLayout'
import { answerSequence, sequenceScene, sequenceStep, sequenceView, startRuleSequence } from './ruleSequence'
import type { RuleSequenceRun } from './ruleSequence'

interface Props { readonly run: RuleSequenceRun; readonly onChange: (run: RuleSequenceRun) => void; readonly onScoring: () => void; readonly completedSceneIds?: readonly string[] }
export function RuleSequencePage({ run, onChange, onScoring, completedSceneIds = [] }: Props) {
  const view = sequenceView(run)
  const completed = (index: number) => run.solved.includes(index) || completedSceneIds.includes(RULE_SEQUENCE_SCENES[index].id)
  const intermediate = run.step === 1 || run.step === 2
  return <BoardLayout
      legend={<p className="small">橙圈：目标黑棋 · 小空心圈：气 · 虚线小圈：被提走的位置</p>}
      feedback={run.message && <LessonFeedback message={run.message} />}
      heading={<><p className="eyebrow">认识规则 / 落子后先提谁</p><h2>{view.scene.title}</h2><p className="turn">{view.title}</p></>}
      board={<>
      <p className="figure-number">规则慢镜头 / {run.sceneIndex + 1} · 2</p>
      <Board board={view.board} marks={view.marks} disabled />
      <p className={`board-caption${intermediate ? ' board-caption--notice' : ''}`}>{intermediate ? '规则演示中间画面 · 尚未判定合法，不是正式落子' : run.step === 0 ? '原始棋形 · 白棋准备下在 A' : view.legal ? '判定结果：白棋有气，这一手合法' : '判定结果：禁止落子，恢复原来的棋盘'}</p>
    </>}
      primary={<><p className="board-brief">{run.step === 0 ? "先看黑棋有几口气，再按下一步拆开这手棋。" : run.step === 1 ? "A 的白子暂时没有气，但要先检查黑棋能不能被提走。" : run.step === 2 ? view.legal ? `黑棋没有气，先提走这 ${view.inspection.captured.length} 颗黑子。` : "黑棋还有 B 这口气，不能提走。" : view.legal ? "提走黑棋后，白棋有气，所以这一手合法。" : "黑棋不能提，白棋也没有气，所以是禁入点。"}</p>
        <div className="actions">
        <button className="button button--ghost" disabled={run.step === 0} onClick={() => onChange(sequenceStep(run, run.step - 1))}>上一步</button>
        <button className="button" disabled={run.step === 3} onClick={() => onChange(sequenceStep(run, run.step + 1))}>下一步</button>
      </div>
      </>}
    >
      <p className="muted">别急着判断白棋会不会被吃。把一手棋拆开，亲眼看看判断的先后顺序。</p>
      <div className="actions">{RULE_SEQUENCE_SCENES.map((scene, index) => <button key={scene.id} className="button button--ghost" aria-pressed={run.sceneIndex === index} onClick={() => onChange(sequenceScene(run, index))}>{index === 0 ? '比较一只眼' : '比较两只眼'}{completed(index) ? ' · 已完成' : ''}</button>)}</div>
      <ol className="study-steps" aria-label="规则演示步骤">{['原图', '暂放白子', '先提对方', '检查自己'].map((label, index) => <li key={label}><button aria-current={run.step === index ? 'step' : undefined} onClick={() => onChange(sequenceStep(run, index))}><span>{index}</span>{label}</button></li>)}</ol>
      <p className="message message--hint" aria-live="polite">{view.text}</p>
      {run.step === 3 && <div className="study-question"><h3>为什么是这个结果？</h3><div className="reason-choices">
        <button className="button button--ghost" onClick={() => onChange(answerSequence(run, false))}>只要周围都是黑棋，白棋就会被吃</button>
        <button className="button button--ghost" onClick={() => onChange(answerSequence(run, true))}>先提对方没气的棋，再检查自己的气</button>
      </div></div>}
      {run.solved.includes(run.sceneIndex) && (RULE_SEQUENCE_SCENES.every((_, index) => completed(index)) ? <button className="button next-lesson" onClick={onScoring}>学习围地与终局</button> : <button className="button next-lesson" onClick={() => onChange(sequenceScene(run, 1 - run.sceneIndex))}>再比较另一种棋形</button>)}
      <div className="restart"><button className="text-button" onClick={() => onChange(startRuleSequence())}>重新观察这两个例子</button></div>
    </BoardLayout>
}
