import { createJSONStorage, type PersistOptions } from 'zustand/middleware'
import type { Cell, Difficulty, GameState, Settings, Stats } from '../lib/types.ts'

interface PersistConfig<S, P> {
  name: string
  version: number
  partialize: (state: S) => P
  isValid: (persisted: unknown) => persisted is P
  restore?: (persisted: P) => P
}

// Anything that fails to parse, has another version or the wrong shape falls back to the defaults.
export function persistConfig<S, P>({
  name,
  version,
  partialize,
  isValid,
  restore = (persisted) => persisted,
}: PersistConfig<S, P>): PersistOptions<S, P> {
  return {
    name,
    version,
    storage: createJSONStorage(() => localStorage),
    partialize,
    migrate: () => undefined as unknown as P,
    merge: (persisted, current) => (isValid(persisted) ? { ...current, ...restore(persisted) } : current),
  }
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null

const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

const isOneOf = <T extends string>(options: readonly T[], v: unknown): v is T =>
  typeof v === 'string' && (options as readonly string[]).includes(v)

const DIFFICULTIES: readonly Difficulty[] = ['easy', 'medium', 'hard', 'expert']
const MISTAKE_MODES = ['off', 'check', 'limit'] as const
const STATUSES = ['ready', 'playing', 'paused', 'won', 'lost'] as const

export function isSettings(v: unknown): v is { settings: Settings } {
  if (!isObject(v) || !isObject(v.settings)) return false
  const s = v.settings
  return (
    isOneOf(MISTAKE_MODES, s.mistakeMode) &&
    typeof s.showTimer === 'boolean' &&
    isOneOf(['system', 'light', 'dark'] as const, s.theme)
  )
}

export function isStats(v: unknown): v is { stats: Stats } {
  if (!isObject(v) || !isObject(v.stats)) return false
  const stats = v.stats
  return DIFFICULTIES.every((d) => {
    const s = stats[d]
    return (
      isObject(s) &&
      isNumber(s.played) &&
      isNumber(s.won) &&
      isNumber(s.totalWonMs) &&
      (s.bestMs === null || isNumber(s.bestMs))
    )
  })
}

const isGrid = (v: unknown): boolean =>
  Array.isArray(v) && v.length === 81 && v.every((x) => Number.isInteger(x) && x >= 0 && x <= 9)

const isCell = (v: unknown): v is Cell =>
  isObject(v) &&
  Number.isInteger(v.value) &&
  (v.value as number) >= 0 &&
  (v.value as number) <= 9 &&
  Number.isInteger(v.notes) &&
  (v.notes as number) >= 0 &&
  (v.notes as number) <= 511 &&
  typeof v.given === 'boolean' &&
  typeof v.hinted === 'boolean'

const isHistory = (v: unknown): boolean =>
  Array.isArray(v) &&
  v.every(
    (step) =>
      Array.isArray(step) &&
      step.every(
        (p) =>
          isObject(p) && Number.isInteger(p.index) && (p.index as number) >= 0 && (p.index as number) < 81 && isCell(p.before) && isCell(p.after),
      ),
  )

function isGameState(v: unknown): v is GameState {
  if (!isObject(v) || !isObject(v.puzzle)) return false
  const p = v.puzzle
  return (
    typeof p.id === 'string' &&
    isOneOf(DIFFICULTIES, p.difficulty) &&
    isNumber(p.seed) &&
    isGrid(p.givens) &&
    isGrid(p.solution) &&
    Array.isArray(v.cells) &&
    v.cells.length === 81 &&
    v.cells.every(isCell) &&
    (v.selected === null || (Number.isInteger(v.selected) && (v.selected as number) >= 0 && (v.selected as number) < 81)) &&
    typeof v.notesMode === 'boolean' &&
    isOneOf(STATUSES, v.status) &&
    (v.pausedBy === null || v.pausedBy === 'user' || v.pausedBy === 'auto') &&
    isOneOf(MISTAKE_MODES, v.mistakeMode) &&
    isNumber(v.mistakes) &&
    isNumber(v.hintsUsed) &&
    isNumber(v.elapsedMs) &&
    isHistory(v.past) &&
    isHistory(v.future)
  )
}

export function isPersistedGame(v: unknown): v is { game: GameState | null } {
  return isObject(v) && (v.game === null || isGameState(v.game))
}
