import { useEffect, useState } from 'react'
import { getCell, getGroup, toIndex } from '../../engine'
import { Board } from '../board/Board'
import { BoardLayout } from '../board/BoardLayout'
import type { BoardMark } from '../board/marks'
import { LessonFeedback } from './LessonFeedback'
import { COMPLETION_LABELS } from './learningProgress'
import { captureCompletion, captureHint, capturePoint, captureReplay, startCapture, undoCapture } from './captureRunner'
import type { CaptureReplayKind, CaptureRun } from './captureRunner'

interface Props {
  readonly run: CaptureRun
  readonly onChange: (run: CaptureRun) => void
  readonly nextLabel: string
  readonly onNext: () => void
  readonly onPlay?: () => void
}
interface Replay extends ReturnType<typeof captureReplay> {
  readonly kind: CaptureReplayKind
  readonly step: number
  readonly automatic: boolean
}
const HINTS = ['提醒我看哪里', '标出目标白棋和气', '演示一种做法']

export function CapturePage({ run, onChange, nextLabel, onNext, onPlay }: Props) {
  const { scene, stage } = run
  const [replay, setReplay] = useState<Replay | null>(null)
  const automatic = replay?.automatic ?? false
  useEffect(() => {
    if (!automatic) return
    const timer = window.setInterval(() => {
      setReplay((current) => {
        if (!current?.automatic) return current
        const step = current.step + 1
        return { ...current, step, automatic: step < current.frames.length - 1 }
      })
    }, 450)
    return () => window.clearInterval(timer)
  }, [automatic])

  const shown = replay ? replay.frames[replay.step] : run.game
  const last = shown.history.at(-1)
  const marks: BoardMark[] = []
  if (run.hint >= 2 || replay) {
    const seen = new Set<number>()
    for (const target of scene.targets) {
      if (getCell(shown.board, target) !== 'white') continue
      const group = getGroup(shown.board, target)!
      for (const [points, kind] of [[group.stones, 'target'], [group.liberties, 'liberty']] as const) {
        for (const point of points) {
          const index = toIndex(shown.board, point)
          if (seen.has(index)) continue
          seen.add(index)
          marks.push({ point, kind })
        }
      }
    }
  }
  if (last?.kind === 'play') {
    for (const point of last.captured) marks.push({ point, kind: 'captured' })
  }

  function startReplay(kind: CaptureReplayKind) {
    setReplay({ ...captureReplay(scene, kind), kind, step: 0, automatic: kind === 'solution' })
  }
  function hint() {
    const next = captureHint(run)
    if (next.assisted) startReplay('solution')
    onChange(next)
  }
  function restart() {
    setReplay(null)
    onChange(startCapture(scene))
  }

  const replayEnd = !!replay && replay.step === replay.frames.length - 1
  const turn = !last ? '题目原图 · 你执黑'
    : `${last.color === 'black' ? '黑棋' : '白棋'}${last.kind === 'pass' ? '停一手' : '落子'}`
  const contrastGroup = replayEnd && replay?.kind === 'contrast' && replay.run.failure === 'escape'
    ? getGroup(shown.board, scene.targets[0]) : null
  const feedback = contrastGroup
    ? `白棋逃出去了。它连上了路上的白棋，现在有 ${contrastGroup.liberties.length} 口气，黑棋一手叫吃不了。`
    : replay ? (replayEnd ? replay.run.message : null) : run.message
  const label = stage === 'done' ? COMPLETION_LABELS[captureCompletion(run)]
    : stage === 'failed' ? '这次没吃到'
    : `追吃中 · 已下 ${run.moves} 手 / 最多 ${scene.maxMoves} 手`
  const replayControls = replay && <div className="actions">
    <button className="text-button" disabled={replay.step === 0} onClick={() => setReplay({ ...replay, step: replay.step - 1, automatic: false })}>上一手</button>
    <button className="text-button" disabled={replayEnd} onClick={() => setReplay({ ...replay, step: replay.step + 1, automatic: false })}>下一手</button>
    <button className="text-button" onClick={() => setReplay({ ...replay, step: 0, automatic: false })}>回看原图</button>
    <button className="text-button" onClick={() => setReplay(null)}>返回解题结果</button>
  </div>

  return <BoardLayout
    heading={<>
      <p className="eyebrow">吃掉对方的棋 / 第 {scene.lesson} 课 · {scene.guided ? '一起练习' : '自己试试'}</p>
      <h2>{scene.title}</h2>
      <div className="step-task">
        <p className="step-label">{label}</p>
        {stage === 'active' && <p className="turn">{scene.task}</p>}
      </div>
    </>}
    board={<>
      <Board board={shown.board} marks={marks} lastMove={last?.kind === 'play' ? last.point : null}
        disabled={stage !== 'active' || !!replay} ghostColor="black"
        onPointClick={(point) => onChange(capturePoint(run, point))} />
      <p className="board-caption">{replay ? `回放 · ${replay.step} / ${replay.frames.length - 1} 手 · ` : ''}{turn}</p>
    </>}
    feedback={feedback && <LessonFeedback message={feedback} />}
    primary={<>
      {stage === 'active' && <>
        {!run.message && <p className="step-intro">{scene.intro}{scene.guided && <> {scene.hints[0]}</>}</p>}
        {run.rounds.length > 0 && <button className="text-button" onClick={() => onChange(undoCapture(run))}>退回一手</button>}
        <button className="text-button hint-button" onClick={hint}>{HINTS[run.hint]}</button>
      </>}
      {stage === 'failed' && <div className="actions">
        <button className="button" onClick={() => onChange(undoCapture(run))}>退回一手</button>
        <button className="text-button" onClick={restart}>重来这一题</button>
      </div>}
      {stage === 'done' && <>
        <div className="actions next-lesson">
          <button className="button" onClick={onNext}>{nextLabel}</button>
          {onPlay && <button className="button button--ghost" onClick={onPlay}>开始我的陪练</button>}
        </div>
        {run.assisted && replay?.kind !== 'solution' && <div className="actions">
          <button className="text-button" onClick={() => startReplay('solution')}>回看演示</button>
        </div>}
        {replay?.kind === 'solution' && replayControls}
        {scene.guided && <details className="step-compare" onToggle={(event) => {
          if (!event.currentTarget.open) setReplay((current) => current?.kind === 'solution' ? current : null)
        }}>
          <summary>看看对照</summary>
          <div className="actions">
            <button className="button button--ghost" aria-pressed={replay?.kind === 'wrong'} onClick={() => startReplay('wrong')}>如果先从另一边叫吃</button>
            {scene.contrastRows && <button className="button button--ghost" aria-pressed={replay?.kind === 'contrast'} onClick={() => startReplay('contrast')}>如果路上有白子</button>}
          </div>
          {replay && replay.kind !== 'solution' && replayControls}
        </details>}
        <div className="restart"><button className="text-button" onClick={restart}>重来这一题</button></div>
      </>}
    </>}
  >
    <details className="step-notes">
      <summary>讲解与图例</summary>
      <p className="muted">{scene.intro}</p>
      <p className="small">棋子上的圈：目标白棋 · 空心圈：气 · 虚线小圈：提子位置</p>
    </details>
  </BoardLayout>
}
