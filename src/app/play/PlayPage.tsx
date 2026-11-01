import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { chooseMove } from '../../ai'
import type { AiMove } from '../../ai'
import type { MoveRecord } from '../../engine'
import { Board } from '../board/Board'
import type { BoardMark } from '../board/marks'
import { moveDescription } from '../replay/records'
import { atariStones, computerMove, createMatch, humanMove, markDead } from './match'
import type { Match } from './match'

interface PlayPageProps {
  readonly match: Match
  readonly onChange: Dispatch<SetStateAction<Match>>
  readonly onFinish: (match: Match) => void
}

export function PlayPage({ match, onChange, onFinish }: PlayPageProps) {
  const [showAtari, setShowAtari] = useState(false)
  const [expiredCapture, setExpiredCapture] = useState<MoveRecord | undefined>()
  const [confirmRestart, setConfirmRestart] = useState(false)
  const { game } = match
  const scoring = game.phase === 'scoring'
  const thinking = !scoring && game.toPlay === 'white'
  const last = game.history.at(-1)

  useEffect(() => {
    if (game.phase !== 'playing' || game.toPlay !== 'white' || confirmRestart) return
    const timer = window.setTimeout(() => {
      let move: AiMove
      try { move = chooseMove(game) }
      catch (error) { console.warn('电脑选点失败，改为停一手。', error); move = { kind: 'pass' } }
      const result = computerMove(match, move)
      if (result.invalid) console.warn('电脑返回非法落点，改为停一手。', move)
      onChange((current) => current === match ? result.match : current)
    }, 350)
    return () => window.clearTimeout(timer)
  }, [game, match, onChange, confirmRestart])

  useEffect(() => {
    if (last?.kind !== 'play' || last.captured.length === 0) return
    const timer = window.setTimeout(() => setExpiredCapture(last), 1200)
    return () => window.clearTimeout(timer)
  }, [last])

  const marks: BoardMark[] = scoring
    ? match.dead.map((point) => ({ point, kind: 'dead' }))
    : [
        ...(showAtari ? atariStones(game).map((point): BoardMark => ({ point, kind: 'ring' })) : []),
        ...(last !== expiredCapture && last?.kind === 'play' ? last.captured.map((point): BoardMark => ({ point, kind: 'captured' })) : []),
      ]

  return (
    <section className="page page--with-board">
      <div>
        <Board board={game.board} marks={marks} lastMove={last?.kind === 'play' ? last.point : null}
          ghostColor={scoring ? null : 'black'} disabled={thinking || confirmRestart}
          onPointClick={(point) => onChange((current) => scoring ? markDead(current, point) : humanMove(current, point))} />
        <p className="board-caption">9 路 · 中国规则 · 黑先 · 白贴 7.5</p>
      </div>
      <div className="panel">
        <p className="eyebrow">你执黑 · 电脑执白</p>
        <h2>对局</h2>
        <p className="turn" role="status">{scoring ? '终局 · 标记死子' : thinking ? '电脑正在思考…' : '轮到你了，下一颗黑子。'}</p>
        <p className="muted">已下 {game.history.length} 手</p>
        {last && <p className="move-event">{moveDescription(last)}</p>}
        {match.message && <p className="message message--hint" role="alert">{match.message}</p>}
        {match.notices.length > 0 && <aside className="message message--success" aria-label="规则说明">
          {match.notices.map((notice) => <p key={notice}>{notice}</p>)}
          <button className="text-button" type="button" onClick={() => onChange((current) => ({ ...current, notices: [] }))}>知道了</button>
        </aside>}
        {scoring ? <>
          <p>点棋子，按整块标记或取消死子。红叉表示死子；电脑会同意你的标记。</p>
          <p>已标记 {match.dead.length} 颗死子。没有死子时可直接确认。</p>
          <button className="button" type="button" disabled={confirmRestart} onClick={() => onFinish(match)}>确认数子，进入复盘</button>
        </> : <>
          <label className="check-control"><input type="checkbox" checked={showAtari} onChange={(event) => setShowAtari(event.target.checked)} />显示只剩一口气的棋块</label>
          <p className="muted small">不想继续落子时，可以停一手；电脑可能继续下。</p>
          <button className="button" type="button" disabled={thinking || confirmRestart} onClick={() => onChange((current) => humanMove(current, null))}>停一手</button>
        </>}
        <div className="restart">
          {confirmRestart ? <div role="group" aria-label="确认重新开始">
            <p>重新开始会丢弃这一盘尚未保存的对局。</p>
            <div className="actions"><button className="button" type="button" onClick={() => { onChange(createMatch()); setConfirmRestart(false) }}>确认重新开始</button>
              <button className="button button--ghost" type="button" onClick={() => setConfirmRestart(false)}>继续这盘</button></div>
          </div> : <button className="text-button" type="button" onClick={() => setConfirmRestart(true)}>重新开始</button>}
        </div>
      </div>
    </section>
  )
}
