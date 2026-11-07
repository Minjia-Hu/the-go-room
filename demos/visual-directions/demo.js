/* 独立视觉样稿：仅演示一题固定的认险局面，不替代正式围棋引擎。 */
const app = document.querySelector('#app')
const names = { a: '晴空棋室', b: '棋谱编辑部', c: '夜航棋社' }
let theme = 'a'
let screen = 'home'
let choice = null
let view = 'after'
let confirmed = false
let reveal = false

const arrow = '<span aria-hidden="true">↗</span>'
const logo = '<span class="logo-symbol" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span>The Go Room</span>'
const labels = ['认识规则', '保住自己的棋', '有提示的陪练']
const subtitles = ['从落子开始，认识气与提子。', '看见危险，学会连接与逃跑。', '每手先试下，看懂以后再确认。']

function button(text, action, cls = 'primary') {
  return `<button class="${cls}" data-action="${action}">${text}</button>`
}
function topbar() {
  return `<header class="site-nav"><a class="wordmark" href="#${theme}-home">${logo}</a><nav aria-label="样稿页面"><a href="#${theme}-home" ${screen === 'home' ? 'aria-current="page"' : ''}>学习首页</a><a href="#${theme}-lesson" ${screen === 'lesson' ? 'aria-current="page"' : ''}>生存练习</a></nav><span class="nav-note">属于你的围棋教室</span></header>`
}
function footer() {
  return '<footer class="site-foot"><span>THE GO ROOM</span><span>不急着赢，先看懂每一步。</span><span>从零开始，也很好。</span></footer>'
}
function board(interactive = false) {
  const id = interactive ? 'exercise' : 'cover'
  const previewing = interactive && choice && view !== 'before'
  const reply = previewing && choice === 'b' && view === 'reply'
  const safe = previewing && choice === 'a'
  const stones = [[3, 4, 'white'], [4, 3, 'white'], [5, 4, 'white']]
  if (!reply) stones.push([4, 4, 'black'])
  if (safe) stones.push([4, 5, 'black'])
  if (previewing && choice === 'b') stones.push([6, 6, 'black'])
  if (reply) stones.push([4, 5, 'white'])
  const lines = Array.from({ length: 9 }, (_, i) => `<path d="M36 ${36 + 32 * i}H292 M${36 + 32 * i} 36V292"/>`).join('')
  const pieces = stones.map(([x, y, color]) => `<circle class="stone-shadow" cx="${37 + x * 32}" cy="${38 + y * 32}" r="14.6"/><circle class="stone stone-${color}" cx="${36 + x * 32}" cy="${36 + y * 32}" r="14.6" fill="url(#${id}-${color})"/>`).join('')
  const libertyPoints = safe ? [[3, 5], [5, 5], [4, 6]] : [[4, 5]]
  const liberties = !reply ? libertyPoints.map(([x, y]) => `<circle class="liberty" cx="${36 + x * 32}" cy="${36 + y * 32}" r="6"/>`).join('') : ''
  const target = !reply ? `<circle class="target" cx="164" cy="164" r="10"/>` : '<path class="capture-cross" d="M157 157l14 14 M171 157l-14 14"/>'
  const pointLabel = (x, y, letter) => `<g class="point-label"><circle cx="${36 + x * 32}" cy="${36 + y * 32}" r="10"/><text x="${36 + x * 32}" y="${37 + y * 32}">${letter}</text></g>`
  const hits = interactive ? [[4, 5, 'a'], [6, 6, 'b']].map(([x, y, point]) => `<rect class="board-hit" role="button" tabindex="0" aria-label="试下 ${point.toUpperCase()} 点" data-action="choose-${point}" x="${20 + x * 32}" y="${20 + y * 32}" width="32" height="32" rx="5"/>`).join('') : ''
  return `<svg class="go-board" viewBox="0 0 328 328" ${interactive ? 'role="group" aria-label="认险练习棋盘，选择 A 或 B 点"' : 'aria-hidden="true"'}>
    <defs><radialGradient id="${id}-black" cx=".32" cy=".24" r=".8"><stop stop-color="#51575b"/><stop offset=".6" stop-color="#242c31"/><stop offset="1" stop-color="#151a1e"/></radialGradient><radialGradient id="${id}-white" cx=".3" cy=".2" r=".85"><stop stop-color="#fff"/><stop offset=".7" stop-color="#faf9f4"/><stop offset="1" stop-color="#d8d8d0"/></radialGradient></defs>
    <rect class="board-surface" x="1" y="1" width="326" height="326" rx="10"/>
    <g class="grid-lines">${lines}</g><g class="stars">${[[2, 2], [6, 2], [4, 4], [2, 6], [6, 6]].map(([x, y]) => `<circle cx="${36 + x * 32}" cy="${36 + y * 32}" r="2.1"/>`).join('')}</g>
    ${pieces}${liberties}${target}${!safe && !reply ? pointLabel(4, 5, 'A') : ''}${interactive && (!choice || view === 'before') ? pointLabel(6, 6, 'B') : ''}${hits}
    <text class="board-coordinate" x="164" y="316">9 × 9</text>
  </svg>`
}
function courseCard(i) {
  return `<article class="course-card"><span class="course-index">0${i + 1}</span><div class="course-art art-${i}" aria-hidden="true"><i></i><i></i><i></i><i></i></div><h3>${labels[i]}</h3><p>${subtitles[i]}</p><div class="course-meta"><span>${['5 关互动教学', '4 课 · 8 个小局面', '9 路 · 新手陪练'][i]}</span>${i === 1 ? `<a href="#${theme}-lesson">体验一题 ${arrow}</a>` : '<span class="sample-tag">内容示意</span>'}</div></article>`
}
function homeA() {
  return `<div class="theme theme-a">${topbar()}<div class="site-content">
    <section class="a-hero"><div class="a-hero-copy"><span class="kicker"><i></i> 围棋，从一个小发现开始</span><h1>下一颗棋，<br>懂一点<span class="accent-word">为什么。</span></h1><p>不用一下子记住所有规则。<br>看看哪里有危险，试着救出自己的棋。</p><a class="primary" href="#a-lesson">先来试一题 ${arrow}</a><span class="tiny-note">零基础友好 · 可以试错 · 每步都有解释</span></div><div class="a-hero-visual"><div class="floating-note note-top"><span class="note-dot"></span>它只剩一口气了</div>${board()}<div class="floating-note note-bottom"><span class="note-spark">✦</span><div>先看懂，再落子。<small>找到 A，就找到了一条出路。</small></div></div><span class="orbit orbit-one"></span><span class="orbit orbit-two"></span></div></section>
    <section class="course-section"><div class="section-title"><div><span class="kicker">一点一点，走得更远</span><h2>你的学棋路线</h2></div><p>认识规则 → 保住棋子 → 试着下完一盘</p></div><div class="course-grid">${[0, 1, 2].map(courseCard).join('')}</div></section>
    <div class="a-bottom"><span class="little-stone" aria-hidden="true"></span><div><h3>被吃掉，也可以是一个好问题。</h3><p>在陪练里回看发生了什么，再换一种走法。</p></div><a href="#a-lesson">看看提示长什么样 ${arrow}</a></div>
  </div>${footer()}</div>`
}
function homeB() {
  return `<div class="theme theme-b">${topbar()}<div class="site-content">
    <div class="b-edition"><span>入门手记 · 第一册</span><span>OBSERVE / TRY / UNDERSTAND</span><span>从一口气开始</span></div>
    <section class="b-hero"><div class="b-title"><span class="kicker">写给第一次拿起棋子的你</span><h1>黑白之间，<br>慢慢<span>看懂。</span></h1><div class="b-intro"><span class="vertical-label">学棋，不必着急</span><p>一颗棋为什么会被吃？<br>哪一步可以救回它？<br>从一个小局面，读懂棋盘上的因果。</p></div><a class="primary" href="#b-lesson">翻开第一道练习 ${arrow}</a></div><figure class="b-figure"><span class="figure-no">图 01 / 一口气</span>${board()}<figcaption><strong>棋子的出路，藏在相邻的空点里。</strong><span>先观察 A，再想一想落子之后会怎样。</span></figcaption></figure></section>
    <section class="b-contents"><div class="contents-intro"><span class="kicker">CONTENTS</span><h2>循序入门</h2><p>每一章，<br>解决一个小困惑。</p><span class="book-seal" aria-hidden="true">弈</span></div><div class="contents-list">${labels.map((title, i) => `<article><span class="contents-no">${['壹', '贰', '叁'][i]}</span><div><h3>${title}</h3><p>${subtitles[i]}</p></div><span class="contents-count">${['五关', '四课', '一盘'][i]}</span>${i === 1 ? '<a href="#b-lesson" aria-label="体验生存练习">↗</a>' : '<span class="sample-tag">内容示意</span>'}</article>`).join('')}</div></section>
    <div class="b-quote"><span>「</span><p>先理解一手棋，<br>再慢慢理解一盘棋。</p><span>」</span><a href="#b-lesson">从这个局面开始 →</a></div>
  </div>${footer()}</div>`
}
function rail() {
  return `<aside class="c-rail"><a class="wordmark" href="#c-home">${logo}</a><p class="rail-label">你的棋室</p><nav aria-label="夜航棋社导航"><a href="#c-home" ${screen === 'home' ? 'aria-current="page"' : ''}><span>◈</span> 学习概览</a><a href="#c-lesson" ${screen === 'lesson' ? 'aria-current="page"' : ''}><span>⊞</span> 生存练习</a></nav><div class="rail-divider"></div><p class="rail-label">循序入门</p><ol><li><b>01</b> 认识规则</li><li class="rail-current"><b>02</b> 保住自己的棋</li><li><b>03</b> 有提示的陪练</li></ol><div class="rail-bottom"><span class="online-dot"></span><p>慢一点，也在前进。<small>看懂原因，比猜中答案更重要。</small></p></div></aside>`
}
function homeC() {
  return `<div class="theme theme-c"><div class="c-layout">${rail()}<div class="c-main"><header class="c-top"><span>学习概览 <i>/</i> 从这里开始</span><span class="c-tag">BEGINNER'S ROOM</span></header>
    <section class="c-greeting"><span class="kicker">每次看懂一点</span><h1>今天，救回你的<span>第一块棋。</span></h1><p>观察棋盘，尝试落子，让每一步都有理由。</p></section>
    <section class="c-feature"><div class="c-feature-copy"><span class="c-badge">可体验 · 生存练习</span><h2>危险，<br>有迹可循。</h2><p>中间的黑棋只剩一口气。<br>给它找一条出路，看看会发生什么。</p><div class="c-facts"><div><b>01</b><span>一个目标棋块</span></div><div><b>02</b><span>两种走法对比</span></div></div><a href="#c-lesson" class="primary">进入练习 ${arrow}</a></div><div class="c-board-wrap"><div class="c-board-title"><span class="online-dot"></span>局面 01 <span>你执黑</span></div>${board()}<div class="c-board-footer"><span>○ 空点是棋子的气</span><span>↳ 先看 A</span></div></div></section>
    <section class="c-path"><div class="section-title"><h2>从会落子，到会思考</h2><span>你的学习路线</span></div><div class="c-path-grid">${labels.map((title, i) => `<article class="${i === 1 ? 'current' : ''}"><span class="path-no">0${i + 1}</span><h3>${title}</h3><p>${subtitles[i]}</p>${i === 1 ? '<a href="#c-lesson">体验这一课 ↗</a>' : '<span class="sample-tag">内容示意</span>'}</article>`).join('')}</div></section>
    ${footer()}</div></div></div>`
}
function lessonCopy() {
  let title = '先看看，黑棋还能往哪里走？'
  let message = '带圈的黑棋，上、左、右都被白棋挡住，只剩下方 A 这一口气。你会接在 A，还是去远处的 B？'
  if (choice === 'a') {
    title = confirmed ? '你给这块棋找到了出路。' : '接在 A，两颗黑棋共用 3 口气。'
    message = '新棋子与原来的黑棋上下相连。左、右、下方三个空点，都成了整块棋的气；白棋下一手不能直接提走它。'
  } else if (choice === 'b') {
    title = view === 'reply' ? '白棋占住 A，原来的黑棋被提走。' : '下在 B，原来的黑棋仍只有 1 口气。'
    message = 'B 没有与目标棋块连接，也没有提走旁边的白棋。白棋下一手可以占住 A，让中间黑棋的气变成 0。'
  }
  return `<div class="lesson-copy" id="lesson-copy"><div class="lesson-step"><span>02 / 保住自己的棋</span><span>一起练习</span></div><h1>给自己的棋<br>找一条出路。</h1><p class="lesson-intro">今天只学一件事：落子后，整块棋的气有没有变多？</p><div class="lesson-progress" aria-hidden="true"><i class="filled"></i><i class="${choice ? 'filled' : ''}"></i><i class="${confirmed ? 'filled' : ''}"></i></div><div class="explanation" role="status"><span class="explanation-label">${confirmed ? '这一步的收获' : choice ? '为什么这样下' : '先观察'}</span><h2>${title}</h2><p>${message}</p></div>${!choice ? `<div class="choose-buttons">${button('A · 接在旁边', 'choose-a')}${button('B · 去远处下', 'choose-b', 'secondary')}</div>${button(reveal ? '收起提示' : '给我一点提示', 'hint', 'text-link')}${reveal ? '<p class="hint-text">相邻的棋子会连成一块、共用气。试着选择紧挨黑棋的空点。</p>' : ''}` : `<div class="view-switch" aria-label="对照走法">${button('下之前', 'before', view === 'before' ? 'selected' : '')}${button('下之后', 'after', view === 'after' ? 'selected' : '')}${choice === 'b' ? button('看白棋怎样提', 'reply', view === 'reply' ? 'selected' : '') : ''}</div><div class="confirm-row">${choice === 'a' && !confirmed ? button('确认这一步', 'confirm') : ''}${choice === 'b' ? button('换到 A 试试', 'choose-a') : ''}${button(confirmed ? '再试一次' : '重新选点', 'reset', 'secondary')}</div>${confirmed ? '<p class="success-note">✓ 练习完成。气变多，眼前的危险就缓解了；这不代表以后一定安全。</p>' : ''}`}</div>`
}
function lesson() {
  const caption = view === 'before' ? '对照 · 落子之前' : confirmed ? '这一步已确认' : view === 'reply' ? '演示 · 白棋占住最后一气' : choice ? '试下预览 · 还可以重新选点' : '你执黑 · 选择 A 或 B 试下'
  const stage = `<div class="lesson-stage"><div class="stage-heading"><span>${theme === 'b' ? '图 02 / 找出路' : '练习棋盘'}</span><span><i class="black-dot"></i>你执黑</span></div>${board(true)}<p class="stage-caption" role="status">${caption}</p><div class="board-legend"><span><i class="legend-target"></i>目标棋块</span><span><i class="legend-liberty"></i>棋块的气</span></div></div>`
  const content = `<div class="lesson-breadcrumb"><a href="#${theme}-home">← 返回学习首页</a><span>观察 → 试下 → 理解原因</span></div><section class="lesson-layout">${stage}${lessonCopy()}</section><p class="prototype-note">交互样稿：本题只开放 A、B 两个落点，用于比较视觉和提示体验；完整对局沿用正式项目。</p>`
  if (theme === 'c') return `<div class="theme theme-c"><div class="c-layout">${rail()}<div class="c-main"><header class="c-top"><span>生存练习 <i>/</i> 给自己的棋找出路</span><span class="c-tag">TRY & UNDERSTAND</span></header>${content}${footer()}</div></div></div>`
  return `<div class="theme theme-${theme}">${topbar()}<div class="site-content">${content}</div>${footer()}</div>`
}
function overview() {
  const data = [
    ['a', '轻松入门，亲近一点。', '浅蓝 · 白色 · 柔和圆角', '以具体的小问题开场，把第一次尝试放在最显眼的位置。', '适合希望亲切、清楚，又不显得幼稚的学习体验。'],
    ['b', '像翻开一本好看的棋书。', '纸色 · 墨色 · 书刊排版', '用章节、图注和留白串起学习内容，减轻工具感。', '适合喜欢安静、有文化气息、愿意慢慢阅读的体验。'],
    ['c', '进入棋室，专心下一手。', '深蓝黑 · 薄荷绿 · 工作台', '把棋盘放在视觉中心，课程作为身旁的学习路线。', '适合喜欢现代、沉浸、带一点游戏感的练习体验。'],
  ]
  return `<section class="overview"><div class="overview-heading"><span>THE GO ROOM / DESIGN STUDIES</span><h1>同一间棋室，<br>三种不同的气质。</h1><p>每个方案都有首页与同一道可点击的练习。先看你想走进哪一间，再试试它是否让你更愿意学。</p></div><div class="proposal-grid">${data.map(([key, title, palette, desc, fit]) => `<article class="proposal proposal-${key}"><a href="#${key}-home" class="proposal-image" aria-label="打开 ${names[key]} 首页"><img src="./previews/${key}-home.png" alt="${names[key]}首页预览"></a><div class="proposal-copy"><span class="proposal-letter">${key.toUpperCase()} <small>${palette}</small></span><h2>${names[key]}</h2><h3>${title}</h3><p>${desc}</p><p class="proposal-fit">${fit}</p><div><a class="proposal-open" href="#${key}-home">看首页 ↗</a><a href="#${key}-lesson">体验练习 →</a></div></div></article>`).join('')}</div><div class="comparison-tip"><strong>建议这样选</strong><p>喜欢哪种整体气质？哪一版的棋盘最清楚？哪一版的提示让你最愿意读？也可以组合，例如 A 的首页搭配 B 的棋盘质感。</p><span>视觉样稿，不保存练习进度；切换方案会重新开始本题。</span></div></section>`
}
function render() {
  if (screen === 'overview') app.innerHTML = overview()
  else app.innerHTML = screen === 'lesson' ? lesson() : ({ a: homeA, b: homeB, c: homeC })[theme]()
  document.querySelectorAll('[data-theme-link]').forEach(link => {
    link.href = `#${link.dataset.themeLink}-${screen === 'lesson' ? 'lesson' : 'home'}`
    if (screen !== 'overview' && link.dataset.themeLink === theme) link.setAttribute('aria-current', 'page')
    else link.removeAttribute('aria-current')
  })
  document.title = screen === 'overview' ? 'The Go Room · 三案对比' : `${theme.toUpperCase()} ${names[theme]} · ${screen === 'home' ? '首页' : '生存练习'}样稿`
}
function route() {
  const match = location.hash.match(/^#([abc])-(home|lesson)$/)
  if (match) { theme = match[1]; screen = match[2] } else screen = 'overview'
  choice = null; view = 'after'; confirmed = false; reveal = false
  render()
  window.scrollTo(0, 0)
}
function action(name) {
  if (name.startsWith('choose-')) { choice = name.slice(-1); view = 'after'; confirmed = false }
  else if (name === 'reset') { choice = null; view = 'after'; confirmed = false; reveal = false }
  else if (name === 'confirm') { confirmed = true; view = 'after' }
  else if (name === 'hint') reveal = !reveal
  else if (['before', 'after', 'reply'].includes(name)) view = name
  const scroll = window.scrollY
  render()
  // 重绘后恢复键盘焦点；被确认或替换的按钮回到讲解标题。
  const next = app.querySelector(`[data-action="${name}"]`) ?? app.querySelector('.explanation h2')
  if (next) { if (next.tagName === 'H2') next.tabIndex = -1; next.focus({ preventScroll: true }) }
  window.scrollTo(0, scroll)
}
app.addEventListener('click', e => { const target = e.target.closest('[data-action]'); if (target) action(target.dataset.action) })
app.addEventListener('keydown', e => {
  if (e.target.matches('.board-hit') && ['Enter', ' '].includes(e.key)) { e.preventDefault(); action(e.target.dataset.action) }
})
window.addEventListener('hashchange', route)
route()
