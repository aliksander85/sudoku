import type { GameState, HistoryStep } from '../types.ts'

function apply(cells: GameState['cells'], step: HistoryStep, side: 'before' | 'after') {
  const next = cells.slice()
  for (const patch of step) next[patch.index] = patch[side]
  return next
}

export function undoStep(state: GameState): GameState {
  const step = state.past[state.past.length - 1]
  if (!step) return state
  return {
    ...state,
    cells: apply(state.cells, step, 'before'),
    past: state.past.slice(0, -1),
    future: [...state.future, step],
  }
}

export function redoStep(state: GameState): GameState {
  const step = state.future[state.future.length - 1]
  if (!step) return state
  return {
    ...state,
    cells: apply(state.cells, step, 'after'),
    past: [...state.past, step],
    future: state.future.slice(0, -1),
  }
}
