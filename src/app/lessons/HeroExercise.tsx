import { useState } from 'react'
import { Board } from '../board/Board'
import { chooseHeroPoint, heroBoard, heroLiberties, heroMarks, startHero } from './heroRunner'
import type { HeroRun } from './heroRunner'

const COUNT = ['零', '一', '两', '三', '四', '五']

interface Props { readonly onStart: () => void; readonly onSurvival: () => void }

/** 首页可以直接点的「一子一气」：棋盘在墨圈里，结果就地写在旁边，不必跳页。 */
export function HeroExercise({ onStart, onSurvival }: Props) {
  const [run, setRun] = useState<HeroRun>(startHero)
  const liberties = heroLiberties(run)
  const count = liberties ? COUNT[liberties.length] ?? String(liberties.length) : '零'
  const reset = () => setRun(startHero())

  let feedback: { tone: 'good' | 'warn' | 'bad'; title: string; body: string; note?: string; actions: readonly [string, () => void, boolean?][]; next: [string, () => void] } | null = null
  if (run.choice === 'a') feedback = run.view === 'before'
    ? { tone: 'good', title: '下之前：只有一口气', body: '这是落子前的样子：A 是带圈黑棋唯一的出路。', actions: [['看下之后', () => setRun({ ...run, view: 'after' })], ['再练一次', reset, true]], next: ['接着学：保住自己的棋', onSurvival] }
    : { tone: 'good', title: `接上了，${count}口气！`, body: `黑棋接在 A，两颗棋连成一块，共用${count}口气。白棋一手提不掉，暂时脱离了叫吃。`, note: '要点：被围住时，先往能增加气的方向走。', actions: [['对照下之前', () => setRun({ ...run, view: 'before' })], ['再练一次', reset, true]], next: ['接着学：保住自己的棋', onSurvival] }
  if (run.choice === 'b') feedback = run.view === 'reply'
    ? { tone: 'bad', title: '白棋占 A，黑棋被提走', body: '白棋下在 A，带圈黑棋最后一口气被堵上，从棋盘上拿走。远处那一手没帮上忙。', note: '换到 A 试试，看看气会怎么变。', actions: [['换到 A 再试', () => setRun(chooseHeroPoint(run, { x: 4, y: 5 })), true], ['重新选点', reset]], next: ['从第一课开始', onStart] }
    : { tone: 'warn', title: `还是只有${count}口气`, body: 'B 离目标太远，没有给带圈黑棋增加任何气。轮到白棋，它会怎么下？', actions: [['看白棋应对', () => setRun({ ...run, view: 'reply' }), true], ['重新选点', reset]], next: ['从第一课开始', onStart] }

  return <>
    <figure className="ink-hero__board">
      <svg className="ink-enso" viewBox="0 0 400 400" aria-hidden="true" focusable="false">
        <defs><filter id="ink-enso-brush"><feTurbulence type="fractalNoise" baseFrequency=".04" numOctaves="3" /><feDisplacementMap in="SourceGraphic" scale="9" /></filter></defs>
        <path filter="url(#ink-enso-brush)" d="M205 28C110 22 34 96 30 196c-4 104 76 178 172 176 98-2 168-80 166-176-1-60-30-112-74-142" />
      </svg>
      <Board board={heroBoard(run)} marks={heroMarks(run)} ghostColor={run.choice ? null : 'black'} onPointClick={(point) => setRun(chooseHeroPoint(run, point))} />
    </figure>
    <div className="ink-hero__copy" aria-live="polite">
      {feedback ? <>
        <div className={`ink-feedback ink-feedback--${feedback.tone}`} key={`${run.choice}-${run.view}`}>
          <p className="ink-feedback__title">{feedback.title}</p>
          <p>{feedback.body}</p>
          {feedback.note && <p className="ink-note">{feedback.note}</p>}
        </div>
        <div className="actions">{feedback.actions.map(([label, action, primary]) => <button key={label} className={primary ? 'button' : 'button button--ghost'} onClick={action}>{label}</button>)}</div>
        <button className="text-button" onClick={feedback.next[1]}>{feedback.next[0]} →</button>
      </> : <>
        <p className="ink-hero__lede">棋子靠身边的空点呼吸。<br />看见它还剩几口气，<br />你就看懂了围棋的第一课。</p>
        <p className="ink-hero__try">现在就试：点棋盘上的 <b>A</b> 或 <b>B</b>，救中间那颗黑棋。</p>
        {run.hint && <p className="ink-note">提示：数一数带圈黑棋旁边还空着的交叉点。气只算上下左右紧挨着的空点。</p>}
        {run.notice && <p className="ink-note">{run.notice}</p>}
        <div className="actions"><button className="button button--ghost" onClick={() => setRun({ ...run, hint: !run.hint })}>{run.hint ? '收起提示' : '给我一点提示'}</button></div>
        <button className="text-button" onClick={onStart}>从第一课开始</button>
      </>}
    </div>
  </>
}
