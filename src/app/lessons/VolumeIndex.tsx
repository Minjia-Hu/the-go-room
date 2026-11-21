import type { CourseVolume } from './courseVolumes'
import { COMPLETION_LABELS, type LearningProgress, type LearningUnit } from './learningProgress'

interface Props {
  readonly volume: CourseVolume
  readonly currentId?: string
  readonly completed?: LearningProgress['completed']
  readonly onSelect: (unit: LearningUnit) => void
}

export function VolumeIndex({ volume, currentId, completed, onSelect }: Props) {
  const inLesson = completed === undefined
  return <div className={inLesson ? 'volume-guide__lessons' : 'course-index'}>
    {volume.groups.map(group =>
      <div className="course-pair" key={group.entries[0].unit.id} role={group.label && 'group'} aria-label={group.label}>
        {group.entries.map(({ unit, title, tag }) => {
          const label = inLesson && tag === '练习' ? '自己试试' : tag
          const current = unit.id === currentId
          const mode = completed?.[unit.id]
          return <button key={unit.id} className={`course-index__link${tag ? ' course-index__secondary' : ''}`}
            aria-label={label && `${label} ${title}`} aria-current={current ? 'step' : undefined}
            aria-description={mode && COMPLETION_LABELS[mode]} onClick={() => onSelect(unit)}>
            <span>{label && <span className="course-index__tag">{label}{inLesson ? ' ·' : ' '}</span>}{title}</span>
            {current && inLesson && <span className="volume-guide__current">当前</span>}
            {mode && <span className="course-index__check" aria-hidden="true">✓</span>}
          </button>
        })}
      </div>)}
  </div>
}
