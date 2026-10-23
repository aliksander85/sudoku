// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { EASY } from '../../lib/__fixtures__/puzzles.ts'
import { createGame } from '../../lib/game/createGame.ts'
import { parseGrid } from '../../lib/grid.ts'
import type { Difficulty, Puzzle } from '../../lib/types.ts'
import { useGameStore } from '../../store/index.ts'
import NewGameDialog from './NewGameDialog.tsx'

const puzzle: Puzzle = {
  id: 'easy-1',
  difficulty: 'easy',
  seed: 1,
  givens: parseGrid(EASY.puzzle),
  solution: parseGrid(EASY.solution),
}

const button = (name: string) => screen.getByRole('button', { name, hidden: true }) as HTMLButtonElement

let startNewGame: Mock<(difficulty: Difficulty) => Promise<void>>

beforeEach(() => {
  // jsdom has no showModal/close
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open')
  }
  startNewGame = vi.fn<(difficulty: Difficulty) => Promise<void>>(() => Promise.resolve())
  useGameStore.setState({ game: null, startNewGame })
})

afterEach(cleanup)

describe('NewGameDialog', () => {
  it('starts immediately when there is no game', async () => {
    const onClose = vi.fn()
    render(<NewGameDialog open onClose={onClose} dismissible={false} />)
    await userEvent.click(button('hard'))
    expect(startNewGame).toHaveBeenCalledWith('hard')
    expect(onClose).toHaveBeenCalled()
  })

  it('starts immediately for a game that has not begun', async () => {
    useGameStore.setState({ game: createGame(puzzle, 'check') })
    render(<NewGameDialog open onClose={() => {}} dismissible />)
    await userEvent.click(button('easy'))
    expect(startNewGame).toHaveBeenCalledWith('easy')
  })

  it('asks for confirmation when a game is in progress', async () => {
    useGameStore.setState({ game: { ...createGame(puzzle, 'check'), status: 'playing' } })
    render(<NewGameDialog open onClose={() => {}} dismissible />)
    await userEvent.click(button('expert'))
    expect(startNewGame).not.toHaveBeenCalled()
    await userEvent.click(button('Back'))
    expect(button('expert')).toBeTruthy()
    await userEvent.click(button('expert'))
    await userEvent.click(button('Start new game'))
    expect(startNewGame).toHaveBeenCalledWith('expert')
  })

  it('shows a spinner while generating and closes afterwards', async () => {
    let resolve!: () => void
    startNewGame.mockReturnValue(new Promise<void>((r) => (resolve = r)))
    const onClose = vi.fn()
    render(<NewGameDialog open onClose={onClose} dismissible={false} />)
    await userEvent.click(button('medium'))
    expect(screen.getByRole('status', { hidden: true }).textContent).toContain('Generating')
    expect(button('easy').disabled).toBe(true)
    expect(onClose).not.toHaveBeenCalled()
    await act(async () => resolve())
    expect(onClose).toHaveBeenCalled()
  })

  it('ignores Esc when not dismissible and closes on Esc when dismissible', () => {
    const onClose = vi.fn()
    const { rerender } = render(<NewGameDialog open onClose={onClose} dismissible={false} />)
    fireEvent(document.querySelector('dialog')!, new Event('cancel', { cancelable: true }))
    expect(onClose).not.toHaveBeenCalled()
    rerender(<NewGameDialog open onClose={onClose} dismissible />)
    fireEvent(document.querySelector('dialog')!, new Event('cancel', { cancelable: true }))
    expect(onClose).toHaveBeenCalled()
  })
})
