import { useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'

const query = '(min-width: 840px)'
function subscribe(notify: () => void) {
  const media = window.matchMedia?.(query)
  media?.addEventListener('change', notify)
  return () => media?.removeEventListener('change', notify)
}
function isDesktop() { return window.matchMedia?.(query).matches ?? false }

/** 桌面默认展开；手机保留展开入口。跨断点时重新应用默认状态。 */
export function ResponsiveExplanation({ summary, children }: { readonly summary: string; readonly children: ReactNode }) {
  const desktop = useSyncExternalStore(subscribe, isDesktop, () => false)
  return <details key={String(desktop)} className="coach-explanation" open={desktop}>
    <summary>{summary}</summary>{children}
  </details>
}
