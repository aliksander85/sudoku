# Sudoku — Specification

## 1. Overview

A single-page classic 9×9 Sudoku game that runs entirely in the browser (no backend). Target user: a casual-to-serious player on desktop or phone who wants clean, fast, keyboard-friendly play with notes, undo and clear difficulty levels.

**MVP goal:** generate unique-solution puzzles at four difficulties, play them with mouse/touch/keyboard, notes, undo/redo, hints, timer and mistake checking, and resume an unfinished game after reload.

## 2. Scope

### MVP

- Puzzle generation at runtime in a Web Worker, seeded and reproducible, with a guaranteed unique solution.
- Difficulties: Easy, Medium, Hard, Expert, defined by the number of givens (see §5.5).
- Digit entry, erase, notes mode (toggle + Shift shortcut), automatic note cleanup in peers.
- Conflict highlighting (always on); mistake modes: off / check against solution / 3-mistake limit.
- Unlimited undo/redo per game.
- Hints (reveal a cell) and auto-fill candidates (counts as a hint).
- Timer with manual pause and auto-pause on hidden tab; optional hiding of timer.
- Selection highlighting: row, column, box, same digit.
- Number pad with remaining-digit counts.
- Persistence in `localStorage`: current game, settings, per-difficulty stats.
- New game dialog, win dialog, lost dialog (limit mode), settings dialog.
- Light/dark theme (system default + manual override).
- Responsive layout from 320 px; accessible grid with screen-reader labels and live announcements.

### Later (nice-to-have)

- Technique-based difficulty rating: a human-style solver (naked/hidden singles, pairs, pointing/claiming, triples, X-Wing, …) that rates puzzles by the hardest technique required, replacing the givens-count rule.
- "Explain next step" hints using the technique solver.
- Share/replay a puzzle via URL (`?p=<difficulty>-<seed>`).
- Daily puzzle.
- Cell colour marking.
- PWA / offline install.
- Playwright E2E tests, CI on GitHub Actions, coverage reports.
- Stats history/charts.

### Out of scope

- Accounts, backend, sync, leaderboards, multiplayer.
- Variants (Killer, Diagonal, 6×6, 16×16) and puzzle import from image/text.
- Localisation (English only).
- Ads, analytics.

## 3. Game rules & behavior

### 3.1 Board

81 cells, index `i = row * 9 + col` (row, col in 0–8). Box of a cell: `Math.floor(row / 3) * 3 + Math.floor(col / 3)`. Peers of a cell: the 20 other cells sharing its row, column or box.

### 3.2 Cell kinds

- *Given* — part of the puzzle; immutable.
- *Hinted* — filled by a hint; immutable like a given (until undone).
- *User* — editable: empty (optionally with notes) or holding a digit.

### 3.3 Conflict

A filled cell is in conflict if any peer holds the same digit. Conflicts are always highlighted (both cells, givens included), independent of mistake mode.

### 3.4 Mistakes

A user digit that differs from the solution.
- `off`: mistakes are neither shown nor counted.
- `check`: wrong digits are shown; each placement of a wrong digit increments `mistakes`.
- `limit`: as `check`; when `mistakes` reaches 3 the game becomes `lost`.
- Wrong digits stay on the board until the player changes or erases them.
- Changing mistake mode mid-game keeps the current count; the loss check runs only when a new mistake is made.

### 3.5 Win condition

Every cell's value equals the solution → status `won`. (With a unique solution, a full conflict-free board is the solution, so this matches the rules in every mode.)

### 3.6 Statuses

`ready` (generated, no move yet) → `playing` (first board-changing action) ⇄ `paused` → `won` | `lost`.
- Timer runs only in `playing`.
- In `paused`, `won`, `lost`: all board-changing actions, undo/redo and selection are ignored; the board's digits are hidden while paused.
- `won` and `lost` are terminal; the only ways out are New game or Restart (restart = same puzzle, reset to givens, zero timer/mistakes/hints/history).

### 3.7 Actions and edge cases

- *Input digit* (not notes mode): no-op if no selection, cell is given/hinted, or cell already holds that digit. Otherwise set value, clear the cell's notes, remove that digit from the notes of all peers. Counted as a mistake if wrong (per mode). One undo step.
- *Input in notes mode* / *Shift+digit*: toggle that note. No-op on a filled cell or given/hinted cell.
- *Erase*: clears value or, if empty, clears all notes. No-op on given/hinted or already-empty-without-notes cells.
- *Hint*: target = selected cell if it is empty or wrong; otherwise a random empty-or-wrong cell. Sets the solution value, marks `hinted`, clears its notes and that digit from peers' notes. `hintsUsed += 1`. Not a mistake. Undoable (undo does not decrement `hintsUsed`).
- *Auto-candidates*: every empty user cell gets notes = digits not present among its peers' current values (wrong digits included). Overwrites existing notes. `hintsUsed += 1`. One undo step. No-op if there are no empty cells.
- *Undo/redo*: steps through board changes only. Never changes `mistakes`, `hintsUsed`, timer or status. A new board change clears the redo stack.
- *Move selection*: arrows wrap at edges (moving right from col 8 goes to col 0, same row). With no selection, any move selects cell 0.
- *Number pad availability*: a digit is disabled when 9 instances of it are "placed". In `off` mode every cell holding the digit counts (no information about correctness leaks). In `check`/`limit` only givens, hinted cells and correct user digits count — wrong digits are already marked and must not block entering the correct one.

### 3.8 Timer

Elapsed time accumulates from `tick` actions while `playing`. Tab hidden → auto-pause; tab visible → auto-resume only if the pause was automatic. Time spent with the page closed is not counted.

### 3.9 Stats

Per difficulty: `played` increments on a game's first move (`ready → playing`); `won` and time totals update on win. Lost and abandoned games count as played, not won.

## 4. Data model

### 4.1 Types

```ts
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
```

### 4.2 Invariants

- The reducer is immutable and **preserves references of unchanged cells** (per-cell selectors depend on it).
- History is patch-based (`before`/`after` per changed cell), so persisted history stays small.
- New games are created by `createGame(puzzle, mistakeMode): GameState`, not by an action.

### 4.3 Persistence

Stored with Zustand `persist`.

| Key | Content | Version |
|---|---|---|
| `sudoku:game` | `GameState \| null` | 1 |
| `sudoku:settings` | `Settings` | 1 |
| `sudoku:stats` | `Stats` | 1 |

On version mismatch without a migration, or on parse/shape failure, the stored value is discarded and defaults are used. A stored game in `ready`/`playing`/`paused` is resumed; `won`/`lost` is discarded on load.

## 5. Algorithms

All in `src/lib`, synchronous, pure, deterministic given a seed.

### 5.1 RNG

`mulberry32(seed: number)` → `() => number` in [0, 1). Helpers: `randInt(rng, n)`, `shuffle(rng, arr)` (Fisher–Yates, returns new array). UI creates seeds with `crypto.getRandomValues(new Uint32Array(1))[0]`.

### 5.2 Precomputed tables

In `grid.ts`: `ROWS`, `COLS`, `BOXES` (9 index arrays each), `UNITS` (27), `PEERS[81]` (20 each), `UNITS_OF[81]` (3 each).

`parseGrid` accepts 81 chars of `1`–`9` with `.` or `0` for empty (anything else throws); `serializeGrid` writes empty cells as `.`.

### 5.3 Bitmask candidates

In `candidates.ts`: mask `0x1FF` = all digits. `candidatesFor(grid, i)` = `ALL & ~(union of peer values' bits)`. Popcount and `maskToDigits` via lookup table of 512 entries.

### 5.4 Solver

In `solver.ts`:
- Backtracking over a working copy with per-row/col/box used-digit masks.
- Branch on the empty cell with the fewest candidates (MRV); cell with 0 candidates → backtrack.
- `solve(grid): Grid | null` — first solution, `null` if none or if the input already has conflicts.
- `countSolutions(grid, limit = 2): number` — stops at `limit`.
- `solveRandom(grid, rng)` — same, but candidate order shuffled; used to make full solutions.
- Target: hardest known puzzles solve in < 50 ms on a laptop.

### 5.5 Difficulty

Difficulty is defined only by the number of givens. This correlates with real difficulty only roughly; a technique-based rating is planned (see §2 Later), and the generator is structured so that a rating check can be added as an extra acceptance condition without changing its interface.

| Difficulty | Givens range | MAX_ATTEMPTS |
|---|---|---|
| easy | 36–40 | 10 |
| medium | 32–35 | 20 |
| hard | 28–31 | 30 |
| expert | 24–27 | 50 |

### 5.6 Generator

In `generator.ts`:
```
generatePuzzle(difficulty, seed): Puzzle
  rng   = mulberry32(seed)
  range = GIVENS_RANGE[difficulty]
  best  = null
  repeat up to MAX_ATTEMPTS[difficulty] times:
    solution = solveRandom(emptyGrid, rng)
    target   = range.min + randInt(rng, range.max - range.min + 1)
    puzzle   = copy(solution)
    for each symmetric pair (i, 80 - i) in shuffled order:
      if givenCount(puzzle) <= target: break
      if givenCount(puzzle) - pairSize < range.min: continue
      remove pair; if countSolutions(puzzle, 2) !== 1: restore pair
    if givenCount(puzzle) is within range: return it
    best = the attempt so far whose givens count is closest to range
  return best
```
- Uniqueness is guaranteed by construction: every removal is checked with `countSolutions(…, 2) === 1`.
- 180° rotational symmetry for looks (the center cell, 40, is its own pair; `pairSize` is 1 for it, 2 otherwise).
- Puzzles are reproducible from `(difficulty, seed)`.
- Fallback (`best`) exists only as a safety net; for the test seeds the result must be within range.
- Typical time target in the worker: < 300 ms for every difficulty.

### 5.7 Worker

In `src/workers/generator.worker.ts`: Receives `{ difficulty, seed }`, replies with a `Puzzle` or `{ error }`. Client: `generatePuzzle(difficulty, seed?): Promise<Puzzle>` in `src/workers/generatePuzzle.ts` (module worker via `new Worker(new URL('./generator.worker.ts', import.meta.url), { type: 'module' })`; one worker instance, reused).

## 6. UI/UX

### 6.1 Layout

```
Portrait (default)                  Landscape (≥ 900px wide and wider than tall)
┌─────────────────────────────┐     ┌──────────────────────┬──────────────┐
│ Sudoku   [New] [⚙]          │     │ Sudoku [New] [⚙]     │              │
│ Medium · 04:12 · Mistakes 1 │     │ Medium·04:12·Mist. 1 │  Toolbar     │
│ ┌─────────────────────────┐ │     │ ┌──────────────────┐ │              │
│ │        9×9 board        │ │     │ │    9×9 board     │ │  Number pad  │
│ └─────────────────────────┘ │     │ └──────────────────┘ │  (3×3)       │
│ [↶][↷][⌫][✎ Notes][💡][⏸]   │     └──────────────────────┴──────────────┘
│ [1][2][3][4][5][6][7][8][9] │
└─────────────────────────────┘
```
- Board: CSS Grid, square, size `min(100vw - 32px, 100dvh - <header + controls>, 560px)`; 16 px side gutter; thicker borders between boxes. Font sizes in container-query units (`cqi`) so they scale with the board.
- Cell: value centered; notes as a 3×3 mini-grid of small digits.
- Number pad: each button shows the digit and remaining count (per the *Number pad availability* rule in §3.7); disabled at 0 remaining. In notes mode, the pad looks visibly different (outlined digits).
- Toolbar: Undo, Redo, Erase, Notes (toggle, `aria-pressed`), Hint, Pause/Resume. Auto-candidates is in the settings dialog ("Fill candidates", counts as a hint).
- Status line: difficulty, timer (hidden if `showTimer` is false), mistakes (`Mistakes 1/3` in limit mode, `Mistakes 1` in check mode, hidden in off mode).
- Dialogs use native `<dialog>`: New game (4 difficulty buttons; shows a confirmation step if a game is in `playing`/`paused`), Won (time, mistakes, hints, best time, New game), Lost (Restart, New game), Settings (mistake mode, show timer, theme, fill candidates, reset stats, stats table).
- While generating: the new game dialog shows a spinner; the current board remains visible.
- Paused: digits hidden, overlay "Paused — Resume".

### 6.2 Cell visual states

Priority high → low: selected > conflict/wrong > same digit as selected > peer of selected > default.
- Given: normal-weight text color. User: accent color. Hinted: accent with dotted underline.
- Wrong (check/limit): error color + solid underline. Conflict: error-tinted background + error color text.

### 6.3 Mouse and touch

Click/tap a cell to select it; tap a pad digit to input; toolbar buttons as above. No hover-only behavior; touch targets ≥ 44 px tall (pad buttons are 1/9 of board width, ≥ 32 px wide at 320 px).

### 6.4 Keyboard

Global `keydown` on `document`; ignored while a dialog is open; uses `event.code` so Shift+digit works on every layout.

| Key | Action |
|---|---|
| Arrows / WASD | Move selection (wraps) |
| `1`–`9`, Numpad `1`–`9` | Input (value or note per notes mode) |
| `Shift` + `1`–`9` | Toggle note |
| `Backspace`, `Delete`, `0` | Erase |
| `N` | Toggle notes mode |
| `H` | Hint |
| `P` | Pause / resume |
| `Ctrl/Cmd+Z` | Undo |
| `Ctrl/Cmd+Shift+Z`, `Ctrl+Y` | Redo |
| `Esc` | Close dialog (native) |

### 6.5 Accessibility

- Board `role="grid"` with 9 `role="row"` and 81 `role="gridcell"`. Roving tabindex: the selected cell (or cell 0) has `tabIndex=0`, focus follows selection, `aria-selected` on the selected cell.
- `aria-label` per cell: `"Row 3, column 5, 7, given"`, `"Row 3, column 5, empty, notes 1 4 9"`, `"…, 4, wrong"`, `"…, conflict"`.
- An `aria-live="polite"` region announces conflicts, wrong digits, hint results, pause and win/loss.
- Errors are never shown by color alone (underline / background + label). Text and states meet WCAG AA contrast in both themes.
- `prefers-reduced-motion`: no animations (win animation and transitions off).

### 6.6 Theme

CSS custom properties in `src/styles/theme.css`. Light tokens on `:root`; dark tokens under `@media (prefers-color-scheme: dark)` for `:root:not([data-theme="light"])`, plus `:root[data-theme="dark"]`. The settings store sets `data-theme` on `<html>` (removed for `system`).

## 7. Architecture

### 7.1 Folder structure

```
src/
  lib/                       # pure TS: no React, no DOM, no Zustand
    types.ts
    rng.ts
    grid.ts                  # indices, units, peers, parse/serialize ("." or "0" = empty)
    candidates.ts            # bitmask helpers
    rules.ts                 # findConflicts, isSolved, digitCounts
    solver.ts
    generator.ts
    format.ts                # formatTime
    settings.ts              # DEFAULT_SETTINGS
    stats.ts                 # emptyStats, recordStart, recordWin
    game/
      createGame.ts
      reducer.ts             # gameReducer(state, action): GameState
      history.ts             # applyStep / revertStep
      selectors.ts           # cellFlags, conflicts (memoized on cells ref), remaining digits, cellLabel
    __fixtures__/puzzles.ts  # known puzzles with solutions
    *.test.ts                # next to sources
  store/                     # Zustand stores (thin)
    gameStore.ts             # { game, generating, error, dispatch, startNewGame }
    settingsStore.ts
    statsStore.ts
  workers/
    generator.worker.ts
    generatePuzzle.ts
  hooks/
    useKeyboard.ts
    useTimer.ts              # 1s interval → tick(deltaMs from performance.now())
    useAutoPause.ts          # visibilitychange → pause/resume 'auto'
    useTheme.ts
  components/
    Board/        Board.tsx, Cell.tsx, Board.module.css
    NumberPad/    NumberPad.tsx, NumberPad.module.css
    Toolbar/      Toolbar.tsx, Toolbar.module.css
    StatusBar/    StatusBar.tsx, StatusBar.module.css
    dialogs/      Dialog.tsx, NewGameDialog.tsx, ResultDialog.tsx, SettingsDialog.tsx, dialogs.module.css
    LiveRegion.tsx
  styles/   theme.css, global.css
  App.tsx, App.module.css, main.tsx
```

### 7.2 State management

Zustand + pure reducer.
- `gameReducer` holds all game logic. The store only wraps it: `dispatch: (a) => set((s) => ({ game: s.game && gameReducer(s.game, a) }))`.
- Side effects live in the store or hooks, never in the reducer: generation, stats updates on status transitions (`ready→playing`, `→won`, `→lost`), randomness for hints, and announcements.
- Components subscribe narrowly:
  - `Cell` uses `useGameStore((s) => s.game!.cells[i])` (stable ref) and `useGameStore((s) => cellFlags(s.game!, i))` (a number bit-flag), so one input re-renders only the affected cells.
  - The timer reads `elapsedMs` in `StatusBar` only.
- Settings/stats stores are independent; changing `mistakeMode` in settings also dispatches `setMistakeMode` to the game.
- Dependency rule: `components → hooks/store → lib`. `lib` imports nothing outside `lib`.

## 8. Testing strategy

### 8.1 Tools and scripts

- Vitest; `@testing-library/react`, `@testing-library/user-event` and `jsdom` for components.
- Test files use `// @vitest-environment jsdom` when they need the DOM; the default environment is `node`.
- Explicit `import { describe, it, expect } from 'vitest'` (no globals).
- Scripts: `test` (`vitest run`), `test:watch` (`vitest`).

### 8.2 Coverage

No numeric target in MVP. Every public function in `src/lib` has tests for its normal behavior and the edge cases listed in §3.

### 8.3 Unit tests (`src/lib`)

- Grid tables (sizes, symmetry, no self-peers), parse/serialize round-trip.
- RNG determinism, shuffle is a permutation.
- Candidates, conflicts, win detection.
- Solver on fixtures: valid unique puzzle → known solution; multi-solution → `countSolutions === 2`; conflicting input → `null`/0; hardest fixture within time.
- Generator property tests: for a fixed list of 10 seeds × 4 difficulties, the result has a unique solution, `givens ⊂ solution`, the givens count is within the difficulty's range, 180° symmetry holds, and the same seed produces the same puzzle.
- Reducer: every action and every edge case in §3, including reference preservation of unchanged cells and undo/redo round-trips that restore exact state.
- Number pad counts in `off` vs `check`/`limit` mode.
- Stats and format functions.

### 8.4 Store tests

Persist round-trip and version-mismatch discard (jsdom `localStorage`).

### 8.5 Component and integration tests

Few, high value:
- Click cell + pad input.
- Keyboard navigation and input; Shift+digit note.
- Undo/redo via keys.
- Conflict and wrong-digit labels.
- Winning a near-complete fixture game shows the result dialog.

### 8.6 Not tested automatically in MVP

Worker wiring, visual layout, theming (manual checklist in task 26).

## 9. Task breakdown

References like "§3.7" point to numbered headings in this file.

Each task ends with `npm test`, `npm run lint`, `npm run build` passing. Mark a task done by changing `[ ]` to `[x]`.

- [x] **1. Test setup.** Install `vitest`; add `test`/`test:watch` scripts; add a `test` block to `vite.config.ts` (`/// <reference types="vitest/config" />`, `include: ['src/**/*.test.{ts,tsx}']`); update CLAUDE.md "Commands".
  Files: `package.json`, `vite.config.ts`, `CLAUDE.md`, `src/lib/types.ts`, `src/lib/types.test.ts` (placeholder that imports types).
  Accept: `npm test` runs 1 passing test; build still type-checks.

- [x] **2. Grid tables and parsing.** Add `ROWS/COLS/BOXES/UNITS/PEERS/UNITS_OF`, `rowOf/colOf/boxOf`, `parseGrid(str)`, `serializeGrid(grid)`.
  Files: `src/lib/grid.ts`, `src/lib/grid.test.ts`.
  Accept: 27 units of 9; every `PEERS[i]` has 20 unique entries without `i`; peer relation is symmetric; parse/serialize round-trip; invalid length/characters throw.

- [x] **3. Seeded RNG.**
  Files: `src/lib/rng.ts`, `src/lib/rng.test.ts`.
  Accept: same seed → same first 10 values; values in [0, 1); `shuffle` returns a permutation and does not mutate its input; `randInt` stays in bounds over 10k draws.

- [x] **4. Candidates and rules.** Bitmask helpers, `candidatesFor`, `findConflicts(values): boolean[]`, `isSolved(cells, solution)`, `digitCounts(values)`.
  Files: `src/lib/candidates.ts`, `src/lib/rules.ts`, `src/lib/candidates.test.ts`, `src/lib/rules.test.ts`.
  Accept: conflicts flag both cells for row/col/box duplicates and nothing on a valid grid; candidates match a hand-checked cell.

- [x] **5. Solver.** `solve`, `countSolutions`, `solveRandom`; fixtures file with ≥ 1 easy, 1 very hard and 1 multi-solution puzzle with their known solutions.
  Files: `src/lib/solver.ts`, `src/lib/solver.test.ts`, `src/lib/__fixtures__/puzzles.ts`.
  Accept: fixtures solve to their known solutions; multi-solution → 2; conflicting input → `null`/0; empty grid → `countSolutions === 2`; `solveRandom` with different seeds gives different valid full grids; very hard fixture < 50 ms.

- [x] **6. Generator.** `generatePuzzle(difficulty, seed)` per §5.5–5.6.
  Files: `src/lib/generator.ts`, `src/lib/generator.test.ts`.
  Accept: generator property tests from §8.3 pass for the fixed seed list; the generator test file finishes < 20 s.

- [x] **7. Game creation, selection, movement.** `createGame`, reducer skeleton with `select`, `move`, `toggleNotesMode`, `setMistakeMode`.
  Files: `src/lib/game/createGame.ts`, `src/lib/game/reducer.ts`, `src/lib/game/reducer.test.ts`.
  Accept: `createGame` marks givens, status `ready`; moves wrap on all four edges; move with no selection selects 0; select ignored when paused.

- [x] **8. Input, notes, erase.** `input`, `note`, `erase` with peer note cleanup; first board change moves `ready → playing`.
  Files: `src/lib/game/reducer.ts`, `src/lib/game/reducer.test.ts`.
  Accept: every input/note/erase rule in §3.7; placing a digit removes it from peers' notes; no-ops on givens/hinted cells; unchanged cells keep references.

- [x] **9. Mistakes and win/loss.** Mistake counting per mode, `lost` on the 3rd mistake in `limit`, `won` on the last correct digit, terminal statuses.
  Files: `src/lib/game/reducer.ts`, `src/lib/game/reducer.test.ts`.
  Accept: mistakes counted only in `check`/`limit`; changing mode mid-game keeps the count; 3rd mistake in limit → `lost`; last correct digit → `won`; all board actions ignored in `won`/`lost`.

- [x] **10. Undo/redo.** Patch-based history.
  Files: `src/lib/game/history.ts`, `src/lib/game/reducer.ts`, tests.
  Accept: placing a digit that clears peer notes is undone in one step; undo→redo yields deep-equal state; a new action clears `future`; undo does not change mistakes/hints/timer; undo ignored when won/lost/paused.

- [x] **11. Hint and auto-candidates.**
  Files: `src/lib/game/reducer.ts`, tests.
  Accept: hint picks the selected empty/wrong cell, otherwise the cell chosen deterministically from `random`; hinted cells are locked; hint clears peers' notes; auto-candidates fills correct masks, is one undo step and counts as a hint; undo does not decrement `hintsUsed`.

- [x] **12. Pause/resume, tick, restart.**
  Files: `src/lib/game/reducer.ts`, tests.
  Accept: tick only adds while `playing`; auto-resume does not undo a user pause; actions ignored while paused; restart resets to givens with zero timer/mistakes/hints/history and status `ready`.

- [x] **13. Selectors, format, settings, stats.** `cellFlags`, memoized `getConflicts`, `remainingDigits`, `cellLabel`, `formatTime`, `DEFAULT_SETTINGS`, `recordStart/recordWin`.
  Files: `src/lib/game/selectors.ts`, `src/lib/format.ts`, `src/lib/settings.ts`, `src/lib/stats.ts`, tests.
  Accept: flags correct for selected/peer/same-digit/conflict/wrong (wrong hidden in `off`); `getConflicts` returns the same array for the same `cells` ref; `remainingDigits` follows the *Number pad availability* rule in §3.7 in every mode; labels match the formats in §6.5; `formatTime(65_000) === '01:05'`, `formatTime(3_725_000) === '1:02:05'`; best/average time updated correctly.

- [x] **14. Stores.** Install `zustand`. Game, settings and stats stores with `persist` (keys/versions per §4.3); `startNewGame` calls an injectable generator; stats updated on status transitions.
  Files: `src/store/*.ts`, `src/store/gameStore.test.ts`, `package.json`.
  Accept: (jsdom) state survives store re-creation from `localStorage`; wrong version or corrupted JSON → defaults; `won` game is not restored; `ready→playing` increments `played` once.

- [x] **15. Worker.** Worker + promise client; wire into `gameStore.startNewGame`.
  Files: `src/workers/generator.worker.ts`, `src/workers/generatePuzzle.ts`, `src/store/gameStore.ts`.
  Accept (manual, `npm run dev`): calling `startNewGame('expert')` from the console resolves with a puzzle while the page stays responsive; the production build emits a separate worker chunk.

- [ ] **16. App shell and theme.** Remove template content (`App.css`, `index.css`, `src/assets/*`, template markup, unused `public/icons.svg`); add theme tokens, global styles, responsive layout containers.
  Files: `src/App.tsx`, `src/App.module.css`, `src/main.tsx`, `src/styles/theme.css`, `src/styles/global.css`, `src/hooks/useTheme.ts`, `index.html` (title).
  Accept: empty layout renders in light and dark (system and forced); no horizontal scroll at 320 px; landscape switches to side panel at ≥ 900 px.

- [ ] **17. Board and Cell: rendering and ARIA.** Install `@testing-library/react`, `@testing-library/user-event`, `jsdom`. Render values and notes, grid ARIA, roving tabindex, click-to-select.
  Files: `src/components/Board/*`, `src/components/Board/Board.test.tsx`, `src/App.tsx`, `package.json`.
  Accept: test — clicking a cell sets `aria-selected` and its label matches the spec; notes render as a 3×3 mini-grid.

- [ ] **18. Cell visual states and render performance.** Selected/peer/same-digit/conflict/wrong/given/hinted styles per §6.2 priority; narrow store subscriptions.
  Files: `src/components/Board/*`.
  Accept: manual — highlights match §6.2 priority in both themes; React DevTools "highlight updates" shows only affected cells re-render on input.

- [ ] **19. Number pad and toolbar.**
  Files: `src/components/NumberPad/*`, `src/components/Toolbar/*`, tests, `src/App.tsx`.
  Accept: test — select cell, click pad `5` → cell shows 5; notes toggle changes pad behavior; undo button restores; pad digit disabled per the *Number pad availability* rule in §3.7.

- [ ] **20. Keyboard.**
  Files: `src/hooks/useKeyboard.ts`, `src/hooks/useKeyboard.test.tsx`, `src/App.tsx`.
  Accept: test — every shortcut in the §6.4 table dispatches the right action; Shift+Digit1 toggles note 1; keys are ignored while a dialog is open; focus follows selection.

- [ ] **21. Status bar, timer, pause.**
  Files: `src/components/StatusBar/*`, `src/hooks/useTimer.ts`, `src/hooks/useAutoPause.ts`, `src/components/Board/*` (paused overlay), `src/App.tsx`.
  Accept: manual — timer advances only while playing; switching tabs pauses and returns resumes; user pause persists across tab switch; digits hidden while paused; mistakes display per mode; `showTimer=false` hides timer.

- [ ] **22. New game dialog and flow.**
  Files: `src/components/dialogs/Dialog.tsx`, `NewGameDialog.tsx`, `dialogs.module.css`, `src/App.tsx`.
  Accept: first load without a saved game opens the dialog; confirmation shown only for an in-progress game; spinner while generating; reload mid-game resumes the same board, notes, time and history.

- [ ] **23. Result dialogs and stats.**
  Files: `src/components/dialogs/ResultDialog.tsx`, `src/App.tsx`, `src/components/dialogs/ResultDialog.test.tsx`.
  Accept: test — finishing a near-complete fixture game shows time/mistakes/hints; manual — 3rd mistake in limit mode shows Lost with working Restart; best time updates.

- [ ] **24. Settings dialog.**
  Files: `src/components/dialogs/SettingsDialog.tsx`, `src/components/Toolbar/Toolbar.tsx` or header, `src/App.tsx`.
  Accept: changing mistake mode updates the current game display immediately; theme override persists across reload; "Fill candidates" works and increments hints; reset stats clears the stats table.

- [ ] **25. Live announcements and a11y pass.**
  Files: `src/components/LiveRegion.tsx`, `src/store/gameStore.ts`, components as needed.
  Accept: VoiceOver reads cell labels while arrowing and announces conflict/hint/win; whole game playable with keyboard only; axe DevTools shows no serious issues; reduced motion disables animations.

- [ ] **26. Responsive and final QA.**
  Files: CSS modules as needed, `CLAUDE.md` (update "Project state").
  Accept, manually at 320×568, 390×844, 768×1024, 1280×800 and landscape phone:
  - no horizontal scroll; board stays square;
  - touch targets ≥ 44 px tall;
  - full game is playable by touch;
  - both themes pass the contrast check.