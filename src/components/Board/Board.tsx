import { useEffect, useRef } from 'react'
import { useGameStore } from '../../store/index.ts'
import Cell from './Cell.tsx'
import styles from './Board.module.css'

const ROWS = Array.from({ length: 9 }, (_, r) => r)
const COLS = Array.from({ length: 9 }, (_, c) => c)

function Board() {
  const ref = useRef<HTMLDivElement>(null)
  const selected = useGameStore((s) => s.game?.selected ?? null)

  useEffect(() => {
    if (selected === null) return
    ref.current?.querySelector<HTMLElement>(`[data-index="${selected}"]`)?.focus()
  }, [selected])

  return (
    <div ref={ref} role="grid" aria-label="Sudoku board" className={styles.board}>
      {ROWS.map((r) => (
        <div key={r} role="row" className={styles.row}>
          {COLS.map((c) => (
            <Cell key={c} index={r * 9 + c} />
          ))}
        </div>
      ))}
    </div>
  )
}

export default Board
