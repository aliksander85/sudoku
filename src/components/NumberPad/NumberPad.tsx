import { useMemo } from 'react'
import { remainingDigits } from '../../lib/game/selectors.ts'
import type { Digit } from '../../lib/types.ts'
import { useGameStore } from '../../store/index.ts'
import styles from './NumberPad.module.css'

const DIGITS: Digit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9]

function NumberPad() {
  const game = useGameStore((s) => s.game)!
  const dispatch = useGameStore((s) => s.dispatch)
  const { cells, mistakeMode, notesMode, status } = game
  // eslint-disable-next-line react-hooks/exhaustive-deps -- remainingDigits only reads these fields
  const remaining = useMemo(() => remainingDigits(game), [cells, mistakeMode])
  const frozen = status !== 'ready' && status !== 'playing'

  return (
    <div role="group" aria-label="Number pad" className={styles.pad} data-notes={notesMode}>
      {DIGITS.map((d) => (
        <button
          key={d}
          type="button"
          className={styles.button}
          disabled={frozen || remaining[d] === 0}
          aria-label={String(d)}
          onClick={() => dispatch({ type: 'input', digit: d })}
        >
          <span className={styles.digit}>{d}</span>
        </button>
      ))}
    </div>
  )
}

export default NumberPad
