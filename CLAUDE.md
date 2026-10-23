# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

A feature-complete Sudoku app (SPEC.md tasks 1–26): pure game logic, solver and generator (`src/lib`, generation in a Web Worker under `src/workers`), Zustand stores (`src/store`: game, settings, stats, persisted), and the UI (board, number pad, toolbar, status bar, new game / result / settings dialogs, live region), with Vitest tests next to the code. No routing.

Layout is CSS modules per component plus `src/styles/{global,theme}.css` (light/dark tokens). Portrait is the default; two columns apply at ≥ 900px landscape and also on short landscape viewports (≤ 500px tall, i.e. landscape phones — a deviation from SPEC §6.1's 900px rule). Touch targets are ≥ 44px tall except board cells (inherent to 9×9 at 320px).

See SPEC.md for requirements and the task list.

## Commands

- `npm run dev` — Vite dev server with HMR
- `npm run build` — type-check (`tsc -b`, project references) then production build to `dist/`
- `npm run lint` — Oxlint (config in `.oxlintrc.json`: `react`, `typescript`, `oxc` plugins; `rules-of-hooks` is an error)
- `npm run preview` — serve the production build
- `npm test` — run the Vitest suite once (`vitest run`); `npm run test:watch` runs it in watch mode

Tests use Vitest, configured in the `test` block of `vite.config.ts`; test files are `src/**/*.test.{ts,tsx}` and import `describe/it/expect` from `vitest` explicitly (no globals). Component tests that need the DOM add `// @vitest-environment jsdom`.

Type-checking only happens through `npm run build` (or `npx tsc -b`); `vite dev` does not type-check.

## Stack and structure

- React 19, TypeScript 6, Vite 8 with `@vitejs/plugin-react` (Oxc-based). React Compiler is not enabled.
- Entry: `index.html` → `src/main.tsx` (mounts `<App />` in `StrictMode`) → `src/App.tsx`.
- `tsconfig.json` is a solution file referencing `tsconfig.app.json` (covers `src/`, DOM libs) and `tsconfig.node.json` (covers `vite.config.ts`).
- Static files referenced by absolute URL (e.g. `/icons.svg#...` sprite) live in `public/`; imported assets live in `src/assets/`.

## TypeScript constraints worth knowing

From `tsconfig.app.json`:

- `verbatimModuleSyntax` — type-only imports must use `import type` / `import { type X }`.
- `erasableSyntaxOnly` — no `enum`, `namespace`, or constructor parameter properties; use union types / `as const` objects instead.
- `allowImportingTsExtensions` — local imports include the extension (e.g. `import App from './App.tsx'`), matching existing code.
- `noUnusedLocals` / `noUnusedParameters` — unused bindings fail the build.

## Code style

Match existing files: 2-space indent, single quotes, no semicolons, function components.

Shared types live in src/lib/types.ts (SPEC.md §4.1) — always use them.
