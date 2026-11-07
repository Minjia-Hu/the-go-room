import { LESSONS } from '../../content/lessons'
import { SURVIVAL_SCENES } from '../../content/survival'
import type { LearningSession } from './learningSession'
import { startLesson } from './lessonRunner'
import { LessonPage } from './LessonPage'
import { SurvivalPage } from './SurvivalPage'

interface Props { readonly session: LearningSession; readonly onChange: (next: LearningSession) => void; readonly onPlay: () => void }
export function LearningPage({ session, onChange, onPlay }: Props) {
  const openScene = (sceneIndex: number) => onChange({ ...session, page: 'survival', sceneIndex })
  if (session.page === 'home') return <section className="learning-home">
    <p className="eyebrow">从认识规则，到知道为什么这样下</p>
    <h2>一步一步，学会照顾自己的棋。</h2>
    <p className="muted">最后比较活着的棋子和围住的空点，吃子只是办法之一。从一个小局面开始，先看懂，再落子。</p>
    <div className="chapter-grid">
      <article className="panel chapter"><span className="chapter-number">01</span><h3>认识规则</h3><p className="muted">落子、气、提子、禁入点和劫。</p>
        {LESSONS.map((lesson, index) => <button key={lesson.id} className="lesson-link" onClick={() => onChange({ ...session, page: 'rules', rules: session.rules.index === index ? session.rules : { index, run: startLesson(lesson) } })}>{lesson.title}<span aria-hidden="true">→</span></button>)}
      </article>
      <article className="panel chapter"><span className="chapter-number">02</span><h3>保住自己的棋</h3><p className="muted">四课八个局面。观察、试下、比较原因。</p>
        {SURVIVAL_SCENES.filter((s) => s.guided).map((scene, index) => <button key={scene.id} className="lesson-link" onClick={() => openScene(index * 2)}>{scene.course}. {scene.title}<span aria-hidden="true">→</span></button>)}
      </article>
    </div>
    <button className="button" onClick={onPlay}>直接开始陪练</button>
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
