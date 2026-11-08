import { useLayoutEffect } from 'react'
import { LESSONS } from '../../content/lessons'
import { SURVIVAL_SCENES } from '../../content/survival'
import type { LearningSession } from './learningSession'
import { openLearningUnit } from './learningSession'
import { COMPLETION_LABELS, currentLearningUnit, LEARNING_UNITS } from './learningProgress'
import { LearningLink, LearningProgressPanel } from './LearningProgressPanel'
import { startLesson } from './lessonRunner'
import { LessonPage } from './LessonPage'
import { SurvivalPage } from './SurvivalPage'
import { RoomIllustration } from './RoomIllustration'
import { ENDGAME_LESSONS } from '../../content/endgame'
import { EndgamePage } from './EndgamePage'
import { RuleSequencePage } from './RuleSequencePage'
import { STRATEGY_LESSONS } from '../../content/strategy'
import { StrategyPage } from './StrategyPage'
import { WalkthroughPage } from './WalkthroughPage'
import { IndependentPage } from './IndependentPage'

interface Props { readonly session: LearningSession; readonly onChange: (next: LearningSession) => void; readonly onPlay: () => void; readonly onClear?: () => void; readonly storageMessage?: string | null }
export function LearningPage({ session, onChange, onPlay, onClear, storageMessage }: Props) {
  const completed = session.progress.completed
  const currentUnit = currentLearningUnit(session)
  const recorded = currentUnit ? completed[currentUnit.id] : undefined
  useLayoutEffect(() => { document.documentElement.scrollTop = 0; document.body.scrollTop = 0 }, [currentUnit?.id])
  const openScene = (sceneIndex: number) => onChange({ ...session, page: 'survival', sceneIndex })
  const openSequence = () => onChange({ ...session, page: 'rule-sequence' })
  const openEndgame = (endgameIndex: number) => onChange({ ...session, page: 'endgame', endgameIndex })
  const openStrategy = (strategyIndex: number) => onChange({ ...session, page: 'strategy', strategyIndex })
  const openWalk = () => onChange({ ...session, page: 'walkthrough' })
  const openIndependent = (independentIndex: number) => onChange({ ...session, page: 'independent', independentIndex })
  const independentDone = (index: number) => session.independentRuns[index].stage === 'done' || !!completed[`independent/${session.independentRuns[index].scene.id}`]
  const allIndependentDone = session.independentRuns.every((_, index) => independentDone(index))
  if (session.page === 'home') return <>
    {storageMessage && <p className="message message--hint" role="alert">{storageMessage}</p>}
    <section className="learning-home">
    <div className="edition-line"><span>入门手记 · 第一册</span><span lang="en">OBSERVE / TRY / UNDERSTAND</span><span>从一口气开始</span></div>
    <div className="learning-hero">
      <div className="learning-hero__copy">
        <p className="eyebrow">写给第一次拿起棋子的你</p>
        <h2>黑白之间，<br />慢慢<span>看懂。</span></h2>
        <div className="hero-intro"><span className="vertical-note" aria-hidden="true">学棋，不必着急</span><p>一颗棋为什么会被吃？<br />哪一步可以救回它？<br />从一个小局面，读懂棋盘上的因果。</p></div>
        <button className="button hero-button" onClick={() => onChange({ ...session, page: 'rules', rules: { index: 0, run: startLesson(LESSONS[0]) } })}>从第一课开始<span aria-hidden="true">↗</span></button>
        <button className="text-button hero-practice" onClick={() => openScene(0)}>先试一道生存练习</button>
      </div>
      <RoomIllustration />
    </div>
    <LearningProgressPanel progress={session.progress} onContinue={(unit) => onChange(openLearningUnit(session, unit))} onClear={onClear} />
    <div className="learning-contents">
      <div className="contents-heading"><span className="eyebrow" lang="en">CONTENTS</span><h3>循序入门</h3><p>每一章，<br />解决一个小困惑。</p><span className="book-seal" aria-hidden="true">弈</span></div>
      <div className="chapter-list">
        <article className="chapter">
          <header className="chapter-heading"><span className="chapter-number" aria-hidden="true">壹</span><div><h3>认识规则</h3><p>落子、气、提子、禁入点和劫。</p></div><span className="chapter-count">五关</span></header>
          <div className="lesson-list">{LESSONS.map((lesson, index) => <LearningLink key={lesson.id} label={lesson.title} mode={completed[`rules/${lesson.id}`]} onClick={() => onChange({ ...session, page: 'rules', rules: session.rules.index === index ? session.rules : { index, run: startLesson(lesson) } })} />)}</div>
          <button className="text-button chapter-supplement" onClick={openSequence}>规则慢镜头：落子后先提谁？</button>
          <details className="lesson-details"><summary>两个慢镜头的学习记录</summary><div className="lesson-list">{LEARNING_UNITS.filter((unit) => unit.page === 'rule-sequence').map((unit) => <LearningLink key={unit.id} label={unit.title} mode={completed[unit.id]} onClick={() => onChange(openLearningUnit(session, unit))} />)}</div></details>
        </article>
        <article className="chapter">
          <header className="chapter-heading"><span className="chapter-number" aria-hidden="true">贰</span><div><h3>保住自己的棋</h3><p>四课八个局面。观察、试下、比较原因。</p></div><span className="chapter-count">四课</span></header>
          <div className="lesson-list">{SURVIVAL_SCENES.map((scene, index) => <LearningLink key={scene.id} label={scene.guided ? `${scene.course}. ${scene.title}` : `自己试试：${scene.title}`} mode={completed[`survival/${scene.id}`]} onClick={() => openScene(index)} />)}</div>
        </article>
        <article className="chapter">
          <header className="chapter-heading"><span className="chapter-number" aria-hidden="true">叁</span><div><h3>围地与终局</h3><p>判断空点归属，自己数分，再走完终局。</p></div><span className="chapter-count">四课</span></header>
          <div className="lesson-list">{ENDGAME_LESSONS.map((lesson, index) => <LearningLink key={lesson.id} label={`${index + 1}. ${lesson.title}`} mode={completed[`endgame/${lesson.id}`]} onClick={() => openEndgame(index)} />)}</div>
        </article>
        <article className="chapter">
          <header className="chapter-heading"><span className="chapter-number" aria-hidden="true">肆</span><div><h3>九路策略入门</h3><p>先顾危险，再想围地；比较走法，理解取舍。</p></div><span className="chapter-count">三课</span></header>
          <div className="lesson-list">{STRATEGY_LESSONS.map((lesson, index) => <LearningLink key={lesson.id} label={`${index + 1}. ${lesson.title}`} mode={completed[`strategy/${lesson.id}`]} onClick={() => openStrategy(index)} />)}</div>
        </article>
        <article className="chapter">
          <header className="chapter-heading"><span className="chapter-number" aria-hidden="true">伍</span><div><h3>从看懂到自己下</h3><p>走完一盘九路，再换没有标记的棋形自己判断。</p></div><span className="chapter-count">一盘 · 六题</span></header>
          <div className="lesson-list"><LearningLink label="一盘九路，从头到尾" mode={completed['walkthrough/full-game']} onClick={openWalk} /><LearningLink label="换个棋形，自己判断" onClick={() => openIndependent(session.independentIndex)} /></div>
          <details className="lesson-details"><summary>六道独立练习 · 已完成 {session.independentRuns.filter((_, index) => independentDone(index)).length} / 6</summary><div className="lesson-list">{LEARNING_UNITS.filter((unit) => unit.page === 'independent').map((unit) => <LearningLink key={unit.id} label={unit.title} mode={completed[unit.id]} onClick={() => openIndependent(unit.index)} />)}</div></details>
        </article>
        <article className="chapter practice-invitation">
          <header className="chapter-heading"><span className="chapter-number" aria-hidden="true">陆</span><div><h3>有提示的陪练</h3><p>每手先试下，看懂提示后再确认；也可以退回重试。</p></div><span className="chapter-count">一盘</span></header>
          <button className="button button--ghost" onClick={onPlay}>直接开始陪练<span aria-hidden="true">↗</span></button>
        </article>
      </div>
    </div>
    <div className="learning-note"><p className="learning-quote">先理解一手棋，<br />再慢慢理解一盘棋。</p><p>最后比较活着的棋子和围住的空点，<br />吃子只是办法之一。</p></div>
    <p className="muted small archive-note">切换页面保留当前练习和对局。课程完成记录与学习位置保存在此浏览器；刷新后题目从头开始，进行中的对局不保留，已完成棋谱仍可复盘。</p>
  </section></>
  return <>
    {storageMessage && <p className="message message--hint" role="alert">{storageMessage}</p>}
    <div className="learning-toolbar"><button className="text-button" onClick={() => onChange({ ...session, page: 'home' })}>返回章节</button><button className="text-button" onClick={onPlay}>直接开始陪练</button></div>

    {session.page === 'rules' && <LessonPage lessons={LESSONS} progress={session.rules} completedIds={LESSONS.filter((lesson) => completed[`rules/${lesson.id}`]).map((lesson) => lesson.id)} onProgress={(rules) => onChange({ ...session, rules })} onFinish={onPlay} onSurvival={() => openScene(0)} onRuleSequence={openSequence} />}
    {session.page === 'rule-sequence' && <RuleSequencePage run={session.sequence} completedSceneIds={LEARNING_UNITS.filter((unit) => unit.page === 'rule-sequence' && completed[unit.id]).map((unit) => unit.id.slice('rule-sequence/'.length))} onChange={(sequence) => onChange({ ...session, sequence })} onScoring={() => openEndgame(0)} />}
    {session.page === 'endgame' && <><EndgamePage run={session.endgameRuns[session.endgameIndex]} onChange={(run) => onChange({ ...session, endgameRuns: session.endgameRuns.map((old, index) => index === session.endgameIndex ? run : old) })} isLast={session.endgameIndex === ENDGAME_LESSONS.length - 1} onNext={() => session.endgameIndex === ENDGAME_LESSONS.length - 1 ? onPlay() : openEndgame(session.endgameIndex + 1)} onStrategy={() => openStrategy(0)} />
      <div className="learning-toolbar archive-note">{session.endgameIndex > 0 && <button className="text-button" onClick={() => openEndgame(session.endgameIndex - 1)}>回看上一课</button>}<button className="text-button" onClick={() => session.endgameIndex === ENDGAME_LESSONS.length - 1 ? onPlay() : openEndgame(session.endgameIndex + 1)}>先跳过这一课</button></div></>}
    {session.page === 'strategy' && <><StrategyPage run={session.strategyRuns[session.strategyIndex]} onChange={(run) => onChange({ ...session, strategyRuns: session.strategyRuns.map((old, index) => index === session.strategyIndex ? run : old) })} isLast={session.strategyIndex === STRATEGY_LESSONS.length - 1} onNext={() => session.strategyIndex === STRATEGY_LESSONS.length - 1 ? onPlay() : openStrategy(session.strategyIndex + 1)} onWalk={openWalk} />
      <div className="learning-toolbar archive-note">{session.strategyIndex > 0 && <button className="text-button" onClick={() => openStrategy(session.strategyIndex - 1)}>回看上一课</button>}<button className="text-button" onClick={() => session.strategyIndex === STRATEGY_LESSONS.length - 1 ? onPlay() : openStrategy(session.strategyIndex + 1)}>先跳过这一课</button></div></>}
    {session.page === 'walkthrough' && <WalkthroughPage run={session.walk} onChange={(walk) => onChange({ ...session, walk })} onPractice={() => openIndependent(0)} />}
    {session.page === 'independent' && <><IndependentPage run={session.independentRuns[session.independentIndex]} index={session.independentIndex} allDone={allIndependentDone} onChange={(run) => onChange({ ...session, independentRuns: session.independentRuns.map((old, index) => index === session.independentIndex ? run : old) })} onNext={() => allIndependentDone ? onPlay() : openIndependent(session.independentIndex < 5 ? session.independentIndex + 1 : session.independentRuns.findIndex((_, index) => !independentDone(index)))} /><div className="independent-index" aria-label="独立练习题目">{session.independentRuns.map((run, index) => <button key={run.scene.id} className="button button--ghost" aria-pressed={index === session.independentIndex} onClick={() => openIndependent(index)}>第 {index + 1} 题{completed[`independent/${run.scene.id}`] ? ` · ${COMPLETION_LABELS[completed[`independent/${run.scene.id}`]]}` : run.stage === 'done' ? run.help > 0 ? ' · 用过提示' : ' · 已完成' : ''}</button>)}</div></>}
    {session.page === 'survival' && <><SurvivalPage run={session.runs[session.sceneIndex]} onChange={(run) => onChange({ ...session, runs: session.runs.map((r, i) => i === session.sceneIndex ? run : r) })} onRuleSequence={openSequence} onScoring={() => openEndgame(0)}
        isLast={session.sceneIndex === 7} onNext={() => session.sceneIndex === 7 ? onPlay() : openScene(session.sceneIndex + 1)} />
      <div className="learning-toolbar archive-note">
        {session.sceneIndex > 0 && <button className="text-button" onClick={() => openScene(session.sceneIndex - 1)}>回看上一题</button>}
        <button className="text-button" onClick={() => session.sceneIndex === 7 ? onPlay() : openScene(session.sceneIndex + 1)}>先跳过这一题</button>
      </div></>}
    {recorded && <p className="completion-note learning-recorded" aria-label="已记录的学习结果">已有记录：{COMPLETION_LABELS[recorded]}。可以再练一次；保留最好的一次记录。</p>}
  </>
}
