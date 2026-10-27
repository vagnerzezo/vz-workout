import { describe, expect, it } from 'vitest'
import type { WeeklyActivity } from '../schemas/home'
import { activitySummary } from './activity'

// Mesmos números do card "Atividade" do canvas
const durations = [180, 210, 150, 240, 200, 230, 260, 95]
const volumes = [8200, 9100, 7600, 10400, 9300, 9900, 11200, 4100]
const reps = [520, 580, 470, 640, 600, 610, 690, 250]
const weeks: WeeklyActivity[] = durations.map((d, i) => ({
  weekStart: `2026-09-${String(i + 1).padStart(2, '0')}`,
  durationMin: d,
  volumeKg: volumes[i]!,
  reps: reps[i]!,
}))

describe('activitySummary', () => {
  it('duração: semana atual e média das semanas completas', () => {
    expect(activitySummary(weeks, 'duration')).toMatchObject({
      headline: '1h 35min',
      caption: 'de treino nesta semana · média de 3h 30min',
    })
  })

  it('volume: média arredondada para centenas', () => {
    expect(activitySummary(weeks, 'volume')).toMatchObject({
      headline: '4.100 kg',
      caption: 'de volume nesta semana · média de 9.400 kg',
    })
  })

  it('repetições: média arredondada para dezenas', () => {
    expect(activitySummary(weeks, 'reps')).toMatchObject({
      headline: '250 reps',
      caption: 'nesta semana · média de 590 reps',
    })
  })

  it('sem semanas anteriores, não mostra média', () => {
    expect(activitySummary(weeks.slice(-1), 'duration').caption).toBe('de treino nesta semana')
  })

  it('sem nenhuma semana, mostra zero', () => {
    expect(activitySummary([], 'reps')).toEqual({ values: [], headline: '0 reps', caption: 'nesta semana' })
  })
})
