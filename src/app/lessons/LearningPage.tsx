import { useLayoutEffect, useRef } from 'react'
import { LESSONS } from '../../content/lessons'
import { CAPTURE_SCENES } from '../../content/capture'
import { CapturePage } from './CapturePage'
import { SURVIVAL_SCENES } from '../../content/survival'
import type { LearningSession } from './learningSession'
import { openLearningUnit } from './learningSession'
import { COMPLETION_LABELS, COURSE_PROGRESS_UNITS, continueLearningUnit, currentLearningUnit, LEARNING_UNITS } from './learningProgress'
import { LearningProgressPanel } from './LearningProgressPanel'
import { startLesson } from './lessonRunner'
import { LessonPage } from './LessonPage'
import { SurvivalPage } from './SurvivalPage'
import { HeroExercise } from './HeroExercise'
import { VolumeContents } from './VolumeContents'
import { VolumeIndex } from './VolumeIndex'
import { COURSE_VOLUMES, homeVolume, volumeFor } from './courseVolumes'
import { ScrollContents } from './ScrollContents'
import type { PracticeItem } from './practiceCatalog'
import type { ScrollChapter } from './ScrollContents'
import { ENDGAME_LESSONS } from '../../content/endgame'
import { EndgamePage } from './EndgamePage'
import { RuleSequencePage } from './RuleSequencePage'
import { STRATEGY_LESSONS } from '../../content/strategy'
import { StrategyPage } from './StrategyPage'
import { WalkthroughPage } from './WalkthroughPage'
import { IndependentPage } from './IndependentPage'

interface Props {
  readonly catalogVisit?: number
  readonly onPractice: (item: PracticeItem | null) => void
  readonly session: LearningSession
  readonly onChange: (next: LearningSession) => void
  readonly onPlay: () => void
  readonly onClear?: () => void
  readonly storageMessage?: string | null
}
export function LearningPage({ onPractice, catalogVisit, session, onChange, onPlay, onClear, storageMessage }: Props) {
  const completed = session.progress.completed
  const currentUnit = currentLearningUnit(session)
  const returningToCatalog = useRef(false)
  useLayoutEffect(() => {
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    if (returningToCatalog.current && session.page === 'home') {
      returningToCatalog.current = false
      document.getElementById('course-catalog-heading')?.focus()
    }
  }, [currentUnit?.id, session.page])
  const openScene = (sceneIndex: number) => onChange({ ...session, page: 'survival', sceneIndex })
  const openCapture = (captureIndex: number) => onChange({ ...session, page: 'capture', captureIndex })
  const survivalLast = session.sceneIndex === SURVIVAL_SCENES.length - 1
  const capture = session.captureRuns[session.captureIndex]
  const survival = SURVIVAL_SCENES[session.sceneIndex]
  const nextSurvival = SURVIVAL_SCENES.findIndex(scene => scene.guided && scene.course === survival.course + 1)
  const advanceSurvival = () => nextSurvival < 0 ? openCapture(0) : openScene(nextSurvival)
  const nextCapture = CAPTURE_SCENES.findIndex(scene => scene.guided && scene.lesson === capture.scene.lesson + 1)
  const openSequence = () => onChange({ ...session, page: 'rule-sequence', sequenceReturnTo: session.page === 'survival' ? 'survival' : 'rules' })
  const returnFromSequence = () => {
    if (session.sequenceReturnTo === 'survival') openScene(session.sceneIndex)
    else onChange(openLearningUnit(session, LEARNING_UNITS.find(unit => unit.id === 'rules/suicide')!))
  }
  const openEndgame = (endgameIndex: number) => onChange({ ...session, page: 'endgame', endgameIndex })
  const openStrategy = (strategyIndex: number) => onChange({ ...session, page: 'strategy', strategyIndex })
  const openWalk = () => onChange({ ...session, page: 'walkthrough' })
  const openIndependent = (independentIndex: number) => onChange({ ...session, page: 'independent', independentIndex })
  const independentDone = (index: number) => session.independentRuns[index].stage === 'done' || !!completed[`independent/${session.independentRuns[index].scene.id}`]
  const allIndependentDone = session.independentRuns.every((_, index) => independentDone(index))
  if (session.page === 'home') {
    const next = continueLearningUnit(session.progress)
    const allDone = COURSE_PROGRESS_UNITS.every((unit) => completed[unit.id])
    const startRules = () => onChange({ ...session, page: 'rules', rules: { index: 0, run: startLesson(LESSONS[0]) } })
    const current = next ? COURSE_VOLUMES.indexOf(volumeFor(next)) : 0
    const chapters: ScrollChapter[] = COURSE_VOLUMES.map(homeVolume).map(volume => {
      const entries = volume.groups.flatMap(group => group.entries)
      return {
        number: volume.number, title: volume.title, count: volume.count,
        done: [entries.filter(({ unit }) => completed[unit.id]).length, entries.length],
        content: <VolumeIndex volume={volume} currentId={allDone ? undefined : next?.id} completed={completed}
          onSelect={unit => onChange(openLearningUnit(session, unit))} />,
      }
    })
    return <>
      {storageMessage && <p className="message message--hint" role="alert">{storageMessage}</p>}
      <section className="learning-home">
        <div className="ink-hero">
          <div className="ink-hero__title"><h2>一子一气</h2><p>写给第一次拿起棋子的人</p></div>
          <HeroExercise onStart={startRules} onSurvival={() => openScene(0)} />
        </div>
        <ScrollContents key={catalogVisit} onPractice={onPractice} completed={completed} chapters={chapters} initialOpen={current} onPlay={onPlay} />
        <LearningProgressPanel progress={session.progress} onContinue={(unit) => onChange(openLearningUnit(session, unit))} onClear={onClear} />
        <p className="muted small archive-note">切换页面保留当前练习和对局。课程完成记录与学习位置保存在此浏览器；刷新后题目从头开始，进行中的对局不保留，已完成棋谱仍可复盘。</p>
      </section>
    </>
  }
  return <>
    {storageMessage && <p className="message message--hint" role="alert">{storageMessage}</p>}
    {currentUnit && <VolumeContents volume={volumeFor(currentUnit)} currentId={currentUnit.id} onPlay={onPlay}
      onSelect={unit => onChange(openLearningUnit(session, unit))}
      onCatalog={() => { returningToCatalog.current = true; onChange({ ...session, page: 'home' }) }} />}

    {session.page === 'rules' && <LessonPage lessons={LESSONS} progress={session.rules} completedIds={LESSONS.filter((lesson) => completed[`rules/${lesson.id}`]).map((lesson) => lesson.id)} onProgress={(rules) => onChange({ ...session, rules })} onFinish={onPlay} onSurvival={() => openScene(0)} onRuleSequence={openSequence} />}
    {session.page === 'rule-sequence' && <RuleSequencePage run={session.sequence} completedSceneIds={LEARNING_UNITS.filter((unit) => unit.page === 'rule-sequence' && completed[unit.id]).map((unit) => unit.id.slice('rule-sequence/'.length))} onChange={(sequence) => onChange({ ...session, sequence })} onReturn={returnFromSequence} returnLabel={session.sequenceReturnTo === 'survival' ? '返回两眼课' : '返回第 4 课 · 禁入点'} />}
    {session.page === 'endgame' && <><EndgamePage run={session.endgameRuns[session.endgameIndex]} onChange={(run) => onChange({ ...session, endgameRuns: session.endgameRuns.map((old, index) => index === session.endgameIndex ? run : old) })} isLast={session.endgameIndex === ENDGAME_LESSONS.length - 1} onNext={() => session.endgameIndex === ENDGAME_LESSONS.length - 1 ? onPlay() : openEndgame(session.endgameIndex + 1)} onStrategy={() => openStrategy(0)} />
      <div className="learning-toolbar archive-note">{session.endgameIndex > 0 && <button className="text-button" onClick={() => openEndgame(session.endgameIndex - 1)}>回看上一课</button>}<button className="text-button" onClick={() => session.endgameIndex === ENDGAME_LESSONS.length - 1 ? onPlay() : openEndgame(session.endgameIndex + 1)}>先跳过这一课</button></div></>}
    {session.page === 'strategy' && <><StrategyPage run={session.strategyRuns[session.strategyIndex]} onChange={(run) => onChange({ ...session, strategyRuns: session.strategyRuns.map((old, index) => index === session.strategyIndex ? run : old) })} isLast={session.strategyIndex === STRATEGY_LESSONS.length - 1} onNext={() => session.strategyIndex === STRATEGY_LESSONS.length - 1 ? onPlay() : openStrategy(session.strategyIndex + 1)} onWalk={openWalk} />
      <div className="learning-toolbar archive-note">{session.strategyIndex > 0 && <button className="text-button" onClick={() => openStrategy(session.strategyIndex - 1)}>回看上一课</button>}<button className="text-button" onClick={() => session.strategyIndex === STRATEGY_LESSONS.length - 1 ? onPlay() : openStrategy(session.strategyIndex + 1)}>先跳过这一课</button></div></>}
    {session.page === 'walkthrough' && <WalkthroughPage run={session.walk} onChange={(walk) => onChange({ ...session, walk })} onPractice={() => openIndependent(0)} />}
    {session.page === 'independent' && <><IndependentPage run={session.independentRuns[session.independentIndex]} index={session.independentIndex} allDone={allIndependentDone} onChange={(run) => onChange({ ...session, independentRuns: session.independentRuns.map((old, index) => index === session.independentIndex ? run : old) })} onNext={() => allIndependentDone ? onPlay() : openIndependent(session.independentIndex < 5 ? session.independentIndex + 1 : session.independentRuns.findIndex((_, index) => !independentDone(index)))} /><div className="independent-index" aria-label="独立练习题目">{session.independentRuns.map((run, index) => <button key={run.scene.id} className="button button--ghost" aria-pressed={index === session.independentIndex} onClick={() => openIndependent(index)}>第 {index + 1} 题{completed[`independent/${run.scene.id}`] ? ` · ${COMPLETION_LABELS[completed[`independent/${run.scene.id}`]]}` : run.stage === 'done' ? run.help > 0 ? ' · 用过提示' : ' · 已完成' : ''}</button>)}</div></>}
    {session.page === 'survival' && <><SurvivalPage run={session.runs[session.sceneIndex]} onChange={(run) => onChange({ ...session, runs: session.runs.map((r, i) => i === session.sceneIndex ? run : r) })} onRuleSequence={openSequence}
        nextLabel={nextSurvival < 0 ? '下一章 · 吃掉对方的棋 →' : `下一课 · ${SURVIVAL_SCENES[nextSurvival].title} →`}
        onNext={advanceSurvival}
        onTry={survival.guided ? () => openScene(session.sceneIndex + 1) : undefined}
        onPlay={survivalLast ? onPlay : undefined} />
      <div className="learning-toolbar learning-toolbar--quiet archive-note">
        {session.sceneIndex > 0 && <button className="text-button" onClick={() => openScene(session.sceneIndex - 1)}>回看上一题</button>}
        <button className="text-button" onClick={advanceSurvival}>先跳过这一题</button>
      </div></>}
    {session.page === 'capture' && <CapturePage key={capture.scene.id} run={capture}
      onChange={(run) => onChange({ ...session, captureRuns: session.captureRuns.map((old, index) => index === session.captureIndex ? run : old) })}
      nextLabel={nextCapture < 0 ? '下一章 · 围地与终局 →' : `下一课 · ${CAPTURE_SCENES[nextCapture].title} →`}
      onNext={() => nextCapture < 0 ? openEndgame(0) : openCapture(nextCapture)}
      onTry={capture.scene.guided ? () => openCapture(session.captureIndex + 1) : undefined}
      onPlay={!capture.scene.guided && nextCapture < 0 ? onPlay : undefined} />}
  </>
}
