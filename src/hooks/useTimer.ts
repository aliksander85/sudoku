import { useEffect } from 'react'
import { useGameStore } from '../store/index.ts'

const TICK_MS = 1000

// Advances elapsedMs while playing; deltas are measured so throttled timers don't lose time.
export function useTimer(): void {
  const playing = useGameStore((s) => s.game?.status === 'playing')
  const dispatch = useGameStore((s) => s.dispatch)

  useEffect(() => {
    if (!playing) return
    let last = performance.now()
    const id = setInterval(() => {
      const now = performance.now()
      dispatch({ type: 'tick', deltaMs: now - last })
      last = now
    }, TICK_MS)
    return () => {
      // Count the partial interval so quick pause/resume cycles don't drop time
      dispatch({ type: 'tick', deltaMs: performance.now() - last })
      clearInterval(id)
    }
  }, [playing, dispatch])
}
