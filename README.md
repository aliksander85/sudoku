# Sudoku

A fast, keyboard-friendly classic 9×9 Sudoku that runs entirely in the browser — no backend, no accounts, no ads. Puzzles are generated on the fly in a Web Worker, always have exactly one solution, and your game survives a page reload.

Built with React 19, TypeScript, Zustand and Vite.

## Features

- **Fresh puzzles every time** — generated at runtime, seeded and reproducible, with a guaranteed unique solution and 180° rotational symmetry.
- **Four difficulties** — Easy, Medium, Hard and Expert.
- **Notes** — a notes mode (or hold `Shift`) for pencil marks; placing a digit clears it from the notes of every cell in its row, column and box.
- **Auto-candidates** — fill every empty cell with its possible digits in one click.
- **Hints** — reveal the selected cell, or a random unsolved one.
- **Unlimited undo / redo** for the whole game.
- **Mistake modes** — *off*, *check* (count mistakes) or *limit* (lose after 3). Rule conflicts are always highlighted.
- **Highlighting** of the selected cell's row, column, box and matching digits.
- **Timer** with manual pause, auto-pause when the tab is hidden, and an option to hide it.
- **Persistence** — the current game, settings and per-difficulty stats are saved in `localStorage`.
- **Light and dark themes** — follows the system by default, with a manual override.
- **Responsive** from 320 px phones to desktop, with a two-column layout on wide and landscape screens.
- **Accessible** — screen-reader labels for every cell and live announcements for moves and game events.

## Keyboard shortcuts

| Key | Action |
|---|---|
| Arrows / `W` `A` `S` `D` | Move selection (wraps around edges) |
| `1`–`9` (incl. numpad) | Enter digit, or toggle note in notes mode |
| `Shift` + `1`–`9` | Toggle note |
| `Backspace`, `Delete`, `0` | Erase |
| `N` | Toggle notes mode |
| `H` | Hint |
| `P` | Pause / resume |
| `Ctrl/Cmd` + `Z` | Undo |
| `Ctrl/Cmd` + `Shift` + `Z`, `Ctrl` + `Y` | Redo |
| `?` | Show keyboard shortcuts (also the `?` button in the header) |
| `Esc` | Close dialog |

Shortcuts use physical key codes, so they work on any keyboard layout.

## Getting started

Requires a recent Node.js and npm.

```sh
git clone https://github.com/aliksander85/sudoku.git
cd sudoku
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Type-check and build for production into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run the test suite once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Lint with Oxlint |

The build output in `dist/` is a static site and can be hosted anywhere (GitHub Pages, Netlify, Vercel, …).

## How it works

### Puzzle generation

1. A full random solution is built by a backtracking solver with shuffled candidate order.
2. Cells are removed in symmetric pairs `(i, 80 − i)` in random order. After each removal the solver counts solutions (stopping at two); if the puzzle is no longer unique, the pair is put back.
3. Removal stops once the number of givens falls within the difficulty's range:

| Difficulty | Givens |
|---|---|
| Easy | 36–40 |
| Medium | 32–35 |
| Hard | 28–31 |
| Expert | 24–27 |

The solver uses bitmask candidates and picks the cell with the fewest options first (MRV), so even the hardest known puzzles solve in milliseconds. Generation runs in a Web Worker to keep the UI responsive, and every puzzle is reproducible from its `(difficulty, seed)` pair thanks to a seeded `mulberry32` RNG.

### State

Game logic is a pure reducer (`src/lib/game`) with no React dependencies, wrapped by Zustand stores for the game, settings and stats. Undo/redo records per-cell before/after patches of board changes only, so it never touches mistakes, hints or the timer.

## Project structure

```
src/
├── lib/          # Pure logic: grid, rules, candidates, solver, generator, RNG, game reducer
├── workers/      # Web Worker for puzzle generation + promise-based client
├── store/        # Zustand stores (game, settings, stats) and localStorage persistence
├── hooks/        # Keyboard shortcuts, timer, auto-pause, theme
├── components/   # Board, NumberPad, Toolbar, StatusBar, dialogs, live region
└── styles/       # Global styles and light/dark theme tokens
```

Each component has its own CSS module. Tests sit next to the code they cover.

## Testing

Tests use [Vitest](https://vitest.dev) and [Testing Library](https://testing-library.com). They cover the solver and generator (uniqueness, givens ranges, reproducibility), the game reducer and its edge cases, undo/redo, stats, persistence, keyboard handling and the main UI components.

```sh
npm test
```

## Roadmap

Ideas for later:

- Technique-based difficulty rating and "explain the next step" hints
- Shareable puzzle links and a daily puzzle
- Cell colour marking
- PWA / offline install
- End-to-end tests and CI

The full specification lives in [SPEC.md](SPEC.md).
