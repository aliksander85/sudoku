import { useEffect } from 'react'
import { useGameStore } from '../store/index.ts'

// Hidden tab pauses; visible again resumes only an automatic pause (the reducer enforces that).
export function useAutoPause(): void {
  const dispatch = useGameStore((s) => s.dispatch)

  useEffect(() => {
    const onChange = () => {
      dispatch({ type: document.hidden ? 'pause' : 'resume', by: 'auto' })
    }
    document.addEventListener('visibilitychange', onChange)
    return () => document.removeEventListener('visibilitychange', onChange)
  }, [dispatch])
}
