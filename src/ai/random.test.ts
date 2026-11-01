import { describe, expect, it } from 'vitest'
import { createRng } from './random'

describe('createRng', () => {
  it('同一种子产生同一串数', () => {
    const a = createRng(42)
    const b = createRng(42)
    const seqA = [a(), a(), a()]
    const seqB = [b(), b(), b()]
    expect(seqA).toEqual(seqB)
  })

  it('不同种子产生不同的数', () => {
    expect(createRng(1)()).not.toBe(createRng(2)())
  })

  it('输出在 [0, 1) 之间', () => {
    const rng = createRng(7)
    for (let i = 0; i < 1000; i++) {
      const v = rng()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})
