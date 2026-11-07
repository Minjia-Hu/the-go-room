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
    <div className="learning-hero">
      <div className="learning-hero__copy">
        <p className="eyebrow"><span className="eyebrow__line" aria-hidden="true" />从认识规则，到知道为什么这样下</p>
        <h2>一步一步，学会照顾自己的棋。</h2>
        <p className="muted">最后比较活着的棋子和围住的空点，吃子只是办法之一。从一个小局面开始，先看懂，再落子。</p>
        <button className="button hero-button" onClick={() => onChange({ ...session, page: 'rules', rules: { index: 0, run: startLesson(LESSONS[0]) } })}>从第一课开始<span aria-hidden="true">↗</span></button>
        <span className="hero-note">零基础也可以 · 在棋盘上边下边学</span>
      </div>
      <RoomIllustration />
    </div>
    <div className="section-heading"><h3>你的学棋之路</h3><span>先认识，再练习</span></div>
    <div className="chapter-grid">
      <article className="panel chapter"><span className="chapter-number">01</span><h3>认识规则</h3><p className="muted">落子、气、提子、禁入点和劫。</p>
        {LESSONS.map((lesson, index) => <button key={lesson.id} className="lesson-link" onClick={() => onChange({ ...session, page: 'rules', rules: session.rules.index === index ? session.rules : { index, run: startLesson(lesson) } })}>{lesson.title}<span aria-hidden="true">→</span></button>)}
      </article>
      <article className="panel chapter"><span className="chapter-number">02</span><h3>保住自己的棋</h3><p className="muted">四课八个局面。观察、试下、比较原因。</p>
        {SURVIVAL_SCENES.filter((s) => s.guided).map((scene, index) => <button key={scene.id} className="lesson-link" onClick={() => openScene(index * 2)}>{scene.course}. {scene.title}<span aria-hidden="true">→</span></button>)}
      </article>
    </div>
    <div className="practice-invitation"><div><span className="eyebrow">下一步 · 把学到的用起来</span><h3>有人陪你，慢慢下一盘。</h3><p>每手先试下，看懂提示后再确认；也可以退回重试。</p></div><button className="button" onClick={onPlay}>直接开始陪练<span aria-hidden="true">↗</span></button></div>
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
