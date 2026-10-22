import { describe, it, expect } from 'vitest'
import { createGame } from './createGame.ts'
import { reducer } from './reducer.ts'
import { generatePuzzle } from '../generator.ts'
import { PEERS } from '../grid.ts'
import type { Digit, GameAction, GameState } from '../types.ts'

const puzzle = generatePuzzle('easy', 1)
const emptyIdx = puzzle.givens.findIndex((v) => v === 0)
const correct = puzzle.solution[emptyIdx] as Digit
const wrong: Digit = correct === 1 ? 2 : 1

const run = (state: GameState, ...actions: GameAction[]) => actions.reduce(reducer, state)
const start = (): GameState => ({ ...createGame(puzzle, 'check'), selected: emptyIdx })

describe('undo/redo', () => {
  it('undoes a digit and its peer note cleanup in one step', () => {
    const peer = PEERS[emptyIdx].find((p) => puzzle.givens[p] === 0)!
    const base = start()
    const withNote = {
      ...base,
      cells: base.cells.map((c, k) => (k === peer ? { ...c, notes: 1 << (correct - 1) } : c)),
    }
    const placed = run(withNote, { type: 'input', digit: correct })
    expect(placed.cells[peer].notes).toBe(0)
    expect(placed.past).toHaveLength(1)
    const undone = run(placed, { type: 'undo' })
    expect(undone.cells).toEqual(withNote.cells)
    expect(undone.past).toHaveLength(0)
  })

  it('undo then redo restores the exact state', () => {
    const placed = run(start(), { type: 'input', digit: correct })
    expect(run(placed, { type: 'undo' }, { type: 'redo' })).toEqual(placed)
  })

  it('a new action clears the redo stack', () => {
    const undone = run(start(), { type: 'input', digit: correct }, { type: 'undo' })
    expect(undone.future).toHaveLength(1)
    expect(run(undone, { type: 'note', digit: wrong }).future).toHaveLength(0)
  })

  it('keeps mistakes, hints and timer', () => {
    const s = { ...start(), hintsUsed: 2, elapsedMs: 5000 }
    const placed = run(s, { type: 'input', digit: wrong })
    expect(placed.mistakes).toBe(1)
    for (const a of [{ type: 'undo' }, { type: 'redo' }] as const) {
      const next = reducer(a.type === 'undo' ? placed : run(placed, { type: 'undo' }), a)
      expect(next).toMatchObject({ mistakes: 1, hintsUsed: 2, elapsedMs: 5000, status: 'playing' })
    }
  })

  it('preserves references of untouched cells', () => {
    const placed = run(start(), { type: 'input', digit: correct })
    const undone = run(placed, { type: 'undo' })
    placed.cells.forEach((c, k) => {
      if (k !== emptyIdx && placed.past[0].every((p) => p.index !== k)) expect(undone.cells[k]).toBe(c)
    })
  })

  it('is a no-op with empty stacks', () => {
    const s = start()
    expect(reducer(s, { type: 'undo' })).toBe(s)
    expect(reducer(s, { type: 'redo' })).toBe(s)
  })

  it('is ignored when paused, won or lost', () => {
    const placed = run(start(), { type: 'input', digit: correct })
    const undone = run(placed, { type: 'undo' })
    for (const status of ['paused', 'won', 'lost'] as const) {
      const a = { ...placed, status }
      const b = { ...undone, status }
      expect(reducer(a, { type: 'undo' })).toBe(a)
      expect(reducer(b, { type: 'redo' })).toBe(b)
    }
  })
})
