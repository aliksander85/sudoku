import { PEERS } from './grid.ts'
import type { Cell, Grid } from './types.ts'

export function findConflicts(values: Grid): boolean[] {
  return values.map((v, i) => v !== 0 && PEERS[i].some((p) => values[p] === v))
}

export function isSolved(cells: readonly Cell[], solution: Grid): boolean {
  return cells.every((c, i) => c.value === solution[i])
}

// counts[d] = occurrences of digit d; counts[0] = number of empty cells
export function digitCounts(values: Grid): number[] {
  const counts = new Array<number>(10).fill(0)
  for (const v of values) counts[v]++
  return counts
}
