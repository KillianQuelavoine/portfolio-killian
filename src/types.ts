export type PhaseType = 'warmup' | 'work' | 'rest' | 'cooldown'
export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed'

export interface SessionConfig {
  warmupDuration: number
  workDuration: number
  restDuration: number
  rounds: number
  cooldownDuration: number
}

export interface GuidancePreferences {
  startCountdown: boolean
  endCountdown: boolean
  halfwayCue: boolean
}

export interface SessionPhase {
  id: string
  type: PhaseType
  duration: number
  round?: number
}

export type PhaseTotals = Record<PhaseType, number>

export interface ActiveSession {
  id: string
  config: SessionConfig
  phases: SessionPhase[]
  phaseIndex: number
  status: TimerStatus
  startedAt: number
  finishedAt?: number
  phaseStartedAt: number | null
  phaseEndsAt: number | null
  pausedRemainingMs: number
  completedMs: PhaseTotals
  addedRestMs: number
  restAdjustmentMs: number
  earlyFinish: boolean
}

export interface HistoryEntry {
  id: string
  date: string
  finishedAt: string
  totalDuration: number
  workDuration: number
  restDuration: number
  warmupDuration: number
  cooldownDuration: number
  rounds: number
  config: SessionConfig
  addedRestDuration: number
  earlyFinish: boolean
}
