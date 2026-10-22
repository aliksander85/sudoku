import { describe, it, expect } from 'vitest'
import type { Cell, Digit } from './types.ts'

describe('types', () => {
  it('Digit and Cell accept the expected values', () => {
    const digit: Digit = 9
    const empty: Cell = 0
    expect([digit, empty]).toEqual([9, 0])
  })
})
