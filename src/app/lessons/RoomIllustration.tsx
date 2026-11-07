import { useId } from 'react'

/** 首页的静态棋书插图；可操作的局面由正式课程提供。 */
export function RoomIllustration() {
  const id = useId()
  const lines = Array.from({ length: 9 }, (_, i) => 36 + i * 32)
  const stones = [[3, 4, 'white'], [4, 3, 'white'], [5, 4, 'white'], [4, 4, 'black']] as const
  return <figure className="room-illustration">
    <p className="figure-number">图 01 / 一口气</p>
    <svg viewBox="0 0 328 328" role="img" aria-label="九路棋盘插图：中间黑棋的上、左、右被白棋挡住，仅剩下方 A 一口气。" focusable="false">
      <defs>
        <radialGradient id={`${id}-black`} cx=".32" cy=".24" r=".8"><stop stopColor="#51575b" /><stop offset=".6" stopColor="#242c31" /><stop offset="1" stopColor="#151a1e" /></radialGradient>
        <radialGradient id={`${id}-white`} cx=".3" cy=".2" r=".85"><stop stopColor="#fff" /><stop offset=".7" stopColor="#faf9f4" /><stop offset="1" stopColor="#d8d8d0" /></radialGradient>
      </defs>
      <rect className="room-illustration__wood" x="1" y="1" width="326" height="326" />
      <g className="room-illustration__grid">{lines.map((v) => <path key={v} d={`M36 ${v}H292 M${v} 36V292`} />)}</g>
      {[[2, 2], [6, 2], [4, 4], [2, 6], [6, 6]].map(([x, y]) => <circle key={`${x}-${y}`} className="board__star" cx={36 + x * 32} cy={36 + y * 32} r="2.1" />)}
      {stones.map(([x, y, color]) => <g key={`${x}-${y}`}>
        <circle cx={37 + x * 32} cy={38 + y * 32} r="14.6" fill="#302e29" opacity=".18" />
        <circle cx={36 + x * 32} cy={36 + y * 32} r="14.6" fill={`url(#${id}-${color})`} />
      </g>)}
      <circle cx="164" cy="164" r="10" className="board__target" />
      <circle cx="164" cy="196" r="10" className="board__label-bg" />
      <text x="164" y="196.5" className="board__label">A</text>
      <text x="164" y="316" className="room-illustration__size">9 × 9</text>
    </svg>
    <figcaption><strong>棋子的出路，藏在相邻的空点里。</strong><span>先观察 A，再想一想落子之后会怎样。</span></figcaption>
  </figure>
}
