// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, it, expect } from 'vitest'
import { EASY } from '../lib/__fixtures__/puzzles.ts'
import { createGame } from '../lib/game/createGame.ts'
import { parseGrid } from '../lib/grid.ts'
import { useGameStore } from '../store/index.ts'
import LiveRegion from './LiveRegion.tsx'

const puzzle = {
  id: 'easy-0',
  difficulty: 'easy' as const,
  seed: 0,
  givens: parseGrid(EASY.puzzle.replaceAll('.', '0')),
  solution: parseGrid(EASY.solution),
}

afterEach(cleanup)

describe('LiveRegion', () => {
  it('is a polite status region and announces a conflict', () => {
    useGameStore.setState({ game: { ...createGame(puzzle, 'check'), selected: 2 } })
    render(<LiveRegion />)
    const region = screen.getByRole('status')
    expect(region.getAttribute('aria-live')).toBe('polite')
    act(() => useGameStore.getState().dispatch({ type: 'input', digit: 5 }))
    expect(region.textContent).toBe('Conflict at row 1, column 3')
  })
})
