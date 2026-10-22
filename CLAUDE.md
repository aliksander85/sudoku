# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

A Sudoku app in its earliest stage: the repo is still the stock Vite `react-ts` template (`src/App.tsx` is the template's demo page). No game logic, routing, state library, or test setup exists yet.

See SPEC.md for requirements and the task list.

## Commands

- `npm run dev` — Vite dev server with HMR
- `npm run build` — type-check (`tsc -b`, project references) then production build to `dist/`
- `npm run lint` — Oxlint (config in `.oxlintrc.json`: `react`, `typescript`, `oxc` plugins; `rules-of-hooks` is an error)
- `npm run preview` — serve the production build

There is no test runner configured. If tests are added, Vitest fits the existing Vite setup; add a `test` script to `package.json` and update this section.

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
