import { useLayoutEffect, useRef, type ReactNode } from 'react'

interface Props {
  readonly title: string
  readonly navLabel: string
  readonly catalog?: { readonly label: string; readonly onOpen: () => void }
  readonly currentId: string
  readonly onPlay?: () => void
  readonly children: ReactNode
}

export function DirectoryToolbar({ title, navLabel, catalog, currentId, onPlay, children }: Props) {
  const details = useRef<HTMLDetailsElement>(null)
  const summary = useRef<HTMLElement>(null)
  useLayoutEffect(() => { if (details.current) details.current.open = false }, [currentId])

  function close() {
    if (details.current) details.current.open = false
    summary.current?.focus()
  }

  return <div className="learning-toolbar volume-guide">
    <details ref={details} onKeyDown={(event) => {
      if (event.key === 'Escape' && details.current?.open) close()
    }}>
      <summary ref={summary}>{title} <span aria-hidden="true">▾</span></summary>
      <nav className="volume-guide__panel" aria-label={navLabel} onClickCapture={event => {
        if (event.target instanceof Element && event.target.closest('button')) close()
      }}>
        {children}
        {catalog && <button className="text-button" onClick={catalog.onOpen}>{catalog.label} <span aria-hidden="true">→</span></button>}
      </nav>
    </details>
    {onPlay && <button className="text-button volume-guide__play" onClick={onPlay}>直接开始陪练</button>}
  </div>
}
