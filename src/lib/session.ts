import type { PhaseTotals, PhaseType, SessionConfig, SessionPhase } from '../types'

export const DEFAULT_SESSION: SessionConfig = {
  warmupDuration: 120,
  workDuration: 45,
  restDuration: 20,
  rounds: 10,
  cooldownDuration: 60,
}

export const DEFAULT_INTERVALS: SessionConfig = {
  warmupDuration: 0,
  workDuration: 45,
  restDuration: 20,
  rounds: 10,
  cooldownDuration: 0,
}

export const emptyTotals = (): PhaseTotals => ({ warmup: 0, work: 0, rest: 0, cooldown: 0 })

export function sanitizeConfig(config: SessionConfig): SessionConfig {
  const duration = (value: number) => Math.max(0, Math.min(60 * 60, Math.round(Number(value) || 0)))
  return {
    warmupDuration: duration(config.warmupDuration),
    workDuration: Math.max(1, duration(config.workDuration)),
    restDuration: duration(config.restDuration),
    rounds: Math.max(1, Math.min(100, Math.round(Number(config.rounds) || 1))),
    cooldownDuration: duration(config.cooldownDuration),
  }
}

export function generatePhases(rawConfig: SessionConfig): SessionPhase[] {
  const config = sanitizeConfig(rawConfig)
  const phases: SessionPhase[] = []

  if (config.warmupDuration > 0) {
    phases.push({ id: 'warmup', type: 'warmup', duration: config.warmupDuration })
  }

  for (let round = 1; round <= config.rounds; round += 1) {
    phases.push({ id: `work-${round}`, type: 'work', duration: config.workDuration, round })
    if (round < config.rounds && config.restDuration > 0) {
      phases.push({ id: `rest-${round}`, type: 'rest', duration: config.restDuration, round })
    }
  }

  if (config.cooldownDuration > 0) {
    phases.push({ id: 'cooldown', type: 'cooldown', duration: config.cooldownDuration })
  }

  return phases
}

export function summarizePhases(phases: SessionPhase[]): PhaseTotals & { total: number } {
  const totals = emptyTotals()
  for (const phase of phases) totals[phase.type] += phase.duration
  return { ...totals, total: Object.values(totals).reduce((sum, value) => sum + value, 0) }
}

export function phaseLabel(type: PhaseType): string {
  return { warmup: 'ÉCHAUFFEMENT', work: 'CORDE', rest: 'REPOS', cooldown: 'RÉCUPÉRATION' }[type]
}

export function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.ceil(totalSeconds))
  const minutes = Math.floor(seconds / 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

export function formatDuration(totalSeconds: number, compact = false): string {
  const seconds = Math.max(0, Math.round(totalSeconds))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = seconds % 60
  if (compact) {
    if (hours) return `${hours} h ${minutes ? `${minutes} min` : ''}`.trim()
    if (minutes && rest) return `${minutes} min ${rest}`
    if (minutes) return `${minutes} min`
    return `${rest} sec`
  }
  const parts: string[] = []
  if (hours) parts.push(`${hours} h`)
  if (minutes) parts.push(`${minutes} min`)
  if (rest || parts.length === 0) parts.push(`${rest} sec`)
  return parts.join(' ')
}

export function nextPhaseText(phases: SessionPhase[], index: number, rounds: number): string {
  const next = phases[index + 1]
  if (!next) return 'Ensuite : fin de la séance'
  if (next.type === 'work') return `Ensuite : round ${next.round} sur ${rounds}`
  return `Ensuite : ${phaseLabel(next.type).toLocaleLowerCase('fr-FR')} ${formatDuration(next.duration)}`
}
