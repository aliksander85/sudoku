import { generatePuzzle } from '../lib/generator.ts'
import type { GameState } from '../lib/types.ts'
import { createGameStore } from './gameStore.ts'
import { createSettingsStore } from './settingsStore.ts'
import { createStatsStore, type StatsStore } from './statsStore.ts'

// Stats side effects of a status transition (§7.2). A loss was already counted in `played`.
export function statsEffect(stats: StatsStore, prev: GameState, next: GameState): void {
  const { difficulty } = next.puzzle
  if (prev.status === 'ready') stats.recordStart(difficulty)
  if (next.status === 'won') stats.recordWin(difficulty, next.elapsedMs)
}

export const useStatsStore = createStatsStore()

export const useGameStore = createGameStore({
  generate: generatePuzzle,
  getMistakeMode: () => useSettingsStore.getState().settings.mistakeMode,
  onStatusChange: (prev, next) => statsEffect(useStatsStore.getState(), prev, next),
})

export const useSettingsStore = createSettingsStore({
  onMistakeModeChange: (mode) => useGameStore.getState().dispatch({ type: 'setMistakeMode', mode }),
})
