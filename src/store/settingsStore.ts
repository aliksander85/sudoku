import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_SETTINGS } from '../lib/settings.ts'
import type { MistakeMode, Settings } from '../lib/types.ts'
import { isSettings, persistConfig } from './persist.ts'

export interface SettingsStore {
  settings: Settings
  update: (patch: Partial<Settings>) => void
}

interface Deps {
  onMistakeModeChange: (mode: MistakeMode) => void
}

export function createSettingsStore({ onMistakeModeChange }: Deps) {
  return create<SettingsStore>()(
    persist(
      (set, get) => ({
        settings: DEFAULT_SETTINGS,
        update: (patch) => {
          const prev = get().settings
          set({ settings: { ...prev, ...patch } })
          if (patch.mistakeMode !== undefined && patch.mistakeMode !== prev.mistakeMode) {
            onMistakeModeChange(patch.mistakeMode)
          }
        },
      }),
      persistConfig({
        name: 'sudoku:settings',
        version: 1,
        partialize: (s: SettingsStore) => ({ settings: s.settings }),
        isValid: isSettings,
      }),
    ),
  )
}
