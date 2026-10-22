import type { Cell, GameState, MistakeMode, Puzzle } from '../types.ts'

export function createGame(puzzle: Puzzle, mistakeMode: MistakeMode): GameState {
  const cells: Cell[] = puzzle.givens.map((value) => ({
    value,
    notes: 0,
    given: value !== 0,
    hinted: false,
  }))
  return {
    puzzle,
    cells,
    selected: null,
    notesMode: false,
    status: 'ready',
    pausedBy: null,
    mistakeMode,
    mistakes: 0,
    hintsUsed: 0,
    elapsedMs: 0,
    past: [],
    future: [],
  }
}
