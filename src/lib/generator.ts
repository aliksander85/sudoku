import { mulberry32, randInt, shuffle } from './rng.ts'
import { countSolutions, solveRandom } from './solver.ts'
import type { Difficulty, Grid, Puzzle } from './types.ts'

interface GivensRange {
  min: number
  max: number
}

export const GIVENS_RANGE: Readonly<Record<Difficulty, GivensRange>> = {
  easy: { min: 36, max: 40 },
  medium: { min: 32, max: 35 },
  hard: { min: 28, max: 31 },
  expert: { min: 24, max: 27 },
}

export const MAX_ATTEMPTS: Readonly<Record<Difficulty, number>> = {
  easy: 10,
  medium: 20,
  hard: 30,
  expert: 50,
}

// 180° rotational pairs; the center cell (40) is its own pair.
const PAIRS: readonly (readonly number[])[] = Array.from({ length: 41 }, (_, i) =>
  i === 40 ? [40] : [i, 80 - i],
)

const distanceToRange = (count: number, { min, max }: GivensRange): number =>
  Math.max(0, min - count, count - max)

export function generatePuzzle(difficulty: Difficulty, seed: number): Puzzle {
  const rng = mulberry32(seed)
  const range = GIVENS_RANGE[difficulty]
  let best: { givens: Grid; solution: Grid; distance: number } | null = null

  for (let attempt = 0; attempt < MAX_ATTEMPTS[difficulty]; attempt++) {
    // An empty grid always has a solution.
    const solution = solveRandom(new Array(81).fill(0), rng)!
    const target = range.min + randInt(rng, range.max - range.min + 1)
    const givens = [...solution]
    let count = 81

    for (const pair of shuffle(rng, PAIRS)) {
      if (count <= target) break
      if (count - pair.length < range.min) continue
      for (const i of pair) givens[i] = 0
      if (countSolutions(givens, 2) === 1) {
        count -= pair.length
      } else {
        for (const i of pair) givens[i] = solution[i]
      }
    }

    const distance = distanceToRange(count, range)
    if (best === null || distance < best.distance) best = { givens, solution, distance }
    if (distance === 0) break
  }

  return {
    id: `${difficulty}-${seed}`,
    difficulty,
    seed: seed >>> 0,
    givens: best!.givens,
    solution: best!.solution,
  }
}
