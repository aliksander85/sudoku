import type { CellValue, Digit } from './types.ts'

export function rowOf(i: number): number {
  return Math.floor(i / 9)
}

export function colOf(i: number): number {
  return i % 9
}

export function boxOf(i: number): number {
  return Math.floor(rowOf(i) / 3) * 3 + Math.floor(colOf(i) / 3)
}

const range = (n: number) => Array.from({ length: n }, (_, k) => k)

export const ROWS: readonly (readonly number[])[] = range(9).map((r) =>
  range(9).map((c) => r * 9 + c),
)

export const COLS: readonly (readonly number[])[] = range(9).map((c) =>
  range(9).map((r) => r * 9 + c),
)

export const BOXES: readonly (readonly number[])[] = range(9).map((b) =>
  range(81).filter((i) => boxOf(i) === b),
)

export const UNITS: readonly (readonly number[])[] = [...ROWS, ...COLS, ...BOXES]

export const UNITS_OF: readonly (readonly (readonly number[])[])[] = range(81).map((i) => [
  ROWS[rowOf(i)],
  COLS[colOf(i)],
  BOXES[boxOf(i)],
])

export const PEERS: readonly (readonly number[])[] = range(81).map((i) =>
  [...new Set(UNITS_OF[i].flat())].filter((p) => p !== i).sort((a, b) => a - b),
)

export function parseGrid(str: string): CellValue[] {
  if (str.length !== 81) {
    throw new Error(`Grid must be 81 characters, got ${str.length}`)
  }
  return Array.from(str, (ch, i) => {
    if (ch === '.' || ch === '0') return 0
    if (ch >= '1' && ch <= '9') return Number(ch) as Digit
    throw new Error(`Invalid character ${JSON.stringify(ch)} at index ${i}`)
  })
}

export function serializeGrid(grid: readonly CellValue[]): string {
  if (grid.length !== 81) {
    throw new Error(`Grid must have 81 cells, got ${grid.length}`)
  }
  return grid.map((v) => (v === 0 ? '.' : String(v))).join('')
}
