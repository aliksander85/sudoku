import { describe, it, expect } from 'vitest'
import { createGame } from './createGame.ts'
import { reducer } from './reducer.ts'
import { generatePuzzle } from '../generator.ts'
import { PEERS } from '../grid.ts'
import type { Cell, Digit, Direction, GameState } from '../types.ts'

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

const emptyIdx = puzzle.givens.findIndex((v) => v === 0)
const givenIdx = puzzle.givens.findIndex((v) => v !== 0)
const peerIdx = PEERS[emptyIdx].find((p) => !puzzle.givens[p])!
const farIdx = [...Array(81).keys()].find(
  (k) => k !== emptyIdx && !PEERS[emptyIdx].includes(k) && !puzzle.givens[k],
)!

const withCells = (state: GameState, patches: Record<number, Partial<Cell>>): GameState => ({
  ...state,
  cells: state.cells.map((c, i) => (patches[i] ? { ...c, ...patches[i] } : c)),
})
const sel = (patches: Record<number, Partial<Cell>> = {}, index = emptyIdx): GameState =>
  withCells({ ...fresh(), selected: index }, patches)

describe('input', () => {
  it('sets the value, clears own notes and peers\' notes of that digit', () => {
    const s = sel({
      [emptyIdx]: { notes: 0b111 },
      [peerIdx]: { notes: 0b101 },
      [farIdx]: { notes: 0b101 },
    })
    const next = reducer(s, { type: 'input', digit: 1 })
    expect(next.cells[emptyIdx]).toMatchObject({ value: 1, notes: 0 })
    expect(next.cells[peerIdx].notes).toBe(0b100)
    expect(next.cells[farIdx]).toBe(s.cells[farIdx])
    expect(next.status).toBe('playing')
    expect(next.past).toHaveLength(1)
    expect(next.past[0]).toHaveLength(2)
    expect(next.past[0][1]).toMatchObject({ index: peerIdx, before: s.cells[peerIdx] })
    expect(next.future).toEqual([])
  })

  it('keeps references of untouched cells', () => {
    const s = sel({ [peerIdx]: { notes: 1 } })
    const next = reducer(s, { type: 'input', digit: 1 })
    s.cells.forEach((c, i) => {
      if (i !== emptyIdx && i !== peerIdx) expect(next.cells[i]).toBe(c)
    })
  })

  it('overwrites a different user digit', () => {
    const next = reducer(sel({ [emptyIdx]: { value: 4 } }), { type: 'input', digit: 5 })
    expect(next.cells[emptyIdx].value).toBe(5)
  })

  it('is a no-op in all blocked cases', () => {
    const blocked: GameState[] = [
      fresh(),
      sel({}, givenIdx),
      sel({ [emptyIdx]: { hinted: true } }),
      sel({ [emptyIdx]: { value: 3 } }),
      ...(['paused', 'won', 'lost'] as const).map((status) => ({ ...sel(), status })),
    ]
    for (const s of blocked) expect(reducer(s, { type: 'input', digit: 3 })).toBe(s)
  })

  it('toggles a note in notes mode', () => {
    const s = { ...sel(), notesMode: true }
    const next = reducer(s, { type: 'input', digit: 2 })
    expect(next.cells[emptyIdx]).toMatchObject({ value: 0, notes: 0b10 })
  })
})

describe('note', () => {
  it('toggles on and off regardless of notes mode', () => {
    const on = reducer(sel(), { type: 'note', digit: 9 })
    expect(on.cells[emptyIdx].notes).toBe(0b100000000)
    expect(on.status).toBe('playing')
    expect(reducer(on, { type: 'note', digit: 9 }).cells[emptyIdx].notes).toBe(0)
  })

  it('is a no-op on filled, given and hinted cells', () => {
    const blocked = [
      sel({ [emptyIdx]: { value: 2 } }),
      sel({}, givenIdx),
      sel({ [emptyIdx]: { hinted: true } }),
    ]
    for (const s of blocked) expect(reducer(s, { type: 'note', digit: 1 as Digit })).toBe(s)
  })
})

describe('erase', () => {
  it('clears the value', () => {
    const next = reducer(sel({ [emptyIdx]: { value: 6 } }), { type: 'erase' })
    expect(next.cells[emptyIdx].value).toBe(0)
    expect(next.past).toHaveLength(1)
  })

  it('clears all notes on an empty cell', () => {
    const next = reducer(sel({ [emptyIdx]: { notes: 0b1011 } }), { type: 'erase' })
    expect(next.cells[emptyIdx].notes).toBe(0)
  })

  it('is a no-op on given, hinted and empty-without-notes cells', () => {
    const blocked = [sel({}, givenIdx), sel({ [emptyIdx]: { value: 2, hinted: true } }), sel()]
    for (const s of blocked) expect(reducer(s, { type: 'erase' })).toBe(s)
  })

  it('does not leave ready on a no-op', () => {
    expect(reducer(sel(), { type: 'erase' }).status).toBe('ready')
  })
})
