import { useCallback, useEffect, useState } from 'react'

export type Page = 'lessons' | 'practice' | 'play' | 'replay'

const PAGES: readonly Page[] = ['lessons', 'practice', 'play', 'replay']

/** 把地址栏的 hash(如 "#/play")转成页面名,认不出来时回到教学页。 */
export function pageFromHash(hash: string): Page {
  const key = hash.replace(/^#\/?/, '')
  return (PAGES as readonly string[]).includes(key) ? (key as Page) : 'lessons'
}

/** 当前页面和切换页面的函数。页面名写在地址栏 hash 里,刷新后还在。 */
export function usePage(): readonly [Page, (page: Page) => void] {
  const [page, setPage] = useState<Page>(() => pageFromHash(window.location.hash))

  useEffect(() => {
    const onChange = () => setPage(pageFromHash(window.location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  const navigate = useCallback((next: Page) => {
    window.location.hash = `/${next}`
    setPage(next)
  }, [])

  return [page, navigate] as const
}
