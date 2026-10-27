import { describe, expect, it } from 'vitest'
import { ageOn, dueLabel, initials, syncedLabel, timeSince, weightProgress } from './profile'

const today = new Date(2026, 9, 21) // quarta, 21/10/2026

describe('initials', () => {
  it.each([
    ['Renato Alves', 'RA'],
    ['Carlos', 'C'],
    ['ana maria de souza', 'AS'],
    ['  ', ''],
  ])('%s → %s', (name, text) => expect(initials(name)).toBe(text))
})

describe('ageOn', () => {
  it('só completa o ano no dia do aniversário', () => {
    expect(ageOn('1993-10-21', today)).toBe(33)
    expect(ageOn('1993-10-22', today)).toBe(32)
  })
})

describe('timeSince', () => {
  it.each([
    ['2026-06-10', '4 meses'],
    ['2026-09-21', '1 mês'],
    ['2026-10-01', 'menos de 1 mês'],
    ['2025-10-21', '1 ano'],
    ['2024-08-01', '2 anos e 2 meses'],
    ['2025-09-01', '1 ano e 1 mês'],
  ])('%s → %s', (since, text) => expect(timeSince(since, today)).toBe(text))
})

describe('dueLabel', () => {
  it.each([
    ['2026-10-21', 'Vence hoje'],
    ['2026-10-22', 'Vence amanhã'],
    ['2026-10-23', 'Vence em 2 dias'],
    ['2026-10-20', 'Atrasado há 1 dia'],
    ['2026-10-18', 'Atrasado há 3 dias'],
  ])('%s → %s', (due, text) => expect(dueLabel(due, today)).toBe(text))
})

describe('weightProgress', () => {
  it('meta de perder peso', () => {
    expect(weightProgress(85, 82.4, 76)).toEqual({ doneKg: 2.6, totalKg: 9, percent: 29 })
  })

  it('meta de ganhar peso', () => {
    expect(weightProgress(60, 63, 66)).toEqual({ doneKg: 3, totalKg: 6, percent: 50 })
  })

  it('andou para o lado contrário: progresso zero, diferença negativa', () => {
    expect(weightProgress(85, 86.2, 76)).toEqual({ doneKg: -1.2, totalKg: 9, percent: 0 })
  })

  it('passou da meta: 100%', () => {
    expect(weightProgress(85, 75, 76).percent).toBe(100)
  })
})

describe('syncedLabel', () => {
  it.each([
    [new Date(2026, 9, 21, 7, 12), 'hoje, 07:12'],
    [new Date(2026, 9, 20, 21, 40), 'ontem, 21:40'],
    [new Date(2026, 9, 18, 9, 0), 'em 18/10'],
  ])('%s → %s', (at, text) => expect(syncedLabel(at.toISOString(), today)).toBe(text))
})
