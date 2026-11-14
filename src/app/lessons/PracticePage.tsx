import { useLayoutEffect, useState } from 'react'
import type { LearningSession } from './learningSession'
import { COMPLETION_LABELS } from './learningProgress'
import type { LearningUnit } from './learningProgress'
import { PRACTICE_GROUPS, PRACTICE_ITEMS, nextPracticeItem, openPracticeItem } from './practiceCatalog'
import type { PracticeItem } from './practiceCatalog'
import { SurvivalPage } from './SurvivalPage'
import { IndependentPage } from './IndependentPage'

interface Props {
  readonly session: LearningSession
  readonly onChange: (session: LearningSession) => void
  readonly onLesson: (unit: LearningUnit) => void
  readonly onPlay: () => void
  readonly storageMessage?: string | null
}
export function PracticePage({ session, onChange, onLesson, onPlay, storageMessage }: Props) {
  const [active, setActive] = useState<PracticeItem | null>(null)
  useLayoutEffect(() => { document.documentElement.scrollTop = 0; document.body.scrollTop = 0 }, [active])
  const completed = session.progress.completed
  function open(item: PracticeItem) {
    onChange(openPracticeItem(session, item))
    // 仅剩这一题需再练时，也从页面顶部开始新的一次尝试。
    setActive({ ...item })
  }
  const notice = storageMessage && <p className="message message--hint" role="alert">{storageMessage}</p>
  if (active) {
    const next = nextPracticeItem(session.progress, active.id)
    const onNext = () => next ? open(next) : setActive(null)
    const nextLabel = next ? '下一道练习' : '返回练习列表'
    const mode = completed[active.id]
    return <>
      {notice}
      <div className="learning-toolbar practice-toolbar"><button className="text-button" onClick={() => setActive(null)}>返回练习</button><span>练 · {active.group}</span></div>
      {active.source === 'survival'
        ? <SurvivalPage run={session.runs[active.index]} isLast={false} nextLabel={nextLabel} onNext={onNext}
            onChange={(run) => onChange({ ...session, runs: session.runs.map((old, index) => index === active.index ? run : old) })} />
        : <IndependentPage run={session.independentRuns[active.index]} index={active.index} practiceTitle={active.title} allDone={false} nextLabel={nextLabel} onNext={onNext}
            onChange={(run) => onChange({ ...session, independentRuns: session.independentRuns.map((old, index) => index === active.index ? run : old) })} />}
      {mode && <p className="completion-note learning-recorded" aria-label="已记录的学习结果">已有记录：{COMPLETION_LABELS[mode]}。可以再练一次；保留最好的一次记录。</p>}
    </>
  }
  const next = nextPracticeItem(session.progress)
  const count = PRACTICE_ITEMS.filter((item) => completed[item.id] === 'independent').length
  return <section className="practice-hub" aria-labelledby="practice-title">
    {notice}
    <header className="practice-heading">
      <div><p className="eyebrow">十个局面 · 五种本领</p><h2 id="practice-title">练 · 自己判断</h2>
        <p className="muted">这些题在课程里也有，这里按能力集中练。做题不改变课程里的学习位置。</p></div>
      <div className="practice-progress"><p>独立完成 <strong>{count} / {PRACTICE_ITEMS.length}</strong></p>
        <div className="ink-strokes" aria-hidden="true">{PRACTICE_ITEMS.map((item) => <i key={item.id} className={completed[item.id] === 'independent' ? 'ink-strokes__on' : undefined} />)}</div>
        {next ? <button className="button" onClick={() => open(next)}>来一道还没独立完成的题</button>
          : <><p className="muted">这十题都已独立完成。可以重做任意一题，或者去下一盘。</p><button className="button" onClick={onPlay}>去弈下一盘</button></>}
      </div>
    </header>
    <div className="practice-groups">{PRACTICE_GROUPS.map((group, index) => <section className="practice-group" key={group} aria-labelledby={`practice-group-${index}`}>
      <h3 id={`practice-group-${index}`}><span aria-hidden="true">{['壹', '贰', '叁', '肆', '伍'][index]}</span>{group}</h3>
      <ul className="practice-list">{PRACTICE_ITEMS.filter((item) => item.group === group).map((item) => {
        const mode = completed[item.id]
        return <li className={`practice-item${mode === 'independent' ? ' practice-item--independent' : ''}`} key={item.id}>
          <button className="lesson-link" onClick={() => open(item)}><span className="lesson-link__dot" aria-hidden="true" />{item.title}<span className="lesson-link__go" aria-hidden="true">↗</span></button>
          <p className="practice-status">{mode ? COMPLETION_LABELS[mode] : '还没完成'}</p>
          <button className="text-button practice-related" onClick={() => onLesson(item.related)}>相关讲解：{item.relatedTitle}</button>
        </li>
      })}</ul>
    </section>)}</div>
  </section>
}
