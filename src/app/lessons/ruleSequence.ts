import { createGame, getGroup, inspectPlay, parseBoard } from '../../engine'
import { RULE_SEQUENCE_SCENES } from '../../content/endgame'
import type { BoardMark } from '../board/marks'

export interface RuleSequenceRun {
  readonly sceneIndex: number
  readonly step: number
  readonly solved: readonly number[]
  readonly message: string | null
}
export function startRuleSequence(): RuleSequenceRun { return { sceneIndex: 0, step: 0, solved: [], message: null } }
export function sequenceStep(run: RuleSequenceRun, step: number): RuleSequenceRun {
  return { ...run, step: Math.max(0, Math.min(3, step)), message: null }
}
export function sequenceScene(run: RuleSequenceRun, sceneIndex: number): RuleSequenceRun {
  return { ...run, sceneIndex: Math.max(0, Math.min(RULE_SEQUENCE_SCENES.length - 1, sceneIndex)), step: 0, message: null }
}
export function sequenceView(run: RuleSequenceRun) {
  const scene = RULE_SEQUENCE_SCENES[run.sceneIndex]
  const game = createGame({ board: parseBoard(scene.rows), toPlay: 'white' })
  const inspection = inspectPlay(game, scene.point)
  const legal = inspection.result.ok
  const group = getGroup(game.board, scene.target)!
  const board = run.step === 0 || (run.step === 3 && !legal) ? game.board
    : run.step === 1 ? inspection.placed! : inspection.afterCaptures!
  const marks: BoardMark[] = []
  if (run.step <= 1 || !legal) group.stones.forEach((point) => marks.push({ point, kind: 'target' }))
  if (run.step === 0 || (run.step === 3 && !legal)) marks.push({ point: scene.point, kind: 'label', text: 'A' })
  else marks.push({ point: scene.point, kind: 'preview' })
  if (scene.otherEye) marks.push({ point: scene.otherEye, kind: 'label', text: 'B' })
  if (run.step >= 2 && legal) {
    inspection.captured.forEach((point) => marks.push({ point, kind: 'captured' }))
    inspection.ownLiberties.forEach((point) => marks.push({ point, kind: 'liberty' }))
  }
  const titles = ['先看原来的棋形', '① 暂时把白棋放在 A', '② 先检查并提走对方', '③ 再检查刚下的白棋']
  const text = run.step === 0
    ? `这 ${group.stones.length} 颗黑棋相连，共有 ${group.liberties.length} 口气。现在轮到白棋，试着在 A 落子。`
    : run.step === 1
      ? `白子刚放入，周围都是黑棋，此刻它看起来没有气。但还不能判定：下一步先检查黑棋有没有被提走。${legal ? '黑棋最后的一口气已被占住。' : '黑棋还有 B 这一口气。'}`
      : run.step === 2
        ? legal ? `黑棋已经没有气，先提走这 ${inspection.captured.length} 颗黑子。它们原来的位置空了出来，给刚下的白棋留下 ${inspection.ownLiberties.length} 口气。`
          : '黑棋还有 B 这口气，所以一颗也不能提走。黑棋都留在原地，继续围着 A 的白子。'
        : legal ? `提走黑棋后，白棋有 ${inspection.ownLiberties.length} 口气，所以这一手合法。先处理对方的提子，再检查自己；不是黑棋和白棋同时互相提。`
          : '没有黑棋可以被提走，A 的白子仍然没有气，所以这一手属于禁入点，不允许下。棋盘恢复原样；不是白棋先下进去再被吃。'
  return { scene, game, inspection, legal, board, marks, title: titles[run.step], text }
}
export function answerSequence(run: RuleSequenceRun, correct: boolean): RuleSequenceRun {
  if (run.step !== 3) return run
  if (!correct) return { ...run, message: '再按顺序看一次：先看对方有没有没气的棋被提走，然后才看刚下的棋有没有气。周围是黑棋，并不直接决定白棋能不能下。' }
  return { ...run, solved: [...new Set([...run.solved, run.sceneIndex])], message: '原因答对了。记住这个顺序：先提对方，再检查自己。' }
}
