import { addMonths, differenceInCalendarDays, format, getDaysInMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { HistorySession } from '../schemas/history'
import { parseIsoDate, shortDate, toIsoDate } from '../format/date'

export type HistoryStats = {
  count: number
  totalMinutes: number
  averageMinutes: number | null
  volumeKg: number
  /** Variação do volume em relação ao mês anterior, em % arredondado; null sem base de comparação */
  volumeChangePct: number | null
  records: number
  lastRecordDate: string | null
}

export function historyStats(
  sessions: Pick<HistorySession, 'date' | 'durationMin' | 'volumeKg' | 'exercises'>[],
  previousMonthVolumeKg: number | null,
): HistoryStats {
  const totalMinutes = sessions.reduce((sum, s) => sum + s.durationMin, 0)
  const volumeKg = sessions.reduce((sum, s) => sum + s.volumeKg, 0)
  const withRecords = sessions.filter((s) => s.exercises.some((e) => e.isRecord))
  return {
    count: sessions.length,
    totalMinutes,
    averageMinutes: sessions.length ? totalMinutes / sessions.length : null,
    volumeKg,
    volumeChangePct: previousMonthVolumeKg ? Math.round(((volumeKg - previousMonthVolumeKg) / previousMonthVolumeKg) * 100) : null,
    records: sessions.reduce((sum, s) => sum + s.exercises.filter((e) => e.isRecord).length, 0),
    lastRecordDate: withRecords.map((s) => s.date).sort().at(-1) ?? null,
  }
}

/** Dias do mês numa grade de segunda a domingo; null preenche antes do dia 1 e depois do último. */
export function monthGrid(month: string): (string | null)[] {
  const first = parseIsoDate(`${month}-01`)
  const leading = (first.getDay() + 6) % 7 // segunda = 0
  const days = Array.from({ length: getDaysInMonth(first) }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`)
  const cells = [...Array<null>(leading).fill(null), ...days]
  while (cells.length % 7) cells.push(null)
  return cells
}

/** "2026-10" para a data */
export const yearMonthOf = (date: Date) => format(date, 'yyyy-MM')

export const shiftMonth = (month: string, delta: number) => yearMonthOf(addMonths(parseIsoDate(`${month}-01`), delta))

/** "Outubro 2026" */
export function monthLabel(month: string): string {
  const label = format(parseIsoDate(`${month}-01`), "MMMM yyyy", { locale: ptBR })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

/** "setembro" */
export const monthName = (month: string) => format(parseIsoDate(`${month}-01`), 'MMMM', { locale: ptBR })

/** "hoje", "ontem" ou "em 14/10" */
export function relativeDay(isoDate: string, today: Date): string {
  const days = differenceInCalendarDays(today, parseIsoDate(isoDate))
  if (days === 0) return 'hoje'
  if (days === 1) return 'ontem'
  return `em ${shortDate(parseIsoDate(isoDate))}`
}

/** Treinos na semana (segunda a domingo) de `today`. */
export function sessionsThisWeek(sessions: Pick<HistorySession, 'date'>[], today: Date): number {
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7))
  const from = toIsoDate(monday)
  const to = toIsoDate(today)
  return sessions.filter((s) => s.date >= from && s.date <= to).length
}

const WEEKDAY_SHORT = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB']

/** "TER" (o date-fns em pt-BR abrevia terça como "terça") */
export const weekdayShort = (isoDate: string) => WEEKDAY_SHORT[parseIsoDate(isoDate).getDay()]!
