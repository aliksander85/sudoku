// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EASY } from '../lib/__fixtures__/puzzles.ts'
import { parseGrid } from '../lib/grid.ts'
import type { Difficulty, Puzzle } from '../lib/types.ts'
import { createGameStore, type PuzzleGenerator } from './gameStore.ts'
import { statsEffect } from './index.ts'
import { createSettingsStore } from './settingsStore.ts'
import { createStatsStore } from './statsStore.ts'

const makePuzzle = (difficulty: Difficulty, seed: number): Puzzle => ({
  id: `${difficulty}-${seed}`,
  difficulty,
  seed,
  givens: parseGrid(EASY.puzzle),
  solution: parseGrid(EASY.solution),
})

// All cells filled except index 2, so a single correct digit wins.
const almostSolved = (difficulty: Difficulty, seed: number): Puzzle => {
  const solution = parseGrid(EASY.solution)
  const givens = solution.slice()
  givens[2] = 0
  return { id: `${difficulty}-${seed}`, difficulty, seed, givens, solution }
}

function setup(generate: PuzzleGenerator = vi.fn(makePuzzle)) {
  const settings = createSettingsStore({
    onMistakeModeChange: (mode) => game.getState().dispatch({ type: 'setMistakeMode', mode }),
  })
  const stats = createStatsStore()
  const game = createGameStore({
    generate,
    getMistakeMode: () => settings.getState().settings.mistakeMode,
    onStatusChange: (prev, next) => statsEffect(stats.getState(), prev, next),
  })
  return { game, settings, stats, generate: vi.mocked(generate) }
}

const store = (key: string, state: unknown, version = 1) =>
  localStorage.setItem(key, JSON.stringify({ state, version }))

beforeEach(() => localStorage.clear())

describe('persistence', () => {
  it('restores game, settings and stats after re-creation', async () => {
    const a = setup()
    await a.game.getState().startNewGame('easy')
    a.game.getState().dispatch({ type: 'select', index: 2 })
    a.game.getState().dispatch({ type: 'input', digit: 4 })
    a.settings.getState().update({ theme: 'dark', showTimer: false })

    const b = setup()
    expect(b.game.getState().game).toEqual(a.game.getState().game)
    expect(b.game.getState().game?.cells[2].value).toBe(4)
    expect(b.settings.getState().settings).toMatchObject({ theme: 'dark', showTimer: false })
    expect(b.stats.getState().stats.easy.played).toBe(1)
  })

  it('uses defaults on a wrong version', async () => {
    const a = setup()
    await a.game.getState().startNewGame('easy')
    a.settings.getState().update({ theme: 'dark' })
    for (const key of ['sudoku:game', 'sudoku:settings', 'sudoku:stats']) {
      const raw = JSON.parse(localStorage.getItem(key)!)
      localStorage.setItem(key, JSON.stringify({ ...raw, version: 99 }))
    }
    const b = setup()
    expect(b.game.getState().game).toBeNull()
    expect(b.settings.getState().settings.theme).toBe('system')
    expect(b.stats.getState().stats.easy.played).toBe(0)
  })

  it('uses defaults on corrupted JSON or a wrong shape', () => {
    localStorage.setItem('sudoku:game', '{not json')
    localStorage.setItem('sudoku:settings', '{{{')
    store('sudoku:stats', { stats: { easy: 'nope' } })
    const b = setup()
    expect(b.game.getState().game).toBeNull()
    expect(b.settings.getState().settings.mistakeMode).toBe('check')
    expect(b.stats.getState().stats.easy.played).toBe(0)

    store('sudoku:game', { game: { status: 'playing' } })
    expect(setup().game.getState().game).toBeNull()
  })

  it('does not restore won or lost games but restores paused ones', async () => {
    const a = setup()
    await a.game.getState().startNewGame('easy')
    const base = a.game.getState().game!
    for (const status of ['won', 'lost'] as const) {
      store('sudoku:game', { game: { ...base, status } })
      expect(setup().game.getState().game).toBeNull()
    }
    store('sudoku:game', { game: { ...base, status: 'paused', pausedBy: 'user' } })
    expect(setup().game.getState().game?.status).toBe('paused')
  })
})

describe('stats transitions', () => {
  it('increments played once on ready → playing', async () => {
    const { game, stats } = setup()
    await game.getState().startNewGame('medium')
    const { dispatch } = game.getState()
    dispatch({ type: 'select', index: 2 })
    expect(stats.getState().stats.medium.played).toBe(0)
    dispatch({ type: 'input', digit: 4 })
    dispatch({ type: 'input', digit: 5 })
    dispatch({ type: 'erase' })
    expect(stats.getState().stats.medium.played).toBe(1)
  })

  it('records a win with the elapsed time', async () => {
    const { game, stats } = setup(vi.fn(almostSolved))
    await game.getState().startNewGame('easy')
    const { dispatch } = game.getState()
    dispatch({ type: 'select', index: 2 })
    dispatch({ type: 'input', digit: 4 })
    expect(game.getState().game?.status).toBe('won')
    expect(stats.getState().stats.easy).toMatchObject({ played: 1, won: 1, bestMs: 0 })
  })
})

describe('game and settings', () => {
  it('passes the difficulty to the generator and uses the settings mistake mode', async () => {
    const { game, settings, generate } = setup()
    settings.getState().update({ mistakeMode: 'limit' })
    await game.getState().startNewGame('hard')
    expect(generate).toHaveBeenCalledWith('hard', expect.any(Number))
    expect(game.getState().game?.puzzle.difficulty).toBe('hard')
    expect(game.getState().game?.mistakeMode).toBe('limit')
  })

  it('forwards a mistake mode change to the running game', async () => {
    const { game, settings } = setup()
    await game.getState().startNewGame('easy')
    settings.getState().update({ mistakeMode: 'off' })
    expect(game.getState().game?.mistakeMode).toBe('off')
  })

  it('ignores a stale generation', async () => {
    let release!: () => void
    const gate = new Promise<void>((r) => (release = r))
    const generate = vi.fn(async (d: Difficulty, seed: number) => {
      if (d === 'easy') await gate
      return makePuzzle(d, seed)
    })
    const { game } = setup(generate)
    const first = game.getState().startNewGame('easy')
    await game.getState().startNewGame('hard')
    release()
    await first
    expect(game.getState().game?.puzzle.difficulty).toBe('hard')
  })
})
