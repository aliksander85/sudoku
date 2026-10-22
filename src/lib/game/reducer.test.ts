import { describe, it, expect } from 'vitest'
import { createGame } from './createGame.ts'
import { reducer } from './reducer.ts'
import { generatePuzzle } from '../generator.ts'
import type { Direction, GameState } from '../types.ts'

const puzzle = generatePuzzle('easy', 1)
const fresh = (): GameState => createGame(puzzle, 'check')
const at = (index: number): GameState => ({ ...fresh(), selected: index })

describe('createGame', () => {
  it('marks givens and starts ready', () => {
    const g = fresh()
    expect(g.status).toBe('ready')
    expect(g.cells).toHaveLength(81)
    g.cells.forEach((c, i) => {
      expect(c.given).toBe(puzzle.givens[i] !== 0)
      expect(c.value).toBe(puzzle.givens[i])
      expect(c.notes).toBe(0)
      expect(c.hinted).toBe(false)
    })
    expect(g).toMatchObject({
      selected: null,
      notesMode: false,
      pausedBy: null,
      mistakeMode: 'check',
      mistakes: 0,
      hintsUsed: 0,
      elapsedMs: 0,
      past: [],
      future: [],
    })
  })
})

describe('move', () => {
  const cases: [Direction, number, number][] = [
    ['right', 8, 0],
    ['right', 0, 1],
    ['left', 0, 8],
    ['left', 9 + 5, 9 + 4],
    ['up', 4, 76],
    ['up', 30, 21],
    ['down', 76, 4],
    ['down', 21, 30],
  ]
  it.each(cases)('%s from %i goes to %i', (dir, from, to) => {
    expect(reducer(at(from), { type: 'move', dir }).selected).toBe(to)
  })

  it('selects cell 0 when nothing is selected', () => {
    expect(reducer(fresh(), { type: 'move', dir: 'down' }).selected).toBe(0)
  })

  it('is ignored when paused, won or lost', () => {
    for (const status of ['paused', 'won', 'lost'] as const) {
      const s = { ...at(5), status }
      expect(reducer(s, { type: 'move', dir: 'right' })).toBe(s)
    }
  })
})

describe('select', () => {
  it('selects and clears', () => {
    const s = reducer(fresh(), { type: 'select', index: 12 })
    expect(s.selected).toBe(12)
    expect(reducer(s, { type: 'select', index: null }).selected).toBeNull()
  })

  it('returns the same state when nothing changes', () => {
    const s = at(3)
    expect(reducer(s, { type: 'select', index: 3 })).toBe(s)
  })

  it('ignores out-of-range indices', () => {
    const s = fresh()
    expect(reducer(s, { type: 'select', index: 81 })).toBe(s)
    expect(reducer(s, { type: 'select', index: -1 })).toBe(s)
  })

  it('is ignored when paused, won or lost', () => {
    for (const status of ['paused', 'won', 'lost'] as const) {
      const s = { ...fresh(), status }
      expect(reducer(s, { type: 'select', index: 4 })).toBe(s)
    }
  })

  it('keeps cell references', () => {
    const s = fresh()
    expect(reducer(s, { type: 'select', index: 4 }).cells).toBe(s.cells)
  })
})

describe('toggleNotesMode / setMistakeMode', () => {
  it('toggles notes mode', () => {
    const on = reducer(fresh(), { type: 'toggleNotesMode' })
    expect(on.notesMode).toBe(true)
    expect(reducer(on, { type: 'toggleNotesMode' }).notesMode).toBe(false)
  })

  it('changes mistake mode and keeps the count', () => {
    const s = { ...fresh(), mistakes: 2 }
    const next = reducer(s, { type: 'setMistakeMode', mode: 'limit' })
    expect(next.mistakeMode).toBe('limit')
    expect(next.mistakes).toBe(2)
  })
})
