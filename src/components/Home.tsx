import type { ActiveSession, SessionConfig } from '../types'
import { formatDuration } from '../lib/session'
import { AppHeader } from './AppHeader'

interface HomeProps {
  lastConfig: SessionConfig | null
  activeSession: ActiveSession | null
  soundEnabled: boolean
  onSoundToggle: () => void
  onSession: () => void
  onIntervals: () => void
  onStopwatch: () => void
  onHistory: () => void
  onStats: () => void
  onRepeat: () => void
  onResume: () => void
}

export function Home(props: HomeProps) {
  return (
    <main className="page home-page">
      <AppHeader soundEnabled={props.soundEnabled} onSoundToggle={props.onSoundToggle} />
      <section className="brand-block">
        <span className="brand-mark" aria-hidden="true"><i /><i /></span>
        <p className="eyebrow">Pour Maëlle</p>
        <h1>Corde<br />Maëlle</h1>
        <p className="brand-subtitle">Ton rythme. Ta corde. Rien de plus.</p>
      </section>

      {props.activeSession && props.activeSession.status !== 'completed' && (
        <button type="button" className="resume-card" onClick={props.onResume}>
          <span>Reprendre la séance en cours</span>
          <span aria-hidden="true">›</span>
        </button>
      )}

      <section className="mode-list" aria-label="Choisir un mode">
        <button type="button" className="mode-card mode-card-primary" onClick={props.onSession}>
          <span className="mode-kicker">Mode principal</span>
          <strong>Séance</strong>
          <span>Échauffement, rounds et récupération</span>
          <span className="card-arrow" aria-hidden="true">›</span>
        </button>
        <div className="mode-row">
          <button type="button" className="mode-card compact" onClick={props.onIntervals}>
            <strong>Intervalles</strong>
            <span>Corde & repos répétés</span>
          </button>
          <button type="button" className="mode-card compact" onClick={props.onStopwatch}>
            <strong>Chronomètre</strong>
            <span>Temps libre</span>
          </button>
        </div>
      </section>

      {props.lastConfig && (
        <button type="button" className="last-session" onClick={props.onRepeat}>
          <span><strong>Refaire la dernière séance</strong><small>{formatDuration(props.lastConfig.workDuration)} corde · {formatDuration(props.lastConfig.restDuration)} repos · {props.lastConfig.rounds} rounds</small></span>
          <span aria-hidden="true">›</span>
        </button>
      )}

      <nav className="home-nav" aria-label="Données d'entraînement">
        <button type="button" onClick={props.onHistory}>Historique</button>
        <span aria-hidden="true">·</span>
        <button type="button" onClick={props.onStats}>Statistiques</button>
      </nav>
      <p className="privacy-note"><span aria-hidden="true">⌁</span> Tes données restent sur cet appareil</p>
    </main>
  )
}
