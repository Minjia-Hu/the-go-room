/** 首页的静态装饰，不承担教学局面或交互。 */
export function RoomIllustration() {
  const lines = Array.from({ length: 7 }, (_, i) => 48 + i * 36)
  const stones = [
    [120, 120, 'black'], [156, 120, 'black'], [156, 156, 'black'],
    [192, 156, 'black'], [120, 156, 'white'], [120, 192, 'white'],
    [156, 192, 'white'], [228, 84, 'white'],
  ] as const
  return <div className="room-illustration" aria-hidden="true">
    <span className="room-illustration__caption">一方棋盘，慢慢探索</span>
    <svg viewBox="0 0 312 312" focusable="false">
      <rect className="room-illustration__wood" x="15" y="15" width="282" height="282" rx="4" />
      {lines.map((v) => <g key={v} className="room-illustration__grid"><path d={`M48 ${v}H264 M${v} 48V264`} /></g>)}
      {[84, 228].flatMap((x) => [84, 228].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="2.5" fill="#8d7956" />))}
      <circle cx="156" cy="156" r="2.5" fill="#8d7956" />
      {stones.map(([x, y, color]) => <g key={`${x}-${y}`}>
        <circle cx={x + 1} cy={y + 3} r="16" fill="#483a24" opacity=".18" />
        <circle className={`room-illustration__stone--${color}`} cx={x} cy={y} r="16" />
        <ellipse cx={x - 4} cy={y - 5} rx="6" ry="4" fill="#fff" opacity={color === 'black' ? '.1' : '.7'} />
      </g>)}
      <circle cx="192" cy="192" r="11" fill="none" stroke="#426353" strokeWidth="1.5" strokeDasharray="3 4" />
    </svg>
    <span className="room-illustration__note">黑白之间，自有天地。</span>
  </div>
}
