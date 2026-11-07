import type { CaptureReview as Review } from './session'
import { transitionText } from '../coaching/analysis'
interface Props { readonly review: Review; readonly before: boolean; readonly onBefore: (before: boolean) => void; readonly onContinue: () => void; readonly onRetry: () => void }
export function CaptureReview({ review, before, onBefore, onContinue, onRetry }: Props) {
  return <aside className="coach-card" aria-label="看懂这次提子">
    <h3>先看看，为什么被吃了</h3>
    <p>{transitionText(review.before, review.after)}切到“被吃前”，圈出的黑棋共用最后的 A；白棋落在 A 后，它们都没有气了。</p>
    <div className="actions">
      <button type="button" className="button button--ghost" aria-pressed={before} onClick={() => onBefore(true)}>被吃前</button>
      <button type="button" className="button button--ghost" aria-pressed={!before} onClick={() => onBefore(false)}>被吃后</button>
    </div>
    <div className="actions"><button type="button" className="button" onClick={onRetry}>退回这一回合重试</button><button type="button" className="button button--ghost" onClick={onContinue}>继续下</button></div>
  </aside>
}
