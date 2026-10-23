import { useEffect, useRef } from 'react'
import type { Digit, Direction, GameAction } from '../lib/types.ts'
import { useGameStore } from '../store/index.ts'

const DIRECTIONS: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  KeyW: 'up',
  KeyS: 'down',
  KeyA: 'left',
  KeyD: 'right',
}

const DIGIT_CODE = /^(?:Digit|Numpad)([0-9])$/

function toAction(e: KeyboardEvent, paused: boolean): GameAction | 'hint' | null {
  const mod = e.ctrlKey || e.metaKey
  if (mod) {
    if (e.code === 'KeyZ') return { type: e.shiftKey ? 'redo' : 'undo' }
    if (e.code === 'KeyY' && e.ctrlKey) return { type: 'redo' }
    return null
  }
  if (e.altKey) return null

  const dir = DIRECTIONS[e.code]
  if (dir) return { type: 'move', dir }

  const digit = DIGIT_CODE.exec(e.code)?.[1]
  if (digit !== undefined) {
    if (digit === '0') return { type: 'erase' }
    return { type: e.shiftKey ? 'note' : 'input', digit: Number(digit) as Digit }
  }

  switch (e.code) {
    case 'Backspace':
    case 'Delete':
      return { type: 'erase' }
    case 'KeyN':
      return { type: 'toggleNotesMode' }
    case 'KeyH':
      return 'hint'
    case 'KeyP':
      return { type: paused ? 'resume' : 'pause', by: 'user' }
    default:
      return null
  }
}

// Global shortcuts (§6.4). Ignored while a dialog is open or a text field has focus.
// `?` (Shift + Slash) calls onShowShortcuts.
export function useKeyboard(onShowShortcuts?: () => void): void {
  const showShortcutsRef = useRef(onShowShortcuts)
  useEffect(() => {
    showShortcutsRef.current = onShowShortcuts
  })

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (document.querySelector('dialog[open]')) return
      const target = e.target
      if (target instanceof HTMLElement && target.closest('input, textarea, select')) return
      if (e.code === 'Slash' && e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const show = showShortcutsRef.current
        if (show) {
          e.preventDefault()
          show()
        }
        return
      }
      const { game, dispatch, hint } = useGameStore.getState()
      if (!game) return
      const action = toAction(e, game.status === 'paused')
      if (!action) return
      e.preventDefault()
      if (e.repeat && (action === 'hint' || action.type === 'undo' || action.type === 'redo')) return
      if (action === 'hint') hint()
      else dispatch(action)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])
}
