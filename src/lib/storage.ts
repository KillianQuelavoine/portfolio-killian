import type { ActiveSession, GuidancePreferences, HistoryEntry, SessionConfig } from '../types'

const KEYS = {
  sound: 'corde-maelle:sound',
  history: 'corde-maelle:history',
  lastConfig: 'corde-maelle:last-config',
  active: 'corde-maelle:active-session',
  guidance: 'corde-maelle:guidance',
  volume: 'corde-maelle:volume',
}

const DEFAULT_GUIDANCE: GuidancePreferences = {
  startCountdown: true,
  endCountdown: true,
  halfwayCue: true,
}

function read<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Le stockage privé peut être indisponible : l'app reste utilisable.
  }
}

export const storage = {
  getSound: () => read(KEYS.sound, true),
  setSound: (enabled: boolean) => write(KEYS.sound, enabled),
  getGuidance: () => ({ ...DEFAULT_GUIDANCE, ...read<Partial<GuidancePreferences>>(KEYS.guidance, {}) }),
  setGuidance: (preferences: GuidancePreferences) => write(KEYS.guidance, preferences),
  getVolume: () => Math.max(0.1, Math.min(1, read(KEYS.volume, 0.85))),
  setVolume: (volume: number) => write(KEYS.volume, Math.max(0.1, Math.min(1, volume))),
  getHistory: () => read<HistoryEntry[]>(KEYS.history, []),
  addHistory(entry: HistoryEntry) {
    const entries = storage.getHistory()
    if (entries.some((item) => item.id === entry.id)) return entries
    const next = [entry, ...entries].slice(0, 500)
    write(KEYS.history, next)
    return next
  },
  getLastConfig: () => read<SessionConfig | null>(KEYS.lastConfig, null),
  setLastConfig: (config: SessionConfig) => write(KEYS.lastConfig, config),
  getActive: () => read<ActiveSession | null>(KEYS.active, null),
  setActive: (session: ActiveSession) => write(KEYS.active, session),
  clearActive() {
    try { localStorage.removeItem(KEYS.active) } catch { /* rien à faire */ }
  },
}
