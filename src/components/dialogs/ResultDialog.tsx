import { formatTime } from '../../lib/format.ts'
import { useGameStore, useStatsStore } from '../../store/index.ts'
import Dialog from './Dialog.tsx'
import styles from './dialogs.module.css'

interface Props {
  suppressed: boolean
  onNewGame: () => void
}

function ResultDialog({ suppressed, onNewGame }: Props) {
  const game = useGameStore((s) => s.game)
  const dispatch = useGameStore((s) => s.dispatch)
  const bestMs = useStatsStore((s) => (game ? s.stats[game.puzzle.difficulty].bestMs : null))

  const won = game?.status === 'won'
  const lost = game?.status === 'lost'

  return (
    <Dialog open={(won || lost) && !suppressed} onClose={() => {}} title={won ? 'You won!' : 'Game over'} dismissible={false}>
      {game && won && (
        <dl className={styles.stats}>
          <dt>Time</dt>
          <dd>{formatTime(game.elapsedMs)}</dd>
          <dt>Mistakes</dt>
          <dd>{game.mistakes}</dd>
          <dt>Hints</dt>
          <dd>{game.hintsUsed}</dd>
          <dt>Best time</dt>
          <dd>{bestMs === null ? '—' : formatTime(bestMs)}</dd>
        </dl>
      )}
      {lost && <p>Too many mistakes.</p>}
      <div className={styles.actions}>
        {lost && (
          <button type="button" onClick={() => dispatch({ type: 'restart' })}>
            Restart
          </button>
        )}
        <button type="button" onClick={onNewGame}>
          New game
        </button>
      </div>
    </Dialog>
  )
}

export default ResultDialog
