import { describe, expect, it } from 'vitest'
import type { HistoryEntry } from '../types'
import { currentStreak, weeklyWorkSeconds } from './statistics'

const entry = (date: string, workDuration = 60): HistoryEntry => ({
  id: date,
  date,
  finishedAt: `${date}T12:00:00`,
  totalDuration: workDuration,
  workDuration,
  restDuration: 0,
  warmupDuration: 0,
  cooldownDuration: 0,
  rounds: 1,
  config: { warmupDuration: 0, workDuration: 60, restDuration: 0, rounds: 1, cooldownDuration: 0 },
  addedRestDuration: 0,
  earlyFinish: false,
})

describe('statistiques', () => {
  it('additionne uniquement la corde de la semaine courante', () => {
    const now = new Date('2026-08-12T18:00:00')
    expect(weeklyWorkSeconds([entry('2026-08-10', 120), entry('2026-08-09', 900)], now)).toBe(120)
  })

  it('calcule une série incluant aujourd’hui', () => {
    const now = new Date('2026-08-12T18:00:00')
    expect(currentStreak([entry('2026-08-10'), entry('2026-08-11'), entry('2026-08-12')], now)).toBe(3)
  })

  it('conserve la série d’hier si aucune séance aujourd’hui', () => {
    const now = new Date('2026-08-12T18:00:00')
    expect(currentStreak([entry('2026-08-10'), entry('2026-08-11')], now)).toBe(2)
  })
})
