// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Board from '../components/Board/Board.tsx'
import { EASY } from '../lib/__fixtures__/puzzles.ts'
import { createGame } from '../lib/game/createGame.ts'
import { parseGrid } from '../lib/grid.ts'
import { useGameStore } from '../store/index.ts'
import { useKeyboard } from './useKeyboard.ts'

const puzzle = {
  id: 'easy-1',
  difficulty: 'easy' as const,
  seed: 1,
  givens: parseGrid(EASY.puzzle),
  solution: parseGrid(EASY.solution),
}

function Harness() {
  useKeyboard()
  return <Board />
}

const dispatch = vi.fn()
const hint = vi.fn()

beforeEach(() => {
  dispatch.mockReset()
  hint.mockReset()
  useGameStore.setState({ game: createGame(puzzle, 'check'), dispatch, hint })
})

afterEach(cleanup)

describe('useKeyboard', () => {
  it.each([
    ['{ArrowUp}', { type: 'move', dir: 'up' }],
    ['{ArrowDown}', { type: 'move', dir: 'down' }],
    ['{ArrowLeft}', { type: 'move', dir: 'left' }],
    ['{ArrowRight}', { type: 'move', dir: 'right' }],
    ['w', { type: 'move', dir: 'up' }],
    ['a', { type: 'move', dir: 'left' }],
    ['s', { type: 'move', dir: 'down' }],
    ['d', { type: 'move', dir: 'right' }],
    ['5', { type: 'input', digit: 5 }],
    ['{Shift>}1{/Shift}', { type: 'note', digit: 1 }],
    ['{Backspace}', { type: 'erase' }],
    ['{Delete}', { type: 'erase' }],
    ['0', { type: 'erase' }],
    ['n', { type: 'toggleNotesMode' }],
    ['p', { type: 'pause', by: 'user' }],
    ['{Control>}z{/Control}', { type: 'undo' }],
    ['{Meta>}z{/Meta}', { type: 'undo' }],
    ['{Control>}{Shift>}z{/Shift}{/Control}', { type: 'redo' }],
    ['{Control>}y{/Control}', { type: 'redo' }],
  ])('%s dispatches the matching action', async (keys, action) => {
    render(<Harness />)
    await userEvent.keyboard(keys)
    expect(dispatch).toHaveBeenCalledTimes(1)
    expect(dispatch).toHaveBeenCalledWith(action)
  })

  it('maps numpad digits to input', async () => {
    render(<Harness />)
    fireEvent.keyDown(document.body, { code: 'Numpad7', key: '7' })
    expect(dispatch).toHaveBeenCalledWith({ type: 'input', digit: 7 })
  })

  it('H calls hint', async () => {
    render(<Harness />)
    await userEvent.keyboard('h')
    expect(hint).toHaveBeenCalledTimes(1)
  })

  it('P resumes when paused', async () => {
    useGameStore.setState({ game: { ...createGame(puzzle, 'check'), status: 'paused' } })
    render(<Harness />)
    await userEvent.keyboard('p')
    expect(dispatch).toHaveBeenCalledWith({ type: 'resume', by: 'user' })
  })

  it('ignores keys while a dialog is open', async () => {
    const dialog = document.createElement('dialog')
    dialog.setAttribute('open', '')
    document.body.append(dialog)
    render(<Harness />)
    await userEvent.keyboard('5{ArrowUp}h')
    expect(dispatch).not.toHaveBeenCalled()
    expect(hint).not.toHaveBeenCalled()
    dialog.remove()
  })

  it('moves selection and focus follows it', async () => {
    const real = useGameStore.getInitialState().dispatch
    useGameStore.setState({ dispatch: real })
    useGameStore.setState({ game: { ...createGame(puzzle, 'check'), selected: 0 } })
    render(<Harness />)
    await userEvent.keyboard('{ArrowRight}{ArrowDown}')
    expect(useGameStore.getState().game!.selected).toBe(10)
    expect(document.activeElement).toBe(document.querySelector('[data-index="10"]'))
  })
})
