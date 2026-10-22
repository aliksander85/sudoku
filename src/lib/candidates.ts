import { PEERS } from './grid.ts'
import type { Digit, Grid } from './types.ts'

export const ALL = 0x1ff

export const bit = (d: number): number => 1 << (d - 1)

export const POPCOUNT: readonly number[] = Array.from({ length: 512 }, (_, m) => {
  let n = 0
  for (let x = m; x; x &= x - 1) n++
  return n
})

const MASK_DIGITS: readonly (readonly Digit[])[] = Array.from({ length: 512 }, (_, m) =>
  ([1, 2, 3, 4, 5, 6, 7, 8, 9] as const).filter((d) => m & bit(d)),
)

export function popcount(mask: number): number {
  return POPCOUNT[mask]
}

export function maskToDigits(mask: number): readonly Digit[] {
  return MASK_DIGITS[mask]
}

export function candidatesFor(grid: Grid, i: number): number {
  let used = 0
  for (const p of PEERS[i]) {
    if (grid[p] !== 0) used |= bit(grid[p])
  }
  return ALL & ~used
}
