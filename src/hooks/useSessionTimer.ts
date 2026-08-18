import { useEffect, useMemo, useReducer, useState } from 'react'
import type { ActiveSession, HistoryEntry, PhaseTotals, SessionConfig } from '../types'
import { emptyTotals, generatePhases, sanitizeConfig } from '../lib/session'
import { localDateKey } from '../lib/statistics'
import { storage } from '../lib/storage'

type Action =
  | { type: 'tick'; now: number }
  | { type: 'pause'; now: number }
  | { type: 'resume'; now: number }
  | { type: 'skip'; now: number }
  | { type: 'adjustRest'; milliseconds: number; now: number }
  | { type: 'finish'; now: number }

function commitCurrent(session: ActiveSession, now: number): ActiveSession {
  if (session.phaseStartedAt === null) return session
  const phase = session.phases[session.phaseIndex]
  const elapsed = Math.max(0, Math.min(now - session.phaseStartedAt, (session.phaseEndsAt ?? now) - session.phaseStartedAt))
  return { ...session, completedMs: { ...session.completedMs, [phase.type]: session.completedMs[phase.type] + elapsed } }
}

function nextPhase(session: ActiveSession, startAt: number): ActiveSession {
  const phaseIndex = session.phaseIndex + 1
  if (phaseIndex >= session.phases.length) {
    return { ...session, phaseIndex: session.phases.length - 1, status: 'completed', finishedAt: startAt, phaseStartedAt: null, phaseEndsAt: null, pausedRemainingMs: 0 }
  }
  return {
    ...session,
    phaseIndex,
    phaseStartedAt: startAt,
    phaseEndsAt: startAt + session.phases[phaseIndex].duration * 1000,
    pausedRemainingMs: 0,
  }
}

export function advanceSession(initial: ActiveSession, now: number): ActiveSession {
  let session = initial
  if (session.status !== 'running') return session
  while (session.phaseEndsAt !== null && now >= session.phaseEndsAt && session.status === 'running') {
    const boundary = session.phaseEndsAt
    session = nextPhase(commitCurrent(session, boundary), boundary)
  }
  return session
}

export function sessionReducer(session: ActiveSession, action: Action): ActiveSession {
  if (action.type === 'tick') return advanceSession(session, action.now)
  if (action.type === 'pause' && session.status === 'running') {
    const current = advanceSession(session, action.now)
    if (current.status !== 'running') return current
    const committed = commitCurrent(current, action.now)
    return { ...committed, status: 'paused', pausedRemainingMs: Math.max(0, (current.phaseEndsAt ?? action.now) - action.now), phaseStartedAt: null, phaseEndsAt: null }
  }
  if (action.type === 'resume' && session.status === 'paused') {
    return { ...session, status: 'running', phaseStartedAt: action.now, phaseEndsAt: action.now + session.pausedRemainingMs, pausedRemainingMs: 0 }
  }
  if (action.type === 'skip' && (session.status === 'running' || session.status === 'paused')) {
    const committed = session.status === 'running' ? commitCurrent(session, action.now) : session
    const next = nextPhase(committed, action.now)
    if (session.status === 'paused' && next.status !== 'completed') {
      return { ...next, status: 'paused', pausedRemainingMs: next.phases[next.phaseIndex].duration * 1000, phaseStartedAt: null, phaseEndsAt: null }
    }
    return next
  }
  if (action.type === 'adjustRest' && session.phases[session.phaseIndex]?.type === 'rest' && (session.status === 'running' || session.status === 'paused')) {
    const remaining = session.status === 'paused'
      ? session.pausedRemainingMs
      : Math.max(0, (session.phaseEndsAt ?? action.now) - action.now)
    const delta = action.milliseconds < 0
      ? Math.max(action.milliseconds, 1000 - remaining)
      : action.milliseconds
    return {
      ...session,
      addedRestMs: session.addedRestMs + Math.max(0, delta),
      restAdjustmentMs: (session.restAdjustmentMs ?? session.addedRestMs) + delta,
      phaseEndsAt: session.phaseEndsAt === null ? null : session.phaseEndsAt + delta,
      pausedRemainingMs: session.status === 'paused' ? session.pausedRemainingMs + delta : session.pausedRemainingMs,
    }
  }
  if (action.type === 'finish' && session.status !== 'completed') {
    const current = session.status === 'running' ? commitCurrent(advanceSession(session, action.now), action.now) : session
    return { ...current, status: 'completed', finishedAt: action.now, phaseStartedAt: null, phaseEndsAt: null, pausedRemainingMs: 0, earlyFinish: true }
  }
  return session
}

export function createActiveSession(rawConfig: SessionConfig, now = Date.now()): ActiveSession {
  const config = sanitizeConfig(rawConfig)
  const phases = generatePhases(config)
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${now}-${Math.random()}`,
    config,
    phases,
    phaseIndex: 0,
    status: 'running',
    startedAt: now,
    phaseStartedAt: now,
    phaseEndsAt: now + phases[0].duration * 1000,
    pausedRemainingMs: 0,
    completedMs: emptyTotals(),
    addedRestMs: 0,
    restAdjustmentMs: 0,
    earlyFinish: false,
  }
}

export function liveTotals(session: ActiveSession, now = Date.now()): PhaseTotals {
  const totals = { ...session.completedMs }
  if (session.status === 'running' && session.phaseStartedAt !== null) {
    const phase = session.phases[session.phaseIndex]
    const elapsed = Math.max(0, Math.min(now - session.phaseStartedAt, (session.phaseEndsAt ?? now) - session.phaseStartedAt))
    totals[phase.type] += elapsed
  }
  return totals
}

export function sessionToHistory(session: ActiveSession): HistoryEntry {
  const totals = liveTotals(session, session.finishedAt ?? Date.now())
  const finished = new Date(session.finishedAt ?? Date.now())
  return {
    id: session.id,
    date: localDateKey(finished),
    finishedAt: finished.toISOString(),
    totalDuration: Math.round(Object.values(totals).reduce((sum, value) => sum + value, 0) / 1000),
    workDuration: Math.round(totals.work / 1000),
    restDuration: Math.round(totals.rest / 1000),
    warmupDuration: Math.round(totals.warmup / 1000),
    cooldownDuration: Math.round(totals.cooldown / 1000),
    rounds: session.config.rounds,
    config: session.config,
    addedRestDuration: Math.round(session.addedRestMs / 1000),
    earlyFinish: session.earlyFinish,
  }
}

export function useSessionTimer(initial: ActiveSession) {
  const [session, dispatch] = useReducer(sessionReducer, initial, (value) => advanceSession(value, Date.now()))
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    if (session.status !== 'running') return
    const sync = () => {
      const current = Date.now()
      setNow(current)
      dispatch({ type: 'tick', now: current })
    }
    const timer = window.setInterval(sync, 200)
    document.addEventListener('visibilitychange', sync)
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', sync) }
  }, [session.status])
  useEffect(() => { session.status === 'completed' ? storage.clearActive() : storage.setActive(session) }, [session])
  const remainingMs = session.status === 'paused' ? session.pausedRemainingMs : Math.max(0, (session.phaseEndsAt ?? now) - now)
  const totals = useMemo(() => liveTotals(session, now), [session, now])
  return {
    session,
    remainingMs,
    totals,
    pause: () => dispatch({ type: 'pause', now: Date.now() }),
    resume: () => dispatch({ type: 'resume', now: Date.now() }),
    skip: () => dispatch({ type: 'skip', now: Date.now() }),
    adjustRest: (seconds: number) => dispatch({ type: 'adjustRest', milliseconds: seconds * 1000, now: Date.now() }),
    finish: () => dispatch({ type: 'finish', now: Date.now() }),
  }
}
