// Each solution was checked with an independent brute-force solver.
export interface PuzzleFixture {
  puzzle: string
  solution: string
}

export const EASY: PuzzleFixture = {
  puzzle: '53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79',
  solution: '534678912672195348198342567859761423426853791713924856961537284287419635345286179',
}

// Arto Inkala's 2012 puzzle, widely cited as one of the hardest known.
export const VERY_HARD: PuzzleFixture = {
  puzzle: '8..........36......7..9.2...5...7.......457.....1...3...1....68..85...1..9....4..',
  solution: '812753649943682175675491283154237896369845721287169534521974368438526917796318452',
}

// EASY with the last clue (7) removed: exactly 2 solutions.
export const MULTI_SOLUTION: string =
  '53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8...9'

// EASY with a second 5 added to row 0 (index 2 clashes with index 0).
export const CONFLICTING: string =
  '535.7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79'

export const EMPTY: string = '.'.repeat(81)
