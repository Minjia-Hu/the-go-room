import { PRACTICE_DANGER_SCENES, PRACTICE_RESCUE_SCENES, PRIORITY_SCENES } from '../../content/practiceExtras'
import { startPriority } from './priorityRunner'
import type { PriorityRun } from './priorityRunner'
import { LESSONS } from '../../content/lessons'
import { CAPTURE_SCENES } from '../../content/capture'
import { startCapture } from './captureRunner'
import type { CaptureRun } from './captureRunner'
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
import { createIndependentRuns, startIndependent } from './independentRunner'
import type { IndependentRun } from './independentRunner'
import { continueLearningUnit, emptyLearningProgress } from './learningProgress'
import type { LearningProgress, LearningUnit } from './learningProgress'

export interface RuleProgress { readonly index: number; readonly run: LessonRun }
export interface LearningSession {
  readonly progress: LearningProgress
  readonly page: 'home' | 'rules' | 'survival' | 'capture' | 'rule-sequence' | 'endgame' | 'strategy' | 'walkthrough' | 'independent'
  readonly rules: RuleProgress
  readonly sceneIndex: number
  readonly runs: readonly SurvivalRun[]
  readonly captureIndex: number
  readonly captureRuns: readonly CaptureRun[]
  readonly sequence: RuleSequenceRun
  readonly endgameIndex: number
  readonly endgameRuns: readonly EndgameRun[]
  readonly strategyIndex: number
  readonly strategyRuns: readonly StrategyRun[]
  readonly walk: WalkRun
  readonly independentIndex: number
  readonly independentRuns: readonly IndependentRun[]
  readonly practiceDangerRuns: readonly SurvivalRun[]
  readonly practiceRescueRuns: readonly IndependentRun[]
  readonly priorityRuns: readonly PriorityRun[]
}
export function createLearningSession(): LearningSession {
  return { progress: emptyLearningProgress(), page: 'home', rules: { index: 0, run: startLesson(LESSONS[0]) }, sceneIndex: 0, runs: SURVIVAL_SCENES.map(startSurvival),
    captureIndex: 0, captureRuns: CAPTURE_SCENES.map((scene) => startCapture(scene)), sequence: startRuleSequence(), endgameIndex: 0, endgameRuns: createEndgameRuns(), strategyIndex: 0, strategyRuns: createStrategyRuns(), walk: startWalk(), independentIndex: 0, independentRuns: createIndependentRuns(), practiceDangerRuns: PRACTICE_DANGER_SCENES.map(startSurvival), practiceRescueRuns: PRACTICE_RESCUE_SCENES.map(startIndependent), priorityRuns: PRIORITY_SCENES.map(startPriority) }
}

export function openLearningUnit(session: LearningSession, unit: LearningUnit): LearningSession {
  switch (unit.page) {
    case 'rules': return { ...session, page: unit.page, rules: session.rules.index === unit.index ? session.rules : { index: unit.index, run: startLesson(LESSONS[unit.index]) } }
    case 'survival': return { ...session, page: unit.page, sceneIndex: unit.index }
    case 'capture': return { ...session, page: unit.page, captureIndex: unit.index }
    case 'rule-sequence': return { ...session, page: unit.page, sequence: session.sequence.sceneIndex === unit.index ? session.sequence : { ...session.sequence, sceneIndex: unit.index, step: 0, message: null } }
    case 'endgame': return { ...session, page: unit.page, endgameIndex: unit.index }
    case 'strategy': return { ...session, page: unit.page, strategyIndex: unit.index }
    case 'independent': return { ...session, page: unit.page, independentIndex: unit.index }
    case 'walkthrough': return { ...session, page: unit.page }
  }
}
export function restoreLearningSession(progress: LearningProgress): LearningSession {
  const session = { ...createLearningSession(), progress }
  const unit = continueLearningUnit(progress)
  return unit ? openLearningUnit(session, unit) : session
}
