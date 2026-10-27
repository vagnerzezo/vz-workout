import { describe, expect, it } from 'vitest'
import { weekdayLabel } from '../format/date'
import { estimateDuration } from './duration'
import { planWeek, workoutForDate } from './schedule'

const rx = (warmupSets: number, prepSets: number, workingSets: number, restSeconds: number) => ({
  warmupSets, prepSets, workingSets, restSeconds,
})

describe('estimateDuration', () => {
  it('soma séries, descansos e trocas de aparelho e arredonda para 5 min', () => {
    // 2 aquecimentos (200s) + 4 séries × (40 + 120)s (640s) + 2 séries × (40 + 60)s (200s) + 1 troca (60s) = 1100s ≈ 18,3 min
    expect(estimateDuration({ exercises: [rx(2, 1, 3, 120), rx(0, 0, 2, 60)] })).toBe(20)
  })

  it('treino vazio dura zero', () => {
    expect(estimateDuration({ exercises: [] })).toBe(0)
  })
})

describe('workoutForDate', () => {
  const days = [{ id: 'a', weekday: 1 }, { id: 'c', weekday: 3 }]

  it('acha o treino do dia da semana', () => {
    expect(workoutForDate(days, new Date(2026, 9, 21))?.id).toBe('c') // quarta
  })

  it('devolve null em dia sem treino', () => {
    expect(workoutForDate(days, new Date(2026, 9, 25))).toBeNull() // domingo
  })
})

describe('planWeek', () => {
  const plan = { startsOn: '2026-10-14', durationWeeks: 8 }

  it.each([
    [new Date(2026, 9, 14), 1],
    [new Date(2026, 9, 20), 1],
    [new Date(2026, 9, 21), 2],
    [new Date(2026, 9, 1), 1], // antes do início
    [new Date(2027, 2, 1), 8], // depois do fim
  ])('%s → semana %i', (date, week) => {
    expect(planWeek(plan, date)).toBe(week)
  })
})

describe('weekdayLabel', () => {
  it('escreve o dia sem "-feira"', () => {
    expect([1, 2, 3, 5, 6, 7].map(weekdayLabel)).toEqual(['Segunda', 'Terça', 'Quarta', 'Sexta', 'Sábado', 'Domingo'])
  })
})
