import { useEffect, useState } from 'react'
import { AppHeader } from './AppHeader'
import { formatClock } from '../lib/session'

interface StopwatchProps {
  soundEnabled: boolean
  onSoundToggle: () => void
  onBack: () => void
}

export function Stopwatch({ soundEnabled, onSoundToggle, onBack }: StopwatchProps) {
  const [status, setStatus] = useState<'idle' | 'running' | 'paused'>('idle')
  const [startedAt, setStartedAt] = useState(0)
  const [accumulated, setAccumulated] = useState(0)
  const [, refresh] = useState(0)
  useEffect(() => {
    if (status !== 'running') return
    const id = window.setInterval(() => refresh((value) => value + 1), 100)
    return () => window.clearInterval(id)
  }, [status])
  const elapsed = accumulated + (status === 'running' ? Date.now() - startedAt : 0)
  const start = () => { setStartedAt(Date.now()); setStatus('running') }
  const pause = () => { setAccumulated(accumulated + Date.now() - startedAt); setStatus('paused') }
  const reset = () => { setAccumulated(0); setStartedAt(0); setStatus('idle') }

  return (
    <main className="page stopwatch-page">
      <AppHeader title="Chronomètre" onBack={onBack} soundEnabled={soundEnabled} onSoundToggle={onSoundToggle} />
      <section className="stopwatch-focus">
        <p className="eyebrow">Temps libre</p>
        <p className="stopwatch-time">{formatClock(elapsed / 1000)}</p>
        <p>{status === 'running' ? 'En cours' : status === 'paused' ? 'En pause' : 'Prête quand tu veux'}</p>
      </section>
      <div className="stopwatch-actions">
        {status === 'running'
          ? <button type="button" className="primary-button" onClick={pause}>Pause</button>
          : <button type="button" className="primary-button" onClick={start}>{status === 'paused' ? 'Reprendre' : 'Commencer'}</button>}
        <button type="button" className="secondary-button" onClick={reset} disabled={status === 'idle'}>Remettre à zéro</button>
      </div>
    </main>
  )
}
