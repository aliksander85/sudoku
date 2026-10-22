import { describe, it, expect } from 'vitest'
import { averageMs, createEmptyStats, recordStart, recordWin } from './stats.ts'

describe('stats', () => {
  it('starts empty for every difficulty', () => {
    const s = createEmptyStats()
    for (const d of ['easy', 'medium', 'hard', 'expert'] as const) {
      expect(s[d]).toEqual({ played: 0, won: 0, bestMs: null, totalWonMs: 0 })
    }
  })

  it('recordStart increments played only for that difficulty, without mutating', () => {
    const s = createEmptyStats()
    const next = recordStart(s, 'hard')
    expect(next.hard.played).toBe(1)
    expect(next.easy).toBe(s.easy)
    expect(s.hard.played).toBe(0)
  })

  it('recordWin tracks won, total and best time', () => {
    let s = createEmptyStats()
    s = recordWin(s, 'easy', 120_000)
    expect(s.easy).toMatchObject({ won: 1, bestMs: 120_000, totalWonMs: 120_000 })
    s = recordWin(s, 'easy', 90_000)
    s = recordWin(s, 'easy', 200_000)
    expect(s.easy).toMatchObject({ won: 3, bestMs: 90_000, totalWonMs: 410_000 })
    expect(s.medium.won).toBe(0)
  })

  it('averageMs is null without wins, otherwise total / won', () => {
    let s = createEmptyStats()
    expect(averageMs(s.easy)).toBeNull()
    s = recordWin(recordWin(s, 'easy', 100_000), 'easy', 200_000)
    expect(averageMs(s.easy)).toBe(150_000)
  })

  it('does not count a start as a win', () => {
    const s = recordStart(createEmptyStats(), 'easy')
    expect(s.easy).toMatchObject({ played: 1, won: 0, bestMs: null })
  })
})
