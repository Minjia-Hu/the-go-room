import { LESSONS } from '../content/lessons'
import { LessonPage } from './lessons/LessonPage'
import { usePage } from './router'
import type { Page } from './router'

const NAV: readonly { page: Page; label: string }[] = [
  { page: 'lessons', label: '教学' },
  { page: 'play', label: '对局' },
  { page: 'replay', label: '复盘' },
]

function Placeholder({ title }: { title: string }) {
  return (
    <section className="page">
      <div className="panel">
        <h2>{title}</h2>
        <p className="muted">这一页还没有做好。</p>
      </div>
    </section>
  )
}

export function App() {
  const [page, navigate] = usePage()

  return (
    <>
      <header className="topbar">
        <h1 className="topbar__title">The Go Room</h1>
        <nav className="topbar__nav" aria-label="主导航">
          {NAV.map((item) => (
            <button
              key={item.page}
              type="button"
              className="topbar__link"
              aria-current={item.page === page ? 'page' : undefined}
              onClick={() => navigate(item.page)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>
      <main>
        {page === 'lessons' && <LessonPage lessons={LESSONS} onFinish={() => navigate('play')} />}
        {page === 'play' && <Placeholder title="对局" />}
        {page === 'replay' && <Placeholder title="复盘" />}
      </main>
    </>
  )
}
