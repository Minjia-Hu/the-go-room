import { describe, expect, it } from 'vitest'
import { getCell } from '../../engine'
import { chooseHeroPoint, HERO_POINTS, HERO_TARGET, heroBoard, heroLiberties, heroMarks, startHero } from './heroRunner'

describe('首页一子一气练习', () => {
  it('起始局面：带圈黑棋只剩 A 一口气，A、B 都标出来', () => {
    const run = startHero()
    expect(heroLiberties(run)).toEqual([HERO_POINTS.a])
    const labels = heroMarks(run).filter((mark) => mark.kind === 'label').map((mark) => mark.kind === 'label' && mark.text)
    expect(labels).toEqual(['A', 'B'])
    expect(heroMarks(run).some((mark) => mark.kind === 'liberty')).toBe(false)
  })

  it('提示时只标出那一口气', () => {
    const run = { ...startHero(), hint: true }
    expect(heroMarks(run).filter((mark) => mark.kind === 'liberty').map((mark) => mark.point)).toEqual([HERO_POINTS.a])
  })

  it('接在 A：两颗黑棋连成一块，有三口气', () => {
    const run = chooseHeroPoint(startHero(), HERO_POINTS.a)
    expect(run.choice).toBe('a')
    expect(heroLiberties(run)).toHaveLength(3)
    expect(getCell(heroBoard(run), HERO_POINTS.a)).toBe('black')
    expect(heroLiberties({ ...run, view: 'before' })).toHaveLength(1)
  })

  it('下在 B：还是一口气；白棋占 A 后整块被提走', () => {
    const run = chooseHeroPoint(startHero(), HERO_POINTS.b)
    expect(heroLiberties(run)).toEqual([HERO_POINTS.a])
    const reply = { ...run, view: 'reply' as const }
    expect(heroLiberties(reply)).toBeNull()
    expect(getCell(heroBoard(reply), HERO_TARGET)).toBeNull()
    expect(getCell(heroBoard(reply), HERO_POINTS.a)).toBe('white')
    expect(heroMarks(reply)).toEqual([{ point: HERO_TARGET, kind: 'captured' }])
  })

  it('A、B 以外的点不落子，只提醒比较两点', () => {
    const run = chooseHeroPoint(startHero(), { x: 0, y: 0 })
    expect(run.choice).toBeNull()
    expect(run.notice).toContain('A 和 B')
    expect(chooseHeroPoint(run, HERO_POINTS.a).notice).toBeNull()
  })
})
