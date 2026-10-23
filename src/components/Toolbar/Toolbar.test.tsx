// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { EASY } from '../../lib/__fixtures__/puzzles.ts'
import { createGame } from '../../lib/game/createGame.ts'
import { parseGrid } from '../../lib/grid.ts'
import { useGameStore } from '../../store/index.ts'
import Board from '../Board/Board.tsx'
import NumberPad from '../NumberPad/NumberPad.tsx'
import Toolbar from './Toolbar.tsx'

const puzzle = {
  id: 'easy-1',
  difficulty: 'easy' as const,
  seed: 1,
  givens: parseGrid(EASY.puzzle),
  solution: parseGrid(EASY.solution),
}

const emptyIndex = puzzle.givens.findIndex((v) => v === 0)
const value = () => useGameStore.getState().game!.cells[emptyIndex].value
const button = (name: string) => screen.getByRole('button', { name }) as HTMLButtonElement

beforeEach(() => {
  useGameStore.setState({ game: createGame(puzzle, 'check') })
})

afterEach(cleanup)

describe('Toolbar', () => {
  it('undoes and redoes a digit, with buttons disabled on empty history', async () => {
    render(
      <>
        <Board />
        <Toolbar />
        <NumberPad />
      </>,
    )
    expect(button('Undo').disabled).toBe(true)
    expect(button('Redo').disabled).toBe(true)
    await userEvent.click(screen.getAllByRole('gridcell')[emptyIndex])
    await userEvent.click(screen.getByRole('button', { name: '5' }))
    expect(value()).toBe(5)
    await userEvent.click(button('Undo'))
    expect(value()).toBe(0)
    expect(button('Redo').disabled).toBe(false)
    await userEvent.click(button('Redo'))
    expect(value()).toBe(5)
  })

  it('erases the selected cell', async () => {
    render(<Toolbar />)
    useGameStore.getState().dispatch({ type: 'select', index: emptyIndex })
    useGameStore.getState().dispatch({ type: 'input', digit: 5 })
    await userEvent.click(button('Erase'))
    expect(value()).toBe(0)
  })

  it('uses a hint', async () => {
    render(<Toolbar />)
    await userEvent.click(button('Hint'))
    expect(useGameStore.getState().game!.hintsUsed).toBe(1)
  })

  it('pauses and resumes', async () => {
    render(<Toolbar />)
    expect(button('Pause').disabled).toBe(true) // game not started yet
    useGameStore.getState().dispatch({ type: 'select', index: emptyIndex })
    useGameStore.getState().dispatch({ type: 'input', digit: 5 })
    await userEvent.click(button('Pause'))
    expect(useGameStore.getState().game!.status).toBe('paused')
    await userEvent.click(button('Resume'))
    expect(useGameStore.getState().game!.status).toBe('playing')
  })
})
