import type { ActionAnalysis, GroupFact } from './analysis'
import type { BoardMark } from '../board/marks'
import { REJECTIONS } from '../play/match'
import { getGroup } from '../../engine'

export function explainAction(a: ActionAnalysis): string {
  if (!a.ok) return REJECTIONS[a.reason]
  if (!a.point) return `这一回合不落子，现有危险不会因此消失。${a.after.phase === 'scoring' ? '白棋上一手已停，确认后进入死子标记。' : '电脑可能继续下。'}`
  const parts: string[] = []
  if (a.dangers.length) parts.push(`这一步合法，但仍有 ${a.dangers.length} 块黑棋能被白棋下一手直接提走。圈出的棋只剩 A 一口气。`)
  if (a.rescued.length) {
    const old = a.rescued[0]
    const current = getGroup(a.after.board, old.stones[0])!
    parts.push(`暂时解除了 ${a.rescued.length} 块棋的直接危险。原来的目标棋块从 ${old.liberties.length} 口气变成 ${current.liberties.length} 口气。`)
  }
  if (a.connected >= 2) parts.push(`原来的 ${a.connected} 块棋连成了一块，共用所有的气。`)
  const last = a.after.history.at(-1)
  if (last?.kind === 'play' && last.captured.length) parts.push(`这一步提走 ${last.captured.length} 颗白棋，腾出了空点。`)
  parts.push(`落子所在棋块有 ${a.own?.liberties.length ?? 0} 口气。`)
  if (!a.dangers.length) parts.push('未发现白棋下一手能直接提走的黑棋，这不代表以后一定安全。')
  return parts.join('')
}

export function groupMarks(group: GroupFact | null | undefined, showLiberties = true): BoardMark[] {
  if (!group) return []
  const stones = group.stones.map((point): BoardMark => ({ point, kind: 'target' }))
  if (!showLiberties) return stones
  return [
    ...stones,
    ...group.liberties.map((point): BoardMark => ({ point, kind: 'liberty' })),
    ...(group.liberties.length === 1 ? [{ point: group.liberties[0], kind: 'label' as const, text: 'A' }] : []),
  ]
}
