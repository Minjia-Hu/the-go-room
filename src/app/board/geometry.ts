import type { Point } from '../../engine'

/** 星位坐标。9 路是四个三三和天元;13 路及以上用四四。 */
export function starPoints(size: number): Point[] {
  if (size < 7) return []
  const edge = size >= 13 ? 3 : 2
  const far = size - 1 - edge
  const points = [
    { x: edge, y: edge },
    { x: far, y: edge },
    { x: edge, y: far },
    { x: far, y: far },
  ]
  if (size % 2 === 1 && size >= 9) {
    const mid = (size - 1) / 2
    points.push({ x: mid, y: mid })
  }
  return points
}

/** 交叉点的无障碍名称,测试也用它找到对应的点。 */
export function pointLabel(p: Point): string {
  return `交叉点 ${p.x},${p.y}`
}
