// @vitest-environment jsdom
import { act, cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Profiler } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { EASY } from '../../lib/__fixtures__/puzzles.ts'
import { createGame } from '../../lib/game/createGame.ts'
import { parseGrid } from '../../lib/grid.ts'
import { useGameStore } from '../../store/index.ts'
import Board from './Board.tsx'
import Cell from './Cell.tsx'

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

describe('Cell visual states', () => {
  const flagged = (attr: string) =>
    screen.getAllByRole('gridcell').filter((c) => c.getAttribute(attr) === 'true')

  it('marks selected, peers and same digits', async () => {
    render(<Board />)
    const given = puzzle.givens.findIndex((v) => v !== 0)
    await userEvent.click(cellAt(given))
    expect(flagged('data-selected')).toEqual([cellAt(given)])
    expect(flagged('data-peer').length).toBeGreaterThan(0)
    expect(flagged('data-peer')).not.toContain(cellAt(given))
    expect(flagged('data-same-digit').length).toBeGreaterThan(0)
  })

  it('marks conflicts on both cells', () => {
    const game = createGame(puzzle, 'check')
    const given = puzzle.givens.findIndex((v) => v !== 0)
    game.cells[emptyIndex] = { ...game.cells[emptyIndex], value: puzzle.givens[given] }
    useGameStore.setState({ game })
    render(<Board />)
    expect(cellAt(emptyIndex).getAttribute('data-conflict')).toBe('true')
    expect(flagged('data-conflict').length).toBeGreaterThanOrEqual(2)
  })

  it('tags given and hinted values', () => {
    const game = createGame(puzzle, 'check')
    game.cells[emptyIndex] = { ...game.cells[emptyIndex], value: puzzle.solution[emptyIndex], hinted: true }
    useGameStore.setState({ game })
    render(<Board />)
    const kind = (i: number) => cellAt(i).querySelector('[data-kind]')?.getAttribute('data-kind')
    expect(kind(emptyIndex)).toBe('hinted')
    expect(kind(puzzle.givens.findIndex((v) => v !== 0))).toBe('given')
  })

  it('re-renders only cells whose flags change when selection moves', () => {
    const renders = new Map<number, number>()
    render(
      <>
        {Array.from({ length: 81 }, (_, i) => (
          <Profiler key={i} id={String(i)} onRender={() => renders.set(i, (renders.get(i) ?? 0) + 1)}>
            <Cell index={i} />
          </Profiler>
        ))}
      </>,
    )
    renders.clear()
    // only cells whose peer / same-digit / selected state differs should re-render
    act(() => useGameStore.getState().dispatch({ type: 'select', index: 40 }))
    act(() => useGameStore.getState().dispatch({ type: 'select', index: 41 }))
    const total = [...renders.values()].reduce((a, b) => a + b, 0)
    expect(total).toBeLessThan(81)
    const untouched = Array.from({ length: 81 }, (_, i) => i).filter((i) => !renders.has(i))
    expect(untouched.length).toBeGreaterThan(40)
  })
})
