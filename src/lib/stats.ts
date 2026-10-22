import type { Difficulty, DifficultyStats, Stats } from './types.ts'

const emptyDifficultyStats = (): DifficultyStats => ({
  played: 0,
  won: 0,
  bestMs: null,
  totalWonMs: 0,
})

export function createEmptyStats(): Stats {
  return {
    easy: emptyDifficultyStats(),
    medium: emptyDifficultyStats(),
    hard: emptyDifficultyStats(),
    expert: emptyDifficultyStats(),
  }
}

export function recordStart(stats: Stats, difficulty: Difficulty): Stats {
  const d = stats[difficulty]
  return { ...stats, [difficulty]: { ...d, played: d.played + 1 } }
}

export function recordWin(stats: Stats, difficulty: Difficulty, elapsedMs: number): Stats {
  const d = stats[difficulty]
  return {
    ...stats,
    [difficulty]: {
      ...d,
      won: d.won + 1,
      totalWonMs: d.totalWonMs + elapsedMs,
      bestMs: d.bestMs === null ? elapsedMs : Math.min(d.bestMs, elapsedMs),
    },
  }
}

export function averageMs(d: DifficultyStats): number | null {
  return d.won > 0 ? d.totalWonMs / d.won : null
}
