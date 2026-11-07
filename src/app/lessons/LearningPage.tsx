import { LESSONS } from '../../content/lessons'
import { SURVIVAL_SCENES } from '../../content/survival'
import type { LearningSession } from './learningSession'
import { startLesson } from './lessonRunner'
import { LessonPage } from './LessonPage'
import { SurvivalPage } from './SurvivalPage'
import { RoomIllustration } from './RoomIllustration'

interface Props { readonly session: LearningSession; readonly onChange: (next: LearningSession) => void; readonly onPlay: () => void }
export function LearningPage({ session, onChange, onPlay }: Props) {
  const openScene = (sceneIndex: number) => onChange({ ...session, page: 'survival', sceneIndex })
  if (session.page === 'home') return <section className="learning-home">
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
    <div className="learning-contents">
      <div className="contents-heading"><span className="eyebrow" lang="en">CONTENTS</span><h3>循序入门</h3><p>每一章，<br />解决一个小困惑。</p><span className="book-seal" aria-hidden="true">弈</span></div>
      <div className="chapter-list">
        <article className="chapter">
          <header className="chapter-heading"><span className="chapter-number" aria-hidden="true">壹</span><div><h3>认识规则</h3><p>落子、气、提子、禁入点和劫。</p></div><span className="chapter-count">五关</span></header>
          <div className="lesson-list">{LESSONS.map((lesson, index) => <button key={lesson.id} className="lesson-link" onClick={() => onChange({ ...session, page: 'rules', rules: session.rules.index === index ? session.rules : { index, run: startLesson(lesson) } })}>{lesson.title}<span aria-hidden="true">↗</span></button>)}</div>
        </article>
        <article className="chapter">
          <header className="chapter-heading"><span className="chapter-number" aria-hidden="true">贰</span><div><h3>保住自己的棋</h3><p>四课八个局面。观察、试下、比较原因。</p></div><span className="chapter-count">四课</span></header>
          <div className="lesson-list">{SURVIVAL_SCENES.filter((s) => s.guided).map((scene, index) => <button key={scene.id} className="lesson-link" onClick={() => openScene(index * 2)}>{scene.course}. {scene.title}<span aria-hidden="true">↗</span></button>)}</div>
        </article>
        <article className="chapter practice-invitation">
          <header className="chapter-heading"><span className="chapter-number" aria-hidden="true">叁</span><div><h3>有提示的陪练</h3><p>每手先试下，看懂提示后再确认；也可以退回重试。</p></div><span className="chapter-count">一盘</span></header>
          <button className="button button--ghost" onClick={onPlay}>直接开始陪练<span aria-hidden="true">↗</span></button>
        </article>
      </div>
    </div>
    <div className="learning-note"><p className="learning-quote">先理解一手棋，<br />再慢慢理解一盘棋。</p><p>最后比较活着的棋子和围住的空点，<br />吃子只是办法之一。</p></div>
    <p className="muted small archive-note">切换页面保留当前练习和对局。刷新后练习回到这里，进行中的对局不保留；已完成棋谱仍可复盘。</p>
  </section>
  return <>
    <div className="learning-toolbar"><button className="text-button" onClick={() => onChange({ ...session, page: 'home' })}>返回章节</button><button className="text-button" onClick={onPlay}>直接开始陪练</button></div>
    {session.page === 'rules' ? <LessonPage lessons={LESSONS} progress={session.rules} onProgress={(rules) => onChange({ ...session, rules })} onFinish={onPlay} onSurvival={() => openScene(0)} />
      : <><SurvivalPage run={session.runs[session.sceneIndex]} onChange={(run) => onChange({ ...session, runs: session.runs.map((r, i) => i === session.sceneIndex ? run : r) })}
        isLast={session.sceneIndex === 7} onNext={() => session.sceneIndex === 7 ? onPlay() : openScene(session.sceneIndex + 1)} />
      <div className="learning-toolbar archive-note">
        {session.sceneIndex > 0 && <button className="text-button" onClick={() => openScene(session.sceneIndex - 1)}>回看上一题</button>}
        <button className="text-button" onClick={() => session.sceneIndex === 7 ? onPlay() : openScene(session.sceneIndex + 1)}>先跳过这一题</button>
      </div></>}
  </>
}
