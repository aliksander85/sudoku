// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EASY } from '../../lib/__fixtures__/puzzles.ts'
import { createGame } from '../../lib/game/createGame.ts'
import { parseGrid } from '../../lib/grid.ts'
import type { Digit, GameState, Puzzle } from '../../lib/types.ts'
import { useGameStore, useStatsStore } from '../../store/index.ts'
import ResultDialog from './ResultDialog.tsx'

const puzzle: Puzzle = {
  id: 'easy-1',
  difficulty: 'easy',
  seed: 1,
  givens: parseGrid(EASY.puzzle),
  solution: parseGrid(EASY.solution),
}

const button = (name: string) => screen.getByRole('button', { name, hidden: true })

// One empty cell left; `selected` points at it.
function nearlyDone(overrides: Partial<GameState> = {}): { game: GameState; index: number; digit: Digit } {
  const base = createGame(puzzle, 'check')
  const index = puzzle.givens.indexOf(0)
  const cells = base.cells.map((c, i) => (c.given || i === index ? c : { ...c, value: puzzle.solution[i] }))
  const game: GameState = { ...base, cells, selected: index, status: 'playing', elapsedMs: 65_000, ...overrides }
  return { game, index, digit: puzzle.solution[index] as Digit }
}

beforeEach(() => {
  // jsdom has no showModal/close
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open')
  }
  useStatsStore.getState().reset()
  useGameStore.setState({ game: null })
})

afterEach(cleanup)

describe('ResultDialog', () => {
  it('stays closed while the game is in progress', () => {
    useGameStore.setState({ game: nearlyDone().game })
    render(<ResultDialog suppressed={false} onNewGame={() => {}} />)
    expect(document.querySelector('dialog')!.hasAttribute('open')).toBe(false)
  })

  it('shows time, mistakes, hints and best time after the final digit', () => {
    const { game, digit } = nearlyDone({ mistakes: 2, hintsUsed: 1 })
    useGameStore.setState({ game })
    render(<ResultDialog suppressed={false} onNewGame={() => {}} />)
    act(() => useGameStore.getState().dispatch({ type: 'input', digit }))

    const dialog = screen.getByRole('dialog', { hidden: true })
    expect(dialog.hasAttribute('open')).toBe(true)
    expect(dialog.textContent).toContain('You won!')
    expect(dialog.textContent).toContain('01:05')
    expect(dialog.textContent).toMatch(/Mistakes\s*2/)
    expect(dialog.textContent).toMatch(/Hints\s*1/)
    expect(dialog.textContent).toMatch(/Best time\s*01:05/)
    expect(useStatsStore.getState().stats.easy.won).toBe(1)
  })

  it('shows Lost with Restart on the third mistake in limit mode, and Restart resets the game', async () => {
    const { game, index, digit } = nearlyDone({ mistakeMode: 'limit', mistakes: 2 })
    useGameStore.setState({ game })
    render(<ResultDialog suppressed={false} onNewGame={() => {}} />)
    const wrong = ((digit % 9) + 1) as Digit
    act(() => useGameStore.getState().dispatch({ type: 'input', digit: wrong }))

    expect(screen.getByRole('dialog', { hidden: true }).textContent).toContain('Game over')
    await userEvent.click(button('Restart'))
    const restarted = useGameStore.getState().game!
    expect(restarted.status).toBe('ready')
    expect(restarted.mistakes).toBe(0)
    expect(restarted.cells[index].value).toBe(0)
    expect(document.querySelector('dialog')!.hasAttribute('open')).toBe(false)
  })

  it('calls onNewGame from both result states', async () => {
    const onNewGame = vi.fn()
    useGameStore.setState({ game: nearlyDone({ status: 'won' }).game })
    const { rerender } = render(<ResultDialog suppressed={false} onNewGame={onNewGame} />)
    await userEvent.click(button('New game'))
    expect(onNewGame).toHaveBeenCalledTimes(1)

    act(() => useGameStore.setState({ game: nearlyDone({ status: 'lost' }).game }))
    rerender(<ResultDialog suppressed={false} onNewGame={onNewGame} />)
    await userEvent.click(button('New game'))
    expect(onNewGame).toHaveBeenCalledTimes(2)
  })

  it('hides while suppressed', () => {
    useGameStore.setState({ game: nearlyDone({ status: 'won' }).game })
    render(<ResultDialog suppressed onNewGame={() => {}} />)
    expect(document.querySelector('dialog')!.hasAttribute('open')).toBe(false)
  })

  it('ignores Esc', () => {
    useGameStore.setState({ game: nearlyDone({ status: 'won' }).game })
    render(<ResultDialog suppressed={false} onNewGame={() => {}} />)
    const cancel = new Event('cancel', { cancelable: true })
    fireEvent(document.querySelector('dialog')!, cancel)
    expect(cancel.defaultPrevented).toBe(true)
    expect(document.querySelector('dialog')!.hasAttribute('open')).toBe(true)
  })
})
