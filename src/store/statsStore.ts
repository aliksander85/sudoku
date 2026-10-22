import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createEmptyStats, recordStart, recordWin } from '../lib/stats.ts'
import type { Difficulty, Stats } from '../lib/types.ts'
import { isStats, persistConfig } from './persist.ts'

export interface StatsStore {
  stats: Stats
  recordStart: (difficulty: Difficulty) => void
  recordWin: (difficulty: Difficulty, elapsedMs: number) => void
  reset: () => void
}

export function createStatsStore() {
  return create<StatsStore>()(
    persist(
      (set) => ({
        stats: createEmptyStats(),
        recordStart: (difficulty) => set((s) => ({ stats: recordStart(s.stats, difficulty) })),
        recordWin: (difficulty, elapsedMs) => set((s) => ({ stats: recordWin(s.stats, difficulty, elapsedMs) })),
        reset: () => set({ stats: createEmptyStats() }),
      }),
      persistConfig({
        name: 'sudoku:stats',
        version: 1,
        partialize: (s: StatsStore) => ({ stats: s.stats }),
        isValid: isStats,
      }),
    ),
  )
}
