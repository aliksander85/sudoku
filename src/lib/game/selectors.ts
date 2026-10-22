import { maskToDigits } from '../candidates.ts'
import { PEERS, colOf, rowOf } from '../grid.ts'
import { findConflicts } from '../rules.ts'
import type { Cell, GameState } from '../types.ts'

// Bit-flags keep the per-cell store selector a primitive, so unchanged cells skip re-rendering
export const CELL_FLAG = {
  selected: 1,
  peer: 2,
  sameDigit: 4,
  conflict: 8,
  wrong: 16,
} as const

let lastCells: readonly Cell[] | null = null
let lastConflicts: boolean[] = []

export function getConflicts(cells: readonly Cell[]): boolean[] {
  if (cells !== lastCells) {
    lastConflicts = findConflicts(cells.map((c) => c.value))
    lastCells = cells
  }
  return lastConflicts
}

function isWrong(state: GameState, index: number): boolean {
  const cell = state.cells[index]
  return (
    state.mistakeMode !== 'off' &&
    !cell.given &&
    !cell.hinted &&
    cell.value !== 0 &&
    cell.value !== state.puzzle.solution[index]
  )
}

export function cellFlags(
  state: GameState,
  index: number,
  conflicts: readonly boolean[] = getConflicts(state.cells),
): number {
  const { selected, cells } = state
  const isSelected = selected === index
  const hasOther = selected !== null && !isSelected
  const selectedValue = selected === null ? 0 : cells[selected].value
  let flags = 0
  if (isSelected) flags |= CELL_FLAG.selected
  if (hasOther && PEERS[selected].includes(index)) flags |= CELL_FLAG.peer
  if (hasOther && selectedValue !== 0 && cells[index].value === selectedValue) {
    flags |= CELL_FLAG.sameDigit
  }
  if (conflicts[index]) flags |= CELL_FLAG.conflict
  if (isWrong(state, index)) flags |= CELL_FLAG.wrong
  return flags
}

// remaining[d] = how many more copies of digit d can still be placed (index 0 unused)
export function remainingDigits(state: GameState): number[] {
  const remaining = new Array<number>(10).fill(9)
  const countAll = state.mistakeMode === 'off'
  state.cells.forEach((cell, i) => {
    if (cell.value === 0) return
    const counts = countAll || cell.given || cell.hinted || cell.value === state.puzzle.solution[i]
    if (counts) remaining[cell.value] = Math.max(0, remaining[cell.value] - 1)
  })
  return remaining
}

export function cellLabel(
  state: GameState,
  index: number,
  conflicts: readonly boolean[] = getConflicts(state.cells),
): string {
  const cell = state.cells[index]
  const parts = [`Row ${rowOf(index) + 1}`, `column ${colOf(index) + 1}`]
  if (cell.value === 0) {
    parts.push('empty')
    if (cell.notes !== 0) parts.push(`notes ${maskToDigits(cell.notes).join(' ')}`)
  } else {
    parts.push(String(cell.value))
    if (cell.given) parts.push('given')
    else if (cell.hinted) parts.push('hinted')
  }
  if (isWrong(state, index)) parts.push('wrong')
  if (conflicts[index]) parts.push('conflict')
  return parts.join(', ')
}
