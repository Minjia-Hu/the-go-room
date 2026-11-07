import type { Point } from '../engine'

export interface SurvivalScene {
  readonly id: string
  readonly course: number
  readonly title: string
  readonly guided: boolean
  readonly kind: 'danger' | 'escape' | 'connect' | 'eyes'
  readonly rows: readonly string[]
  readonly target: Point
  readonly intro: string
  readonly hints: readonly [string, string, string]
  readonly examples: readonly Point[]
  readonly eyes?: readonly Point[]
  readonly contrastRows?: readonly string[]
  readonly wrongMove?: Point
}
