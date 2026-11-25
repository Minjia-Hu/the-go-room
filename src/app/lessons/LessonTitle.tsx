import { lessonTitleParts } from './lessonTerms'

export function LessonTitle({ title }: { title: string }) {
  const { name, term, definition } = lessonTitleParts(title)
  return <>
    <h2>{name}</h2>
    {term && <details key={term} className="lesson-term">
      <summary>{term}</summary>
      <p>{definition}</p>
    </details>}
  </>
}
