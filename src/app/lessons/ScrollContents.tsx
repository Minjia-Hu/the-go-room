import { useState, type ReactNode } from 'react'
import type { LearningProgress } from './learningProgress'
import { PRACTICE_GROUP_NUMBERS, PRACTICE_GROUPS, PRACTICE_ITEMS, type PracticeItem } from './practiceCatalog'
import { PracticeItemButton } from './PracticeItemButton'

export interface ScrollChapter {
  readonly number: string
  readonly title: string
  readonly count: string
  readonly done?: readonly [number, number]
  readonly content: ReactNode
}

interface Props {
  readonly chapters: readonly ScrollChapter[]
  readonly initialOpen: number
  readonly completed: LearningProgress['completed']
  readonly onPlay: () => void
  readonly onPractice: (item: PracticeItem | null) => void
}

export function ScrollContents({ chapters, initialOpen, completed, onPlay, onPractice }: Props) {
  const groups = PRACTICE_GROUPS.map((title, index) => {
    const items = PRACTICE_ITEMS.filter(item => item.group === title)
    return {
      number: PRACTICE_GROUP_NUMBERS[index], title, count: `${items.length} 题`,
      content: <ul className="practice-list">{items.map(item =>
        <li key={item.id}><PracticeItemButton item={item} completion={completed[item.id]} onOpen={onPractice} /></li>
      )}</ul>,
    }
  })
  return <div className="home-catalogs">
    <section className="scrolls" aria-label="课程卷目">
      <h2 className="scrolls__heading" id="course-catalog-heading" tabIndex={-1}>学</h2>
      <ScrollRow id="study" entries={chapters} initialOpen={initialOpen} />
    </section>
    <section className="scrolls" aria-label="练习分组">
      <h2 className="scrolls__heading">练</h2>
      <ScrollRow id="practice" entries={groups} initialOpen={0} />
    </section>
    <div className="scrolls__end"><button className="text-button" onClick={onPlay}>去下一盘九路棋 <span aria-hidden="true">→</span></button></div>
  </div>
}

function ScrollRow({ id, entries, initialOpen }: {
  readonly id: string
  readonly entries: readonly ScrollChapter[]
  readonly initialOpen: number
}) {
  const [open, setOpen] = useState(initialOpen)
  const [animate, setAnimate] = useState(false)
  return <div className="scrolls__row">
    {entries.map((chapter, index) => {
      const isOpen = index === open
      const panelId = `scroll-panel-${id}-${index}`
      return <article key={chapter.title} className={`scroll${isOpen ? ' scroll--open' : ''}`}>
        <button className="scroll__spine" aria-expanded={isOpen} aria-controls={isOpen ? panelId : undefined}
          aria-label={`第${chapter.number}卷：${chapter.title}`}
          onClick={() => { setOpen(index); setAnimate(true) }}>
          <span className="scroll__number" aria-hidden="true">{chapter.number}</span>
          <span className="scroll__title" aria-hidden="true">{chapter.title}</span>
          <span className="scroll__meta" aria-hidden="true">
            <span>{chapter.count}</span>
            {chapter.done && <span className={chapter.done[0] === chapter.done[1] ? 'scroll__done scroll__done--full' : 'scroll__done'}>{chapter.done[0]} / {chapter.done[1]}</span>}
          </span>
        </button>
        {isOpen && <div id={panelId} className={`scroll__panel${animate ? ' scroll__panel--unroll' : ''}`} role="region" aria-label={chapter.title}>
          {chapter.content}
        </div>}
      </article>
    })}
  </div>
}
