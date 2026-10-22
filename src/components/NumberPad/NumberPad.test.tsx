// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { EASY } from '../../lib/__fixtures__/puzzles.ts'
import { createGame } from '../../lib/game/createGame.ts'
import { parseGrid } from '../../lib/grid.ts'
import type { MistakeMode } from '../../lib/types.ts'
import { useGameStore } from '../../store/index.ts'
import Board from '../Board/Board.tsx'
import Toolbar from '../Toolbar/Toolbar.tsx'
import NumberPad from './NumberPad.tsx'

const puzzle = {
  id: 'easy-1',
  difficulty: 'easy' as const,
  seed: 1,
  givens: parseGrid(EASY.puzzle),
  solution: parseGrid(EASY.solution),
}

const emptyIndex = puzzle.givens.findIndex((v) => v === 0)
const solutionDigit = puzzle.solution[emptyIndex]

const cellAt = (index: number) =>
  screen.getAllByRole('gridcell').find((el) => el.getAttribute('data-index') === String(index))!

const padButton = (digit: number) => screen.getByRole('button', { name: new RegExp(`^${digit}, `) })

beforeEach(() => {
  useGameStore.setState({ game: createGame(puzzle, 'check') })
})

afterEach(cleanup)

describe('NumberPad', () => {
  it('enters the digit into the selected cell', async () => {
    render(
      <>
        <Board />
        <NumberPad />
      </>,
    )
    await userEvent.click(cellAt(emptyIndex))
    await userEvent.click(padButton(5))
    expect(useGameStore.getState().game!.cells[emptyIndex].value).toBe(5)
    expect(cellAt(emptyIndex).getAttribute('aria-label')).toContain(', 5')
  })

  it('shows remaining counts', () => {
    render(<NumberPad />)
    const given = puzzle.givens.filter((v) => v === 1).length
    expect(padButton(1).textContent).toBe(`1${9 - given}`)
  })

  it('adds a note instead of a value in notes mode', async () => {
    render(
      <>
        <Board />
        <Toolbar />
        <NumberPad />
      </>,
    )
    await userEvent.click(cellAt(emptyIndex))
    const notes = screen.getByRole('button', { name: /Notes/ })
    expect(notes.getAttribute('aria-pressed')).toBe('false')
    await userEvent.click(notes)
    expect(notes.getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('group', { name: 'Number pad' }).getAttribute('data-notes')).toBe('true')
    await userEvent.click(padButton(5))
    const cell = useGameStore.getState().game!.cells[emptyIndex]
    expect(cell.value).toBe(0)
    expect(cell.notes).not.toBe(0)
    expect(cellAt(emptyIndex).getAttribute('aria-label')).toContain('notes 5')
  })

  it('disables a digit with no copies remaining', () => {
    const game = createGame(puzzle, 'check')
    game.cells.forEach((c, i) => {
      if (puzzle.solution[i] === 7) c.value = 7
    })
    useGameStore.setState({ game })
    render(<NumberPad />)
    expect((padButton(7) as HTMLButtonElement).disabled).toBe(true)
    expect((padButton(8) as HTMLButtonElement).disabled).toBe(false)
  })

  describe.each<[MistakeMode, boolean]>([
    ['off', true],
    ['check', false],
    ['limit', false],
  ])('with a wrong digit placed (%s mode)', (mode, disabled) => {
    it(`is ${disabled ? 'disabled' : 'enabled'}`, () => {
      // 9 copies of `d` on the board: 8 correct and 1 wrong; the 9th correct cell is empty
      const d = solutionDigit
      const game = createGame(puzzle, mode)
      const correct = puzzle.solution.map((v, i) => (v === d ? i : -1)).filter((i) => i >= 0)
      correct.slice(1).forEach((i) => (game.cells[i].value = d))
      game.cells[correct[0]].value = 0
      const wrongAt = puzzle.givens.findIndex((v, i) => v === 0 && puzzle.solution[i] !== d && i !== correct[0])
      game.cells[wrongAt].value = d
      useGameStore.setState({ game })
      render(<NumberPad />)
      expect((padButton(d) as HTMLButtonElement).disabled).toBe(disabled)
    })
  })

  it('is disabled while paused', () => {
    const game = createGame(puzzle, 'check')
    useGameStore.setState({ game: { ...game, status: 'paused', pausedBy: 'user' } })
    render(<NumberPad />)
    expect((padButton(1) as HTMLButtonElement).disabled).toBe(true)
  })
})
