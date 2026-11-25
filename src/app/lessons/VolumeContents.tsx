import { DirectoryToolbar } from './DirectoryToolbar'
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
  return <DirectoryToolbar title={`卷${volume.number} · ${volume.title}`} navLabel={`卷${volume.number}目录`}
    catalog={{ label: '全部卷目', onOpen: onCatalog }} onPlay={onPlay}>
    <VolumeIndex volume={volume} currentId={currentId} onSelect={onSelect} />
  </DirectoryToolbar>
}
