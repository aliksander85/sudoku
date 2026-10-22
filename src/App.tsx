import { useTheme } from './hooks/useTheme.ts'
import styles from './App.module.css'

function App() {
  useTheme()

  return (
    <div className={styles.app}>
      <main className={styles.main}>
        <header className={styles.header}>
          <h1>Sudoku</h1>
          <p className={styles.status}>Medium · 00:00 · Mistakes 0</p>
        </header>
        <div className={styles.board} />
      </main>
      <div className={styles.controls}>
        <div className={styles.toolbar} />
        <div className={styles.pad} />
      </div>
    </div>
  )
}

export default App
