import { useEffect, useMemo, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { getGroup, samePoint } from '../../engine'
import type { GameState, MoveRecord, Point } from '../../engine'
import { Board } from '../board/Board'
import type { BoardMark } from '../board/marks'
import { moveDescription } from '../replay/records'
import { analyzePosition, transitionText } from '../coaching/analysis'
import { groupMarks } from '../coaching/explanations'
import { suggest } from '../coaching/suggestions'
import { atariStones, markDead } from './match'
import type { Match } from './match'
import { commitHuman, createPlaySession, retryRound, takeComputerTurn } from './session'
import type { PlaySession } from './session'
import { confirmPreview, previewMove } from './preview'
import type { MovePreview } from './preview'
import { CoachingPanel } from './CoachingPanel'
import { CaptureReview } from './CaptureReview'

interface PlayPageProps {
  readonly session: PlaySession
  readonly onChange: Dispatch<SetStateAction<PlaySession>>
  readonly onFinish: (match: Match) => void
  readonly coaching: boolean
  readonly onCoachingChange: (enabled: boolean) => void
  readonly preferenceMessage?: string | null
}
export function PlayPage({ session, onChange, onFinish, coaching, onCoachingChange, preferenceMessage }: PlayPageProps) {
  const [showAtari, setShowAtari] = useState(false)
  const [expiredCapture, setExpiredCapture] = useState<MoveRecord | undefined>()
  const [confirmRestart, setConfirmRestart] = useState(false)
  const [choice, setChoice] = useState<MovePreview | null>(null)
  const [view, setView] = useState<'before' | 'after' | 'reply'>('after')
  const [inspection, setInspection] = useState<{ game: GameState; point: Point } | null>(null)
  const [help, setHelp] = useState<{ game: GameState; level: number } | null>(null)
  const [reviewBefore, setReviewBefore] = useState(false)
  const { match } = session
  const { game } = match
  const scoring = game.phase === 'scoring'
  const thinking = !scoring && game.toPlay === 'white'
  const last = game.history.at(-1)
  const preview = coaching && choice?.source === game ? choice : null
  const a = preview?.analysis
  const review = coaching ? session.captureReview : null
  const hintLevel = help?.game === game ? help.level : 0
  const inspected = inspection?.game === game ? inspection.point : undefined
  const previewThreat = a?.ok ? a.dangers.find((g) => inspected && g.stones.some((p) => samePoint(p, inspected))) ?? a.dangers[0] : undefined
  const shown = review ? (reviewBefore ? review.before : review.after)
    : a?.ok ? (view === 'before' ? game : view === 'reply' ? previewThreat?.capture?.after ?? a.after : a.after) : game
  const facts = useMemo(() => coaching ? analyzePosition(shown) : [], [coaching, shown])
  const dangers = facts.filter((g) => g.color === 'black' && g.capture)
  const group = facts.find((g) => inspected && g.stones.some((p) => samePoint(p, inspected)))
    ?? dangers[0] ?? (a?.ok && a.rescued[0] ? facts.find((g) => g.stones.some((p) => samePoint(p, a.rescued[0].stones[0]))) : undefined)
    ?? (a?.ok && a.point ? facts.find((g) => g.stones.some((p) => samePoint(p, a.point!))) : undefined)
    ?? facts.find((g) => g.color === 'black' && g.liberties.length === 1)
  const suggestion = useMemo(() => hintLevel >= 2 ? suggest(game, inspected) : null, [game, inspected, hintLevel])

  useEffect(() => {
    if (game.phase !== 'playing' || game.toPlay !== 'white' || confirmRestart) return
    const timer = window.setTimeout(() => {
      const result = takeComputerTurn(session)
      if (result.error) console.warn('电脑选点失败或返回非法落点，改为停一手。')
      onChange((current) => current === session ? result.session : current)
    }, 350)
    return () => window.clearTimeout(timer)
  }, [game, session, onChange, confirmRestart])

  useEffect(() => {
    if (last?.kind !== 'play' || last.captured.length === 0) return
    const timer = window.setTimeout(() => setExpiredCapture(last), 1200)
    return () => window.clearTimeout(timer)
  }, [last])

  function clearTransient() { setChoice(null); setInspection(null); setHelp(null); setView('after'); setReviewBefore(false) }
  function select(point: Point | null) {
    if (thinking || confirmRestart || review) return
    if (scoring) { if (point) onChange((current) => ({ ...current, match: markDead(current.match, point) })); return }
    if (!coaching) { onChange((current) => commitHuman(current, point)); return }
    if (point && getGroup(game.board, point)) {
      setChoice(null); setInspection({ game, point }); setHelp(null); return
    }
    setChoice(previewMove(game, point)); setView('after'); setInspection(null)
  }
  function confirm() { if (confirmRestart || thinking) return; onChange((current) => confirmPreview(current, preview)); clearTransient() }
  function retry() { if (confirmRestart || thinking) return; onChange(retryRound); clearTransient() }
  const marks: BoardMark[] = scoring ? match.dead.map((point) => ({ point, kind: 'dead' })) : []
  if (coaching && !scoring) {
    if (review) {
      const move = review.after.history.at(-1)
      if (move?.kind === 'play') {
        move.captured.forEach((point) => marks.push({ point, kind: reviewBefore ? 'target' : 'captured' }))
        marks.push({ point: move.point, kind: 'label', text: 'A' })
      }
    } else {
      marks.push(...groupMarks(group))
      if (a?.ok && a.point && view === 'after') marks.push({ point: a.point, kind: 'preview' })
      if (!preview && suggestion) marks.push({ point: suggestion.point, kind: 'label', text: '试' })
      const shownLast = shown.history.at(-1)
      if (shownLast?.kind === 'play' && shown !== game) shownLast.captured.forEach((point) => marks.push({ point, kind: 'captured' }))
      if (view === 'reply' && previewThreat?.capture) marks.push({ point: previewThreat.capture.point, kind: 'label', text: 'A' })
    }
  } else if (!scoring) {
    if (showAtari) marks.push(...atariStones(game).map((point): BoardMark => ({ point, kind: 'ring' })))
    if (last !== expiredCapture && last?.kind === 'play') marks.push(...last.captured.map((point): BoardMark => ({ point, kind: 'captured' })))
  }
  const shownLast = shown.history.at(-1)
  const inDemo = !!preview && view === 'reply'
  return <section className="page page--with-board">
    <div>
      <Board board={shown.board} marks={marks} lastMove={shownLast?.kind === 'play' ? shownLast.point : null}
        ghostColor={scoring || review || inDemo ? null : 'black'} disabled={thinking || confirmRestart || !!review || inDemo}
        onPointClick={select} />
      <p className="board-caption">{review ? `回看 · ${reviewBefore ? '被吃前' : '被吃后'}` : inDemo ? '演示：白棋可能这样应对' : preview?.analysis.ok ? '试下中，尚未落子' : '9 路 · 中国规则 · 黑先 · 白贴 7.5'}</p>
      {coaching && <p className="board-caption">棋子上的圈：目标棋块 · 空心圈：气 · 虚线：试下</p>}
    </div>
    <div className="panel">
      <p className="eyebrow">你执黑 · 电脑执白</p><h2>对局</h2>
      <p className="turn" role="status">{scoring ? '终局 · 标记死子' : thinking ? '电脑正在思考…' : review ? '看懂这次提子，再继续。' : coaching ? '轮到你了，先试下看看。' : '轮到你了，下一颗黑子。'}</p>
      <p className="muted">已下 {game.history.length} 手</p>
      <label className="check-control"><input type="checkbox" checked={coaching} disabled={thinking || confirmRestart} onChange={(e) => {
        clearTransient(); onChange((current) => ({ ...current, captureReview: null })); onCoachingChange(e.target.checked)
      }} />新手陪练 · 先试下，再确认</label>
      {preferenceMessage && <p className="muted small" role="status">{preferenceMessage}</p>}
      {review ? <CaptureReview review={review} before={reviewBefore} onBefore={setReviewBefore} onContinue={() => { onChange((current) => ({ ...current, captureReview: null })); setReviewBefore(false) }} onRetry={retry} />
        : coaching && !scoring && !thinking && <>
          {session.lastBefore && last?.color === 'white' && !preview && <p className="move-event">{transitionText(session.lastBefore, game)}</p>}
          <CoachingPanel preview={preview} group={group} dangers={a?.ok ? a.dangers : dangers} hintLevel={hintLevel} suggestion={suggestion}
            onHint={() => setHelp({ game, level: hintLevel + 1 })} onSuggest={() => { if (suggestion) select(suggestion.point) }}
            onInspect={(g) => { setInspection({ game, point: g.stones[0] }); setHelp(null) }} />
          {a?.ok && <div className="preview-actions">
            <div className="actions">
              {preview?.point !== null && <><button type="button" className="button button--ghost" onClick={() => setView('before')}>下之前</button><button type="button" className="button button--ghost" onClick={() => setView('after')}>下之后</button></>}
              {a.dangers.length > 0 && <button type="button" className="button button--ghost" onClick={() => setView('reply')}>看白棋怎样提</button>}
            </div>
            {inDemo ? <button type="button" className="button" onClick={() => setView('after')}>返回试下</button> : <button type="button" className="button" onClick={confirm}>{preview?.point === null ? '确认停一手' : '下在这里'}</button>}{' '}
            <button type="button" className="text-button" onClick={clearTransient}>重新选点</button>
          </div>}
        </>}
      {!coaching && last && <p className="move-event">{moveDescription(last)}</p>}
      {match.message && <p className="message message--hint" role="alert">{match.message}</p>}
      {match.notices.length > 0 && <details className="rule-notices" open={!coaching}><summary>规则说明（{match.notices.length}）</summary>
        {match.notices.map((notice) => <p key={notice}>{notice}</p>)}
        <button type="button" className="text-button" onClick={() => onChange((current) => ({ ...current, match: { ...current.match, notices: [] } }))}>知道了</button>
      </details>}
      {scoring ? <>
        <p>点棋子，按整块标记或取消死子。红叉表示死子；电脑会同意你的标记。</p><p>已标记 {match.dead.length} 颗死子。没有死子时可直接确认。</p>
        <button type="button" className="button" disabled={confirmRestart} onClick={() => onFinish(match)}>确认数子，进入复盘</button>
      </> : <>
        {!coaching && <label className="check-control"><input type="checkbox" checked={showAtari} onChange={(event) => setShowAtari(event.target.checked)} />显示只剩一口气的棋块</label>}
        <p className="muted small">不想继续落子时，可以停一手；电脑可能继续下。</p>
        <button type="button" className="button button--ghost" disabled={thinking || confirmRestart || !!review || inDemo} onClick={() => select(null)}>停一手</button>
      </>}
      {coaching && !review && <p><button type="button" className="text-button" disabled={!session.undo || thinking || confirmRestart || inDemo} onClick={retry}>退回这一回合重试</button></p>}
      <div className="restart">{confirmRestart ? <div role="group" aria-label="确认重新开始"><p>重新开始会丢弃这一盘尚未保存的对局。</p>
        <div className="actions"><button type="button" className="button" onClick={() => { onChange(createPlaySession(Date.now())); clearTransient(); setConfirmRestart(false) }}>确认重新开始</button>
          <button type="button" className="button button--ghost" onClick={() => setConfirmRestart(false)}>继续这盘</button></div>
      </div> : <button type="button" className="text-button" onClick={() => setConfirmRestart(true)}>重新开始</button>}</div>
    </div>
  </section>
}
