import { formatTime } from '../format.ts'
import { colOf, rowOf } from '../grid.ts'
import type { GameState } from '../types.ts'
import { MISTAKE_LIMIT } from './reducer.ts'
import { getConflicts } from './selectors.ts'

const where = (index: number): string => `row ${rowOf(index) + 1}, column ${colOf(index) + 1}`

// Screen-reader message for the transition prev → next (§6.5), or null when nothing is worth announcing
export function announce(prev: GameState, next: GameState): string | null {
  if (prev.puzzle !== next.puzzle) return null
  if (next.status !== prev.status) {
    if (next.status === 'won') return `You won. Time ${formatTime(next.elapsedMs)}`
    if (next.status === 'lost') return 'Game over. Too many mistakes'
    if (next.status === 'paused') return 'Paused'
    if (prev.status === 'paused' && next.status === 'playing') return 'Resumed'
  }

  const changed: number[] = []
  next.cells.forEach((cell, i) => {
    if (cell !== prev.cells[i] && cell.value !== prev.cells[i].value && cell.value !== 0) changed.push(i)
  })

  if (next.hintsUsed > prev.hintsUsed) {
    const i = changed.find((k) => next.cells[k].hinted)
    return i === undefined ? null : `Hint: ${where(i)}, ${next.cells[i].value}`
  }

  const messages: string[] = []
  if (next.mistakes > prev.mistakes && changed.length > 0) {
    const limit = next.mistakeMode === 'limit' ? `. Mistake ${next.mistakes} of ${MISTAKE_LIMIT}` : ''
    messages.push(`Wrong digit at ${where(changed[0])}${limit}`)
  }
  const conflicts = getConflicts(next.cells)
  const clash = changed.find((i) => conflicts[i])
  if (clash !== undefined) messages.push(`Conflict at ${where(clash)}`)
  return messages.length > 0 ? messages.join('. ') : null
}
