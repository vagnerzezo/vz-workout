import { describe, expect, it } from 'vitest'
import { adherenceSummary, attentionCounts, attentionWhen, formatSigned, timeAgo, weekLabel } from './dashboard'

const now = new Date(2026, 9, 21, 20, 0) // quarta, 21/10/2026, 20h
const at = (d: number, h: number, m = 0) => new Date(2026, 9, d, h, m).toISOString()

describe('timeAgo', () => {
  it.each([
    [at(21, 20), 'agora'],
    [at(21, 19, 48), 'há 12 min'],
    [at(21, 17), 'há 3 h'],
    [at(20, 21), 'há 23 h'],
    [at(20, 9), 'há 1 dia'],
    [at(19, 20), 'há 2 dias'],
  ])('%s → %s', (iso, label) => {
    expect(timeAgo(iso, now)).toBe(label)
  })
})

describe('attentionWhen', () => {
  it('check-in: tempo desde o envio', () => {
    expect(attentionWhen({ type: 'checkIn', at: at(21, 17) }, now)).toBe('há 3 h')
  })

  it('inatividade: data do último treino', () => {
    expect(attentionWhen({ type: 'inactivity', at: '2026-10-15' }, now)).toBe('último treino 15/10')
  })

  it.each([
    ['2026-10-21', 'vence hoje'],
    ['2026-10-22', 'vence amanhã'],
    ['2026-10-23', 'vence 23/10'],
    ['2026-10-20', 'venceu 20/10'],
  ])('vencimento %s → %s', (date, label) => {
    expect(attentionWhen({ type: 'due', at: date }, now)).toBe(label)
  })
})

describe('attentionCounts', () => {
  it('conta por tipo e o total', () => {
    const items = [{ type: 'checkIn' }, { type: 'checkIn' }, { type: 'due' }, { type: 'inactivity' }] as const
    expect(attentionCounts([...items])).toEqual({ all: 4, checkIn: 2, inactivity: 1, due: 1 })
  })
})

describe('adherenceSummary', () => {
  it('semana atual e variação contra a anterior', () => {
    expect(adherenceSummary([{ pct: 86 }, { pct: 85 }, { pct: 81 }])).toEqual({ current: 81, deltaPts: -4 })
  })

  it('uma semana só: sem variação', () => {
    expect(adherenceSummary([{ pct: 70 }])).toEqual({ current: 70, deltaPts: 0 })
  })
})

describe('weekLabel e formatSigned', () => {
  it('semana ISO da segunda-feira', () => {
    expect(weekLabel('2026-10-19')).toBe('S43')
  })

  it.each([
    [3, '+3'],
    [-4, '−4'],
    [0, '0'],
  ])('%d → %s', (n, label) => {
    expect(formatSigned(n)).toBe(label)
  })
})
