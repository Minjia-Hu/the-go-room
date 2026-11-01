import { useState } from 'react'
import { LESSONS } from '../content/lessons'
import { LessonPage } from './lessons/LessonPage'
import { PlayPage } from './play/PlayPage'
import { createMatch } from './play/match'
import type { Match } from './play/match'
import { ReplayPage } from './replay/ReplayPage'
import { prependGame, readGames, saveRecord, writeGames } from './replay/records'
import type { SavedGame } from './replay/records'
import { usePage } from './router'
import type { Page } from './router'

const NAV: readonly { page: Page; label: string }[] = [
  { page: 'lessons', label: '教学' },
  { page: 'play', label: '对局' },
  { page: 'replay', label: '复盘' },
]

export function App() {
  const [page, navigate] = usePage()
  const [match, setMatch] = useState(createMatch)
  const [games, setGames] = useState<SavedGame[]>(() => {
    try { return readGames(window.localStorage) } catch { return [] }
  })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [storageMessage, setStorageMessage] = useState<string | null>(null)

  function finish(completed: Match) {
    if (completed.game.phase !== 'scoring') return
    const record = saveRecord(completed, crypto.randomUUID(), new Date().toISOString())
    const next = prependGame(games, record)
    let saved = false
    try { saved = writeGames(window.localStorage, next) } catch { /* 浏览器可能禁止访问 localStorage。 */ }
    setStorageMessage(saved ? null : '棋谱未能保存到此浏览器。当前仍可复盘，刷新或关闭页面后本次棋谱会丢失。')
    setGames(next)
    setSelectedId(record.id)
    setMatch(createMatch())
    navigate('replay')
  }

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
        {page === 'play' && <PlayPage match={match} onChange={setMatch} onFinish={finish} />}
        {page === 'replay' && <ReplayPage games={games} selectedId={selectedId} onSelect={setSelectedId} onPlay={() => navigate('play')} storageMessage={storageMessage} />}
      </main>
    </>
  )
}
