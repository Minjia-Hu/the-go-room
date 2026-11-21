import { createGame, parseBoard, play } from '../../engine'
import type { GameState, Point } from '../../engine'
import type { LadderDefenseScene } from '../../content/ladderDefense'
import type { Completion } from './learningProgress'

export interface LadderDefenseRun {
  readonly scene: LadderDefenseScene
  readonly origin: GameState
  readonly frames: readonly [readonly GameState[], readonly GameState[]]
  readonly selected: 0 | 1 | null
  readonly step: number
  readonly seenEnd: boolean
  readonly stage: 'choose' | 'reason' | 'done'
  readonly help: boolean
  readonly mistakes: number
  readonly message: string | null
}

function replay(origin: GameState, moves: readonly Point[], id: string): readonly GameState[] {
  const frames = [origin]
  for (const point of moves) {
    const next = play(frames[frames.length - 1], point)
    if (!next.ok) throw new Error(`防守对照 ${id} 第 ${frames.length} 手非法：${next.reason}`)
    frames.push(next.state)
  }
  return frames
}

export function startLadderDefense(scene: LadderDefenseScene): LadderDefenseRun {
  const origin = createGame({ board: parseBoard(scene.rows) })
  return { scene, origin, frames: [
    replay(origin, scene.choices[0].moves, scene.id),
    replay(origin, scene.choices[1].moves, scene.id),
  ], selected: null, step: 0, seenEnd: false, stage: 'choose', help: false, mistakes: 0, message: null }
}

export function chooseDefense(run: LadderDefenseRun, choice: 0 | 1): LadderDefenseRun {
  if (run.selected === choice || run.stage === 'done') return run
  return { ...run, selected: choice, step: 0, seenEnd: false, stage: 'choose', message: null }
}

export function defenseView(run: LadderDefenseRun): GameState {
  return run.selected === null ? run.origin : run.frames[run.selected][run.step]
}

export function defenseStep(run: LadderDefenseRun, delta: number): LadderDefenseRun {
  if (run.selected === null) return run
  const length = run.scene.choices[run.selected].moves.length
  const step = Math.max(0, Math.min(length, run.step + Math.sign(delta)))
  if (step === run.step) return run
  if (run.stage === 'done') return { ...run, step }
  if (step < length) return { ...run, step, stage: 'choose', message: null }

  const choice = run.scene.choices[run.selected]
  const correct = run.selected === run.scene.answer
  return { ...run, step, stage: correct ? 'reason' : 'choose', seenEnd: true,
    mistakes: run.mistakes + (!correct && !run.seenEnd ? 1 : 0),
    message: choice.feedback + (correct ? '再选出原因。' : '可以再看另一种选择。') }
}

export function answerDefense(run: LadderDefenseRun, reason: number): LadderDefenseRun {
  if (run.stage !== 'reason' || !run.scene.reasons[reason]) return run
  if (reason !== run.scene.reasonAnswer) {
    return { ...run, mistakes: run.mistakes + 1, message: '再看黑棋逃跑的路线，留意有没有可以连上的接应子。' }
  }
  return { ...run, stage: 'done', message: `对。${run.scene.reasons[reason]}。` }
}

export function defenseHint(run: LadderDefenseRun): LadderDefenseRun {
  return run.stage === 'done' ? run : { ...run, help: true, message: '沿着黑棋逃跑的路线看一看。能连到同伴时，再数一数连上后有几口气。' }
}

export function defenseCompletion(run: LadderDefenseRun): Completion {
  return run.help ? 'hint' : run.mistakes > 0 ? 'retry' : 'independent'
}
