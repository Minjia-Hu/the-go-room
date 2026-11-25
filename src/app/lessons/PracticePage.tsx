import { useLayoutEffect, useRef } from 'react'
import type { LearningSession } from './learningSession'
import { COMPLETION_LABELS } from './learningProgress'
import type { LearningUnit } from './learningProgress'
import { PRACTICE_GROUP_NUMBERS, PRACTICE_GROUPS, PRACTICE_ITEMS, nextPracticeItem, practiceLabels } from './practiceCatalog'
import type { PracticeItem } from './practiceCatalog'
import { LadderDefensePage } from './LadderDefensePage'
import { PriorityPage } from './PriorityPage'
import { CapturePage } from './CapturePage'
import { SurvivalPage } from './SurvivalPage'
import { IndependentPage } from './IndependentPage'
import { PracticeItemButton } from './PracticeItemButton'
import { DirectoryToolbar } from './DirectoryToolbar'

interface Props {
  readonly active: PracticeItem | null
  readonly onOpen: (item: PracticeItem | null) => void
  readonly session: LearningSession
  readonly onChange: (session: LearningSession) => void
  readonly onLesson: (unit: LearningUnit) => void
  readonly onPlay: () => void
  readonly storageMessage?: string | null
}
export function PracticePage({ active, onOpen, session, onChange, onLesson, onPlay, storageMessage }: Props) {
  const hubTitle = useRef<HTMLHeadingElement>(null)
  const returningToHub = useRef(false)
  useLayoutEffect(() => {
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    if (!active && returningToHub.current) {
      returningToHub.current = false
      hubTitle.current?.focus()
    }
  }, [active])
  function returnToHub() {
    returningToHub.current = true
    onOpen(null)
  }
  const completed = session.progress.completed
  const notice = storageMessage && <p className="message message--hint" role="alert">{storageMessage}</p>
  if (active) {
    const next = nextPracticeItem(session.progress, active.id)
    const onNext = () => next ? onOpen(next) : returnToHub()
    const nextLabel = next ? '下一道练习' : '返回练习列表'
    const mode = completed[active.id]
    return <>
      {notice}
      <DirectoryToolbar title={`练 · ${active.group}`} navLabel={`${active.group}练习目录`}
        currentId={active.id} catalog={{ label: '全部练习', onOpen: returnToHub }}>
        <div className="volume-guide__lessons">
          {PRACTICE_ITEMS.filter(item => item.group === active.group).map(item =>
            <div className="course-pair" key={item.id}>
              <button className="course-index__link" aria-label={item.title} aria-current={item.id === active.id ? 'step' : undefined}
                onClick={() => { if (item.id !== active.id) onOpen(item) }}>
                <span>{item.title}</span>
                {item.id === active.id && <span className="volume-guide__current">当前</span>}
              </button>
            </div>)}
        </div>
      </DirectoryToolbar>
      {active.source === 'survival' || active.source === 'danger'
        ? <SurvivalPage run={(active.source === 'survival' ? session.runs : session.practiceDangerRuns)[active.index]} practice={practiceLabels(active)} isLast={false} nextLabel={nextLabel} onNext={onNext}
            onChange={(run) => { const key = active.source === 'survival' ? 'runs' : 'practiceDangerRuns'; onChange({ ...session, [key]: session[key].map((old, index) => index === active.index ? run : old) }) }} />
        : active.source === 'capture'
          ? <CapturePage key={active.id} run={session.captureRuns[active.index]} practice={practiceLabels(active)} nextLabel={nextLabel} onNext={onNext}
              onChange={(run) => onChange({ ...session, captureRuns: session.captureRuns.map((old, index) => index === active.index ? run : old) })} />
        : active.source === 'ladder-defense'
          ? <LadderDefensePage run={session.ladderDefenseRuns[active.index]} nextLabel={nextLabel} onNext={onNext}
              onChange={(run) => onChange({ ...session, ladderDefenseRuns: session.ladderDefenseRuns.map((old, index) => index === active.index ? run : old) })} />
        : active.source === 'priority'
          ? <PriorityPage run={session.priorityRuns[active.index]} nextLabel={nextLabel} onNext={onNext}
              onChange={(run) => onChange({ ...session, priorityRuns: session.priorityRuns.map((old, index) => index === active.index ? run : old) })} />
          : <IndependentPage run={(active.source === 'independent' ? session.independentRuns : session.practiceRescueRuns)[active.index]} index={active.index} practice={practiceLabels(active)} allDone={false} nextLabel={nextLabel} onNext={onNext}
              onChange={(run) => { const key = active.source === 'independent' ? 'independentRuns' : 'practiceRescueRuns'; onChange({ ...session, [key]: session[key].map((old, index) => index === active.index ? run : old) }) }} />}
      {mode && <p className="completion-note learning-recorded" aria-label="已记录的学习结果">
        {active.courseUnit
          ? `你在课程「${active.courseUnit.title}」做过这道题：${COMPLETION_LABELS[mode]}。可以再练一次，保留最好的一次记录。`
          : `已有记录：${COMPLETION_LABELS[mode]}。可以再练一次；保留最好的一次记录。`}
      </p>}
    </>
  }
  const next = nextPracticeItem(session.progress)
  const count = PRACTICE_ITEMS.filter((item) => completed[item.id] === 'independent').length
  return <section className="practice-hub" aria-labelledby="practice-title">
    {notice}
    <header className="practice-heading">
      <h2 id="practice-title" ref={hubTitle} tabIndex={-1}>全部练习</h2>
      <div className="practice-progress">
        <span>独立完成 <strong>{count} / {PRACTICE_ITEMS.length}</strong></span>
        {next ? <button className="button" onClick={() => onOpen(next)} title="优先练习尚未独立完成的题">练一道</button>
          : <button className="button" onClick={onPlay}>去弈下一盘</button>}
      </div>
    </header>
    <div className="practice-groups">{PRACTICE_GROUPS.map((group, index) => {
      const items = PRACTICE_ITEMS.filter(item => item.group === group)
      const sharedLesson = items.every(item => item.related.id === items[0].related.id)
      function explanation(item: PracticeItem) {
        return <button className="text-button practice-related" onClick={() => onLesson(item.related)}
          aria-label={`相关讲解：${item.relatedTitle}`} title={item.relatedTitle}>讲解 <span aria-hidden="true">↗</span></button>
      }
      return <section className="practice-group" key={group} aria-labelledby={`practice-group-${index}`}>
        <header className="practice-group__head">
          <h3 id={`practice-group-${index}`}><span aria-hidden="true">{PRACTICE_GROUP_NUMBERS[index]}</span>{group}</h3>
          {sharedLesson && explanation(items[0])}
        </header>
        <ul className="practice-list">{items.map(item => {
          const mode = completed[item.id]
          return <li key={item.id}>
            <PracticeItemButton item={item} completion={mode} onOpen={onOpen} />
            {!sharedLesson && explanation(item)}
          </li>
        })}</ul>
      </section>
    })}</div>
  </section>
}
