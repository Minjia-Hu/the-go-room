// Mulberry32 algorithm reference and attribution: THIRD_PARTY_NOTICES.md.
/** 返回 [0, 1) 之间随机数的函数,接口同 Math.random。 */
export type Rng = () => number

/** 一次随机数及可保存的后继状态，便于陪练重试同一个回合。 */
export function nextRandom(state: number): { value: number; state: number } {
  const next = (state + 0x6d2b79f5) >>> 0
  let t = next
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, state: next }
}

/**
 * 可复现的伪随机数生成器(mulberry32)。
 * 同一个种子总是产生同一串数,用于测试和复现电脑的落子。
 */
export function createRng(seed: number): Rng {
  let state = seed >>> 0
  return () => {
    const next = nextRandom(state)
    state = next.state
    return next.value
  }
}
