import { memo } from 'react'
import { CELL_FLAG, cellFlags, cellLabel } from '../../lib/game/selectors.ts'
import { useGameStore } from '../../store/index.ts'
import styles from './Cell.module.css'

const NOTE_DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9]

function Cell({ index }: { index: number }) {
  const cell = useGameStore((s) => s.game!.cells[index])
  const flags = useGameStore((s) => cellFlags(s.game!, index))
  const isTabStop = useGameStore((s) => (s.game!.selected ?? 0) === index)
  const label = useGameStore((s) => cellLabel(s.game!, index))
  const dispatch = useGameStore((s) => s.dispatch)

  return (
    <div
      role="gridcell"
      className={styles.cell}
      data-index={index}
      data-selected={(flags & CELL_FLAG.selected) !== 0}
      data-peer={(flags & CELL_FLAG.peer) !== 0}
      data-same-digit={(flags & CELL_FLAG.sameDigit) !== 0}
      data-conflict={(flags & CELL_FLAG.conflict) !== 0}
      data-wrong={(flags & CELL_FLAG.wrong) !== 0}
      aria-selected={(flags & CELL_FLAG.selected) !== 0}
      aria-label={label}
      tabIndex={isTabStop ? 0 : -1}
      onClick={() => dispatch({ type: 'select', index })}
    >
      {cell.value !== 0 ? (
        <span
          className={styles.value}
          data-kind={cell.given ? 'given' : cell.hinted ? 'hinted' : 'entered'}
          aria-hidden="true"
        >
          {cell.value}
        </span>
      ) : cell.notes !== 0 ? (
        <span className={styles.notes} data-testid="notes" aria-hidden="true">
          {NOTE_DIGITS.map((d) => (
            <span key={d} className={styles.note}>
              {cell.notes & (1 << (d - 1)) ? d : ''}
            </span>
          ))}
        </span>
      ) : null}
    </div>
  )
}

export default memo(Cell)
