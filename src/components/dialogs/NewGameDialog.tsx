import { useState } from 'react'
import type { Difficulty } from '../../lib/types.ts'
import { useGameStore } from '../../store/index.ts'
import Dialog from './Dialog.tsx'
import styles from './dialogs.module.css'

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'expert']

interface Props {
  open: boolean
  onClose: () => void
  dismissible: boolean
}

function NewGameDialog({ open, onClose, dismissible }: Props) {
  const startNewGame = useGameStore((s) => s.startNewGame)
  const inProgress = useGameStore((s) => s.game?.status === 'playing' || s.game?.status === 'paused')
  const [confirming, setConfirming] = useState<Difficulty | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(false)

  const reset = () => {
    setConfirming(null)
    setError(false)
  }

  const start = async (difficulty: Difficulty) => {
    setPending(true)
    setError(false)
    try {
      await startNewGame(difficulty)
      reset()
      onClose()
    } catch {
      setError(true)
    } finally {
      setPending(false)
    }
  }

  const pick = (difficulty: Difficulty) => {
    if (inProgress) setConfirming(difficulty)
    else void start(difficulty)
  }

  const close = () => {
    if (pending) return
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onClose={close} title="New game" dismissible={dismissible && !pending}>
      {confirming ? (
        <>
          <p>Abandon the current game and start a new {confirming} one?</p>
          <div className={styles.actions}>
            <button type="button" disabled={pending} onClick={() => setConfirming(null)}>
              Back
            </button>
            <button type="button" disabled={pending} onClick={() => void start(confirming)}>
              Start new game
            </button>
          </div>
        </>
      ) : (
        <>
          <div className={styles.choices}>
            {DIFFICULTIES.map((d) => (
              <button key={d} type="button" disabled={pending} onClick={() => pick(d)}>
                {d}
              </button>
            ))}
          </div>
          {dismissible && (
            <div className={styles.actions}>
              <button type="button" disabled={pending} onClick={close}>
                Cancel
              </button>
            </div>
          )}
        </>
      )}
      {pending && (
        <p role="status" className={styles.status}>
          <span className={styles.spinner} aria-hidden="true" /> Generating…
        </p>
      )}
      {error && <p role="alert">Could not generate a puzzle. Try again.</p>}
    </Dialog>
  )
}

export default NewGameDialog
