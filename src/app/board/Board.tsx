import { useId, useState } from 'react'
import { getCell } from '../../engine'
import type { Board as BoardData, Color, Point } from '../../engine'
import { pointLabel, starPoints } from './geometry'
import type { BoardMark } from './marks'

export interface BoardProps {
  readonly board: BoardData
  /** 最后一手,画一个圈。 */
  readonly lastMove?: Point | null
  readonly marks?: readonly BoardMark[]
  /** 鼠标悬停在空点上时预览这个颜色的棋子;null 不预览。 */
  readonly ghostColor?: Color | null
  /** 不响应点击,也不显示预览。 */
  readonly disabled?: boolean
  readonly onPointClick?: (point: Point) => void
}

/** 相邻两条线的距离,SVG 里的所有长度都以它为基准。 */
const UNIT = 24
const MARGIN = UNIT * 0.75
const STONE_RADIUS = UNIT * 0.47
const MARK_RADIUS = UNIT * 0.3
const DOT_RADIUS = UNIT * 0.16
const STAR_RADIUS = UNIT * 0.09

export function Board({ board, lastMove, marks = [], ghostColor = null, disabled = false, onPointClick }: BoardProps) {
  const [hovered, setHovered] = useState<Point | null>(null)
  const surfaceId = useId()
  const { size } = board
  const span = (size - 1) * UNIT
  const total = span + MARGIN * 2
  const viewBox = `${-MARGIN} ${-MARGIN} ${total} ${total}`
  const at = (i: number) => i * UNIT

  const indexes = Array.from({ length: size }, (_, i) => i)
  const showGhost =
    !disabled && ghostColor !== null && hovered !== null && getCell(board, hovered) === null
  // 字母与讲解对应，必须盖在已选圆点之上，避免选中气后看不见 A / B。
  const orderedMarks = [...marks.filter((mark) => mark.kind !== 'label'), ...marks.filter((mark) => mark.kind === 'label')]

  return (
    <svg
      className={disabled ? 'board board--disabled' : 'board'}
      viewBox={viewBox}
      role="group"
      aria-label={`${size} 路棋盘`}
      onMouseLeave={() => setHovered(null)}
    >
      <defs>
        <linearGradient id={`${surfaceId}-wood`} x2="1" y2="1">
          <stop stopColor="#fdfbf6" /><stop offset="1" stopColor="#f4efe3" />
        </linearGradient>
        <radialGradient id={`${surfaceId}-black`} cx=".32" cy=".26" r=".75">
          <stop stopColor="#4a4640" /><stop offset=".6" stopColor="#1e1c19" /><stop offset="1" stopColor="#0c0b0a" />
        </radialGradient>
        <radialGradient id={`${surfaceId}-white`} cx=".32" cy=".26" r=".8">
          <stop stopColor="#fffdf8" /><stop offset=".7" stopColor="#f3eee2" /><stop offset="1" stopColor="#d9d2c2" />
        </radialGradient>
      </defs>
      <rect className="board__wood" fill={`url(#${surfaceId}-wood)`} x={-MARGIN} y={-MARGIN} width={total} height={total} />
      {marks.filter((mark) => mark.kind.endsWith('-area')).map((mark) => (
        <rect key={`area-${mark.point.x}-${mark.point.y}`} className={`board__area board__area--${mark.kind}`}
          data-mark={mark.kind} x={at(mark.point.x) - UNIT / 2} y={at(mark.point.y) - UNIT / 2}
          width={UNIT} height={UNIT} />
      ))}
      {indexes.map((i) => (
        <g key={i}>
          <line className="board__line" x1={0} y1={at(i)} x2={span} y2={at(i)} />
          <line className="board__line" x1={at(i)} y1={0} x2={at(i)} y2={span} />
        </g>
      ))}
      {starPoints(size).map((p) => (
        <circle key={`star-${p.x}-${p.y}`} className="board__star" cx={at(p.x)} cy={at(p.y)} r={STAR_RADIUS} />
      ))}
      {board.cells.map((cell, index) => {
        if (cell === null) return null
        const x = index % size
        const y = Math.floor(index / size)
        return (
          <circle
            key={`stone-${index}`}
            className={`board__stone board__stone--${cell}`}
            fill={`url(#${surfaceId}-${cell})`}
            data-stone={cell}
            data-x={x}
            data-y={y}
            cx={at(x)}
            cy={at(y)}
            r={STONE_RADIUS}
          />
        )
      })}
      {showGhost && (
        <circle
          className={`board__stone board__stone--${ghostColor} board__ghost`}
          fill={`url(#${surfaceId}-${ghostColor})`}
          data-ghost={ghostColor}
          cx={at(hovered.x)}
          cy={at(hovered.y)}
          r={STONE_RADIUS}
        />
      )}
      {orderedMarks.map((mark) => {
        const key = `mark-${mark.kind}-${mark.point.x}-${mark.point.y}`
        const cx = at(mark.point.x)
        const cy = at(mark.point.y)
        if (mark.kind.endsWith('-area')) return null
        if (mark.kind === 'label') return <g key={key} data-mark="label" aria-label={`标记 ${mark.text}`}>
          <circle cx={cx} cy={cy} r={7} className="board__label-bg" />
          <text x={cx} y={cy + 0.5} className="board__label">{mark.text}</text>
        </g>
        if (mark.kind === 'target' || mark.kind === 'liberty' || mark.kind === 'preview') {
          return <circle key={key} className={`board__${mark.kind}`} data-mark={mark.kind} cx={cx} cy={cy}
            r={mark.kind === 'preview' ? STONE_RADIUS + 1 : mark.kind === 'target' ? STONE_RADIUS - 3 : 5} />
        }
        if (mark.kind === 'dead') {
          return <path key={key} className="board__dead" data-mark="dead"
            d={`M${cx - 6},${cy - 6}l12,12 M${cx + 6},${cy - 6}l-12,12`} />
        }
        if (mark.kind === 'captured') {
          return <circle key={key} className="board__captured" data-mark="captured" cx={cx} cy={cy} r={MARK_RADIUS} />
        }
        if (mark.kind === 'ring') {
          return <circle key={key} className="board__ring" data-mark="ring" cx={cx} cy={cy} r={MARK_RADIUS} />
        }
        const cls = mark.kind === 'selected' ? 'board__dot board__dot--selected' : 'board__dot'
        return <circle key={key} className={cls} data-mark={mark.kind} cx={cx} cy={cy} r={DOT_RADIUS} />
      })}
      {lastMove && (
        <circle className="board__last" data-mark="last" cx={at(lastMove.x)} cy={at(lastMove.y)} r={MARK_RADIUS} />
      )}
      {indexes.map((y) =>
        indexes.map((x) => {
          const p = { x, y }
          return (
            <rect
              key={`hit-${x}-${y}`}
              className="board__hit"
              role="button"
              aria-label={pointLabel(p)}
              aria-disabled={disabled || undefined}
              tabIndex={disabled ? -1 : 0}
              x={at(x) - UNIT / 2}
              y={at(y) - UNIT / 2}
              width={UNIT}
              height={UNIT}
              onMouseEnter={() => setHovered(p)}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => {
                if (!disabled) onPointClick?.(p)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  if (!disabled) onPointClick?.(p)
                }
              }}
            />
          )
        }),
      )}
    </svg>
  )
}
