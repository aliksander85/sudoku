// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { EASY } from '../../lib/__fixtures__/puzzles.ts'
import { createGame } from '../../lib/game/createGame.ts'
import { parseGrid } from '../../lib/grid.ts'
import { DEFAULT_SETTINGS } from '../../lib/settings.ts'
import type { Puzzle } from '../../lib/types.ts'
import { useGameStore, useSettingsStore, useStatsStore } from '../../store/index.ts'
import SettingsDialog from './SettingsDialog.tsx'

const puzzle: Puzzle = {
  id: 'easy-1',
  difficulty: 'easy',
  seed: 1,
  givens: parseGrid(EASY.puzzle),
  solution: parseGrid(EASY.solution),
}

const button = (name: string | RegExp) => screen.getByRole('button', { name, hidden: true })
const radio = (name: string) => screen.getByRole('radio', { name, hidden: true })

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open')
  }
  useSettingsStore.setState({ settings: DEFAULT_SETTINGS })
  useStatsStore.getState().reset()
  useGameStore.setState({ game: { ...createGame(puzzle, 'check'), status: 'playing' } })
})

afterEach(cleanup)

describe('SettingsDialog', () => {
  it('changing mistake mode updates the current game', async () => {
    render(<SettingsDialog open onClose={() => {}} />)
    await userEvent.click(radio('limit'))
    expect(useSettingsStore.getState().settings.mistakeMode).toBe('limit')
    expect(useGameStore.getState().game!.mistakeMode).toBe('limit')
  })

  it('toggles the timer and sets the theme', async () => {
    render(<SettingsDialog open onClose={() => {}} />)
    await userEvent.click(screen.getByRole('checkbox', { name: 'Show timer', hidden: true }))
    await userEvent.click(radio('dark'))
    const { settings } = useSettingsStore.getState()
    expect(settings.showTimer).toBe(false)
    expect(settings.theme).toBe('dark')
  })

  it('Fill candidates adds notes, counts a hint and closes', async () => {
    let closed = false
    render(<SettingsDialog open onClose={() => (closed = true)} />)
    await userEvent.click(button(/Fill candidates/))
    const game = useGameStore.getState().game!
    expect(game.hintsUsed).toBe(1)
    expect(game.cells.some((c) => c.notes !== 0)).toBe(true)
    expect(closed).toBe(true)
  })

  it('disables Fill candidates without a playing game', () => {
    act(() => useGameStore.setState({ game: null }))
    render(<SettingsDialog open onClose={() => {}} />)
    expect((button(/Fill candidates/) as HTMLButtonElement).disabled).toBe(true)
  })

  it('reset stats clears the table after confirmation', async () => {
    act(() => {
      useStatsStore.getState().recordStart('easy')
      useStatsStore.getState().recordWin('easy', 65_000)
    })
    render(<SettingsDialog open onClose={() => {}} />)
    expect(screen.getByRole('row', { name: /easy/i, hidden: true }).textContent).toContain('01:05')
    await userEvent.click(button('Reset stats'))
    await userEvent.click(button('Confirm reset'))
    expect(useStatsStore.getState().stats.easy.played).toBe(0)
    expect(screen.getByRole('row', { name: /easy/i, hidden: true }).textContent).not.toContain('01:05')
  })
})
