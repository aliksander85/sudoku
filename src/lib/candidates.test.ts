import { describe, it, expect } from 'vitest'
import { ALL, bit, candidatesFor, maskToDigits, popcount } from './candidates.ts'
import { parseGrid } from './grid.ts'

const PUZZLE = parseGrid(
  '53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79',
)

describe('mask helpers', () => {
  it('popcount counts set bits', () => {
    expect(popcount(0)).toBe(0)
    expect(popcount(bit(1) | bit(9))).toBe(2)
    expect(popcount(ALL)).toBe(9)
  })

  it('maskToDigits lists digits in ascending order', () => {
    expect(maskToDigits(0)).toEqual([])
    expect(maskToDigits(bit(2) | bit(4) | bit(9))).toEqual([2, 4, 9])
    expect(maskToDigits(ALL)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
  })
})

describe('candidatesFor', () => {
  it('returns all digits on an empty grid', () => {
    expect(candidatesFor(parseGrid('.'.repeat(81)), 40)).toBe(ALL)
  })

  it('matches a hand-checked cell', () => {
    // row 0 has 5,3,7; column 2 has 8; box 0 has 5,3,6,9,8 → {1,2,4}
    expect(maskToDigits(candidatesFor(PUZZLE, 2))).toEqual([1, 2, 4])
  })

  it('ignores the cell\'s own value', () => {
    // cell 0 holds 5; its candidates are computed from peers only
    expect(maskToDigits(candidatesFor(PUZZLE, 0))).toEqual([1, 2, 5])
  })

  it('returns 0 when every digit is taken by a peer', () => {
    const grid = parseGrid('.'.repeat(81))
    // fill the rest of row 0 with 1..8 and put 9 in column 0
    for (let c = 1; c < 9; c++) grid[c] = c as 1
    grid[9] = 9
    expect(candidatesFor(grid, 0)).toBe(0)
  })
})
