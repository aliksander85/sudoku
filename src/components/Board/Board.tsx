import { useEffect, useRef } from 'react'
import { useGameStore, useSettingsStore } from '../../store/index.ts'
import Cell from './Cell.tsx'
import styles from './Board.module.css'

const ROWS = Array.from({ length: 9 }, (_, r) => r)
const COLS = Array.from({ length: 9 }, (_, c) => c)

// Fixed per-line tilt (in %) so the hand-drawn lines aren't perfectly parallel; deterministic across renders
const SKETCH_JITTER = [0.3, -0.2, 0.15, -0.3, 0.2, -0.15, 0.3, -0.25, 0.1, -0.2]
const PLAIN_JITTER = SKETCH_JITTER.map(() => 0)

// Static grid drawn over the cells; the hand-drawn style wobbles it with the sketch filter (SketchFilter.tsx)
// and lets the outer frame overshoot the corners like a pen stroke
function makeGrid(jitter: number[], overshoot: number) {
  return (
    <svg className={styles.grid} aria-hidden="true" focusable="false">
      <g strokeLinecap="round" fill="none">
        {jitter.map((a, i) => {
          const b = jitter[9 - i]
          const pos = (i * 100) / 9
          const frame = i === 0 || i === 9
          const [start, end] = frame ? [`${-overshoot}%`, `${100 + overshoot}%`] : ['0%', '100%']
          const cls = frame ? styles.frame : i % 3 === 0 ? styles.thick : styles.thin
          return (
            <g key={i} className={cls}>
              <line x1={start} y1={`${pos + a}%`} x2={end} y2={`${pos + b}%`} />
              <line x1={`${pos + b}%`} y1={start} x2={`${pos + a}%`} y2={end} />
            </g>
          )
        })}
      </g>
    </svg>
  )
}

const SKETCH_GRID = makeGrid(SKETCH_JITTER, 1)
const PLAIN_GRID = makeGrid(PLAIN_JITTER, 0)

function Board() {
  const ref = useRef<HTMLDivElement>(null)
  const paused = useGameStore((s) => s.game!.status === 'paused')
  const dispatch = useGameStore((s) => s.dispatch)
  const selected = useGameStore((s) => s.game?.selected ?? null)
  const handDrawn = useSettingsStore((s) => s.settings.handDrawn)

  useEffect(() => {
    if (selected === null || paused) return
    ref.current?.querySelector<HTMLElement>(`[data-index="${selected}"]`)?.focus()
  }, [selected, paused])

  return (
    <div className={styles.wrap}>
    <div ref={ref} role="grid" aria-label="Sudoku board" className={styles.board}>
      {ROWS.map((r) => (
        <div key={r} role="row" className={styles.row}>
          {COLS.map((c) => (
            <Cell key={c} index={r * 9 + c} />
          ))}
        </div>
      ))}
    </div>
      {handDrawn ? SKETCH_GRID : PLAIN_GRID}
      {paused && (
        <div className={styles.overlay}>
          <span>Paused</span>
          <button type="button" onClick={() => dispatch({ type: 'resume', by: 'user' })}>
            Resume
          </button>
        </div>
      )}
    </div>
  )
}

export default Board
