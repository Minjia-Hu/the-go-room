import { ResponsiveExplanation } from '../board/ResponsiveExplanation'
import type { GroupFact } from '../coaching/analysis'
import type { Suggestion } from '../coaching/suggestions'
import { explainAction } from '../coaching/explanations'
import type { MovePreview } from './preview'

interface Props {
  readonly preview: MovePreview | null
  readonly group: GroupFact | undefined
  readonly dangers: readonly GroupFact[]
  readonly hintLevel: number
  readonly suggestion: Suggestion | null
  readonly onHint: () => void
  readonly onSuggest: () => void
  readonly onInspect: (group: GroupFact) => void
}
export function CoachingPanel({ preview, group, dangers, hintLevel, suggestion, onHint, onSuggest, onInspect }: Props) {
  return <aside className="coach-card" aria-label="陪练提示">
    <p className="eyebrow">先看一看 · 再作决定</p>
    {preview ? <ResponsiveExplanation summary="这手的详细分析"><p>{explainAction(preview.analysis)}</p></ResponsiveExplanation> : group ? <p>
      圈出的这块{group.color === 'black' ? '黑' : '白'}棋有 {group.stones.length} 颗棋，{group.liberties.length} 口气。
      {group.capture ? '只剩 A 这一口气。如果不处理，对方能在这里直接提走整块。' : group.liberties.length === 1 ? '虽然只剩一口气，但对方当前不能合法地直接提走它。' : '点空点试下，看看这块棋的气会怎样变化。'}
    </p> : <p>先看看自己的棋能否互相照应。点棋子可以查看气；点一个空点试下，确认之前都可以重新选择。</p>}
    {dangers.length > 0 && <div className="danger-picker" aria-label="查看危险棋块"><p className="small">{dangers.length} 块黑棋有直接提子危险：</p>
      {dangers.map((g, i) => <button key={`${g.stones[0].x},${g.stones[0].y}`} type="button" className="button button--ghost" onClick={() => onInspect(g)}>查看第 {i + 1} 块 · {g.stones.length} 子</button>)}
    </div>}
    {!preview && <>
      {hintLevel > 0 && <p className="small">{dangers.length ? '先试着给危险的黑棋找出路：向外接、连接自己的棋，或提掉围住它的白棋。试下以后，再数一次气。' : '试着让自己的棋互相照应。也可以先选一个空点，观察试下后的气。气多不代表这步一定更好。'}</p>}
      {hintLevel >= 2 && <p className="message message--success">{suggestion?.reason ?? (dangers.length ? '暂时没有找到能用一手解除这块棋直接提子危险的走法。你仍可试下看看，这不等于判定它已经死了。' : '这次没有明确的建议点。你可以选一个空点，先看看试下结果。')}</p>}
      {hintLevel < 2 ? <button type="button" className="text-button" onClick={onHint}>{hintLevel === 0 ? '给我一点提示' : '看一个可尝试的点'}</button>
        : suggestion && <button type="button" className="button button--ghost" onClick={onSuggest}>试试这个点</button>}
    </>}
  </aside>
}
