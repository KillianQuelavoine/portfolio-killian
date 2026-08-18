import { useEffect, useRef, useState } from 'react'
import type { ActiveSession, GuidancePreferences, HistoryEntry } from '../types'
import { formatClock, nextPhaseText, phaseLabel, summarizePhases } from '../lib/session'
import { sessionAudio } from '../lib/audio'
import { releaseWakeLock, requestWakeLock } from '../lib/wakeLock'
import { sessionToHistory, useSessionTimer } from '../hooks/useSessionTimer'

interface SessionScreenProps {
  initialSession: ActiveSession
  soundEnabled: boolean
  guidance: GuidancePreferences
  onComplete: (session: ActiveSession, entry: HistoryEntry) => void
}

export function SessionScreen({ initialSession, soundEnabled, guidance, onComplete }: SessionScreenProps) {
  const timer = useSessionTimer(initialSession)
  const { session } = timer
  const [confirmFinish, setConfirmFinish] = useState(false)
  const lastCountdown = useRef<number | null>(null)
  const lastPhase = useRef(session.phaseIndex)
  const halfwayAnnounced = useRef<string | null>(null)
  const saved = useRef(false)
  const phase = session.phases[session.phaseIndex]
  const planned = summarizePhases(session.phases).total * 1000 + (session.restAdjustmentMs ?? session.addedRestMs)
  const elapsed = Object.values(timer.totals).reduce((sum, value) => sum + value, 0)
  const countdown = Math.ceil(timer.remainingMs / 1000)

  useEffect(() => {
    if (session.status === 'running') void requestWakeLock()
    else void releaseWakeLock()
    const visible = () => { if (session.status === 'running' && document.visibilityState === 'visible') void requestWakeLock() }
    document.addEventListener('visibilitychange', visible)
    return () => document.removeEventListener('visibilitychange', visible)
  }, [session.status])

  useEffect(() => () => { void releaseWakeLock() }, [])

  useEffect(() => {
    if (!soundEnabled || !guidance.endCountdown || session.status !== 'running') return
    if (countdown >= 1 && countdown <= 3 && countdown !== lastCountdown.current) sessionAudio.countdown(countdown, phase.type === 'work')
    lastCountdown.current = countdown
  }, [countdown, guidance.endCountdown, session.status, soundEnabled])

  useEffect(() => {
    if (!soundEnabled || !guidance.halfwayCue || session.status !== 'running' || phase.type !== 'work') return
    if (phase.duration >= 8 && timer.remainingMs <= phase.duration * 500 && halfwayAnnounced.current !== phase.id) {
      halfwayAnnounced.current = phase.id
      sessionAudio.halfway()
    }
  }, [guidance.halfwayCue, phase, session.status, soundEnabled, timer.remainingMs])

  useEffect(() => {
    if (lastPhase.current !== session.phaseIndex) {
      if (soundEnabled) sessionAudio.phase(phase.type === 'work')
      lastPhase.current = session.phaseIndex
      lastCountdown.current = null
    }
  }, [session.phaseIndex, phase.type, soundEnabled])

  useEffect(() => {
    if (session.status !== 'completed' || saved.current) return
    saved.current = true
    if (soundEnabled && !session.earlyFinish) sessionAudio.finish()
    onComplete(session, sessionToHistory(session))
  }, [session, soundEnabled, onComplete])

  return (
    <main className={`session-screen phase-${phase.type}`}>
      <div className="session-topline">
        <span>Corde Maëlle</span>
        <span>{session.status === 'paused' ? 'En pause' : 'En séance'}</span>
      </div>
      <section className="timer-focus" aria-live="polite" aria-atomic="true">
        <p className="phase-name">{phaseLabel(phase.type)}</p>
        <p className="giant-timer">{formatClock(timer.remainingMs / 1000)}</p>
        {phase.round && <p className="round-label">Round {phase.round} / {session.config.rounds}</p>}
        {!phase.round && <p className="round-label">{phase.type === 'warmup' ? 'Avant de commencer' : 'Dernière étape'}</p>}
      </section>

      <div className="session-progress" aria-label={`Temps écoulé ${formatClock(elapsed / 1000)} sur ${formatClock(planned / 1000)}`}>
        <div className="progress-track"><span style={{ width: `${Math.min(100, planned ? elapsed / planned * 100 : 0)}%` }} /></div>
        <div><span>{formatClock(elapsed / 1000)}</span><span>{formatClock(planned / 1000)}</span></div>
      </div>
      <p className="next-phase">{nextPhaseText(session.phases, session.phaseIndex, session.config.rounds)}</p>

      {phase.type === 'rest' && (
        <div className="rest-extensions">
          <button type="button" onClick={() => timer.adjustRest(-15)}>− 15 sec</button>
          <button type="button" onClick={() => timer.adjustRest(15)}>+ 15 sec</button>
          <button type="button" onClick={() => timer.adjustRest(30)}>+ 30 sec</button>
        </div>
      )}

      <div className="session-controls">
        {session.status === 'paused'
          ? <button type="button" className="session-main-control" onClick={timer.resume}>Reprendre</button>
          : <button type="button" className="session-main-control" onClick={timer.pause}>Pause</button>}
        <button type="button" className="session-secondary-control" onClick={timer.skip}>Passer</button>
        {!confirmFinish
          ? <button type="button" className="finish-link" onClick={() => setConfirmFinish(true)}>Terminer</button>
          : <div className="finish-confirm"><span>Terminer maintenant ?</span><button type="button" onClick={timer.finish}>Oui</button><button type="button" onClick={() => setConfirmFinish(false)}>Non</button></div>}
      </div>
    </main>
  )
}
