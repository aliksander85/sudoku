import { MISTAKE_LIMIT } from '../../lib/game/reducer.ts'
import { formatTime } from '../../lib/format.ts'
import { useGameStore, useSettingsStore } from '../../store/index.ts'
import styles from './StatusBar.module.css'

function StatusBar() {
  const difficulty = useGameStore((s) => s.game!.puzzle.difficulty)
  const elapsedMs = useGameStore((s) => s.game!.elapsedMs)
  const mistakes = useGameStore((s) => s.game!.mistakes)
  const mistakeMode = useGameStore((s) => s.game!.mistakeMode)
  const showTimer = useSettingsStore((s) => s.settings.showTimer)

  const parts = [<span key="d" className={styles.difficulty}>{difficulty}</span>]
  if (showTimer) parts.push(<span key="t">{formatTime(elapsedMs)}</span>)
  if (mistakeMode !== 'off') {
    parts.push(
      <span key="m">
        Mistakes {mistakes}
        {mistakeMode === 'limit' ? `/${MISTAKE_LIMIT}` : ''}
      </span>,
    )
  }

  return (
    <p className={styles.status}>
      {parts.map((part, i) => (
        <span key={part.key}>
          {i > 0 ? ' · ' : ''}
          {part}
        </span>
      ))}
    </p>
  )
}

export default StatusBar
