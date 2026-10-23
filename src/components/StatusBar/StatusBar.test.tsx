// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { EASY } from '../../lib/__fixtures__/puzzles.ts'
import { createGame } from '../../lib/game/createGame.ts'
import { DEFAULT_SETTINGS } from '../../lib/settings.ts'
import { parseGrid } from '../../lib/grid.ts'
import type { MistakeMode } from '../../lib/types.ts'
import { useGameStore, useSettingsStore } from '../../store/index.ts'
import StatusBar from './StatusBar.tsx'

const puzzle = {
  id: 'easy-1',
  difficulty: 'easy' as const,
  seed: 1,
  givens: parseGrid(EASY.puzzle),
  solution: parseGrid(EASY.solution),
}

function setup(mode: MistakeMode, showTimer = true) {
  useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, showTimer } })
  useGameStore.setState({ game: { ...createGame(puzzle, mode), mistakes: 1, elapsedMs: 65_000 } })
  render(<StatusBar />)
}

beforeEach(() => useSettingsStore.setState({ settings: DEFAULT_SETTINGS }))
afterEach(cleanup)

describe('StatusBar', () => {
  it('shows mistakes with the limit in limit mode', () => {
    setup('limit')
    expect(screen.getByText(/easy/i)).toBeTruthy()
    expect(screen.getByText(/01:05/)).toBeTruthy()
    expect(screen.getByText(/Mistakes 1\/3/)).toBeTruthy()
  })

  it('shows plain mistakes in check mode and hides them in off mode', () => {
    setup('check')
    expect(screen.getByText(/Mistakes 1$/)).toBeTruthy()
    cleanup()
    setup('off')
    expect(screen.queryByText(/Mistakes/)).toBeNull()
  })

  it('hides the timer when showTimer is false', () => {
    setup('check', false)
    expect(screen.queryByText(/01:05/)).toBeNull()
  })
})
