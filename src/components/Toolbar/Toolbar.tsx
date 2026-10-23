import { useGameStore } from '../../store/index.ts'
import styles from './Toolbar.module.css'

function Toolbar() {
  const dispatch = useGameStore((s) => s.dispatch)
  const hint = useGameStore((s) => s.hint)
  const canUndo = useGameStore((s) => s.game!.past.length > 0)
  const canRedo = useGameStore((s) => s.game!.future.length > 0)
  const notesMode = useGameStore((s) => s.game!.notesMode)
  const status = useGameStore((s) => s.game!.status)
  const paused = status === 'paused'
  const frozen = status === 'won' || status === 'lost'

  return (
    <div role="toolbar" aria-label="Game controls" className={styles.toolbar}>
      <button type="button" disabled={!canUndo} aria-label="Undo" title="Undo" onClick={() => dispatch({ type: 'undo' })}>
        ↶
      </button>
      <button type="button" disabled={!canRedo} aria-label="Redo" title="Redo" onClick={() => dispatch({ type: 'redo' })}>
        ↷
      </button>
      <button type="button" disabled={frozen || paused} aria-label="Erase" title="Delete" onClick={() => dispatch({ type: 'erase' })}>
        ⌫
      </button>
      <button
        type="button"
        aria-pressed={notesMode}
        disabled={frozen || paused}
        onClick={() => dispatch({ type: 'toggleNotesMode' })}
      >
        ✎ Notes
      </button>
      <button type="button" disabled={frozen || paused} aria-label="Hint" title="Hint" onClick={hint}>
        💡
      </button>
      <button
        type="button"
        disabled={frozen || status === 'ready'}
        aria-label={paused ? 'Resume' : 'Pause'}
        title={paused ? 'Resume' : 'Pause'}
        onClick={() => dispatch({ type: paused ? 'resume' : 'pause', by: 'user' })}
      >
        {paused ? '▶' : '⏸'}
      </button>
    </div>
  )
}

export default Toolbar
