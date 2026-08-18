import { useState } from 'react'
import type { HistoryEntry } from '../types'
import { formatDuration } from '../lib/session'
import { AppHeader } from './AppHeader'

interface HistoryProps {
  history: HistoryEntry[]
  soundEnabled: boolean
  onSoundToggle: () => void
  onBack: () => void
}

function longDate(entry: HistoryEntry): string {
  const date = new Date(entry.finishedAt)
  const today = new Date()
  if (date.toDateString() === today.toDateString()) return "Aujourd’hui"
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(date)
}

export function History({ history, soundEnabled, onSoundToggle, onBack }: HistoryProps) {
  const [selected, setSelected] = useState<HistoryEntry | null>(null)
  if (selected) {
    return (
      <main className="page data-page">
        <AppHeader title="Détail" onBack={() => setSelected(null)} soundEnabled={soundEnabled} onSoundToggle={onSoundToggle} />
        <section className="page-intro"><p className="eyebrow">{longDate(selected)}</p><h1>{formatDuration(selected.totalDuration, true)}</h1><p>{new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(selected.finishedAt))}</p></section>
        <section className="detail-card">
          <div><span>Temps de corde</span><strong>{formatDuration(selected.workDuration)}</strong></div>
          <div><span>Repos réel</span><strong>{formatDuration(selected.restDuration)}</strong></div>
          <div><span>Échauffement</span><strong>{formatDuration(selected.warmupDuration)}</strong></div>
          <div><span>Récupération</span><strong>{formatDuration(selected.cooldownDuration)}</strong></div>
          <div><span>Rounds</span><strong>{selected.rounds}</strong></div>
          <div><span>Configuration</span><strong>{selected.config.workDuration} / {selected.config.restDuration} sec</strong></div>
          {selected.addedRestDuration > 0 && <div><span>Repos ajouté</span><strong>+ {formatDuration(selected.addedRestDuration)}</strong></div>}
        </section>
      </main>
    )
  }
  return (
    <main className="page data-page">
      <AppHeader title="Historique" onBack={onBack} soundEnabled={soundEnabled} onSoundToggle={onSoundToggle} />
      <section className="page-intro"><p className="eyebrow">Toutes tes séances</p><h1>Historique</h1></section>
      {history.length === 0 ? (
        <div className="empty-state"><span aria-hidden="true">○</span><strong>Aucune séance pour l’instant</strong><p>Ta première séance apparaîtra ici automatiquement.</p></div>
      ) : (
        <section className="history-list">
          {history.map((entry) => (
            <button type="button" key={entry.id} onClick={() => setSelected(entry)}>
              <span><strong>{longDate(entry)}</strong><small>{entry.rounds} rounds · {entry.config.workDuration} sec / {entry.config.restDuration} sec</small></span>
              <span className="history-duration">{formatDuration(entry.totalDuration, true)} <i aria-hidden="true">›</i></span>
            </button>
          ))}
        </section>
      )}
    </main>
  )
}
