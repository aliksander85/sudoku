import { useEffect, useState } from 'react'
import { announce } from '../lib/game/announce.ts'
import { useGameStore } from '../store/index.ts'

// Polite live region (§6.5). Consecutive identical messages get an alternating suffix so they are re-read.
function LiveRegion() {
  const [message, setMessage] = useState('')

  useEffect(
    () =>
      useGameStore.subscribe((state, prevState) => {
        if (!state.game || !prevState.game) return
        const text = announce(prevState.game, state.game)
        if (text) setMessage((m) => (m === text ? `${text} ` : text))
      }),
    [],
  )

  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </div>
  )
}

export default LiveRegion
