import type { HistoryEntry } from '../types'
import { formatDuration } from '../lib/session'
import { currentStreak, weeklyWorkSeconds } from '../lib/statistics'
import { AppHeader } from './AppHeader'

interface StatisticsProps {
  history: HistoryEntry[]
  soundEnabled: boolean
  onSoundToggle: () => void
  onBack: () => void
}

export function Statistics({ history, soundEnabled, onSoundToggle, onBack }: StatisticsProps) {
  const week = weeklyWorkSeconds(history)
  const streak = currentStreak(history)
  return (
    <main className="page data-page">
      <AppHeader title="Statistiques" onBack={onBack} soundEnabled={soundEnabled} onSoundToggle={onSoundToggle} />
      <section className="page-intro"><p className="eyebrow">L’essentiel</p><h1>Ton rythme</h1><p>Simplement ce qui compte.</p></section>
      <section className="stat-stack">
        <div className="stat-card"><span>Total de séances</span><strong>{history.length}</strong><small>{history.length > 1 ? 'séances terminées' : 'séance terminée'}</small></div>
        <div className="stat-card accent"><span>Corde cette semaine</span><strong>{formatDuration(week, true)}</strong><small>temps réellement sauté</small></div>
        <div className="stat-card"><span>Série actuelle</span><strong>{streak}</strong><small>{streak > 1 ? 'jours consécutifs' : 'jour consécutif'}</small></div>
      </section>
    </main>
  )
}
