import { describe, it, expect } from 'vitest'
import { EASY } from '../__fixtures__/puzzles.ts'
import { parseGrid } from '../grid.ts'
import { createGame } from './createGame.ts'
import { announce } from './announce.ts'
import { reducer } from './reducer.ts'
import type { GameAction, GameState, MistakeMode } from '../types.ts'

const puzzle = {
  id: 'easy-0',
  difficulty: 'easy' as const,
  seed: 0,
  givens: parseGrid(EASY.puzzle.replaceAll('.', '0')),
  solution: parseGrid(EASY.solution),
}
// EASY: index 0 is given 5; index 2 is empty (solution 4)
const start = (mode: MistakeMode = 'check'): GameState => ({ ...createGame(puzzle, mode), selected: 2 })
const step = (state: GameState, action: GameAction) => announce(state, reducer(state, action))

describe('announce', () => {
  it('does not reveal a wrong digit', () => {
    for (const mode of ['check', 'limit'] as const) {
      const state = start(mode)
      const next = reducer(state, { type: 'input', digit: 1 })
      expect(next.mistakes).toBe(1)
      expect(announce(state, next)).toBeNull()
    }
  })

  it('announces a conflict in every mode', () => {
    for (const mode of ['off', 'check', 'limit'] as const) {
      expect(step(start(mode), { type: 'input', digit: 5 })).toBe('Conflict at row 1, column 3')
    }
  })

  it('says nothing for a correct digit, notes, or selection', () => {
    expect(step(start(), { type: 'input', digit: 4 })).toBeNull()
    expect(step({ ...start(), notesMode: true }, { type: 'input', digit: 4 })).toBeNull()
    expect(step(start(), { type: 'move', dir: 'right' })).toBeNull()
  })

  it('announces hint results', () => {
    expect(step(start(), { type: 'hint', random: 0 })).toBe('Hint: row 1, column 3, 4')
  })

  it('announces pause and resume', () => {
    const playing: GameState = { ...start(), status: 'playing' }
    const paused = reducer(playing, { type: 'pause', by: 'user' })
    expect(announce(playing, paused)).toBe('Paused')
    expect(announce(paused, reducer(paused, { type: 'resume', by: 'user' }))).toBe('Resumed')
  })

  it('announces a win and a loss', () => {
    const playing: GameState = { ...start(), status: 'playing', elapsedMs: 65_000 }
    expect(announce(playing, { ...playing, status: 'won' })).toBe('You won. Time 01:05')
    expect(announce(playing, { ...playing, status: 'lost' })).toBe('Game over. Too many mistakes')
  })

  it('stays silent across a different puzzle', () => {
    expect(announce(start(), { ...start(), puzzle: { ...puzzle } })).toBeNull()
  })
})
