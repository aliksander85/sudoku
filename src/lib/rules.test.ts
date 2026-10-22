import { describe, it, expect } from 'vitest'
import { digitCounts, findConflicts, isSolved } from './rules.ts'
import { parseGrid } from './grid.ts'
import type { Cell, Grid } from './types.ts'

const SOLUTION = parseGrid(
  '534678912672195348198342567859761423426853791713924856961537284287419635345286179',
)
const EMPTY = (): Grid => parseGrid('.'.repeat(81))

const toCells = (grid: Grid): Cell[] =>
  grid.map((value) => ({ value, notes: 0, given: false, hinted: false }))

const flagged = (flags: boolean[]) => flags.flatMap((f, i) => (f ? [i] : []))

describe('findConflicts', () => {
  it('flags nothing on a valid full grid', () => {
    expect(flagged(findConflicts(SOLUTION))).toEqual([])
  })

  it('flags nothing on an empty grid', () => {
    expect(flagged(findConflicts(EMPTY()))).toEqual([])
  })

  it('flags both cells of a row duplicate', () => {
    const g = EMPTY()
    g[0] = 5
    g[8] = 5
    expect(flagged(findConflicts(g))).toEqual([0, 8])
  })

  it('flags both cells of a column duplicate', () => {
    const g = EMPTY()
    g[3] = 7
    g[75] = 7
    expect(flagged(findConflicts(g))).toEqual([3, 75])
  })

  it('flags both cells of a box duplicate', () => {
    const g = EMPTY()
    g[0] = 2
    g[20] = 2
    expect(flagged(findConflicts(g))).toEqual([0, 20])
  })

  it('does not flag equal digits that are not peers', () => {
    const g = EMPTY()
    g[0] = 4
    g[10 + 1] = 4 // same box → conflict
    g[40] = 4 // not a peer of either
    expect(flagged(findConflicts(g))).toEqual([0, 11])
  })
})

describe('isSolved', () => {
  it('is true when all values match the solution', () => {
    expect(isSolved(toCells(SOLUTION), SOLUTION)).toBe(true)
  })

  it('is false when a cell is wrong', () => {
    const g = [...SOLUTION]
    g[80] = 1
    expect(isSolved(toCells(g), SOLUTION)).toBe(false)
  })

  it('is false when a cell is empty', () => {
    const g = [...SOLUTION]
    g[0] = 0
    expect(isSolved(toCells(g), SOLUTION)).toBe(false)
  })
})

describe('digitCounts', () => {
  it('counts 9 of each digit and no empties on a full grid', () => {
    expect(digitCounts(SOLUTION)).toEqual([0, 9, 9, 9, 9, 9, 9, 9, 9, 9])
  })

  it('counts 81 empties on an empty grid', () => {
    expect(digitCounts(EMPTY())).toEqual([81, 0, 0, 0, 0, 0, 0, 0, 0, 0])
  })

  it('counts a partial grid', () => {
    const g = EMPTY()
    g[0] = 3
    g[5] = 3
    g[9] = 1
    expect(digitCounts(g)).toEqual([78, 1, 0, 2, 0, 0, 0, 0, 0, 0])
  })
})
