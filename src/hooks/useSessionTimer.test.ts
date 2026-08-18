import { describe, expect, it } from 'vitest'
import { advanceSession, createActiveSession, liveTotals, sessionReducer } from './useSessionTimer'

describe('moteur temporel', () => {
  it('rattrape plusieurs phases à partir des timestamps réels', () => {
    const started = 1_000_000
    const active = createActiveSession({ warmupDuration: 2, workDuration: 3, restDuration: 2, rounds: 2, cooldownDuration: 0 }, started)
    const updated = advanceSession(active, started + 7_500)
    expect(updated.phaseIndex).toBe(3)
    expect(updated.phases[updated.phaseIndex].type).toBe('work')
    const totals = liveTotals(updated, started + 7_500)
    expect(totals.warmup).toBe(2000)
    expect(totals.work).toBe(3500)
    expect(totals.rest).toBe(2000)
  })

  it('fige le temps pendant une pause puis reprend sans dérive', () => {
    const started = 1_000_000
    const active = createActiveSession({ warmupDuration: 0, workDuration: 10, restDuration: 0, rounds: 1, cooldownDuration: 0 }, started)
    const paused = sessionReducer(active, { type: 'pause', now: started + 2_400 })
    expect(paused.status).toBe('paused')
    expect(paused.pausedRemainingMs).toBe(7600)
    const resumed = sessionReducer(paused, { type: 'resume', now: started + 20_000 })
    expect(resumed.phaseEndsAt).toBe(started + 27_600)
    expect(liveTotals(resumed, started + 21_000).work).toBe(3400)
  })

  it('ajoute du repos sans modifier la configuration originale', () => {
    const started = 1_000_000
    const active = createActiveSession({ warmupDuration: 0, workDuration: 2, restDuration: 3, rounds: 2, cooldownDuration: 0 }, started)
    const resting = advanceSession(active, started + 2_000)
    const extended = sessionReducer(resting, { type: 'adjustRest', milliseconds: 15_000, now: started + 2_000 })
    expect(extended.phaseEndsAt).toBe(started + 20_000)
    expect(extended.addedRestMs).toBe(15_000)
    expect(extended.restAdjustmentMs).toBe(15_000)
    expect(extended.config.restDuration).toBe(3)
  })

  it('retire du repos sans pouvoir descendre sous une seconde', () => {
    const started = 1_000_000
    const active = createActiveSession({ warmupDuration: 0, workDuration: 2, restDuration: 20, rounds: 2, cooldownDuration: 0 }, started)
    const resting = advanceSession(active, started + 2_000)
    const shortened = sessionReducer(resting, { type: 'adjustRest', milliseconds: -15_000, now: started + 2_000 })
    expect(shortened.phaseEndsAt).toBe(started + 7_000)
    expect(shortened.restAdjustmentMs).toBe(-15_000)
    const clamped = sessionReducer(shortened, { type: 'adjustRest', milliseconds: -15_000, now: started + 2_000 })
    expect(clamped.phaseEndsAt).toBe(started + 3_000)
  })

  it('passe immédiatement un échauffement', () => {
    const started = 1_000_000
    const active = createActiveSession({ warmupDuration: 30, workDuration: 10, restDuration: 0, rounds: 1, cooldownDuration: 0 }, started)
    const skipped = sessionReducer(active, { type: 'skip', now: started + 4_000 })
    expect(skipped.phases[skipped.phaseIndex].type).toBe('work')
    expect(skipped.completedMs.warmup).toBe(4000)
  })
})
