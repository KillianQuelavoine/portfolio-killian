import { useCallback, useEffect, useState } from 'react'
import type { ActiveSession, GuidancePreferences, HistoryEntry, SessionConfig } from './types'
import { DEFAULT_INTERVALS, DEFAULT_SESSION } from './lib/session'
import { storage } from './lib/storage'
import { sessionAudio } from './lib/audio'
import { createActiveSession } from './hooks/useSessionTimer'
import { Home } from './components/Home'
import { SessionBuilder } from './components/SessionBuilder'
import { SessionScreen } from './components/SessionScreen'
import { Completion } from './components/Completion'
import { Stopwatch } from './components/Stopwatch'
import { History } from './components/History'
import { Statistics } from './components/Statistics'
import { StartCountdown } from './components/StartCountdown'

type View = 'home' | 'session' | 'intervals' | 'stopwatch' | 'countdown' | 'active' | 'complete' | 'history' | 'stats'

export default function App() {
  const [view, setView] = useState<View>('home')
  const [soundEnabled, setSoundEnabled] = useState(storage.getSound)
  const [guidance, setGuidance] = useState(storage.getGuidance)
  const [soundVolume, setSoundVolume] = useState(storage.getVolume)
  const [lastConfig, setLastConfig] = useState(storage.getLastConfig)
  const [history, setHistory] = useState(storage.getHistory)
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(storage.getActive)
  const [completedEntry, setCompletedEntry] = useState<HistoryEntry | null>(null)
  const [builderConfig, setBuilderConfig] = useState<SessionConfig>(DEFAULT_SESSION)
  const [pendingConfig, setPendingConfig] = useState<SessionConfig | null>(null)

  useEffect(() => sessionAudio.setVolume(soundVolume), [soundVolume])

  const toggleSound = () => setSoundEnabled((current) => {
    const next = !current
    storage.setSound(next)
    if (next) void sessionAudio.unlock()
    return next
  })

  const updateGuidance = (key: 'startCountdown' | 'endCountdown' | 'halfwayCue', enabled: boolean) => {
    setGuidance((current) => {
      const next = { ...current, [key]: enabled }
      storage.setGuidance(next)
      return next
    })
  }

  const updateVolume = (volume: number) => {
    setSoundVolume(volume)
    storage.setVolume(volume)
  }

  const previewSound = async () => {
    await sessionAudio.unlock()
    sessionAudio.preview()
  }

  const launchSession = useCallback((config: SessionConfig) => {
    const active = createActiveSession(config)
    if (soundEnabled) sessionAudio.phase(active.phases[0].type === 'work')
    storage.setLastConfig(config)
    storage.setActive(active)
    setLastConfig(config)
    setActiveSession(active)
    setPendingConfig(null)
    setView('active')
  }, [soundEnabled])

  const startSession = async (config: SessionConfig) => {
    if (soundEnabled) await sessionAudio.unlock()
    storage.setLastConfig(config)
    setLastConfig(config)
    if (guidance.startCountdown) {
      setPendingConfig(config)
      setView('countdown')
    } else launchSession(config)
  }

  const completeSession = useCallback((session: ActiveSession, entry: HistoryEntry) => {
    setActiveSession(session)
    setCompletedEntry(entry)
    setHistory(storage.addHistory(entry))
    setView('complete')
  }, [])

  const repeat = (config: SessionConfig) => {
    setBuilderConfig(config)
    setView('session')
  }

  if (view === 'countdown' && pendingConfig) return <StartCountdown soundEnabled={soundEnabled} onComplete={() => launchSession(pendingConfig)} />
  if (view === 'active' && activeSession) return <SessionScreen initialSession={activeSession} soundEnabled={soundEnabled} guidance={guidance} onComplete={completeSession} />
  if (view === 'complete' && completedEntry) return <Completion entry={completedEntry} onDone={() => setView('home')} onRepeat={() => repeat(completedEntry.config)} />
  if (view === 'session') return <SessionBuilder title="Séance" initialConfig={builderConfig} soundEnabled={soundEnabled} soundVolume={soundVolume} guidance={guidance} onVolumeChange={updateVolume} onSoundPreview={previewSound} onGuidanceChange={updateGuidance} onSoundToggle={toggleSound} onBack={() => setView('home')} onStart={startSession} />
  if (view === 'intervals') return <SessionBuilder title="Intervalles" initialConfig={DEFAULT_INTERVALS} soundEnabled={soundEnabled} soundVolume={soundVolume} guidance={guidance} onVolumeChange={updateVolume} onSoundPreview={previewSound} onGuidanceChange={updateGuidance} onSoundToggle={toggleSound} onBack={() => setView('home')} onStart={startSession} />
  if (view === 'stopwatch') return <Stopwatch soundEnabled={soundEnabled} onSoundToggle={toggleSound} onBack={() => setView('home')} />
  if (view === 'history') return <History history={history} soundEnabled={soundEnabled} onSoundToggle={toggleSound} onBack={() => setView('home')} />
  if (view === 'stats') return <Statistics history={history} soundEnabled={soundEnabled} onSoundToggle={toggleSound} onBack={() => setView('home')} />

  return <Home
    lastConfig={lastConfig}
    activeSession={activeSession?.status === 'completed' ? null : activeSession}
    soundEnabled={soundEnabled}
    onSoundToggle={toggleSound}
    onSession={() => { setBuilderConfig(lastConfig ?? DEFAULT_SESSION); setView('session') }}
    onIntervals={() => setView('intervals')}
    onStopwatch={() => setView('stopwatch')}
    onHistory={() => setView('history')}
    onStats={() => setView('stats')}
    onRepeat={() => repeat(lastConfig ?? DEFAULT_SESSION)}
    onResume={() => setView('active')}
  />
}
