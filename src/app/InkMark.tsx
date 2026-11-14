/** 「一子一气」标识：一颗墨子落在棋盘一角，正下方的朱砂点是它最后的一口气。墨色随文字颜色。 */
export function InkMark({ size = 32 }: { readonly size?: number }) {
  return <svg className="ink-mark" width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
    <path className="ink-mark__grid" d="M4 11H36M4 29H36M11 4V36M29 4V36" />
    <circle className="ink-mark__stone" cx="11" cy="11" r="8.4" />
    <circle className="ink-mark__breath" cx="11" cy="29" r="4" />
  </svg>
}
