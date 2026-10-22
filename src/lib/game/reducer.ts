import { bit } from '../candidates.ts'
import { PEERS } from '../grid.ts'
import type { Cell, CellPatch, Digit, Direction, GameAction, GameState, HistoryStep } from '../types.ts'

const isFrozen = (state: GameState): boolean =>
  state.status === 'paused' || state.status === 'won' || state.status === 'lost'

function moved(index: number, dir: Direction): number {
  const row = Math.floor(index / 9)
  const col = index % 9
  switch (dir) {
    case 'up':
      return ((row + 8) % 9) * 9 + col
    case 'down':
      return ((row + 1) % 9) * 9 + col
    case 'left':
      return row * 9 + ((col + 8) % 9)
    case 'right':
      return row * 9 + ((col + 1) % 9)
  }
}

function editable(state: GameState): number | null {
  if (isFrozen(state) || state.selected === null) return null
  const cell = state.cells[state.selected]
  return cell.given || cell.hinted ? null : state.selected
}

function commit(state: GameState, step: HistoryStep): GameState {
  if (step.length === 0) return state
  const cells = state.cells.slice()
  for (const { index, after } of step) cells[index] = after
  return {
    ...state,
    cells,
    past: [...state.past, step],
    future: [],
    status: state.status === 'ready' ? 'playing' : state.status,
  }
}

const patch = (state: GameState, index: number, changes: Partial<Cell>): CellPatch => {
  const before = state.cells[index]
  return { index, before, after: { ...before, ...changes } }
}

function toggleNote(state: GameState, digit: Digit): GameState {
  const i = editable(state)
  if (i === null || state.cells[i].value !== 0) return state
  return commit(state, [patch(state, i, { notes: state.cells[i].notes ^ bit(digit) })])
}

function inputDigit(state: GameState, digit: Digit): GameState {
  if (state.notesMode) return toggleNote(state, digit)
  const i = editable(state)
  if (i === null || state.cells[i].value === digit) return state
  const step: HistoryStep = [patch(state, i, { value: digit, notes: 0 })]
  for (const peer of PEERS[i]) {
    const { notes } = state.cells[peer]
    if (notes & bit(digit)) step.push(patch(state, peer, { notes: notes & ~bit(digit) }))
  }
  return commit(state, step)
}

function erase(state: GameState): GameState {
  const i = editable(state)
  if (i === null) return state
  const cell = state.cells[i]
  if (cell.value !== 0) return commit(state, [patch(state, i, { value: 0 })])
  if (cell.notes !== 0) return commit(state, [patch(state, i, { notes: 0 })])
  return state
}

export function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'select': {
      if (isFrozen(state) || state.selected === action.index) return state
      const { index } = action
      if (index !== null && !(Number.isInteger(index) && index >= 0 && index < 81)) return state
      return { ...state, selected: index }
    }
    case 'move': {
      if (isFrozen(state)) return state
      const next = state.selected === null ? 0 : moved(state.selected, action.dir)
      return next === state.selected ? state : { ...state, selected: next }
    }
    case 'input':
      return inputDigit(state, action.digit)
    case 'note':
      return toggleNote(state, action.digit)
    case 'erase':
      return erase(state)
    case 'toggleNotesMode':
      return { ...state, notesMode: !state.notesMode }
    case 'setMistakeMode':
      return state.mistakeMode === action.mode ? state : { ...state, mistakeMode: action.mode }
    default:
      return state
  }
}
