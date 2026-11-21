import { useLayoutEffect, useRef } from 'react'
import type { CourseVolume } from './courseVolumes'
import type { LearningUnit } from './learningProgress'
import { VolumeIndex } from './VolumeIndex'

interface Props {
  readonly volume: CourseVolume
  readonly currentId: string
  readonly onSelect: (unit: LearningUnit) => void
  readonly onCatalog: () => void
  readonly onPlay: () => void
}

export function VolumeContents({ volume, currentId, onSelect, onCatalog, onPlay }: Props) {
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
      <summary ref={summary}>卷{volume.number} · {volume.title} <span aria-hidden="true">▾</span></summary>
      <nav className="volume-guide__panel" aria-label={`卷${volume.number}目录`}>
        <VolumeIndex volume={volume} currentId={currentId} onSelect={unit => { close(); onSelect(unit) }} />
        <button className="text-button" onClick={onCatalog}>全部卷目 <span aria-hidden="true">→</span></button>
      </nav>
    </details>
    <button className="text-button volume-guide__play" onClick={onPlay}>直接开始陪练</button>
  </div>
}
