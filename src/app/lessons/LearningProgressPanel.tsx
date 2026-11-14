import { useState } from 'react'
import type { ReactNode } from 'react'
import { COMPLETION_LABELS, continueLearningUnit, LEARNING_UNITS } from './learningProgress'
import type { Completion, LearningProgress, LearningUnit } from './learningProgress'

export function LearningLink({ label, children, mode, current = false, onClick }: { readonly label: string; readonly children?: ReactNode; readonly mode?: Completion; readonly current?: boolean; readonly onClick: () => void }) {
  return <div className={`learning-entry${mode ? ' learning-entry--done' : ''}${current ? ' learning-entry--current' : ''}`}>
    <button className="lesson-link" onClick={onClick} aria-label={children ? label : undefined} aria-current={current ? 'step' : undefined}><span className="lesson-link__dot" aria-hidden="true" />{children ?? label}<span className="lesson-link__go" aria-hidden="true">{current ? '续读 →' : '↗'}</span></button>
    {mode && <p className="completion-note"><span aria-hidden="true">✓ </span>{COMPLETION_LABELS[mode]}</p>}
  </div>
}

interface Props {
  readonly progress: LearningProgress
  readonly onContinue: (unit: LearningUnit) => void
  readonly onClear?: () => void
}
export function LearningProgressPanel({ progress, onContinue, onClear }: Props) {
  const [confirmClear, setConfirmClear] = useState(false)
  const unit = continueLearningUnit(progress)
  const count = LEARNING_UNITS.filter((item) => progress.completed[item.id]).length
  return <section className="learning-record" aria-label="我的学习记录">
    <div>
      <p className="eyebrow">学习手记</p>
      <h3>已完成 {count} / {LEARNING_UNITS.length} 个课程与练习</h3>
      <div className="ink-strokes" aria-hidden="true">{LEARNING_UNITS.map((item) => <i key={item.id} className={progress.completed[item.id] ? 'ink-strokes__on' : undefined} />)}</div>
      <p className="muted small">每题保留最好的一次完成记录。引导课程与独立练习分开标注，完成不代表已经掌握。</p>
      {unit && <div className="continue-learning"><button className="button" onClick={() => onContinue(unit)}>{count === LEARNING_UNITS.length ? '回看最近一课' : '继续学习'}</button><p>{unit.title}</p></div>}
      <p className="muted small">刷新后回到待继续的题目，从该题开头开始；中途棋盘不保存。记录只在此浏览器中，清除浏览器数据后会丢失。</p>
    </div>
    {onClear && <div className="learning-record__reset">{confirmClear ? <div role="group" aria-label="确认清除学习记录">
      <p>清除所有课程、专项练习的完成记录和学习位置，并从头开始？已保存棋谱、当前对局和陪练设置都会保留。</p>
      <div className="actions"><button className="button button--ghost" onClick={() => { onClear(); setConfirmClear(false) }}>确认清除学习记录</button><button className="text-button" onClick={() => setConfirmClear(false)}>保留记录</button></div>
    </div> : <button className="text-button" onClick={() => setConfirmClear(true)}>清除学习记录</button>}</div>}
  </section>
}
