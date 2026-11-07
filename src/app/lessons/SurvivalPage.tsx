import { Board } from '../board/Board'
import type { BoardMark } from '../board/marks'
import { analyzeAction, analyzePosition } from '../coaching/analysis'
import { groupMarks } from '../coaching/explanations'
import { choosePracticePoint, chooseReason, confirmPractice, practiceBoard, practiceHint, startSurvival } from './survivalRunner'
import type { SurvivalRun } from './survivalRunner'

interface Props { readonly run: SurvivalRun; readonly onChange: (run: SurvivalRun) => void; readonly onNext: () => void; readonly isLast: boolean }
export function SurvivalPage({ run, onChange, onNext, isLast }: Props) {
  const { scene } = run
  const shown = practiceBoard(run)
  const reveal = run.hint >= 2 || run.stage === 'done' || run.stage === 'liberty' || run.stage === 'reason' || run.preview?.ok
  const target = analyzePosition(shown).find((g) => g.stones.some((p) => p.x === scene.target.x && p.y === scene.target.y))
  const marks: BoardMark[] = reveal ? groupMarks(target) : []
  if (scene.kind === 'eyes' && !run.view.startsWith('contrast') && (reveal || scene.guided)) scene.eyes!.forEach((point, index) => marks.push({ point, kind: 'label', text: index === 0 ? 'A' : 'B' }))
  run.selected.forEach((point) => { if (shown.board.cells[point.y * 9 + point.x] === null) marks.push({ point, kind: 'selected' }) })
  if (run.preview?.ok && run.preview.point && run.view === 'after') marks.push({ point: run.preview.point, kind: 'preview' })
  const last = shown.history.at(-1)
  if (last?.kind === 'play') last.captured.forEach((point) => marks.push({ point, kind: 'captured' }))
  const goals = { group: '点出你觉得有危险的一块黑棋。', liberty: '点出这整块黑棋最后的一口气。', move: '点空点试下，比较变化，再确认这一步。', eyes: '依次点出两个内部空点，替白棋试一试。', reason: '为什么白棋下不进这两个眼？', done: run.assisted ? '跟着演示完成。可以重来一次，自己找答案。' : run.hint > (scene.guided ? 1 : 0) ? '借助提示完成。可以重来一次，不看提示试试。' : '完成了。看懂原因，再继续下一题。' }
  function demo(which: 'ignore' | 'escape') {
    const p = which === 'ignore' ? scene.wrongMove! : scene.examples[0]
    onChange({ ...run, preview: analyzeAction(run.game, p), view: which === 'ignore' ? 'reply' : 'after',
      message: which === 'ignore' ? '去远处落子没有增加目标黑棋的气。白棋占住最后的 A，整块就被提走。' : '把棋接向空处后，再数一数整块的气。眼前的危险暂时解除了。' })
  }
  return <section className="page page--with-board">
    <div>
      <p className="figure-number">第 {scene.course} 课 / {scene.guided ? '一起练习' : '自己试试'}</p>
      <Board board={shown.board} marks={marks} lastMove={last?.kind === 'play' ? last.point : null}
        disabled={run.view === 'reply' || run.view.startsWith('contrast') || run.stage === 'done' || run.stage === 'reason'}
        ghostColor={run.stage === 'move' ? 'black' : null} onPointClick={(p) => onChange(choosePracticePoint(run, p))} />
      <p className="board-caption">{run.view === 'reply' ? '演示：白棋可能这样应对' : run.view === 'contrast-before' ? '对照：这块棋只剩一个眼，没有外气' : run.view === 'contrast' ? '对照：白棋填最后一气，黑棋被提走' : run.preview?.ok && run.view === 'after' ? '试下中 · 从题目起点观察后果' : scene.kind === 'eyes' ? '这一步暂时替白棋试下' : '9 路练习 · 你执黑'}</p>
      <p className="board-caption">棋子上的圈：目标棋块 · 空心圈：气 · 虚线：试下</p>
    </div>
    <div className="panel">
      <p className="eyebrow">保住自己的棋 / 第 {scene.course} 课 · {scene.guided ? '一起练习' : '自己试试'}</p>
      <h2>{scene.title}</h2><p className="muted">{scene.intro}</p>
      <p className="turn">{goals[run.stage]}</p>
      {run.message && <p className="message message--hint" role="status">{run.message}</p>}
      {reveal && target && <p className="small">目标棋块：{target.stones.length} 颗棋，{target.liberties.length} 口气。</p>}
      {run.preview?.ok && <div className="actions">
        <button className="button button--ghost" onClick={() => onChange({ ...run, view: 'before' })}>下之前</button>
        <button className="button button--ghost" onClick={() => onChange({ ...run, view: 'after' })}>下之后</button>
        {run.preview.dangers.length > 0 && <button className="button button--ghost" onClick={() => onChange({ ...run, view: 'reply' })}>看白棋怎样提</button>}
        {run.stage === 'move' && run.view !== 'reply' && <button className="button" onClick={() => onChange(confirmPractice(run))}>确认这一步</button>}
        {run.stage === 'move' && <button className="text-button" onClick={() => onChange({ ...run, preview: null, view: 'before', message: null })}>重新选点</button>}
      </div>}
      {scene.kind === 'danger' && run.stage === 'done' && <div className="actions"><button className="button button--ghost" onClick={() => demo('ignore')}>如果去远处下</button><button className="button button--ghost" onClick={() => demo('escape')}>如果接向空处</button></div>}
      {scene.contrastRows && (run.stage === 'reason' || run.stage === 'done') && <div className="actions">
        <button className="button button--ghost" onClick={() => onChange({ ...run, view: 'contrast-before' })}>只剩一个眼时</button>
        <button className="button button--ghost" onClick={() => onChange({ ...run, view: 'contrast' })}>白棋填最后一气</button>
        <button className="text-button" onClick={() => onChange({ ...run, view: 'before' })}>回到两眼原图</button>
      </div>}
      {run.stage === 'reason' && <div className="reason-choices">
        <button className="button button--ghost" onClick={() => onChange(chooseReason(run, false))}>因为黑棋比白棋多</button>
        <button className="button button--ghost" onClick={() => onChange(chooseReason(run, true))}>白棋一次只能填一个，另一个还在</button>
      </div>}
      {run.stage !== 'done' && run.hint < 3 && <button className="text-button hint-button" onClick={() => onChange(practiceHint(run))}>{['提醒我看哪里', '标出相关棋块和气', '演示一种做法'][run.hint]}</button>}
      {run.stage === 'done' && <button className="button next-lesson" onClick={onNext}>{isLast ? '开始我的陪练' : scene.guided ? '换个局面自己试试' : '下一课'}</button>}
      <div className="restart"><button className="text-button" onClick={() => onChange(startSurvival(scene))}>重来这一题</button></div>
      {scene.kind === 'escape' && scene.guided && run.solved.length > 0 && run.stage !== 'done' && <p className="small">已比较 {run.solved.length} 种办法。再试另一种：伸出或提子。</p>}
    </div>
  </section>
}
