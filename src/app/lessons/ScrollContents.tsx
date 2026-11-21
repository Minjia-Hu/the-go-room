import { useState } from 'react'
import type { ReactNode } from 'react'

export interface ScrollChapter {
  readonly number: string
  readonly title: string
  readonly count: string
  /** 本卷已完成 / 总数；陪练不计入单元时省略。 */
  readonly done?: readonly [number, number]
  readonly live?: boolean
  readonly content: ReactNode
}

/** 卷目：每卷收起时是一根竖排书脊，点开后展开完整课程目录；同一时间只展开一卷。 */
export function ScrollContents({ chapters, initialOpen }: { readonly chapters: readonly ScrollChapter[]; readonly initialOpen: number }) {
  const [open, setOpen] = useState(initialOpen)
  const [animate, setAnimate] = useState(false)
  return <section className="scrolls" aria-labelledby="scrolls-title">
    <div className="scrolls__head"><h3 id="scrolls-title">卷目</h3><p>七卷 · 点书脊展开</p></div>
    <div className="scrolls__row">
      {chapters.map((chapter, index) => {
        const isOpen = index === open
        const panelId = `scroll-panel-${index}`
        return <article key={chapter.title} className={`scroll${isOpen ? ' scroll--open' : ''}${chapter.live ? ' scroll--live' : ''}`}>
          <button className="scroll__spine" aria-expanded={isOpen} aria-controls={panelId} aria-label={`第${chapter.number}卷：${chapter.title}`}
            onClick={() => { setOpen(index); setAnimate(true) }}>
            <span className="scroll__number" aria-hidden="true">{chapter.number}</span>
            <span className="scroll__title" aria-hidden="true">{chapter.title}</span>
            <span className="scroll__meta" aria-hidden="true"><span>{chapter.count}</span>{chapter.done && <span className={chapter.done[0] === chapter.done[1] ? 'scroll__done scroll__done--full' : 'scroll__done'}>{chapter.done[0]} / {chapter.done[1]}</span>}</span>
          </button>
          {isOpen && <div id={panelId} className={`scroll__panel${animate ? ' scroll__panel--unroll' : ''}`} role="region" aria-label={chapter.title}>
            {chapter.content}
          </div>}
        </article>
      })}
    </div>
  </section>
}
