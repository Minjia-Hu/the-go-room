import { COMPLETION_LABELS, type Completion } from './learningProgress'
import type { PracticeItem } from './practiceCatalog'

interface Props {
  readonly item: PracticeItem
  readonly completion?: Completion
  readonly onOpen: (item: PracticeItem) => void
}

export function PracticeItemButton({ item, completion, onOpen }: Props) {
  const status = completion ? COMPLETION_LABELS[completion] : '还没完成'
  return <button className="course-index__link" onClick={() => onOpen(item)} aria-label={item.title}
    aria-description={item.courseUnit ? `课程题，${status}` : status}>
    <span>{item.title}{item.courseUnit && <small className="practice-source">课程题</small>}</span>
    {completion && <span className="practice-status" title={status}>{completion === 'independent' ? '✓' : status}</span>}
  </button>
}
