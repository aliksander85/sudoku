import type { Direction, GameAction, GameState } from '../types.ts'

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
    case 'toggleNotesMode':
      return { ...state, notesMode: !state.notesMode }
    case 'setMistakeMode':
      return state.mistakeMode === action.mode ? state : { ...state, mistakeMode: action.mode }
    default:
      return state
  }
}
