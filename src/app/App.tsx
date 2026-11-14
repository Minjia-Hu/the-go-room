import { useLayoutEffect, useState } from 'react'
import { InkMark } from './InkMark'
import { PracticePage } from './lessons/PracticePage'
import { LearningPage } from './lessons/LearningPage'
import { createLearningSession, openLearningUnit, restoreLearningSession } from './lessons/learningSession'
import type { LearningSession } from './lessons/learningSession'
import { emptyLearningProgress, readLearningProgress, recordLearningProgress, writeLearningProgress } from './lessons/learningProgress'
import type { LearningProgress } from './lessons/learningProgress'
import { PlayPage } from './play/PlayPage'
import { createPlaySession } from './play/session'
import { readCoaching, writeCoaching } from './play/preferences'
import type { Match } from './play/match'
import { ReplayPage } from './replay/ReplayPage'
import { createRecordId, prependGame, readGames, saveRecord, writeGames } from './replay/records'
import type { SavedGame } from './replay/records'
import { usePage } from './router'
import type { Page } from './router'

// 导航用单字，完整名称作为无障碍名称和悬停提示。
const NAV: readonly { page: Page; label: string; glyph: string }[] = [
  { page: 'lessons', label: '教学', glyph: '学' },
  { page: 'practice', label: '练习', glyph: '练' },
  { page: 'play', label: '对局', glyph: '弈' },
  { page: 'replay', label: '复盘', glyph: '复' },
]

export function App() {
  const [page, navigate] = usePage()
  useLayoutEffect(() => { document.documentElement.scrollTop = 0; document.body.scrollTop = 0 }, [page])
  const [loadedLearning] = useState(() => {
    try { return readLearningProgress(window.localStorage) }
    catch { return { progress: emptyLearningProgress(), message: '无法读取此浏览器的学习记录，本次仍可正常学习。' } }
  })
  const [learning, setLearning] = useState(() => restoreLearningSession(loadedLearning.progress))
  const [learningMessage, setLearningMessage] = useState<string | null>(loadedLearning.message)
  const [session, setSession] = useState(() => createPlaySession(Date.now()))
  const [coaching, setCoaching] = useState(() => { try { return readCoaching(window.localStorage) } catch { return true } })
  const [preferenceMessage, setPreferenceMessage] = useState<string | null>(null)
  const [games, setGames] = useState<SavedGame[]>(() => {
    try { return readGames(window.localStorage) } catch { return [] }
  })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [storageMessage, setStorageMessage] = useState<string | null>(null)

  function saveLearning(progress: LearningProgress) {
    // 只在学习动作或明确清除时写入；首次读取失败不覆盖原始数据。
    let saved = false
    try { saved = writeLearningProgress(window.localStorage, progress) } catch { /* 本次内存记录仍然有效。 */ }
    setLearningMessage(saved ? null : '学习记录未能保存到此浏览器。本次操作仍有效，刷新后可能丢失新进度或恢复旧记录。')
  }

  function changeLearning(next: LearningSession, visit = true) {
    const progress = recordLearningProgress(learning.progress, next, { visit })
    if (progress !== learning.progress) saveLearning(progress)
    setLearning({ ...next, progress })
  }
  function clearLearning() {
    const next = createLearningSession()
    saveLearning(next.progress)
    setLearning(next)
  }

  function finish(completed: Match) {
    if (completed.game.phase !== 'scoring') return
    const record = saveRecord(completed, createRecordId(games), new Date().toISOString())
    const next = prependGame(games, record)
    let saved = false
    try { saved = writeGames(window.localStorage, next) } catch { /* 浏览器可能禁止访问 localStorage。 */ }
    setStorageMessage(saved ? null : '棋谱未能保存到此浏览器。当前仍可复盘，刷新或关闭页面后本次棋谱会丢失。')
    setGames(next)
    setSelectedId(record.id)
    setSession(createPlaySession(Date.now()))
    navigate('replay')
  }

  function changeCoaching(enabled: boolean) {
    setCoaching(enabled)
    let saved = false
    try { saved = writeCoaching(window.localStorage, enabled) } catch { /* 禁止访问 Storage 时保留内存设置。 */ }
    setPreferenceMessage(saved ? null : '本次设置已生效，刷新后可能恢复默认。')
  }

  return (
    <>
      <header className="topbar practice-navigation">
        <a className="brand" href="#/lessons" aria-label="The Go Room 首页" onClick={(event) => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
          event.preventDefault()
          setLearning((current) => ({ ...current, page: 'home' }))
          navigate('lessons')
          window.scrollTo(0, 0)
        }}>
          <InkMark size={36} />
          <h1 className="topbar__title">The Go Room</h1>
        </a>
        <nav className="topbar__nav" aria-label="主导航">
          {NAV.map((item) => (
            <button
              key={item.page}
              type="button"
              className="topbar__link"
              aria-current={item.page === page ? 'page' : undefined}
              aria-label={item.label}
              title={item.label}
              onClick={() => navigate(item.page)}
            >
              {item.glyph}
            </button>
          ))}
        </nav>
      </header>
      <main>
        {page === 'lessons' && <LearningPage session={learning} onChange={changeLearning} onPlay={() => navigate('play')}
          storageMessage={learningMessage} onClear={clearLearning} />}
        {page === 'practice' && <PracticePage session={learning} onChange={(next) => changeLearning(next, false)}
          onLesson={(unit) => { changeLearning(openLearningUnit(learning, unit)); navigate('lessons') }}
          onPlay={() => navigate('play')} storageMessage={learningMessage} />}
        {page === 'play' && <PlayPage session={session} onChange={setSession} onFinish={finish} coaching={coaching} onCoachingChange={changeCoaching} preferenceMessage={preferenceMessage} />}
        {page === 'replay' && <ReplayPage games={games} selectedId={selectedId} onSelect={setSelectedId} onPlay={() => navigate('play')} storageMessage={storageMessage} />}
      </main>
      <footer className="site-footer"><span>不急着赢，先看懂每一步。</span><InkMark size={22} /></footer>
    </>
  )
}
