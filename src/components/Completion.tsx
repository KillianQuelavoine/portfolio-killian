import type { HistoryEntry } from '../types'
import { formatDuration } from '../lib/session'

interface CompletionProps {
  entry: HistoryEntry
  onDone: () => void
  onRepeat: () => void
}

export function Completion({ entry, onDone, onRepeat }: CompletionProps) {
  return (
    <main className="page completion-page">
      <div className="completion-check" aria-hidden="true">✓</div>
      <p className="eyebrow">{entry.earlyFinish ? 'Séance arrêtée' : 'Bravo Maëlle'}</p>
      <h1>Séance<br />terminée</h1>
      <section className="completion-stats">
        <div><strong>{formatDuration(entry.workDuration, true)}</strong><span>de corde</span></div>
        <div><strong>{formatDuration(entry.restDuration + entry.cooldownDuration, true)}</strong><span>de récupération</span></div>
        <div><strong>{entry.rounds}</strong><span>rounds prévus</span></div>
        <div><strong>{formatDuration(entry.totalDuration, true)}</strong><span>au total</span></div>
      </section>
      {entry.addedRestDuration > 0 && <p className="added-note">dont {formatDuration(entry.addedRestDuration)} de repos ajouté</p>}
      <div className="completion-actions">
        <button type="button" className="primary-button" onClick={onDone}>Terminer</button>
        <button type="button" className="text-button" onClick={onRepeat}>Refaire cette séance</button>
      </div>
    </main>
  )
}
