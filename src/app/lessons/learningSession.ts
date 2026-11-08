import { LESSONS } from '../../content/lessons'
import { SURVIVAL_SCENES } from '../../content/survival'
import { startLesson } from './lessonRunner'
import type { LessonRun } from './lessonRunner'
import { startSurvival } from './survivalRunner'
import type { SurvivalRun } from './survivalRunner'
import { startRuleSequence } from './ruleSequence'
import type { RuleSequenceRun } from './ruleSequence'
import { createEndgameRuns } from './endgameRunner'
import type { EndgameRun } from './endgameRunner'
import { createStrategyRuns } from './strategyRunner'
import type { StrategyRun } from './strategyRunner'
import { startWalk } from './walkthroughRunner'
import type { WalkRun } from './walkthroughRunner'
import { createIndependentRuns } from './independentRunner'
import type { IndependentRun } from './independentRunner'

export interface RuleProgress { readonly index: number; readonly run: LessonRun }
export interface LearningSession {
  readonly page: 'home' | 'rules' | 'survival' | 'rule-sequence' | 'endgame' | 'strategy' | 'walkthrough' | 'independent'
  readonly rules: RuleProgress
  readonly sceneIndex: number
  readonly runs: readonly SurvivalRun[]
  readonly sequence: RuleSequenceRun
  readonly endgameIndex: number
  readonly endgameRuns: readonly EndgameRun[]
  readonly strategyIndex: number
  readonly strategyRuns: readonly StrategyRun[]
  readonly walk: WalkRun
  readonly independentIndex: number
  readonly independentRuns: readonly IndependentRun[]
}
export function createLearningSession(): LearningSession {
  return { page: 'home', rules: { index: 0, run: startLesson(LESSONS[0]) }, sceneIndex: 0, runs: SURVIVAL_SCENES.map(startSurvival), sequence: startRuleSequence(), endgameIndex: 0, endgameRuns: createEndgameRuns(), strategyIndex: 0, strategyRuns: createStrategyRuns(), walk: startWalk(), independentIndex: 0, independentRuns: createIndependentRuns() }
}
