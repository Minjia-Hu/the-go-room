import { useState, type ReactNode } from 'react'
import type { LearningProgress } from './learningProgress'
import { PRACTICE_GROUPS, PRACTICE_ITEMS, type PracticeItem } from './practiceCatalog'
import { PracticeItemButton } from './PracticeItemButton'

export interface ScrollChapter {
  readonly number?: string
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
  const [mode, setMode] = useState<'study' | 'practice'>('study')
  const [volume, setVolume] = useState(initialOpen)
  const [group, setGroup] = useState(0)
  const [animate, setAnimate] = useState(false)
  const study = mode === 'study'
  const open = study ? volume : group
  const select = study ? setVolume : setGroup
  const entries: readonly ScrollChapter[] = study ? chapters : PRACTICE_GROUPS.map(title => {
    const items = PRACTICE_ITEMS.filter(item => item.group === title)
    return {
      title, count: `${items.length} 题`,
      content: <ul className="practice-list">{items.map(item =>
        <li key={item.id}><PracticeItemButton item={item} completion={completed[item.id]} onOpen={onPractice} /></li>
      )}</ul>,
    }
  })
  return <section className="scrolls" aria-label="首页目录">
    <div className="scrolls__head">
      <div className="scrolls__switches" role="group" aria-label="选择目录">
        <button type="button" id="course-catalog-switch" aria-label="学 · 课程卷目" aria-pressed={study} onClick={() => setMode('study')}>学</button>
        <button type="button" aria-label="练 · 练习分组" aria-pressed={!study} onClick={() => setMode('practice')}>练</button>
      </div>
      {!study && <button className="text-button" onClick={() => onPractice(null)}>全部练习 <span aria-hidden="true">→</span></button>}
    </div>
    <div className={study ? 'scrolls__row' : 'scrolls__row scrolls__row--practice'}>
      {entries.map((chapter, index) => {
        const isOpen = index === open
        const panelId = `scroll-panel-${mode}-${index}`
        return <article key={chapter.title} className={`scroll${isOpen ? ' scroll--open' : ''}`}>
          <button className="scroll__spine" aria-expanded={isOpen} aria-controls={isOpen ? panelId : undefined}
            aria-label={chapter.number ? `第${chapter.number}卷：${chapter.title}` : chapter.title}
            onClick={() => { select(index); setAnimate(true) }}>
            {chapter.number && <span className="scroll__number" aria-hidden="true">{chapter.number}</span>}
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
    <div className="scrolls__end"><button className="text-button" onClick={onPlay}>去下一盘九路棋 <span aria-hidden="true">→</span></button></div>
  </section>
}
