import type { Color, Point, RejectReason } from '../engine'

/** 针对某个具体错误落点的提示。 */
export interface PointHint {
  readonly point: Point
  readonly text: string
}

/** 要求用户落一子的步骤。落子不被接受时盘面不变,只显示提示。 */
export interface PlaceStep {
  readonly kind: 'place'
  /** 这一步要做什么,显示在棋盘旁。 */
  readonly goal: string
  /** 算对的落点;'any-legal' 表示任何合法点都算对。 */
  readonly accept: readonly Point[] | 'any-legal'
  /** 下在特定错误点时的提示。 */
  readonly hints?: readonly PointHint[]
  /** 其他错误落点的提示。 */
  readonly fallbackHint: string
  /** 落子被引擎拒绝时,按拒绝原因给的提示;没有对应条目时用 fallbackHint。 */
  readonly rejectHints?: Partial<Record<RejectReason, string>>
  /**
   * 这一步的目的是让用户亲身撞上一次拒绝:
   * 在该点落子被引擎以该原因拒绝时,本步完成,显示 success。
   */
  readonly expectReject?: { readonly point: Point; readonly reason: RejectReason }
  readonly success: string
}

/** 要求用户点出一组空点的步骤,例如点出一块棋的所有气。点过的点再点一次取消。 */
export interface SelectStep {
  readonly kind: 'select'
  readonly goal: string
  /** 必须全部点出的点。 */
  readonly targets: readonly Point[]
  /** 点了不属于 targets 的点时的提示。 */
  readonly wrongHint: string
  readonly success: string
}

export type LessonStep = PlaceStep | SelectStep

export interface Lesson {
  readonly id: string
  readonly title: string
  /** 进入关卡时的说明,一两句话。 */
  readonly intro: string
  /** 初始盘面,X 黑 O 白 . 空,每行一个字符串。 */
  readonly rows: readonly string[]
  /** 初始盘面上轮到谁。 */
  readonly toPlay: Color
  /** 从初始盘面开始、双方轮流下的准备手,用来制造"刚刚发生过某事"的局面。 */
  readonly setupMoves?: readonly Point[]
  /** 需要用标记突出显示的点:有子的点画圈,空点画点。 */
  readonly highlight?: readonly Point[]
  readonly steps: readonly LessonStep[]
}
