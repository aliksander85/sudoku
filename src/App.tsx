import { useEffect } from 'react'
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
  useKeyboard()
  useTimer()
  useAutoPause()
  const hasGame = useGameStore((s) => s.game !== null)
  const startNewGame = useGameStore((s) => s.startNewGame)

  // Temporary until the New game dialog exists
  useEffect(() => {
    if (!hasGame) void startNewGame('medium')
  }, [hasGame, startNewGame])

  return (
    <div className={styles.app}>
      <main className={styles.main}>
        <header className={styles.header}>
          <h1>Sudoku</h1>
          {hasGame && <StatusBar />}
        </header>
        <div className={styles.board}>{hasGame && <Board />}</div>
      </main>
      <div className={styles.controls}>
        {hasGame && <Toolbar />}
        {hasGame && <NumberPad />}
      </div>
    </div>
  )
}

export default App
