import { describe, it, expect } from 'vitest'
import { mulberry32, randInt, shuffle } from './rng.ts'

const take = (rng: () => number, n: number) =>
  Array.from({ length: n }, () => rng())

describe('mulberry32', () => {
  it('gives the same first 10 values for the same seed', () => {
    expect(take(mulberry32(12345), 10)).toEqual(take(mulberry32(12345), 10))
  })

  it('gives different sequences for different seeds', () => {
    expect(take(mulberry32(1), 10)).not.toEqual(take(mulberry32(2), 10))
  })

  it('returns values in [0, 1)', () => {
    const rng = mulberry32(42)
    for (let k = 0; k < 10_000; k++) {
      const v = rng()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})

describe('randInt', () => {
  it('stays in [0, n) over 10k draws', () => {
    const rng = mulberry32(7)
    for (let k = 0; k < 10_000; k++) {
      const v = randInt(rng, 9)
      expect(Number.isInteger(v)).toBe(true)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(9)
    }
  })
})

describe('shuffle', () => {
  it('returns a permutation of the input', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    const out = shuffle(mulberry32(99), input)
    expect([...out].sort((a, b) => a - b)).toEqual(input)
  })

  it('does not mutate its input', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    const copy = [...input]
    shuffle(mulberry32(5), input)
    expect(input).toEqual(copy)
  })

  it('is deterministic for a given seed', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    expect(shuffle(mulberry32(3), input)).toEqual(shuffle(mulberry32(3), input))
  })
})
