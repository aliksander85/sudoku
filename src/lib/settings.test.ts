import { describe, it, expect } from 'vitest'
import { DEFAULT_SETTINGS } from './settings.ts'

describe('DEFAULT_SETTINGS', () => {
  it('matches the spec defaults', () => {
    expect(DEFAULT_SETTINGS).toEqual({ mistakeMode: 'check', showTimer: true, theme: 'system' })
  })
})
