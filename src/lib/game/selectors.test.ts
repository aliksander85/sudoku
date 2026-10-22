import { describe, it, expect } from 'vitest'
import { EASY } from '../__fixtures__/puzzles.ts'
import { parseGrid } from '../grid.ts'
import { createGame } from './createGame.ts'
import { CELL_FLAG, cellFlags, cellLabel, getConflicts, remainingDigits } from './selectors.ts'
import type { Cell, GameState, MistakeMode } from '../types.ts'

const puzzle = {
  id: 'easy-0',
  difficulty: 'easy' as const,
  seed: 0,
  givens: parseGrid(EASY.puzzle.replaceAll('.', '0')),
  solution: parseGrid(EASY.solution),
}
// EASY: index 2 is empty (solution 4), index 0 is given 5, index 3 is empty (solution 6)
const game = (mode: MistakeMode = 'check', patch: Record<number, Partial<Cell>> = {}): GameState => {
  const g = createGame(puzzle, mode)
  const cells = g.cells.map((c, i) => (patch[i] ? { ...c, ...patch[i] } : c))
  return { ...g, cells }
}

describe('getConflicts', () => {
  it('returns the same array for the same cells ref and a new one for new cells', () => {
    const g = game()
    expect(getConflicts(g.cells)).toBe(getConflicts(g.cells))
    const g2 = game('check', { 2: { value: 5 } })
    expect(getConflicts(g2.cells)).not.toBe(getConflicts(g.cells))
  })

  it('flags both cells of a duplicate', () => {
    const c = getConflicts(game('check', { 2: { value: 5 } }).cells)
    expect(c[0]).toBe(true)
    expect(c[2]).toBe(true)
    expect(c[1]).toBe(false)
  })
})

const has = (state: GameState, index: number, flag: keyof typeof CELL_FLAG) =>
  (cellFlags(state, index) & CELL_FLAG[flag]) !== 0

describe('cellFlags', () => {
  it('returns a number so store selectors stay referentially stable', () => {
    expect(typeof cellFlags({ ...game(), selected: 0 }, 1)).toBe('number')
    expect(cellFlags(game(), 1)).toBe(0)
  })

  it('flags selected, peer and same digit', () => {
    const g = { ...game(), selected: 0 }
    expect(cellFlags(g, 0)).toBe(CELL_FLAG.selected)
    expect(has(g, 1, 'peer')).toBe(true)
    expect(has(g, 40, 'peer')).toBe(false)
    // the other given 5 not in a peer position of index 0
    const fives = g.cells.flatMap((c, i) => (c.value === 5 && i !== 0 ? [i] : []))
    expect(fives.length).toBeGreaterThan(0)
    expect(has(g, fives[0], 'sameDigit')).toBe(true)
  })

  it('has no peer/sameDigit without selection or on an empty selected cell', () => {
    expect(cellFlags(game(), 1)).toBe(0)
    const g = { ...game(), selected: 2 }
    expect(has(g, 3, 'sameDigit')).toBe(false)
  })

  it('marks wrong user digits in check/limit but not off, never givens/hinted', () => {
    const patch = { 2: { value: 9 as const } }
    expect(has(game('check', patch), 2, 'wrong')).toBe(true)
    expect(has(game('limit', patch), 2, 'wrong')).toBe(true)
    expect(has(game('off', patch), 2, 'wrong')).toBe(false)
    expect(has(game('check', { 2: { value: 9, hinted: true } }), 2, 'wrong')).toBe(false)
    expect(has(game(), 0, 'wrong')).toBe(false)
    expect(has(game('check', { 2: { value: 4 } }), 2, 'wrong')).toBe(false)
  })

  it('marks conflict independent of mistake mode', () => {
    expect(has(game('off', { 2: { value: 5 } }), 2, 'conflict')).toBe(true)
  })
})

describe('remainingDigits', () => {
  it('counts givens per digit', () => {
    const r = remainingDigits(game())
    const fives = puzzle.givens.filter((v) => v === 5).length
    expect(r[5]).toBe(9 - fives)
  })

  it('off counts wrong digits, check/limit do not', () => {
    const patch = { 2: { value: 9 as const } }
    const nines = puzzle.givens.filter((v) => v === 9).length
    expect(remainingDigits(game('off', patch))[9]).toBe(9 - nines - 1)
    expect(remainingDigits(game('check', patch))[9]).toBe(9 - nines)
    expect(remainingDigits(game('limit', patch))[9]).toBe(9 - nines)
  })

  it('counts correct user digits and hinted cells in every mode', () => {
    for (const mode of ['off', 'check', 'limit'] as const) {
      const base = remainingDigits(game(mode))[4]
      expect(remainingDigits(game(mode, { 2: { value: 4 } }))[4]).toBe(base - 1)
      expect(remainingDigits(game(mode, { 2: { value: 9, hinted: true } }))[9]).toBe(
        remainingDigits(game(mode))[9] - 1,
      )
    }
  })

  it('reaches 0 when all 9 are placed', () => {
    const patch: Record<number, Partial<Cell>> = {}
    puzzle.solution.forEach((v, i) => {
      if (v === 1 && puzzle.givens[i] === 0) patch[i] = { value: 1 }
    })
    expect(remainingDigits(game('check', patch))[1]).toBe(0)
  })
})

describe('cellLabel', () => {
  it('labels given cells', () => {
    expect(cellLabel(game(), 0)).toBe('Row 1, column 1, 5, given')
  })

  it('labels empty cells with and without notes', () => {
    expect(cellLabel(game(), 2)).toBe('Row 1, column 3, empty')
    const notes = (1 << 0) | (1 << 3) | (1 << 8)
    expect(cellLabel(game('check', { 2: { notes } }), 2)).toBe('Row 1, column 3, empty, notes 1 4 9')
  })

  it('labels user, hinted, wrong and conflicting digits', () => {
    expect(cellLabel(game('check', { 2: { value: 4 } }), 2)).toBe('Row 1, column 3, 4')
    expect(cellLabel(game('check', { 2: { value: 4, hinted: true } }), 2)).toBe(
      'Row 1, column 3, 4, hinted',
    )
    expect(cellLabel(game('check', { 2: { value: 2 } }), 2)).toBe('Row 1, column 3, 2, wrong')
    expect(cellLabel(game('off', { 2: { value: 5 } }), 2)).toBe('Row 1, column 3, 5, conflict')
    expect(cellLabel(game('check', { 2: { value: 5 } }), 2)).toBe('Row 1, column 3, 5, wrong, conflict')
  })
})
