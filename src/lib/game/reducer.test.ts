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

describe('mistakes and win/loss', () => {
  const solution = puzzle.solution
  const wrongDigit = (i: number): Digit => (solution[i] === 1 ? 2 : 1)
  const correct = (i: number): Digit => solution[i] as Digit
  const inMode = (mistakeMode: GameState['mistakeMode'], mistakes = 0): GameState => ({
    ...sel(),
    mistakeMode,
    mistakes,
  })
  const almostSolved = (mistakeMode: GameState['mistakeMode']): GameState => {
    const base = inMode(mistakeMode)
    return {
      ...base,
      cells: base.cells.map((c, k) => (k === emptyIdx ? c : { ...c, value: solution[k] })),
    }
  }

  it('does not count mistakes in off mode', () => {
    const next = reducer(inMode('off'), { type: 'input', digit: wrongDigit(emptyIdx) })
    expect(next.mistakes).toBe(0)
    expect(next.status).toBe('playing')
    expect(next.cells[emptyIdx].value).toBe(wrongDigit(emptyIdx))
  })

  it('counts each wrong placement in check mode and never loses', () => {
    let s = reducer(inMode('check'), { type: 'input', digit: wrongDigit(emptyIdx) })
    expect(s.mistakes).toBe(1)
    s = reducer(s, { type: 'input', digit: correct(emptyIdx) })
    expect(s.mistakes).toBe(1)
    s = { ...s, mistakes: 2 }
    s = reducer(s, { type: 'input', digit: wrongDigit(emptyIdx) })
    s = reducer(s, { type: 'input', digit: wrongDigit(emptyIdx) === 2 ? 3 : 2 })
    expect(s.mistakes).toBe(4)
    expect(s.status).toBe('playing')
  })

  it('counts overwriting a wrong digit with another wrong digit', () => {
    const w = wrongDigit(emptyIdx)
    const other = ([1, 2, 3] as Digit[]).find((d) => d !== w && d !== correct(emptyIdx))!
    let s = reducer(inMode('check'), { type: 'input', digit: w })
    s = reducer(s, { type: 'input', digit: other })
    expect(s.mistakes).toBe(2)
  })

  it('loses on the 3rd mistake in limit mode', () => {
    const second = reducer(inMode('limit', 1), { type: 'input', digit: wrongDigit(emptyIdx) })
    expect(second).toMatchObject({ mistakes: 2, status: 'playing' })
    const third = reducer(inMode('limit', 2), { type: 'input', digit: wrongDigit(emptyIdx) })
    expect(third).toMatchObject({ mistakes: 3, status: 'lost' })
  })

  it('keeps the count on mode change and checks the limit on the next mistake', () => {
    const s = reducer({ ...inMode('check', 3), status: 'playing' }, { type: 'setMistakeMode', mode: 'limit' })
    expect(s).toMatchObject({ mistakes: 3, status: 'playing' })
    expect(reducer(s, { type: 'input', digit: wrongDigit(emptyIdx) }).status).toBe('lost')
  })

  it('wins on the last correct digit in every mode', () => {
    for (const mode of ['off', 'check', 'limit'] as const) {
      const next = reducer(almostSolved(mode), { type: 'input', digit: correct(emptyIdx) })
      expect(next.status).toBe('won')
    }
  })

  it('does not win on a wrong last digit', () => {
    const next = reducer(almostSolved('check'), { type: 'input', digit: wrongDigit(emptyIdx) })
    expect(next.status).toBe('playing')
    expect(next.mistakes).toBe(1)
  })

  it('ignores board actions and navigation once won or lost', () => {
    for (const status of ['won', 'lost'] as const) {
      const s = { ...sel(), status }
      expect(reducer(s, { type: 'input', digit: 3 })).toBe(s)
      expect(reducer(s, { type: 'note', digit: 3 })).toBe(s)
      expect(reducer(s, { type: 'erase' })).toBe(s)
      expect(reducer(s, { type: 'select', index: 7 })).toBe(s)
      expect(reducer(s, { type: 'move', dir: 'up' })).toBe(s)
    }
  })
})

const emptyIdxs = [...Array(81).keys()].filter((k) => !puzzle.givens[k])
const solutionAt = (i: number) => puzzle.solution[i] as Digit
const wrongAt = (i: number) => ((solutionAt(i) % 9) + 1) as Digit

describe('hint', () => {
  it('fills the selected empty cell with the solution', () => {
    const s = reducer(at(emptyIdx), { type: 'hint', random: 0.5 })
    expect(s.cells[emptyIdx]).toMatchObject({ value: solutionAt(emptyIdx), hinted: true, notes: 0 })
    expect(s.hintsUsed).toBe(1)
    expect(s.mistakes).toBe(0)
    expect(s.status).toBe('playing')
  })

  it('replaces a wrong digit in the selected cell', () => {
    const s = withCells(at(emptyIdx), { [emptyIdx]: { value: wrongAt(emptyIdx) } })
    const next = reducer(s, { type: 'hint', random: 0 })
    expect(next.cells[emptyIdx].value).toBe(solutionAt(emptyIdx))
    expect(next.mistakes).toBe(0)
  })

  it('picks a cell from random when the selection is not a target', () => {
    const correct = withCells(at(emptyIdx), { [emptyIdx]: { value: solutionAt(emptyIdx) } })
    const first = reducer(correct, { type: 'hint', random: 0 })
    const rest = emptyIdxs.filter((k) => k !== emptyIdx)
    expect(first.cells[rest[0]].hinted).toBe(true)
    const last = reducer(correct, { type: 'hint', random: 0.999 })
    expect(last.cells[rest[rest.length - 1]].hinted).toBe(true)
    expect(reducer({ ...fresh(), selected: givenIdx }, { type: 'hint', random: 0 }).cells[emptyIdxs[0]].hinted).toBe(true)
    expect(reducer(fresh(), { type: 'hint', random: 0 }).cells[emptyIdxs[0]].hinted).toBe(true)
  })

  it('locks the hinted cell', () => {
    const s = reducer(at(emptyIdx), { type: 'hint', random: 0 })
    for (const action of [{ type: 'input', digit: wrongAt(emptyIdx) }, { type: 'erase' }, { type: 'note', digit: 1 }] as const) {
      expect(reducer(s, action)).toBe(s)
    }
  })

  it('clears the digit from peers notes only', () => {
    const d = solutionAt(emptyIdx)
    const bitD = 1 << (d - 1)
    const s = withCells(at(emptyIdx), { [emptyIdx]: { notes: 3 }, [peerIdx]: { notes: bitD | 2 }, [farIdx]: { notes: bitD } })
    const next = reducer(s, { type: 'hint', random: 0 })
    expect(next.cells[peerIdx].notes).toBe(2)
    expect(next.cells[farIdx]).toBe(s.cells[farIdx])
  })

  it('is a no-op with no targets, when paused or lost', () => {
    const solved = { ...fresh(), cells: fresh().cells.map((c, k) => ({ ...c, value: puzzle.solution[k] })) }
    expect(reducer(solved, { type: 'hint', random: 0 })).toBe(solved)
    for (const status of ['paused', 'lost'] as const) {
      const s = { ...at(emptyIdx), status }
      expect(reducer(s, { type: 'hint', random: 0 })).toBe(s)
    }
  })

  it('wins when the hint fills the last cell', () => {
    const almost = { ...at(emptyIdx), cells: fresh().cells.map((c, k) => (k === emptyIdx ? c : { ...c, value: puzzle.solution[k] })) }
    expect(reducer(almost, { type: 'hint', random: 0 }).status).toBe('won')
  })

  it('is undoable without decrementing hintsUsed, and redoable', () => {
    const s = withCells(at(emptyIdx), { [peerIdx]: { notes: 1 << (solutionAt(emptyIdx) - 1) } })
    const hinted = reducer(s, { type: 'hint', random: 0 })
    const undone = reducer(hinted, { type: 'undo' })
    expect(undone.cells).toEqual(s.cells)
    expect(undone.hintsUsed).toBe(1)
    const redone = reducer(undone, { type: 'redo' })
    expect(redone.cells).toEqual(hinted.cells)
    expect(redone.hintsUsed).toBe(1)
  })
})

describe('autoCandidates', () => {
  it('fills every empty cell with the digits missing from its peers', () => {
    const s = reducer(fresh(), { type: 'autoCandidates' })
    expect(s.hintsUsed).toBe(1)
    expect(s.status).toBe('playing')
    s.cells.forEach((c, i) => {
      if (c.value !== 0) return expect(c.notes).toBe(0)
      let used = 0
      for (const p of PEERS[i]) if (s.cells[p].value) used |= 1 << (s.cells[p].value - 1)
      expect(c.notes).toBe(0x1ff & ~used)
    })
  })

  it('counts wrong digits as used and overwrites existing notes', () => {
    const wrong = wrongAt(peerIdx)
    const s = withCells(at(emptyIdx), { [peerIdx]: { value: wrong }, [emptyIdx]: { notes: 0x1ff } })
    const next = reducer(s, { type: 'autoCandidates' })
    expect(next.cells[emptyIdx].notes & (1 << (wrong - 1))).toBe(0)
    expect(next.cells[peerIdx].notes).toBe(0)
    expect(next.cells[givenIdx]).toBe(s.cells[givenIdx])
  })

  it('is one undo step and undo keeps hintsUsed', () => {
    const s = reducer(fresh(), { type: 'autoCandidates' })
    expect(s.past).toHaveLength(1)
    const undone = reducer(s, { type: 'undo' })
    expect(undone.cells).toEqual(fresh().cells)
    expect(undone.hintsUsed).toBe(1)
  })

  it('counts a hint even when notes already match', () => {
    const once = reducer(fresh(), { type: 'autoCandidates' })
    const twice = reducer(once, { type: 'autoCandidates' })
    expect(twice.hintsUsed).toBe(2)
    expect(twice.past).toHaveLength(1)
  })

  it('is a no-op on a full board, when paused or lost', () => {
    const full = { ...fresh(), cells: fresh().cells.map((c, k) => ({ ...c, value: puzzle.solution[k] })) }
    expect(reducer(full, { type: 'autoCandidates' })).toBe(full)
    for (const status of ['paused', 'lost'] as const) {
      const s = { ...fresh(), status }
      expect(reducer(s, { type: 'autoCandidates' })).toBe(s)
    }
  })
})

const playing = (): GameState => reducer(sel(), { type: 'input', digit: solutionAt(emptyIdx) })

describe('tick', () => {
  it('adds time only while playing', () => {
    const p = playing()
    expect(p.status).toBe('playing')
    expect(reducer(p, { type: 'tick', deltaMs: 250 }).elapsedMs).toBe(250)
    for (const status of ['ready', 'paused', 'won', 'lost'] as const) {
      const s = { ...p, status }
      expect(reducer(s, { type: 'tick', deltaMs: 250 })).toBe(s)
    }
  })

  it('ignores zero, negative and non-finite deltas', () => {
    const p = playing()
    for (const deltaMs of [0, -5, NaN, Infinity]) {
      expect(reducer(p, { type: 'tick', deltaMs })).toBe(p)
    }
  })
})

describe('pause / resume', () => {
  it('pauses and resumes from playing', () => {
    const paused = reducer(playing(), { type: 'pause', by: 'user' })
    expect(paused).toMatchObject({ status: 'paused', pausedBy: 'user' })
    expect(reducer(paused, { type: 'resume', by: 'user' })).toMatchObject({
      status: 'playing',
      pausedBy: null,
    })
  })

  it('ignores pause outside playing and resume outside paused', () => {
    const p = playing()
    for (const status of ['ready', 'won', 'lost'] as const) {
      const s = { ...p, status }
      expect(reducer(s, { type: 'pause', by: 'user' })).toBe(s)
    }
    expect(reducer(p, { type: 'resume', by: 'user' })).toBe(p)
  })

  it('auto resume undoes an auto pause', () => {
    const paused = reducer(playing(), { type: 'pause', by: 'auto' })
    expect(reducer(paused, { type: 'resume', by: 'auto' }).status).toBe('playing')
  })

  it('auto resume does not undo a user pause', () => {
    const paused = reducer(playing(), { type: 'pause', by: 'user' })
    expect(reducer(paused, { type: 'resume', by: 'auto' })).toBe(paused)
  })

  it('auto pause does not override a user pause; user pause upgrades an auto pause', () => {
    const user = reducer(playing(), { type: 'pause', by: 'user' })
    expect(reducer(user, { type: 'pause', by: 'auto' })).toBe(user)
    const auto = reducer(playing(), { type: 'pause', by: 'auto' })
    const upgraded = reducer(auto, { type: 'pause', by: 'user' })
    expect(upgraded.pausedBy).toBe('user')
    expect(reducer(upgraded, { type: 'resume', by: 'auto' })).toBe(upgraded)
  })

  it('ignores board actions, undo/redo, select and move while paused', () => {
    const paused = reducer(playing(), { type: 'pause', by: 'user' })
    const target = emptyIdxs.find((k) => k !== emptyIdx)!
    const s = { ...paused, selected: target }
    const actions = [
      { type: 'input', digit: 1 },
      { type: 'note', digit: 1 },
      { type: 'erase' },
      { type: 'hint', random: 0 },
      { type: 'autoCandidates' },
      { type: 'undo' },
      { type: 'redo' },
      { type: 'select', index: 0 },
      { type: 'move', dir: 'right' },
    ] as const
    for (const a of actions) expect(reducer(s, a)).toBe(s)
  })
})

describe('restart', () => {
  it('resets to givens with zero timer, mistakes, hints and history', () => {
    const dirty: GameState = {
      ...playing(),
      mistakeMode: 'limit',
      mistakes: 2,
      hintsUsed: 3,
      elapsedMs: 9000,
      notesMode: true,
      selected: 5,
    }
    const restarted = reducer(dirty, { type: 'restart' })
    expect(restarted).toEqual(createGame(puzzle, 'limit'))
    expect(restarted.status).toBe('ready')
  })

  it('works from paused, won and lost', () => {
    for (const status of ['paused', 'won', 'lost'] as const) {
      const s = { ...playing(), status, pausedBy: status === 'paused' ? ('user' as const) : null }
      expect(reducer(s, { type: 'restart' })).toEqual(createGame(puzzle, 'check'))
    }
  })
})
