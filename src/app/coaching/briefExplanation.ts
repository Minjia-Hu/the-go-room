import { getGroup } from '../../engine'
import type { ActionAnalysis } from './analysis'
import { REJECTIONS } from '../play/match'

/** 棋盘旁的一句话保留最关键后果，危险优先于提子或连接收益。 */
export function briefExplanation(a: ActionAnalysis): string {
  if (!a.ok) return REJECTIONS[a.reason]
  if (!a.point) return a.after.phase === 'scoring' ? '白棋已停手；你确认停手后，一起标记死子。' : '停手不会解除棋块的危险，电脑也可能继续下。'
  if (a.dangers.length) return `这手能下，但仍有 ${a.dangers.length} 块黑棋会被白棋下一手直接提走。`
  if (a.rescued.length) {
    const old = a.rescued[0]
    return `目标棋块从 ${old.liberties.length} 口气变为 ${getGroup(a.after.board, old.stones[0])!.liberties.length} 口气，暂时解除直接被提的危险。`
  }
  if (a.connected >= 2) return `${a.connected} 块棋连成一块，共用 ${a.own?.liberties.length ?? 0} 口气；仍要留意后续变化。`
  const last = a.after.history.at(-1)
  if (last?.kind === 'play' && last.captured.length) return `这手提走 ${last.captured.length} 颗白棋，为黑棋腾出空点。`
  return `落下的棋块有 ${a.own?.liberties.length ?? 0} 口气；未发现黑棋下一手被直接提走的危险。`
}
