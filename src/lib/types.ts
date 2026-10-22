// src/lib/types.ts
export type Digit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
export type CellValue = Digit | 0            // 0 = empty
export type Grid = CellValue[]               // length 81, index = row * 9 + col
export type NoteMask = number                // bit (d - 1) set ⇔ note d present (0..511)

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert'
export type MistakeMode = 'off' | 'check' | 'limit'
export type Direction = 'up' | 'down' | 'left' | 'right'

export interface Cell {
  value: CellValue
  notes: NoteMask
  given: boolean
  hinted: boolean
}

export interface Puzzle {
  id: string                 // `${difficulty}-${seed}`
  difficulty: Difficulty
  seed: number               // uint32
  givens: Grid
  solution: Grid
}

export type GameStatus = 'ready' | 'playing' | 'paused' | 'won' | 'lost'

export interface CellPatch { index: number; before: Cell; after: Cell }
export type HistoryStep = CellPatch[]        // one user action, possibly many cells

export interface GameState {
  puzzle: Puzzle
  cells: Cell[]                              // length 81
  selected: number | null
  notesMode: boolean
  status: GameStatus
  pausedBy: 'user' | 'auto' | null
  mistakeMode: MistakeMode
  mistakes: number
  hintsUsed: number
  elapsedMs: number
  past: HistoryStep[]
  future: HistoryStep[]
}

export type GameAction =
  | { type: 'select'; index: number | null }
  | { type: 'move'; dir: Direction }
  | { type: 'input'; digit: Digit }          // value or note, depending on notesMode
  | { type: 'note'; digit: Digit }           // always toggles a note
  | { type: 'erase' }
  | { type: 'toggleNotesMode' }
  | { type: 'hint'; random: number }         // random ∈ [0, 1) supplied by caller → reducer stays pure
  | { type: 'autoCandidates' }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'pause'; by: 'user' | 'auto' }
  | { type: 'resume'; by: 'user' | 'auto' }
  | { type: 'tick'; deltaMs: number }
  | { type: 'restart' }
  | { type: 'setMistakeMode'; mode: MistakeMode }

export interface Settings {
  mistakeMode: MistakeMode                   // default 'check'
  showTimer: boolean                         // default true
  theme: 'system' | 'light' | 'dark'         // default 'system'
}

export interface DifficultyStats {
  played: number
  won: number
  bestMs: number | null
  totalWonMs: number                         // average = totalWonMs / won
}
export type Stats = Record<Difficulty, DifficultyStats>
