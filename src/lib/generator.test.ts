import { describe, it, expect } from 'vitest'
import { GIVENS_RANGE, generatePuzzle } from './generator.ts'
import { findConflicts } from './rules.ts'
import { countSolutions, solve } from './solver.ts'
import type { Difficulty, Puzzle } from './types.ts'

const SEEDS = [1, 2, 3, 42, 123, 777, 2024, 31337, 0xdeadbeef, 4294967295]
const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'expert']

const cache = new Map<string, Puzzle>()
function puzzleFor(difficulty: Difficulty, seed: number): Puzzle {
  const key = `${difficulty}-${seed}`
  let p = cache.get(key)
  if (!p) {
    p = generatePuzzle(difficulty, seed)
    cache.set(key, p)
  }
  return p
}

describe.each(DIFFICULTIES)('generatePuzzle (%s)', (difficulty) => {
  it.each(SEEDS)('seed %i satisfies the puzzle properties', (seed) => {
    const p = puzzleFor(difficulty, seed)
    const { min, max } = GIVENS_RANGE[difficulty]
    const count = p.givens.filter((v) => v !== 0).length

    expect(p.id).toBe(`${difficulty}-${seed}`)
    expect(p.difficulty).toBe(difficulty)
    expect(p.seed).toBe(seed >>> 0)

    // unique solution, equal to the stored one
    expect(countSolutions(p.givens, 2)).toBe(1)
    expect(solve(p.givens)).toEqual(p.solution)

    // full valid solution; givens are a subset of it
    expect(p.solution.every((v) => v !== 0)).toBe(true)
    expect(findConflicts(p.solution).some(Boolean)).toBe(false)
    p.givens.forEach((v, i) => {
      if (v !== 0) expect(v).toBe(p.solution[i])
    })

    expect(count).toBeGreaterThanOrEqual(min)
    expect(count).toBeLessThanOrEqual(max)

    // 180° rotational symmetry
    for (let i = 0; i < 81; i++) {
      expect(p.givens[i] === 0).toBe(p.givens[80 - i] === 0)
    }
  })

  it('is reproducible from (difficulty, seed)', () => {
    expect(generatePuzzle(difficulty, SEEDS[0])).toEqual(puzzleFor(difficulty, SEEDS[0]))
  })
})
