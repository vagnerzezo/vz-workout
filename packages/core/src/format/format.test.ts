import { describe, expect, it } from 'vitest'
import { greetingFor, homeDateLabel, parseIsoDate, weekdayLetter } from './date'
import { formatDuration, formatInt, formatLiters } from './numbers'

const at = (h: number) => new Date(2026, 9, 21, h, 0)

describe('greetingFor', () => {
  it.each([
    [4, 'Boa noite'],
    [5, 'Bom dia'],
    [11, 'Bom dia'],
    [12, 'Boa tarde'],
    [17, 'Boa tarde'],
    [18, 'Boa noite'],
    [23, 'Boa noite'],
  ])('%ih → %s', (h, expected) => {
    expect(greetingFor(at(h))).toBe(expected)
  })
})

describe('homeDateLabel', () => {
  it('escreve o dia com inicial maiúscula e a semana ISO', () => {
    expect(homeDateLabel(at(20))).toBe('Quarta-feira, 21 de outubro · Semana 43')
  })
})

describe('weekdayLetter', () => {
  it('usa a letra do dia em português', () => {
    const week = ['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25']
    expect(week.map((d) => weekdayLetter(parseIsoDate(d))).join('')).toBe('STQQSSD')
  })
})

describe('parseIsoDate', () => {
  it('lê a data no fuso local, sem voltar um dia', () => {
    const d = parseIsoDate('2026-10-21')
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 9, 21])
  })
})

describe('formatLiters', () => {
  it.each([
    [1250, '1,25 L'],
    [1500, '1,5 L'],
    [2000, '2 L'],
    [0, '0 L'],
  ])('%i ml → %s', (ml, expected) => {
    expect(formatLiters(ml)).toBe(expected)
  })
})

describe('formatDuration', () => {
  it.each([
    [95, '1h 35min'],
    [45, '45min'],
    [120, '2h'],
    [210, '3h 30min'],
  ])('%i min → %s', (min, expected) => {
    expect(formatDuration(min)).toBe(expected)
  })
})

describe('formatInt', () => {
  it('separa milhar com ponto', () => {
    expect(formatInt(2127)).toBe('2.127')
  })
})
