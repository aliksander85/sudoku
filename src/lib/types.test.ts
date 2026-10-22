import { describe, it, expect } from 'vitest'
import type { CellValue, Digit } from './types.ts'

describe('types', () => {
  it('Digit and CellValue accept the expected values', () => {
    const digit: Digit = 9
    const empty: CellValue = 0
    expect([digit, empty]).toEqual([9, 0])
  })
})
