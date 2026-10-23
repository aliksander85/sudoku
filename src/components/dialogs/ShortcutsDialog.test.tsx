// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ShortcutsDialog from './ShortcutsDialog.tsx'

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open')
  }
})

afterEach(cleanup)

describe('ShortcutsDialog', () => {
  it('lists the shortcuts', () => {
    render(<ShortcutsDialog open onClose={() => {}} />)
    for (const action of ['Undo', 'Redo', 'Toggle notes mode', 'Pause / resume', 'Hint']) {
      expect(screen.getByRole('cell', { name: action, hidden: true })).toBeTruthy()
    }
    expect(screen.getByRole('rowheader', { name: /^Ctrl\/Cmd\s*\+\s*Z$/, hidden: true })).toBeTruthy()
  })

  it('Close calls onClose', async () => {
    const onClose = vi.fn()
    render(<ShortcutsDialog open onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: 'Close', hidden: true }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
