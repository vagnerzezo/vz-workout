import { describe, expect, it } from 'vitest'
import { formatDeltaKg, formatTons } from '../format/numbers'
import {
  historyStats,
  monthGrid,
  monthLabel,
  monthName,
  relativeDay,
  sessionsThisWeek,
  shiftMonth,
  weekdayShort,
} from './history'

const ex = (isRecord: boolean) => ({ name: 'x', best: { kg: 10, reps: 10 }, deltaKg: 0, isRecord })
const session = (date: string, durationMin: number, volumeKg: number, records = 0) => ({
  date,
  durationMin,
  volumeKg,
  exercises: [...Array(records).fill(ex(true)), ex(false)],
})

describe('historyStats', () => {
  const sessions = [session('2026-10-20', 52, 8400, 2), session('2026-10-16', 58, 9600), session('2026-10-15', 49, 7100, 1)]

  it('soma tempo, volume e recordes do mês', () => {
    expect(historyStats(sessions, 22_800)).toEqual({
      count: 3,
      totalMinutes: 159,
      averageMinutes: 53,
      volumeKg: 25_100,
      volumeChangePct: 10,
      records: 3,
      lastRecordDate: '2026-10-20',
    })
  })

  it('sem mês anterior não compara e mês vazio não tem média', () => {
    expect(historyStats(sessions, null).volumeChangePct).toBeNull()
    expect(historyStats([], 1000)).toMatchObject({ count: 0, averageMinutes: null, volumeChangePct: -100, lastRecordDate: null })
  })
})

describe('monthGrid', () => {
  it('outubro de 2026 começa numa quinta: 3 vazios antes do dia 1', () => {
    const cells = monthGrid('2026-10')
    expect(cells.slice(0, 4)).toEqual([null, null, null, '2026-10-01'])
    expect(cells).toHaveLength(35)
    expect(cells.filter(Boolean)).toHaveLength(31)
  })

  it('fevereiro de 2027 começa numa segunda', () => {
    expect(monthGrid('2027-02')[0]).toBe('2027-02-01')
  })
})

describe('meses', () => {
  it('navega e escreve em português', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12')
    expect(shiftMonth('2026-10', 1)).toBe('2026-11')
    expect(monthLabel('2026-10')).toBe('Outubro 2026')
    expect(monthName('2026-09')).toBe('setembro')
  })
})

describe('datas relativas', () => {
  const today = new Date(2026, 9, 21, 20)

  it.each([
    ['2026-10-21', 'hoje'],
    ['2026-10-20', 'ontem'],
    ['2026-10-14', 'em 14/10'],
  ])('%s → %s', (date, expected) => {
    expect(relativeDay(date, today)).toBe(expected)
  })

  it('conta só os treinos desta semana', () => {
    expect(sessionsThisWeek([{ date: '2026-10-19' }, { date: '2026-10-20' }, { date: '2026-10-18' }], today)).toBe(2)
  })

  it('dia da semana abreviado', () => {
    expect(weekdayShort('2026-10-20')).toBe('TER')
    expect(weekdayShort('2026-10-18')).toBe('DOM')
  })
})

describe('formatos do histórico', () => {
  it('toneladas e diferença de carga', () => {
    expect(formatTons(8400)).toBe('8,4 t')
    expect(formatTons(110_800)).toBe('110,8 t')
    expect(formatDeltaKg(2.5)).toBe('+2,5')
    expect(formatDeltaKg(0)).toBe('=')
    expect(formatDeltaKg(-2.5)).toBe('−2,5')
  })
})
