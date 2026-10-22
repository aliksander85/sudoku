import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createGame } from '../lib/game/createGame.ts'
import { reducer as gameReducer } from '../lib/game/reducer.ts'
import type { Difficulty, GameAction, GameState, MistakeMode, Puzzle } from '../lib/types.ts'
import { isPersistedGame, persistConfig } from './persist.ts'

export type PuzzleGenerator = (difficulty: Difficulty, seed: number) => Puzzle | Promise<Puzzle>

export interface GameStore {
  game: GameState | null
  dispatch: (action: GameAction) => void
  hint: () => void
  startNewGame: (difficulty: Difficulty) => Promise<void>
}

interface Deps {
  generate: PuzzleGenerator
  getMistakeMode: () => MistakeMode
  onStatusChange: (prev: GameState, next: GameState) => void
}

export function createGameStore({ generate, getMistakeMode, onStatusChange }: Deps) {
  let request = 0

  return create<GameStore>()(
    persist(
      (set, get) => ({
        game: null,
        dispatch: (action) => {
          const prev = get().game
          if (!prev) return
          const next = gameReducer(prev, action)
          if (next === prev) return
          set({ game: next })
          if (next.status !== prev.status) onStatusChange(prev, next)
        },
        hint: () => get().dispatch({ type: 'hint', random: Math.random() }),
        startNewGame: async (difficulty) => {
          const current = ++request
          const seed = Math.floor(Math.random() * 2 ** 32)
          const puzzle = await generate(difficulty, seed)
          if (current !== request) return
          set({ game: createGame(puzzle, getMistakeMode()) })
        },
      }),
      persistConfig({
        name: 'sudoku:game',
        version: 1,
        partialize: (s: GameStore) => ({ game: s.game }),
        isValid: isPersistedGame,
        restore: ({ game }) => ({
          game: game && (game.status === 'won' || game.status === 'lost') ? null : game,
        }),
      }),
    ),
  )
}
