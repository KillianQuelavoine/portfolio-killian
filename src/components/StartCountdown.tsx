import { useEffect, useState } from 'react'
import { sessionAudio } from '../lib/audio'

interface StartCountdownProps {
  soundEnabled: boolean
  onComplete: () => void
}

export function StartCountdown({ soundEnabled, onComplete }: StartCountdownProps) {
  const [count, setCount] = useState(1)

  useEffect(() => {
    if (soundEnabled) sessionAudio.startCount(count)
    const timer = window.setTimeout(() => {
      if (count === 3) onComplete()
      else setCount((value) => value + 1)
    }, 900)
    return () => window.clearTimeout(timer)
  }, [count, onComplete, soundEnabled])

  return (
    <main className="start-countdown" aria-live="assertive" aria-atomic="true">
      <p>On se prépare</p>
      <strong>{count}</strong>
      <span>{count === 3 ? 'C’est parti !' : 'Respire'}</span>
    </main>
  )
}
