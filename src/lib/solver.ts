import { ALL, bit, maskToDigits } from './candidates.ts'
import { boxOf, colOf, rowOf } from './grid.ts'
import { shuffle, type Rng } from './rng.ts'
import type { Digit, Grid } from './types.ts'

interface SearchResult {
  count: number
  first: Grid | null
}

// Backtracking with MRV over per-row/col/box used-digit masks. Stops once
// `limit` solutions are found; with `rng` the digit order is shuffled.
function search(grid: Grid, limit: number, rng?: Rng): SearchResult {
  const work = [...grid]
  const rowUsed = new Array<number>(9).fill(0)
  const colUsed = new Array<number>(9).fill(0)
  const boxUsed = new Array<number>(9).fill(0)
  const empties: number[] = []

  for (let i = 0; i < 81; i++) {
    const v = work[i]
    if (v === 0) {
      empties.push(i)
      continue
    }
    const b = bit(v)
    const r = rowOf(i)
    const c = colOf(i)
    const x = boxOf(i)
    if ((rowUsed[r] | colUsed[c] | boxUsed[x]) & b) return { count: 0, first: null }
    rowUsed[r] |= b
    colUsed[c] |= b
    boxUsed[x] |= b
  }

  const result: SearchResult = { count: 0, first: null }

  function rec(): void {
    let best = -1
    let bestMask = 0
    let bestSize = 10
    for (const i of empties) {
      if (work[i] !== 0) continue
      const mask = ALL & ~(rowUsed[rowOf(i)] | colUsed[colOf(i)] | boxUsed[boxOf(i)])
      const size = maskToDigits(mask).length
      if (size < bestSize) {
        best = i
        bestMask = mask
        bestSize = size
        if (size <= 1) break
      }
    }
    if (best === -1) {
      result.count++
      result.first ??= [...work]
      return
    }
    if (bestSize === 0) return

    const r = rowOf(best)
    const c = colOf(best)
    const x = boxOf(best)
    const digits = rng ? shuffle(rng, maskToDigits(bestMask)) : maskToDigits(bestMask)
    for (const d of digits as readonly Digit[]) {
      const b = bit(d)
      work[best] = d
      rowUsed[r] |= b
      colUsed[c] |= b
      boxUsed[x] |= b
      rec()
      work[best] = 0
      rowUsed[r] &= ~b
      colUsed[c] &= ~b
      boxUsed[x] &= ~b
      if (result.count >= limit) return
    }
  }

  rec()
  return result
}

export function solve(grid: Grid): Grid | null {
  return search(grid, 1).first
}

export function countSolutions(grid: Grid, limit = 2): number {
  return limit <= 0 ? 0 : search(grid, limit).count
}

export function solveRandom(grid: Grid, rng: Rng): Grid | null {
  return search(grid, 1, rng).first
}
