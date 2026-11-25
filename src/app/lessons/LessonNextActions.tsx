export interface LessonNextProps {
  readonly nextLabel: string
  readonly onNext: () => void
  readonly onTry?: () => void
  readonly onPlay?: () => void
}

export function LessonNextActions({ nextLabel, onNext, onTry, onPlay }: LessonNextProps) {
  return <div className="actions next-lesson">
    <button className="button" onClick={onNext}>{nextLabel}</button>
    {onTry && <button className="button button--ghost" onClick={onTry}>自己试试</button>}
    {onPlay && <button className="button button--ghost" onClick={onPlay}>开始我的陪练</button>}
  </div>
}
