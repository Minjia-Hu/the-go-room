/** 返回 [0, 1) 之间随机数的函数,接口同 Math.random。 */
export type Rng = () => number

/**
 * 可复现的伪随机数生成器(mulberry32)。
 * 同一个种子总是产生同一串数,用于测试和复现电脑的落子。
 */
export function createRng(seed: number): Rng {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
