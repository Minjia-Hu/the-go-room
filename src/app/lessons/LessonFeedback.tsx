import { useLayoutEffect, useRef } from 'react'

interface Props { readonly message: string | null; readonly kind?: string }
export function LessonFeedback({ message, kind = 'hint' }: Props) {
  const ref = useRef<HTMLParagraphElement>(null)
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const rect = element.getBoundingClientRect()
    // 从页面下方答题时，把新解释带回视野；棋盘旁本已可见的反馈不滚动。
    if (rect.height > 0 && (rect.top < 0 || rect.bottom > window.innerHeight)) {
      element.scrollIntoView({ block: 'nearest' })
    }
  }, [message])
  return message ? <p ref={ref} className={`board-feedback board-feedback--${kind}`} role="status">{message}</p> : null
}
