import { describe, it, expect } from 'vitest'
import { formatTime } from './format.ts'

describe('formatTime', () => {
  it('formats minutes and seconds', () => {
    expect(formatTime(65_000)).toBe('01:05')
    expect(formatTime(0)).toBe('00:00')
  })

  it('floors sub-second values', () => {
    expect(formatTime(59_999)).toBe('00:59')
  })

  it('adds hours from one hour on', () => {
    expect(formatTime(3_600_000)).toBe('1:00:00')
    expect(formatTime(3_725_000)).toBe('1:02:05')
  })
})
