import { describe, expect, it } from 'vitest'
import { generatePhases, summarizePhases } from './session'

const config = { warmupDuration: 120, workDuration: 45, restDuration: 20, rounds: 10, cooldownDuration: 60 }

describe('génération de séance', () => {
  it('génère une seule source de vérité avec 9 repos pour 10 rounds', () => {
    const phases = generatePhases(config)
    expect(phases.filter((phase) => phase.type === 'work')).toHaveLength(10)
    expect(phases.filter((phase) => phase.type === 'rest')).toHaveLength(9)
    expect(phases.at(-2)?.type).toBe('work')
    expect(phases.at(-1)?.type).toBe('cooldown')
  })

  it('calcule exactement corde, repos et total', () => {
    const totals = summarizePhases(generatePhases(config))
    expect(totals.work).toBe(450)
    expect(totals.rest).toBe(180)
    expect(totals.total).toBe(810)
  })

  it('ne crée aucun repos pour un seul round', () => {
    const phases = generatePhases({ ...config, warmupDuration: 0, cooldownDuration: 0, rounds: 1 })
    expect(phases).toEqual([{ id: 'work-1', type: 'work', duration: 45, round: 1 }])
  })

  it('ignore proprement les phases de durée nulle', () => {
    const phases = generatePhases({ ...config, warmupDuration: 0, restDuration: 0, cooldownDuration: 0 })
    expect(phases.every((phase) => phase.type === 'work')).toBe(true)
  })
})
