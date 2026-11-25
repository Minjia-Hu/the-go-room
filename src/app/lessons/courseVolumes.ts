import { CAPTURE_SCENES } from '../../content/capture'
import { SURVIVAL_SCENES } from '../../content/survival'
import { LEARNING_UNITS, type LearningUnit } from './learningProgress'

interface Entry {
  readonly unit: LearningUnit
  readonly title: string
  readonly tag?: '练习' | '慢镜头' | '独立练习'
}
interface Group {
  readonly label?: string
  readonly entries: readonly Entry[]
}
export interface CourseVolume {
  readonly number: string
  readonly title: string
  readonly count: string
  readonly groups: readonly Group[]
}

function units(page: LearningUnit['page']) {
  return LEARNING_UNITS.filter(unit => unit.page === page)
}

function paired(page: 'survival' | 'capture'): Group[] {
  const lessons = units(page).map(unit => {
    const scene = page === 'survival' ? SURVIVAL_SCENES[unit.index] : CAPTURE_SCENES[unit.index]
    return { unit, scene, number: 'course' in scene ? scene.course : scene.lesson }
  })
  return lessons.filter(({ scene }) => scene.guided).map(lesson => ({
    label: `第 ${lesson.number} 课：${lesson.scene.title}`,
    entries: lessons.filter(({ number }) => number === lesson.number).map(({ unit, scene, number }) =>
      scene.guided ? { unit, title: `${number}. ${scene.title}` } : { unit, title: scene.title, tag: '练习' }),
  }))
}

function numbered(page: 'endgame' | 'strategy'): Group[] {
  return units(page).map(unit => ({ entries: [{ unit, title: `${unit.index + 1}. ${unit.title}` }] }))
}

export const COURSE_VOLUMES: readonly CourseVolume[] = [
  { number: '壹', title: '认识规则', count: '五关 · 两镜头', groups: [
    ...units('rules').map(unit => ({ entries: [{ unit, title: unit.title }] })),
    { entries: units('rule-sequence').map(unit => ({ unit, title: unit.title, tag: '慢镜头' })) },
  ] },
  { number: '贰', title: '保住自己的棋', count: '四课 · 八局', groups: paired('survival') },
  { number: '叁', title: '吃掉对方的棋', count: '五课 · 十局', groups: paired('capture') },
  { number: '肆', title: '围地与终局', count: '四课', groups: numbered('endgame') },
  { number: '伍', title: '九路策略入门', count: '三课', groups: numbered('strategy') },
  { number: '陆', title: '从看懂到自己下', count: '一盘 · 六题', groups: [
    { entries: units('walkthrough').map(unit => ({ unit, title: unit.title })) },
    { entries: units('independent').map(unit => ({ unit, title: `第 ${unit.index + 1} 题`, tag: '独立练习' })) },
  ] },
]

export function volumeFor(unit: LearningUnit) {
  return COURSE_VOLUMES.find(volume => volume.groups.some(group => group.entries.some(entry => entry.unit.id === unit.id)))!
}
