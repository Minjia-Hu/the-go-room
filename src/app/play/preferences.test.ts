import { describe, expect, it } from 'vitest'
import { COACHING_KEY, readCoaching, writeCoaching } from './preferences'
describe('独立陪练偏好', () => {
  it('只接受有版本的布尔值；损坏、访问失败默认开启', () => {
    for (const value of [null, 'null', '{}', '{broken', '{"version":1,"enabled":"false"}']) expect(readCoaching({ getItem: () => value, setItem: () => {} })).toBe(true)
    expect(readCoaching({ getItem: () => '{"version":1,"enabled":false}', setItem: () => {} })).toBe(false)
    expect(readCoaching({ getItem: () => { throw new Error('blocked') }, setItem: () => {} })).toBe(true)
  })
  it('仅写偏好键，写失败返回 false', () => {
    let key = ''
    expect(writeCoaching({ getItem: () => null, setItem: (k) => { key = k } }, false)).toBe(true)
    expect(key).toBe(COACHING_KEY)
    expect(writeCoaching({ getItem: () => null, setItem: () => { throw new Error('full') } }, false)).toBe(false)
  })
})
