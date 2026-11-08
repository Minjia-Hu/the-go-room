import { useMemo, useState } from 'react'
import { Board } from '../board/Board'
import type { BoardMark } from '../board/marks'
import { ScorePanel } from '../scoring/ScorePanel'
import { scoringView } from '../scoring/regions'
import { moveDescription, replayRecord } from './records'
import type { GameReplay, SavedGame } from './records'

interface ReplayPageProps {
  readonly games: readonly SavedGame[]
  readonly selectedId: string | null
  readonly onSelect: (id: string) => void
  readonly onPlay: () => void
  readonly storageMessage: string | null
}

function ReplayBoard({ replay }: { readonly replay: GameReplay }) {
  const { frames, record } = replay
  const end = frames.length - 1
  const [step, setStep] = useState(end)
  const [region, setRegion] = useState<number | null>(null)
  const frame = frames[step]
  const last = frame.history.at(-1)
  const view = useMemo(() => scoringView(frames[end].board, record.dead, frames[end].komi), [frames, end, record.dead])
  const atEnd = step === end
  const marks: BoardMark[] = atEnd
    ? view.regions.filter((item) => region === null || item.id === region).flatMap((item) => item.points.map((point): BoardMark => ({ point, kind: `${item.color}-area` })))
    : last?.kind === 'play' ? last.captured.map((point) => ({ point, kind: 'captured' })) : []

  return <div className="page page--with-board">
    <div>
      <p className="figure-number">棋谱回看 / {atEnd ? '终局' : `第 ${step} 手`}</p>
      <Board board={atEnd ? view.cleared : frame.board} disabled marks={marks} lastMove={!atEnd && last?.kind === 'play' ? last.point : null} />
      <p className="board-caption">{atEnd ? '终局盘面 · 已移除标记的死子' : '历史盘面 · 可逐手回看'}</p>
    </div>
    <div className="panel">
      <h3>第 {step} / {end} 手</h3>
      <p className="move-event" role="status">{record.agreedPasses && step > end - record.agreedPasses
        ? `${last?.color === 'black' ? '黑方' : '白方'}按约定停一手，双方同意数子。` : moveDescription(last)}</p>
      <div className="replay-controls" aria-label="回放控制">
        <button className="button button--ghost" type="button" disabled={step === 0} onClick={() => setStep(0)}>跳到开头</button>
        <button className="button button--ghost" type="button" disabled={step === 0} onClick={() => setStep(step - 1)}>上一步</button>
        <button className="button button--ghost" type="button" disabled={atEnd} onClick={() => setStep(step + 1)}>下一步</button>
        <button className="button button--ghost" type="button" disabled={atEnd} onClick={() => setStep(end)}>跳到结尾</button>
      </div>
      <label className="replay-slider">回放进度<input type="range" min={0} max={end} value={step} onChange={(event) => setStep(Number(event.target.value))} /></label>
      {atEnd && <>
        {record.agreedPasses && <p className="message message--hint">本盘由双方同意数子结束，电脑按约定接受，没有自动判断死活。</p>}
        <ScorePanel view={view} selected={region} onSelect={setRegion} deadCount={record.dead.length} />
      </>}
    </div>
  </div>
}

export function ReplayPage({ games, selectedId, onSelect, onPlay, storageMessage }: ReplayPageProps) {
  const selected = games.find((game) => game.id === selectedId) ?? games[0]
  const replay = useMemo(() => selected ? replayRecord(selected) : null, [selected])
  return <section className="replay-page">
    <div className="replay-heading">
      <div><h2>复盘</h2><p className="muted small">回看落子与规则事件，理解这一盘发生了什么。</p></div>
      <button className="button button--ghost" type="button" onClick={onPlay}>去对局</button>
    </div>
    {storageMessage && <p className="message message--hint" role="alert">{storageMessage}</p>}
    {replay ? <>
      <label className="history-picker">最近棋谱
        <select value={selected.id} onChange={(event) => onSelect(event.target.value)}>
          {games.map((game, index) => <option key={game.id} value={game.id}>{new Date(game.endedAt).toLocaleString('zh-CN')} · {game.moves.length} 手{index === 0 ? ' · 最近一盘' : ''}</option>)}
        </select>
      </label>
      <ReplayBoard key={selected.id} replay={replay} />
      <p className="muted small archive-note">此浏览器最多保存最近 10 盘；清除浏览器数据会删除棋谱。正在进行的对局刷新后不会保留。</p>
    </> : <div className="panel"><p>还没有已完成的棋谱。先和电脑下一盘，确认数子后就能在这里回看。</p></div>}
  </section>
}
