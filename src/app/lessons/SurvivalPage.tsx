import { awaitingConfirm, survivalSteps } from './survivalSteps'
import { GuidedDangerPage } from './GuidedDangerPage'
import { LessonFeedback } from './LessonFeedback'
import { Board } from '../board/Board'
import { briefExplanation } from '../coaching/briefExplanation'
import { BoardLayout } from '../board/BoardLayout'
import type { BoardMark } from '../board/marks'
import { analyzeAction, analyzePosition } from '../coaching/analysis'
import { groupMarks } from '../coaching/explanations'
import { choosePracticePoint, chooseReason, confirmPractice, practiceBoard, practiceHint, startSurvival } from './survivalRunner'
import type { SurvivalRun } from './survivalRunner'

import type { PracticeLabels } from './practiceCatalog'

interface Props { readonly practice?: PracticeLabels; readonly nextLabel?: string; readonly run: SurvivalRun; readonly onChange: (run: SurvivalRun) => void; readonly onNext: () => void; readonly isLast: boolean; readonly onRuleSequence?: () => void; readonly onNextChapter?: () => void }
export function SurvivalPage({ run, onChange, onNext, isLast, onRuleSequence, onNextChapter, nextLabel, practice }: Props) {
  const { scene } = run
  if (scene.id === 'danger-guided') return <GuidedDangerPage run={run} onChange={onChange} onNext={onNext} />
  const shown = practiceBoard(run)
  const reveal = run.hint >= 2 || run.stage === 'done' || run.stage === 'liberty' || run.stage === 'reason' || run.preview?.ok
  const target = analyzePosition(shown).find((g) => g.stones.some((p) => p.x === scene.target.x && p.y === scene.target.y))
  const marks: BoardMark[] = reveal ? groupMarks(target) : []
  if (scene.kind === 'eyes' && !run.view.startsWith('contrast') && (reveal || scene.guided)) scene.eyes!.forEach((point, index) => marks.push({ point, kind: 'label', text: index === 0 ? 'A' : 'B' }))
  run.selected.forEach((point) => { if (shown.board.cells[point.y * 9 + point.x] === null) marks.push({ point, kind: 'selected' }) })
  if (run.preview?.ok && run.preview.point && run.view === 'after') marks.push({ point: run.preview.point, kind: 'preview' })
  const last = shown.history.at(-1)
  if (last?.kind === 'play') last.captured.forEach((point) => marks.push({ point, kind: 'captured' }))
  function demo(which: 'ignore' | 'escape') {
    const p = which === 'ignore' ? scene.wrongMove! : scene.examples[0]
    onChange({ ...run, preview: analyzeAction(run.game, p), view: which === 'ignore' ? 'reply' : 'after',
      message: which === 'ignore' ? '去远处落子没有增加目标黑棋的气。白棋占住最后的 A，整块就被提走。' : '把棋接向空处后，再数一数整块的气。眼前的危险暂时解除了。' })
  }
  const step = survivalSteps(run)
  const done = run.stage === 'done'
  const restart = <div className="restart"><button className="text-button" onClick={() => onChange(startSurvival(scene))}>重来这一题</button></div>
  const dangerCompare = scene.kind === 'danger' && done
  const eyesCompare = !!scene.contrastRows && (run.stage === 'reason' || done)
  return <BoardLayout key={scene.id}
      feedback={run.message && <LessonFeedback message={run.message} />}
      heading={<>
        <p className="eyebrow">{practice?.eyebrow ?? `第 ${scene.course} 课 · ${scene.guided ? '一起练习' : '自己试试'}`}</p>
        <h2>{scene.title}</h2>
        <div className="step-task">
          <p className="step-label">{step.done ? step.label : `第 ${step.current} 步 / 共 ${step.total} 步 · ${step.label}`}</p>
          {step.progress && <p className="step-progress">{step.progress}</p>}
          {step.task && <p className="turn">{step.task}</p>}
        </div>
      </>}
      board={<>
      {practice && <p className="figure-number">{practice.figure}</p>}
      <Board board={shown.board} marks={marks} lastMove={last?.kind === 'play' ? last.point : null}
        disabled={run.view === 'reply' || run.view.startsWith('contrast') || run.stage === 'done' || run.stage === 'reason'}
        ghostColor={run.stage === 'move' ? 'black' : null} onPointClick={(p) => onChange(choosePracticePoint(run, p))} />
      <p className="board-caption">{run.view === 'reply' ? '演示：白棋可能这样应对' : run.view === 'contrast-before' ? '对照：这块棋只剩一个眼，没有外气' : run.view === 'contrast' ? '对照：白棋填最后一气，黑棋被提走' : run.preview?.ok && run.view === 'after' ? '试下中 · 从题目起点观察后果' : scene.kind === 'eyes' ? '这一步暂时替白棋试下' : '9 路练习 · 你执黑'}</p>
    </>}
      primary={<>
        {!run.message && !run.preview && !done && <p className="step-intro">{scene.intro}</p>}
        {run.preview && <>{(!run.message || run.view === 'reply') && <p className="board-brief">{run.view === 'reply' ? '演示：白棋能占住最后一气，提走危险黑棋。' : briefExplanation(run.preview)}</p>}{run.preview.ok && <>
          {awaitingConfirm(run) && run.view !== 'reply' && <div className="actions"><button className="button" onClick={() => onChange(confirmPractice(run))}>确认这一步</button></div>}
          <div className="actions">
          <button className="button button--ghost" onClick={() => onChange({ ...run, view: 'before' })}>下之前</button>
          <button className="button button--ghost" onClick={() => onChange({ ...run, view: 'after' })}>下之后</button>
          {run.preview.dangers.length > 0 && <button className="button button--ghost" onClick={() => onChange({ ...run, view: 'reply' })}>看白棋怎样提</button>}
          {run.stage === 'move' && <button className="text-button" onClick={() => onChange({ ...run, preview: null, view: 'before', message: null })}>重新选点</button>}
          </div>
        </>}</>}
        {run.stage === 'reason' && <div className="reason-choices">
          <button className="button button--ghost" onClick={() => onChange(chooseReason(run, false))}>因为黑棋比白棋多</button>
          <button className="button button--ghost" onClick={() => onChange(chooseReason(run, true))}>白棋一次只能填一个，另一个还在</button>
        </div>}
        {!done && run.hint < 3 && <button className="text-button hint-button" onClick={() => onChange(practiceHint(run))}>{['提醒我看哪里', '标出相关棋块和气', '演示一种做法'][run.hint]}</button>}
        {done && <div className="actions next-lesson">{isLast && onNextChapter && nextLabel !== undefined
          ? <><button className="button" onClick={onNextChapter}>{nextLabel}</button><button className="button button--ghost" onClick={onNext}>开始我的陪练</button></>
          : <button className="button" onClick={onNext}>{nextLabel ?? (isLast ? '开始我的陪练' : scene.guided ? '换个局面，自己试试 →' : '下一课 →')}</button>}</div>}
        {(dangerCompare || eyesCompare) && <details className="step-compare" key={run.stage}><summary>看看对照</summary>
          {dangerCompare && <div className="actions"><button className="button button--ghost" onClick={() => demo('ignore')}>如果去远处下</button><button className="button button--ghost" onClick={() => demo('escape')}>如果接向空处</button></div>}
          {eyesCompare && <div className="actions">
            <button className="button button--ghost" onClick={() => onChange({ ...run, view: 'contrast-before' })}>只剩一个眼时</button>
            <button className="button button--ghost" onClick={() => onChange({ ...run, view: 'contrast' })}>白棋填最后一气</button>
            <button className="text-button" onClick={() => onChange({ ...run, view: 'before' })}>回到两眼原图</button>
          </div>}
        </details>}
        {done && restart}
      </>}
    >
      <details className="step-notes"><summary>讲解与图例</summary>
        <p className="muted">{scene.intro}</p>
        <p className="small">棋子上的圈：目标棋块 · 空心圈：气 · 虚线：试下</p>
        {reveal && target && <p className="small">目标棋块：{target.stones.length} 颗棋，{target.liberties.length} 口气。</p>}
        {scene.kind === 'eyes' && onRuleSequence && <button className="text-button" onClick={onRuleSequence}>分步看：为什么不算自杀？</button>}
      </details>
      {!done && restart}
    </BoardLayout>
}
