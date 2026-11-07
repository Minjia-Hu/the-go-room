import { LESSONS } from '../../content/lessons'
import { SURVIVAL_SCENES } from '../../content/survival'
import { startLesson } from './lessonRunner'
import type { LessonRun } from './lessonRunner'
import { startSurvival } from './survivalRunner'
import type { SurvivalRun } from './survivalRunner'

export interface RuleProgress { readonly index: number; readonly run: LessonRun }
export interface LearningSession {
  readonly page: 'home' | 'rules' | 'survival'
  readonly rules: RuleProgress
  readonly sceneIndex: number
  readonly runs: readonly SurvivalRun[]
}
export function createLearningSession(): LearningSession {
  return { page: 'home', rules: { index: 0, run: startLesson(LESSONS[0]) }, sceneIndex: 0, runs: SURVIVAL_SCENES.map(startSurvival) }
}
