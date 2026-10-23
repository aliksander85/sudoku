import { useState } from 'react'
import { formatTime } from '../../lib/format.ts'
import { averageMs } from '../../lib/stats.ts'
import type { Difficulty, MistakeMode, Settings } from '../../lib/types.ts'
import { useGameStore, useSettingsStore, useStatsStore } from '../../store/index.ts'
import Dialog from './Dialog.tsx'
import styles from './dialogs.module.css'

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'expert']
const MISTAKE_MODES: MistakeMode[] = ['off', 'check', 'limit']
const THEMES: Settings['theme'][] = ['system', 'light', 'dark']

interface Props {
  open: boolean
  onClose: () => void
}

interface RadiosProps<T extends string> {
  legend: string
  name: string
  options: T[]
  value: T
  onChange: (value: T) => void
}

function Radios<T extends string>({ legend, name, options, value, onChange }: RadiosProps<T>) {
  return (
    <fieldset className={styles.fieldset}>
      <legend>{legend}</legend>
      {options.map((option) => (
        <label key={option} className={styles.option}>
          <input type="radio" name={name} checked={value === option} onChange={() => onChange(option)} />
          {option}
        </label>
      ))}
    </fieldset>
  )
}

function SettingsDialog({ open, onClose }: Props) {
  const settings = useSettingsStore((s) => s.settings)
  const update = useSettingsStore((s) => s.update)
  const stats = useStatsStore((s) => s.stats)
  const resetStats = useStatsStore((s) => s.reset)
  const dispatch = useGameStore((s) => s.dispatch)
  const canFill = useGameStore((s) => s.game?.status === 'playing')
  const [confirmingReset, setConfirmingReset] = useState(false)

  const close = () => {
    setConfirmingReset(false)
    onClose()
  }

  return (
    <Dialog open={open} onClose={close} title="Settings">
      <Radios
        legend="Mistakes"
        name="mistakeMode"
        options={MISTAKE_MODES}
        value={settings.mistakeMode}
        onChange={(mistakeMode) => update({ mistakeMode })}
      />
      <label className={styles.option}>
        <input type="checkbox" checked={settings.showTimer} onChange={(e) => update({ showTimer: e.target.checked })} />
        Show timer
      </label>
      <Radios
        legend="Theme"
        name="theme"
        options={THEMES}
        value={settings.theme}
        onChange={(theme) => update({ theme })}
      />
      <button
        type="button"
        disabled={!canFill}
        onClick={() => {
          dispatch({ type: 'autoCandidates' })
          close()
        }}
      >
        Fill candidates (counts as a hint)
      </button>

      <table className={styles.statsTable}>
        <caption>Stats</caption>
        <thead>
          <tr>
            <th scope="col">Level</th>
            <th scope="col">Played</th>
            <th scope="col">Won</th>
            <th scope="col">Best</th>
            <th scope="col">Avg</th>
          </tr>
        </thead>
        <tbody>
          {DIFFICULTIES.map((d) => {
            const row = stats[d]
            const avg = averageMs(row)
            return (
              <tr key={d}>
                <th scope="row">{d}</th>
                <td>{row.played}</td>
                <td>{row.won}</td>
                <td>{row.bestMs === null ? '—' : formatTime(row.bestMs)}</td>
                <td>{avg === null ? '—' : formatTime(Math.round(avg))}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className={styles.actions}>
        {confirmingReset ? (
          <>
            <button type="button" onClick={() => setConfirmingReset(false)}>
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                resetStats()
                setConfirmingReset(false)
              }}
            >
              Confirm reset
            </button>
          </>
        ) : (
          <button type="button" onClick={() => setConfirmingReset(true)}>
            Reset stats
          </button>
        )}
        <button type="button" onClick={close}>
          Close
        </button>
      </div>
    </Dialog>
  )
}

export default SettingsDialog
