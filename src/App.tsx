import { useState } from 'react'
import NewGameDialog from './components/dialogs/NewGameDialog.tsx'
import ResultDialog from './components/dialogs/ResultDialog.tsx'
import SettingsDialog from './components/dialogs/SettingsDialog.tsx'
import ShortcutsDialog from './components/dialogs/ShortcutsDialog.tsx'
import LiveRegion from './components/LiveRegion.tsx'
import Board from './components/Board/Board.tsx'
import NumberPad from './components/NumberPad/NumberPad.tsx'
import StatusBar from './components/StatusBar/StatusBar.tsx'
import Toolbar from './components/Toolbar/Toolbar.tsx'
import { useAutoPause } from './hooks/useAutoPause.ts'
import { useKeyboard } from './hooks/useKeyboard.ts'
import { useTheme } from './hooks/useTheme.ts'
import { useTimer } from './hooks/useTimer.ts'
import { useGameStore } from './store/index.ts'
import styles from './App.module.css'

function App() {
  useTheme()
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  useKeyboard(() => setShortcutsOpen(true))
  useTimer()
  useAutoPause()
  const hasGame = useGameStore((s) => s.game !== null)
  const [newGameOpen, setNewGameOpen] = useState(!hasGame)
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <div className={styles.app}>
      <main className={styles.main}>
        <header className={styles.header}>
          <h1>Sudoku</h1>
          <button type="button" onClick={() => setNewGameOpen(true)}>
            New
          </button>
          <button type="button" onClick={() => setSettingsOpen(true)}>
            Settings
          </button>
          <button
            type="button"
            aria-label="Keyboard shortcuts"
            title="Keyboard shortcuts (?)"
            onClick={() => setShortcutsOpen(true)}
          >
            ?
          </button>
          {hasGame && <StatusBar />}
        </header>
        <div className={styles.board}>{hasGame && <Board />}</div>
      </main>
      <div className={styles.controls}>
        {hasGame && <Toolbar />}
        {hasGame && <NumberPad />}
      </div>
      <LiveRegion />
      <ResultDialog suppressed={newGameOpen} onNewGame={() => setNewGameOpen(true)} />
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <ShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <NewGameDialog open={newGameOpen} dismissible={hasGame} onClose={() => setNewGameOpen(false)} />
    </div>
  )
}

export default App
