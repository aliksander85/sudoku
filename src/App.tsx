import { useEffect } from 'react'
import Board from './components/Board/Board.tsx'
import { useTheme } from './hooks/useTheme.ts'
import { useGameStore } from './store/index.ts'
import styles from './App.module.css'

function App() {
  useTheme()
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
          <p className={styles.status}>Medium · 00:00 · Mistakes 0</p>
        </header>
        <div className={styles.board}>{hasGame && <Board />}</div>
      </main>
      <div className={styles.controls}>
        <div className={styles.toolbar} />
        <div className={styles.pad} />
      </div>
    </div>
  )
}

export default App
