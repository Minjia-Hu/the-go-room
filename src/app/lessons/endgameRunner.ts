import { createGame, getCell, isOnBoard, neighbors, parseBoard, pass, play, samePoint, scoreGame, toIndex, toPoint, toggleDeadGroup } from '../../engine'
import type { Board, Color, GameState, Point } from '../../engine'
import { AGREED_DEAD, CONTINUE_POINT, DEAD_CAPTURE, ENDGAME_LESSONS, ENDING_ROWS, SCORING_ROWS, TERRITORY_QUESTIONS } from '../../content/endgame'
import type { EndgameLesson } from '../../content/endgame'
import type { BoardMark } from '../board/marks'

export interface EndgameRun {
  readonly lesson: EndgameLesson
  readonly game: GameState
  readonly step: number
  readonly picked: boolean
  readonly input: string
  readonly dead: readonly Point[]
  readonly demo: boolean
  readonly done: boolean
  readonly assisted: boolean
  readonly message: string | null
}
export function startEndgame(lesson: EndgameLesson): EndgameRun {
  return { lesson, game: createGame({ board: parseBoard(lesson.id === 'ending' ? ENDING_ROWS : SCORING_ROWS) }), step: 0, picked: false, input: '', dead: [], demo: false, done: false, assisted: false, message: null }
}
export function createEndgameRuns(): readonly EndgameRun[] { return ENDGAME_LESSONS.map(startEndgame) }

export function emptyRegion(board: Board, point: Point): readonly Point[] {
  if (!isOnBoard(board, point) || getCell(board, point) !== null) return []
  const seen = new Set<number>([toIndex(board, point)])
  const stack = [point]
  while (stack.length) {
    const current = stack.pop()!
    for (const next of neighbors(board, current)) {
      const index = toIndex(board, next)
      if (getCell(board, next) === null && !seen.has(index)) { seen.add(index); stack.push(next) }
    }
  }
  return [...seen].map((index) => toPoint(board, index))
}
export function lessonScore(run: EndgameRun) {
  const removed = new Set(run.dead.map((p) => toIndex(run.game.board, p)))
  const cleared: Board = { ...run.game.board, cells: run.game.board.cells.map((c, i) => removed.has(i) ? null : c) }
  const score = scoreGame(run.game.board, run.dead, run.game.komi)
  const points = (color: Color, stones: boolean) => cleared.cells.flatMap((cell, index) =>
    score.ownership[index] === color && (stones ? cell === color : cell === null) ? [toPoint(cleared, index)] : [])
  return { score, cleared, blackStones: points('black', true), blackEmpty: points('black', false), whiteStones: points('white', true), whiteEmpty: points('white', false) }
}
export function countQuestion(run: EndgameRun) {
  const score = lessonScore(run)
  return [
    { label: '黑方活子', points: score.blackStones, color: 'black' as const, stones: true },
    { label: '黑方围住的空点', points: score.blackEmpty, color: 'black' as const, stones: false },
    { label: '白方活子', points: score.whiteStones, color: 'white' as const, stones: true },
    { label: '白方围住的空点', points: score.whiteEmpty, color: 'white' as const, stones: false },
  ][Math.min(run.step, 3)]
}
export function selectEndgame(run: EndgameRun, point: Point): EndgameRun {
  if (run.done || run.demo) return run
  if (run.lesson.id === 'territory') {
    const question = TERRITORY_QUESTIONS[run.step]
    const region = emptyRegion(run.game.board, question.point)
    return region.some((p) => samePoint(p, point))
      ? { ...run, picked: true, message: null }
      : { ...run, message: '先点字母标出的空点，或与它相连的同一片空区。棋子本身不是空点。' }
  }
  if (run.lesson.id === 'ending' && run.game.phase === 'scoring') {
    if (!samePoint(point, AGREED_DEAD)) return { ...run, message: '本题双方约定只有圈出的这一颗白棋是死子，其余棋子都活着。被围住不一定是死子；可以先看提子演示。' }
    const dead = toggleDeadGroup(run.game.board, run.dead, point)
    return { ...run, dead, message: dead.length ? '已标记这颗白棋为死子。确认后先移除，再数子；再点一次可以取消。' : '已取消死子标记。想好后可以重新标记。' }
  }
  return run
}
export function answerTerritory(run: EndgameRun, owner: Color | null): EndgameRun {
  if (run.lesson.id !== 'territory' || !run.picked || run.done) return run
  const question = TERRITORY_QUESTIONS[run.step]
  const expected = lessonScore(run).score.ownership[toIndex(run.game.board, question.point)]
  if (owner !== expected) return { ...run, message: expected === null ? '这片空区同时接触黑棋和白棋，所以不属于任何一方。不能只看哪种棋更近或更多。' : `这片相连的空区只接触${expected === 'black' ? '黑' : '白'}棋，因此归${expected === 'black' ? '黑' : '白'}方；沿边界检查，而不是猜距离。` }
  const step = run.step + 1
  if (step === TERRITORY_QUESTIONS.length) return { ...run, step, picked: false, done: true, message: null }
  return { ...run, step, picked: false, message: `${question.label} 判断正确。${expected === null ? '两边都接触的公共空点不计入任何一方。' : `这片空区归${expected === 'black' ? '黑' : '白'}方。`}接着观察下一个字母。` }
}
export function submitCount(run: EndgameRun): EndgameRun {
  if (run.done || !['count', 'komi'].includes(run.lesson.id) || (run.lesson.id === 'komi' && run.step !== 0)) return run
  const value = Number(run.input)
  const expected = run.lesson.id === 'komi' ? lessonScore(run).score.white + run.game.komi : countQuestion(run).points.length
  if (!run.input.trim() || !Number.isFinite(value) || value < 0) return { ...run, message: '先输入一个有效的非负数字。' }
  if (value !== expected) return { ...run, message: run.lesson.id === 'komi' ? `白方盘面分是 ${lessonScore(run).score.white}，只给白方加 ${run.game.komi}。请重新相加；棋盘上的棋子不会增加。` : '还不对。只数当前标记的这一类：棋子数与空点数分开数，每个交叉点只数一次。也可以请我帮你数。' }
  const step = run.step + 1
  return { ...run, step, input: '', done: run.lesson.id === 'count' && step === 4, message: run.lesson.id === 'komi' ? `算对了，白方最终是 ${expected} 分。再与黑方盘面分比较，选出胜方。` : `对，${countQuestion(run).label}是 ${expected}。${step < 4 ? '再数下一类。' : '棋子加空点，就是盘面分。'}` }
}
export function countHint(run: EndgameRun): EndgameRun {
  if (run.done || run.lesson.id !== 'count') return run
  const q = countQuestion(run)
  return { ...run, assisted: true, message: `这一类共 ${q.points.length} 个。可以按棋盘的每一行依次数，输入这个数继续。本课会记录为借助提示完成。` }
}
export function answerWinner(run: EndgameRun, winner: Color): EndgameRun {
  if (run.lesson.id !== 'komi' || run.step !== 1 || run.done) return run
  const { score } = lessonScore(run)
  if (winner !== score.winner) return { ...run, message: `要比较贴目后的分数：黑方 ${score.black}，白方 ${score.white} + ${score.komi} = ${score.white + score.komi}。盘面领先，不一定最终获胜。` }
  return { ...run, done: true, step: 2, message: `对，${winner === 'white' ? '白' : '黑'}方领先 ${score.margin} 分。贴目只改变结算，不改变棋盘。` }
}
export function endingTurn(run: EndgameRun, action: 'black-pass' | 'white-pass' | 'white-play'): EndgameRun {
  if (run.lesson.id !== 'ending' || run.done || run.demo || run.game.phase !== 'playing') return run
  if ((action === 'black-pass') !== (run.game.toPlay === 'black')) return run
  const result = action === 'white-play' ? play(run.game, CONTINUE_POINT) : pass(run.game)
  if (!result.ok) return { ...run, message: '这个继续落子的例子已经试过。现在可以让双方连续停一手，或重来本课。' }
  return { ...run, game: result.state, message: action === 'white-play' ? '白棋选择继续落子，连续停手次数回到 0，这盘还没有结束。现在重新从黑棋停手开始。'
    : result.state.phase === 'scoring' ? '双方已连续停手，进入数子前的确认。先把约定的死子标出来。' : '黑棋停了一手，棋子没有变化。还要看白棋是继续下，还是也停一手。' }
}
export function confirmEnding(run: EndgameRun): EndgameRun {
  if (run.lesson.id !== 'ending' || run.done || run.demo || run.game.phase !== 'scoring') return run
  if (run.dead.length !== 1 || !samePoint(run.dead[0], AGREED_DEAD)) return { ...run, message: '这道练习还有一颗约定的死子没有标记。先点圈出的白棋，再确认数子。' }
  return { ...run, done: true, message: '死子已移除，再按活子与空点计分，最后给白方加贴目。移除的白子不再另给黑方加一分。这是教学盘面，不会写入正式棋谱。' }
}
export function endingDemo(run: EndgameRun): EndgameRun {
  return run.lesson.id === 'ending' && run.game.phase === 'scoring' && !run.done ? { ...run, demo: !run.demo, message: null } : run
}
export function endgameView(run: EndgameRun) {
  const { score, cleared } = lessonScore(run)
  const marks: BoardMark[] = []
  let board = run.game.board
  if (run.lesson.id === 'territory') {
    TERRITORY_QUESTIONS.forEach((question, i) => {
      if (i > run.step) return
      marks.push({ point: question.point, kind: 'label', text: question.label })
      if (i < run.step || (i === run.step && run.picked)) emptyRegion(board, question.point).forEach((point) => marks.push({ point, kind: i < run.step && question.expected ? `${question.expected}-area` : 'selected' }))
    })
  } else if (run.lesson.id === 'count' && !run.done) {
    const q = countQuestion(run)
    q.points.forEach((point) => marks.push({ point, kind: q.stones ? 'target' : 'liberty' }))
  } else if (run.lesson.id === 'ending' && !run.done) {
    if (run.demo) {
      const result = play(createGame({ board, toPlay: 'black' }), DEAD_CAPTURE)
      if (result.ok) { board = result.state.board; marks.push({ point: AGREED_DEAD, kind: 'captured' }, { point: DEAD_CAPTURE, kind: 'preview' }) }
    } else {
      marks.push({ point: AGREED_DEAD, kind: 'target' }, ...run.dead.map((point): BoardMark => ({ point, kind: 'dead' })))
    }
  } else {
    board = cleared
    score.ownership.forEach((owner, i) => { if (owner) marks.push({ point: toPoint(board, i), kind: `${owner}-area` }) })
  }
  return { board, marks }
}
