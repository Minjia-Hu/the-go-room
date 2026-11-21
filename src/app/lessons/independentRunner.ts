import { createGame, getCell, getGroup, isOnBoard, parseBoard, play, samePoint } from '../../engine'
import type { GameState, Point } from '../../engine'
import { INDEPENDENT_SCENES } from '../../content/independent'
import type { IndependentScene } from '../../content/independent'
import type { BoardMark } from '../board/marks'

export interface IndependentRun {
  readonly scene: IndependentScene
  readonly game: GameState
  readonly stage: 'find' | 'move' | 'reason' | 'done'
  readonly point: Point | null
  readonly view: 'before' | 'after' | 'reply'
  readonly help: number
  readonly mistakes: number
  readonly message: string | null
}
export function startIndependent(scene: IndependentScene): IndependentRun {
  return { scene, game: createGame({ board: parseBoard(scene.rows) }), stage: 'find', point: null, view: 'before', help: 0, mistakes: 0, message: null }
}
export function createIndependentRuns(): readonly IndependentRun[] { return INDEPENDENT_SCENES.map(startIndependent) }
export function independentTrial(run: IndependentRun, point: Point) {
  const result = play(run.game, point)
  if (!result.ok) return { result, meetsGoal: false, group: null, captured: 0, reply: null }
  const group = getGroup(result.state.board, run.scene.target)
  const last = result.state.history.at(-1)!
  const captured = last.kind === 'play' ? last.captured.length : 0
  const connected = !run.scene.partner || group?.stones.some((stone) => samePoint(stone, run.scene.partner!))
  const meetsGoal = !!group && group.liberties.length >= 2 && connected && (run.scene.kind !== 'capture' || captured > 0)
  const response = group?.liberties.length === 1 ? play(result.state, group.liberties[0]) : null
  const reply = response?.ok && getCell(response.state.board, run.scene.target) !== 'black' ? response.state : null
  return { result, meetsGoal: !!meetsGoal, group, captured, reply }
}
export function independentPoint(run: IndependentRun, point: Point): IndependentRun {
  if (run.stage === 'done' || run.stage === 'reason' || run.view === 'reply' || !isOnBoard(run.game.board, point)) return run
  if (run.stage === 'find') {
    const group = getGroup(run.game.board, point)
    if (!group || group.color !== 'black') return { ...run, mistakes: run.mistakes + 1, message: '先选一块黑棋，不是空点或白棋。点同一块里的任意一颗都可以。' }
    if (!group.stones.some((stone) => samePoint(stone, run.scene.target))) {
      const message = group.stones.length === 1
        ? `你选的这颗黑棋有 ${group.liberties.length} 口气。本题先找只有一口气、下一手可能被提的黑棋。`
        : `你选的这块黑棋有 ${group.liberties.length} 口气。本题先找只有一口气、下一手可能被提的那块。`
      return { ...run, mistakes: run.mistakes + 1, message }
    }
    const target = group.stones.length === 1 ? '这颗黑棋' : `这 ${group.stones.length} 颗黑棋连成一块，`
    return { ...run, stage: 'move', message: `找到了：${target}只剩一口气。现在自己选一个落点试试。` }
  }
  const trial = independentTrial(run, point)
  if (!trial.result.ok) return { ...run, point: null, view: 'before', mistakes: run.mistakes + 1, message: trial.result.reason === 'occupied' ? '这里已经有棋子。请选择空的交叉点试下。' : '这一手不合法：落子、提掉对方后自己仍不能没气，也不能重复之前的盘面。换个空点试试。' }
  const target = trial.group?.stones.length === 1 ? '这颗黑棋' : '目标整块'
  return { ...run, point, view: 'after', message: `试下后，${target}有 ${trial.group?.liberties.length ?? 0} 口气，提掉白棋 ${trial.captured} 颗。先看看变化，再确认是否完成了本题目标。` }
}
export function confirmIndependent(run: IndependentRun): IndependentRun {
  if (run.stage !== 'move' || !run.point || run.view !== 'after') return run
  const trial = independentTrial(run, run.point)
  if (!trial.meetsGoal) return { ...run, mistakes: run.mistakes + 1, message: trial.reply ? '还没有解除眼前危险，目标仍只剩一口气。可以看白棋怎样提，再回到原图重试。' : '这手还没有完成本题目标。检查是否至少有两口气，以及是否完成了题目要求的提子或连接；这不是对整盘最佳走法的评价。' }
  return { ...run, stage: 'reason', message: '这手完成了本题目标。再选出它为什么有用，才算完成这一题。' }
}
export function independentHint(run: IndependentRun): IndependentRun {
  if (run.stage === 'done' || run.help >= 2) return run
  const help = run.help + 1
  return { ...run, help, message: help === 1 ? '从整块棋数气，每个相邻空点只数一次。先找只有一口气的黑块，再看能否接向空处、提掉白棋或连接同伴。' : run.scene.kind === 'capture' ? '已圈出目标黑棋和附近需要观察的白棋。白棋也只剩一口气，提走它可能为黑棋腾出空间。' : '已标出目标黑块与它的气。沿最后一口气向外看，是否能接到更多空点或另一块黑棋？' }
}
export function independentReasons(run: IndependentRun) {
  return run.scene.kind === 'capture'
    ? ['因为提走白棋，空出位置，目标黑块的气增加了', '因为只要吃过棋，这盘就赢了', '因为白棋数量少，所以可以直接拿走']
    : run.scene.kind === 'connect'
      ? ['因为两块棋斜着靠近，就能共享气', '因为直线连成同一块，可以共用整块的气', '因为连接之后永远不会被提']
      : ['因为多放了一颗黑子，就一定安全', '因为离边缘更远，就不会被吃', '因为与原棋块相连，整块接触到更多空点']
}
export function answerIndependent(run: IndependentRun, index: number): IndependentRun {
  if (run.stage !== 'reason' || !independentReasons(run)[index]) return run
  const correct = { capture: 0, connect: 1, extend: 2 }[run.scene.kind]
  if (index !== correct) return { ...run, mistakes: run.mistakes + 1, message: '再看实际变化：直线连接才能共用气，提走白子会空出位置。多一颗、靠得近或吃过子，都不等于永远安全或已经获胜。' }
  return { ...run, stage: 'done', message: '原因判断正确。这里确认的是目标至少有两口气、完成本题任务，不是在保证它长期不会被吃。' }
}
export function independentView(run: IndependentRun) {
  const trial = run.point ? independentTrial(run, run.point) : null
  const game = run.view === 'reply' && trial?.reply ? trial.reply : run.view === 'after' && trial?.result.ok ? trial.result.state : run.game
  const marks: BoardMark[] = []
  const group = getGroup(game.board, run.scene.target)
  if (run.stage !== 'find' || run.help >= 2) {
    group?.stones.forEach((point) => marks.push({ point, kind: 'target' }))
    if (run.help >= 2 || run.point) group?.liberties.forEach((point) => marks.push({ point, kind: 'liberty' }))
  }
  if (run.help >= 2 && run.scene.focus && run.view === 'before') getGroup(game.board, run.scene.focus)?.stones.forEach((point) => marks.push({ point, kind: 'target' }))
  const last = game.history.at(-1)
  if (last?.kind === 'play') {
    marks.push({ point: last.point, kind: 'preview' })
    last.captured.forEach((point) => marks.push({ point, kind: 'captured' }))
  }
  const completion = run.help > 0 ? '借助提示完成' : run.mistakes > 0 ? '本次重试后完成' : '本次未用提示完成'
  return { game, marks, trial, completion }
}
