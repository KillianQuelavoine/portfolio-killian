import { useMemo, useState } from 'react'
import type { GuidancePreferences, SessionConfig } from '../types'
import { formatDuration, generatePhases, sanitizeConfig, summarizePhases } from '../lib/session'
import { AppHeader } from './AppHeader'
import { Stepper } from './Stepper'

interface SessionBuilderProps {
  title: string
  initialConfig: SessionConfig
  soundEnabled: boolean
  soundVolume: number
  guidance: GuidancePreferences
  onGuidanceChange: (key: 'startCountdown' | 'endCountdown' | 'halfwayCue', enabled: boolean) => void
  onVolumeChange: (volume: number) => void
  onSoundPreview: () => void
  onSoundToggle: () => void
  onBack: () => void
  onStart: (config: SessionConfig) => void
}

export function SessionBuilder({ title, initialConfig, soundEnabled, soundVolume, guidance, onGuidanceChange, onVolumeChange, onSoundPreview, onSoundToggle, onBack, onStart }: SessionBuilderProps) {
  const [config, setConfig] = useState(() => sanitizeConfig(initialConfig))
  const phases = useMemo(() => generatePhases(config), [config])
  const totals = useMemo(() => summarizePhases(phases), [phases])
  const update = (key: keyof SessionConfig, value: number) => setConfig((current) => sanitizeConfig({ ...current, [key]: value }))

  return (
    <main className="page builder-page">
      <AppHeader title={title} onBack={onBack} soundEnabled={soundEnabled} onSoundToggle={onSoundToggle} />
      <section className="page-intro">
        <p className="eyebrow">Prépare ton rythme</p>
        <h1>{title}</h1>
        <p>{title === 'Séance'
          ? 'Le format complet : échauffement, rounds et récupération finale.'
          : 'Le format rapide : une répétition simple de temps de corde et de repos.'}</p>
      </section>

      <section className="settings-card" aria-label="Réglages de la séance">
        <div className="toggle-row">
          <div><strong>Échauffement</strong><span>Avant le premier round</span></div>
          <button type="button" className="switch" role="switch" aria-checked={config.warmupDuration > 0} onClick={() => update('warmupDuration', config.warmupDuration > 0 ? 0 : 120)}><span /></button>
        </div>
        {config.warmupDuration > 0 && <Stepper label="Durée échauffement" value={config.warmupDuration} onChange={(value) => update('warmupDuration', value)} step={15} />}
        <div className="section-rule" />
        <Stepper label="Temps de corde" value={config.workDuration} onChange={(value) => update('workDuration', value)} step={5} min={1} />
        <Stepper label="Temps de repos" value={config.restDuration} onChange={(value) => update('restDuration', value)} step={5} />
        <Stepper label="Nombre de rounds" value={config.rounds} onChange={(value) => update('rounds', value)} step={1} min={1} max={100} suffix="" />
        <div className="section-rule" />
        <div className="toggle-row">
          <div><strong>Récupération finale</strong><span>Après le dernier round</span></div>
          <button type="button" className="switch" role="switch" aria-checked={config.cooldownDuration > 0} onClick={() => update('cooldownDuration', config.cooldownDuration > 0 ? 0 : 60)}><span /></button>
        </div>
        {config.cooldownDuration > 0 && <Stepper label="Durée récupération" value={config.cooldownDuration} onChange={(value) => update('cooldownDuration', value)} step={15} />}
      </section>

      <section className="settings-card guidance-card" aria-label="Guidage sonore">
        <p className="settings-title">Guidage sonore</p>
        <div className="volume-setting">
          <div><label htmlFor="sound-volume">Volume des alertes</label><output htmlFor="sound-volume">{Math.round(soundVolume * 100)} %</output></div>
          <div className="volume-controls">
            <input id="sound-volume" type="range" min="10" max="100" step="5" value={Math.round(soundVolume * 100)} onChange={(event) => onVolumeChange(Number(event.target.value) / 100)} aria-label="Volume des alertes" />
            <button type="button" onClick={onSoundPreview} disabled={!soundEnabled}>Tester</button>
          </div>
          <small>Bips renforcés pour rester audibles avec de la musique.</small>
        </div>
        <div className="toggle-row">
          <div><strong>Départ 1 · 2 · 3</strong><span>Son montant avant le lancement</span></div>
          <button type="button" className="switch" role="switch" aria-checked={guidance.startCountdown} onClick={() => onGuidanceChange('startCountdown', !guidance.startCountdown)}><span /></button>
        </div>
        <div className="toggle-row">
          <div><strong>Fin 3 · 2 · 1</strong><span>Son descendant avant chaque phase</span></div>
          <button type="button" className="switch" role="switch" aria-checked={guidance.endCountdown} onClick={() => onGuidanceChange('endCountdown', !guidance.endCountdown)}><span /></button>
        </div>
        <div className="toggle-row">
          <div><strong>Annonce « Moitié »</strong><span>À mi-temps pendant la corde</span></div>
          <button type="button" className="switch" role="switch" aria-checked={guidance.halfwayCue} onClick={() => onGuidanceChange('halfwayCue', !guidance.halfwayCue)}><span /></button>
        </div>
      </section>

      <section className="summary-card" aria-live="polite">
        <div className="summary-lead"><strong>{formatDuration(totals.work, true)} de corde</strong><span>sur {formatDuration(totals.total, true)} au total</span></div>
        <div className="summary-grid">
          <div><span>Corde</span><strong>{formatDuration(totals.work, true)}</strong></div>
          <div><span>Repos</span><strong>{formatDuration(totals.rest, true)}</strong></div>
          <div><span>Échauffement</span><strong>{formatDuration(totals.warmup, true)}</strong></div>
          <div><span>Récupération</span><strong>{formatDuration(totals.cooldown, true)}</strong></div>
        </div>
        <div className="summary-total"><span>Durée totale</span><strong>{formatDuration(totals.total, true)}</strong></div>
      </section>

      <div className="sticky-action"><button type="button" className="primary-button" onClick={() => onStart(config)}>Commencer</button></div>
    </main>
  )
}
