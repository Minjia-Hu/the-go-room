import { useState } from 'react'
import type { CaptureScene } from '../../content/capture'
import { getGroup } from '../../engine'
import type { Point } from '../../engine'
import { Board } from '../board/Board'
import { BoardLayout } from '../board/BoardLayout'
import type { BoardMark } from '../board/marks'
import { connectionFrames } from './captureRunner'
import { LessonFeedback } from './LessonFeedback'

export function ConnectionComparison({ scene, onReturn }: { scene: CaptureScene; onReturn: () => void }) {
  const [frames] = useState(() => connectionFrames(scene))
  const [step, setStep] = useState(0)
  const [choice, setChoice] = useState<Point | null>(null)
  const correct = choice !== null && scene.connection !== undefined && choice.x === scene.connection.x && choice.y === scene.connection.y
  const game = frames[step]
  const last = game.history.at(-1)
  const marks: BoardMark[] = []
  if (step === 0 && choice) marks.push({ kind: 'selected', point: choice })
  if (step === 1) {
    const group = getGroup(game.board, scene.targets[0])!
    marks.push({ kind: 'liberty', point: group.liberties[0] })
  }
  if (step === 2 && last?.kind === 'play') {
    for (const point of last.captured) marks.push({ kind: 'captured', point })
  }
  const task = ['点出白棋能把两边连起来的位置。', '白棋接上了。数数这块棋还剩几口气。', '接上的白棋只剩一口气，黑棋占住它，整块白棋一起被提走。'][step]
  return <BoardLayout heading={<><p className="eyebrow">走法对照 · 接不归</p><h2>如果白棋硬接</h2><p className="turn">{task}</p></>}
    board={<Board board={game.board} marks={marks} lastMove={last?.kind === 'play' ? last.point : null}
      disabled={step !== 0} ghostColor="white" onPointClick={setChoice} />}
    feedback={step === 0 && choice && <LessonFeedback message={correct ? '这点能把两边的白棋连起来。' : '再找找两边白棋之间的空点。'} />}
    primary={<div className="actions">
      {step === 0 && <button className="button" disabled={!correct} onClick={() => setStep(1)}>试着接回去</button>}
      {step === 1 && <button className="button" onClick={() => setStep(2)}>看黑棋怎样提子</button>}
      {step > 0 && <button className="text-button" onClick={() => setStep(step - 1)}>上一手</button>}
      <button className="text-button" onClick={onReturn}>返回本题</button>
    </div>}>
    <details className="step-notes"><summary>讲解与图例</summary>
      <p className="small">接上后，空心圈标出整块白棋的最后一口气。提子后，虚线小圈标出白棋原来的位置。</p>
    </details>
  </BoardLayout>
}
