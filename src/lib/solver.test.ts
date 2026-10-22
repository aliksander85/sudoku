import { describe, it, expect } from 'vitest'
import { CONFLICTING, EASY, EMPTY, MULTI_SOLUTION, VERY_HARD } from './__fixtures__/puzzles.ts'
import { parseGrid } from './grid.ts'
import { mulberry32 } from './rng.ts'
import { countSolutions, solve, solveRandom } from './solver.ts'
import { findConflicts } from './rules.ts'
import type { Grid } from './types.ts'

const isFullValid = (g: Grid | null): boolean =>
  g !== null && g.length === 81 && g.every((v) => v !== 0) && !findConflicts(g).some(Boolean)

describe('solve', () => {
  it('solves the easy fixture to its known solution', () => {
    expect(solve(parseGrid(EASY.puzzle))).toEqual(parseGrid(EASY.solution))
  })

  it('solves the very hard fixture to its known solution', () => {
    expect(solve(parseGrid(VERY_HARD.puzzle))).toEqual(parseGrid(VERY_HARD.solution))
  })

  it('does not mutate its input', () => {
    const grid = parseGrid(EASY.puzzle)
    const copy = [...grid]
    solve(grid)
    expect(grid).toEqual(copy)
  })

  it('returns a valid solution for a multi-solution puzzle', () => {
    const grid = parseGrid(MULTI_SOLUTION)
    const result = solve(grid)
    expect(isFullValid(result)).toBe(true)
    grid.forEach((v, i) => {
      if (v !== 0) expect(result![i]).toBe(v)
    })
  })

  it('returns null for conflicting input', () => {
    expect(solve(parseGrid(CONFLICTING))).toBeNull()
  })

  it('returns the grid itself (equal) when already solved', () => {
    expect(solve(parseGrid(EASY.solution))).toEqual(parseGrid(EASY.solution))
  })
})

describe('countSolutions', () => {
  it('returns 1 for unique puzzles', () => {
    expect(countSolutions(parseGrid(EASY.puzzle))).toBe(1)
    expect(countSolutions(parseGrid(VERY_HARD.puzzle))).toBe(1)
  })

  it('returns 2 for a multi-solution puzzle', () => {
    expect(countSolutions(parseGrid(MULTI_SOLUTION))).toBe(2)
  })

  it('returns 0 for conflicting input', () => {
    expect(countSolutions(parseGrid(CONFLICTING))).toBe(0)
  })

  it('returns 2 for the empty grid', () => {
    expect(countSolutions(parseGrid(EMPTY))).toBe(2)
  })

  it('stops at the limit', () => {
    expect(countSolutions(parseGrid(EMPTY), 5)).toBe(5)
    expect(countSolutions(parseGrid(MULTI_SOLUTION), 1)).toBe(1)
  })
})

describe('solveRandom', () => {
  it('produces valid full grids from the empty grid', () => {
    expect(isFullValid(solveRandom(parseGrid(EMPTY), mulberry32(1)))).toBe(true)
  })

  it('gives different grids for different seeds', () => {
    const grids = [1, 2, 3, 4, 5].map((s) => solveRandom(parseGrid(EMPTY), mulberry32(s))!.join(''))
    expect(new Set(grids).size).toBe(grids.length)
    grids.forEach((g) => expect(isFullValid(parseGrid(g))).toBe(true))
  })

  it('is deterministic for the same seed', () => {
    const a = solveRandom(parseGrid(EMPTY), mulberry32(42))
    const b = solveRandom(parseGrid(EMPTY), mulberry32(42))
    expect(a).toEqual(b)
  })

  it('keeps the givens', () => {
    const grid = parseGrid(MULTI_SOLUTION)
    const result = solveRandom(grid, mulberry32(7))
    expect(isFullValid(result)).toBe(true)
    grid.forEach((v, i) => {
      if (v !== 0) expect(result![i]).toBe(v)
    })
  })

  it('returns null for conflicting input', () => {
    expect(solveRandom(parseGrid(CONFLICTING), mulberry32(1))).toBeNull()
  })
})

describe('performance', () => {
  it('solves the very hard fixture in under 50 ms', () => {
    const grid = parseGrid(VERY_HARD.puzzle)
    solve(grid) // warm-up
    const start = performance.now()
    solve(grid)
    expect(performance.now() - start).toBeLessThan(50)
  })
})
