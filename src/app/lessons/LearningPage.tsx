import { useLayoutEffect } from 'react'
import { LESSONS } from '../../content/lessons'
import { CAPTURE_SCENES } from '../../content/capture'
import { CapturePage } from './CapturePage'
import { SURVIVAL_SCENES } from '../../content/survival'
import type { LearningSession } from './learningSession'
import { openLearningUnit } from './learningSession'
import { COMPLETION_LABELS, continueLearningUnit, currentLearningUnit, LEARNING_UNITS } from './learningProgress'
import type { LearningUnit } from './learningProgress'
import { LearningLink, LearningProgressPanel } from './LearningProgressPanel'
import { startLesson } from './lessonRunner'
import { LessonPage } from './LessonPage'
import { survivalNextLabel } from './survivalSteps'
import { SurvivalPage } from './SurvivalPage'
import { HeroExercise } from './HeroExercise'
import { ScrollContents } from './ScrollContents'
import type { ScrollChapter } from './ScrollContents'
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
  const openCapture = (captureIndex: number) => onChange({ ...session, page: 'capture', captureIndex })
  const survivalLast = session.sceneIndex === SURVIVAL_SCENES.length - 1
  const capture = session.captureRuns[session.captureIndex]
  const nextCapture = CAPTURE_SCENES[session.captureIndex + 1]
  const openSequence = () => onChange({ ...session, page: 'rule-sequence' })
  const openEndgame = (endgameIndex: number) => onChange({ ...session, page: 'endgame', endgameIndex })
  const openStrategy = (strategyIndex: number) => onChange({ ...session, page: 'strategy', strategyIndex })
  const openWalk = () => onChange({ ...session, page: 'walkthrough' })
  const openIndependent = (independentIndex: number) => onChange({ ...session, page: 'independent', independentIndex })
  const independentDone = (index: number) => session.independentRuns[index].stage === 'done' || !!completed[`independent/${session.independentRuns[index].scene.id}`]
  const allIndependentDone = session.independentRuns.every((_, index) => independentDone(index))
  if (session.page === 'home') {
    const next = continueLearningUnit(session.progress)
    const allDone = LEARNING_UNITS.every((unit) => completed[unit.id])
    const isNext = (id: string) => !allDone && next?.id === id
    const tally = (pages: readonly LearningUnit['page'][]): [number, number] => {
      const units = LEARNING_UNITS.filter((unit) => pages.includes(unit.page))
      return [units.filter((unit) => completed[unit.id]).length, units.length]
    }
    const startRules = () => onChange({ ...session, page: 'rules', rules: { index: 0, run: startLesson(LESSONS[0]) } })
    const chapters: ScrollChapter[] = [
      { number: '壹', title: '认识规则', summary: '落子、气、提子、禁入点和劫；再用两个慢镜头看清提子的先后。', count: '五关 · 两镜头', done: tally(['rules', 'rule-sequence']), content: <>
        <div className="lesson-list">{LESSONS.map((lesson, index) => <LearningLink key={lesson.id} label={lesson.title} mode={completed[`rules/${lesson.id}`]} current={isNext(`rules/${lesson.id}`)} onClick={() => onChange({ ...session, page: 'rules', rules: session.rules.index === index ? session.rules : { index, run: startLesson(lesson) } })} />)}</div>
        <button className="text-button chapter-supplement" onClick={openSequence}>规则慢镜头：落子后先提谁？</button>
        <details className="lesson-details"><summary>两个慢镜头的学习记录</summary><div className="lesson-list">{LEARNING_UNITS.filter((unit) => unit.page === 'rule-sequence').map((unit) => <LearningLink key={unit.id} label={unit.title} mode={completed[unit.id]} current={isNext(unit.id)} onClick={() => onChange(openLearningUnit(session, unit))} />)}</div></details>
      </> },
      { number: '贰', title: '保住自己的棋', summary: '四课八个局面。观察、试下、比较原因。', count: '四课 · 八局', done: tally(['survival']), content:
        <div className="survival-contents">{SURVIVAL_SCENES.filter((scene) => scene.guided).map((lesson) =>
          <div className="course-pair" role="group" aria-label={`第 ${lesson.course} 课：${lesson.title}`} key={lesson.id}>
            {SURVIVAL_SCENES.map((scene, index) => scene.course !== lesson.course ? null :
              <div key={scene.id} className={scene.guided ? 'course-pair__lesson' : 'course-pair__practice'}>
                <LearningLink label={scene.guided ? `${scene.course}. ${scene.title}` : `自己试试：${scene.title}`} mode={completed[`survival/${scene.id}`]} current={isNext(`survival/${scene.id}`)} onClick={() => openScene(index)}>
                  {scene.guided ? undefined : <span className="course-pair__practice-label"><span className="course-pair__tag">自己试试</span><span>{scene.title}</span></span>}
                </LearningLink>
              </div>)}
          </div>)}</div> },
      { number: '叁', title: '吃掉对方的棋', summary: '找准叫吃方向，练门吃、抱吃、双叫吃和征子。', count: '三课 · 六局', done: tally(['capture']), content:
        <div className="survival-contents">{CAPTURE_SCENES.filter((scene) => scene.guided).map((lesson) =>
          <div className="course-pair" role="group" aria-label={`第 ${lesson.lesson} 课：${lesson.title}`} key={lesson.id}>
            {CAPTURE_SCENES.map((scene, index) => scene.lesson !== lesson.lesson ? null :
              <div key={scene.id} className={scene.guided ? 'course-pair__lesson' : 'course-pair__practice'}>
                <LearningLink label={scene.guided ? `${scene.lesson}. ${scene.title}` : `自己试试：${scene.title}`}
                  mode={completed[`capture/${scene.id}`]} current={isNext(`capture/${scene.id}`)} onClick={() => openCapture(index)}>
                  {scene.guided ? undefined : <span className="course-pair__practice-label"><span className="course-pair__tag">自己试试</span><span>{scene.title}</span></span>}
                </LearningLink>
              </div>)}
          </div>)}</div> },
      { number: '肆', title: '围地与终局', summary: '判断空点归属，自己数分，再走完终局。', count: '四课', done: tally(['endgame']), content:
        <div className="lesson-list">{ENDGAME_LESSONS.map((lesson, index) => <LearningLink key={lesson.id} label={`${index + 1}. ${lesson.title}`} mode={completed[`endgame/${lesson.id}`]} current={isNext(`endgame/${lesson.id}`)} onClick={() => openEndgame(index)} />)}</div> },
      { number: '伍', title: '九路策略入门', summary: '先顾危险，再想围地；比较走法，理解取舍。', count: '三课', done: tally(['strategy']), content:
        <div className="lesson-list">{STRATEGY_LESSONS.map((lesson, index) => <LearningLink key={lesson.id} label={`${index + 1}. ${lesson.title}`} mode={completed[`strategy/${lesson.id}`]} current={isNext(`strategy/${lesson.id}`)} onClick={() => openStrategy(index)} />)}</div> },
      { number: '陆', title: '从看懂到自己下', summary: '走完一盘九路，再换没有标记的棋形自己判断。', count: '一盘 · 六题', done: tally(['walkthrough', 'independent']), content: <>
        <div className="lesson-list"><LearningLink label="一盘九路，从头到尾" mode={completed['walkthrough/full-game']} current={isNext('walkthrough/full-game')} onClick={openWalk} /><LearningLink label="换个棋形，自己判断" current={next?.page === 'independent' && !allDone} onClick={() => openIndependent(session.independentIndex)} /></div>
        <details className="lesson-details"><summary>六道独立练习 · 已完成 {session.independentRuns.filter((_, index) => independentDone(index)).length} / 6</summary><div className="lesson-list">{LEARNING_UNITS.filter((unit) => unit.page === 'independent').map((unit) => <LearningLink key={unit.id} label={unit.title} mode={completed[unit.id]} onClick={() => openIndependent(unit.index)} />)}</div></details>
      </> },
      { number: '柒', title: '有提示的陪练', summary: '每手先试下，看懂提示后再确认；也可以退回重试。不计入课程单元。', count: '一盘', content:
        <button className="button" onClick={onPlay}>直接开始陪练<span aria-hidden="true"> →</span></button> },
    ]
    const chapterOf: Record<LearningUnit['page'], number> = { rules: 0, 'rule-sequence': 0, survival: 1, capture: 2, endgame: 3, strategy: 4, walkthrough: 5, independent: 5 }
    const current = next ? chapterOf[next.page] : 0
    return <>
      {storageMessage && <p className="message message--hint" role="alert">{storageMessage}</p>}
      <section className="learning-home">
        <div className="ink-hero">
          <div className="ink-hero__title"><h2>一子一气</h2><p>写给第一次拿起棋子的人</p></div>
          <HeroExercise onStart={startRules} onSurvival={() => openScene(0)} />
        </div>
        <ScrollContents chapters={chapters.map((chapter, index) => index === current ? { ...chapter, live: true } : chapter)} initialOpen={current} />
        <LearningProgressPanel progress={session.progress} onContinue={(unit) => onChange(openLearningUnit(session, unit))} onClear={onClear} />
        <p className="muted small archive-note">切换页面保留当前练习和对局。课程完成记录与学习位置保存在此浏览器；刷新后题目从头开始，进行中的对局不保留，已完成棋谱仍可复盘。</p>
      </section>
    </>
  }
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
    {session.page === 'survival' && <><SurvivalPage run={session.runs[session.sceneIndex]} onChange={(run) => onChange({ ...session, runs: session.runs.map((r, i) => i === session.sceneIndex ? run : r) })} onRuleSequence={openSequence}
        nextLabel={survivalLast ? '下一章 · 吃掉对方的棋 →' : survivalNextLabel(session.sceneIndex)}
        isLast={survivalLast} onNextChapter={survivalLast ? () => openCapture(0) : undefined}
        onNext={() => survivalLast ? onPlay() : openScene(session.sceneIndex + 1)} />
      <div className="learning-toolbar learning-toolbar--quiet archive-note">
        {session.sceneIndex > 0 && <button className="text-button" onClick={() => openScene(session.sceneIndex - 1)}>回看上一题</button>}
        <button className="text-button" onClick={() => survivalLast ? onPlay() : openScene(session.sceneIndex + 1)}>先跳过这一题</button>
      </div></>}
    {session.page === 'capture' && <CapturePage key={capture.scene.id} run={capture}
      onChange={(run) => onChange({ ...session, captureRuns: session.captureRuns.map((old, index) => index === session.captureIndex ? run : old) })}
      nextLabel={nextCapture ? (capture.scene.guided ? '换个局面，自己试试 →' : `下一课 · ${nextCapture.title} →`) : '学习围地与终局 →'}
      onNext={() => nextCapture ? openCapture(session.captureIndex + 1) : openEndgame(0)}
      onPlay={nextCapture ? undefined : onPlay} />}
    {recorded && <p className="completion-note learning-recorded" aria-label="已记录的学习结果">已有记录：{COMPLETION_LABELS[recorded]}。可以再练一次；保留最好的一次记录。</p>}
  </>
}
