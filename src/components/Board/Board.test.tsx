// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { EASY } from '../../lib/__fixtures__/puzzles.ts'
import { createGame } from '../../lib/game/createGame.ts'
import { parseGrid } from '../../lib/grid.ts'
import { useGameStore } from '../../store/index.ts'
import Board from './Board.tsx'

const puzzle = {
  id: 'easy-1',
  difficulty: 'easy' as const,
  seed: 1,
  givens: parseGrid(EASY.puzzle),
  solution: parseGrid(EASY.solution),
}

const cellAt = (index: number) =>
  screen.getAllByRole('gridcell').find((el) => el.getAttribute('data-index') === String(index))!

const emptyIndex = puzzle.givens.findIndex((v) => v === 0)

beforeEach(() => {
  useGameStore.setState({ game: createGame(puzzle, 'check') })
})

afterEach(cleanup)

describe('Board', () => {
  it('renders a 9x9 grid with a single tab stop', () => {
    render(<Board />)
    expect(screen.getByRole('grid')).toBeTruthy()
    expect(screen.getAllByRole('row')).toHaveLength(9)
    const cells = screen.getAllByRole('gridcell')
    expect(cells).toHaveLength(81)
    expect(cells.filter((c) => c.tabIndex === 0)).toEqual([cells[0]])
  })

  it('selects a cell on click and moves the tab stop and focus', async () => {
    render(<Board />)
    const index = 2 * 9 + 4
    await userEvent.click(cellAt(index))
    const cell = cellAt(index)
    expect(cell.getAttribute('aria-selected')).toBe('true')
    expect(cell.getAttribute('aria-label')).toMatch(/^Row 3, column 5, /)
    expect(cell.tabIndex).toBe(0)
    expect(document.activeElement).toBe(cell)
    expect(screen.getAllByRole('gridcell').filter((c) => c.tabIndex === 0)).toHaveLength(1)
    expect(screen.getAllByRole('gridcell').filter((c) => c.getAttribute('aria-selected') === 'true')).toHaveLength(1)
  })

  it('labels givens and empty cells', () => {
    render(<Board />)
    const given = puzzle.givens.findIndex((v) => v !== 0)
    expect(cellAt(given).getAttribute('aria-label')).toBe(
      `Row ${Math.floor(given / 9) + 1}, column ${(given % 9) + 1}, ${puzzle.givens[given]}, given`,
    )
    expect(cellAt(emptyIndex).getAttribute('aria-label')).toMatch(/, empty$/)
  })

  it('renders notes as a 3x3 mini-grid', () => {
    const game = createGame(puzzle, 'check')
    game.cells[emptyIndex] = { ...game.cells[emptyIndex], notes: 0b100001001 } // 1, 4, 9
    useGameStore.setState({ game })
    render(<Board />)
    const cell = cellAt(emptyIndex)
    expect(cell.getAttribute('aria-label')).toMatch(/, empty, notes 1 4 9$/)
    const slots = within(cell).getByTestId('notes').children
    expect(slots).toHaveLength(9)
    expect(Array.from(slots, (s) => s.textContent)).toEqual(['1', '', '', '4', '', '', '', '', '9'])
  })
})
