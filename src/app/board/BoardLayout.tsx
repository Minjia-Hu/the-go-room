import type { ReactNode } from 'react'

interface Props {
  readonly heading: ReactNode
  readonly board: ReactNode
  readonly primary?: ReactNode
  readonly children: ReactNode
}
/** 同一套内容：手机按任务、棋盘、操作排列，桌面保持左右棋书版面。 */
export function BoardLayout({ heading, board, primary, children }: Props) {
  return <section className="page page--with-board board-flow">
    <header className="board-task">{heading}</header>
    <div className="board-frame">{board}</div>
    {primary && <div className="board-primary">{primary}</div>}
    <div className="panel board-detail">{children}</div>
  </section>
}
