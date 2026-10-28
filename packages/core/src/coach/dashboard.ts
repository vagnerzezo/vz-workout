import { differenceInCalendarDays, differenceInMinutes, getISOWeek } from 'date-fns'
import { parseIsoDate, shortDate } from '../format/date'
import type { AttentionItem, AttentionType } from '../schemas/coach'

/** "agora" · "há 12 min" · "há 3 h" · "há 1 dia" · "há 4 dias" */
export function timeAgo(iso: string, now: Date): string {
  const at = new Date(iso)
  const min = differenceInMinutes(now, at)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  if (min < 24 * 60) return `há ${Math.floor(min / 60)} h`
  const days = Math.max(1, differenceInCalendarDays(now, at))
  return days === 1 ? 'há 1 dia' : `há ${days} dias`
}

const dateOf = (at: string) => (at.length === 10 ? parseIsoDate(at) : new Date(at))

/** Linha de baixo do nome: "há 3 h" (check-in), "último treino 15/10", "vence hoje" / "vence amanhã" / "vence 23/10". */
export function attentionWhen(item: Pick<AttentionItem, 'type' | 'at'>, now: Date): string {
  const at = dateOf(item.at)
  if (item.type === 'checkIn') return timeAgo(at.toISOString(), now)
  if (item.type === 'inactivity') return `último treino ${shortDate(at)}`
  const days = differenceInCalendarDays(at, now)
  if (days === 0) return 'vence hoje'
  if (days === 1) return 'vence amanhã'
  return days < 0 ? `venceu ${shortDate(at)}` : `vence ${shortDate(at)}`
}

export type AttentionFilter = 'all' | AttentionType

/** Quantos itens em cada filtro ("Todos · 7", "Check-ins · 3"…). */
export function attentionCounts(items: Pick<AttentionItem, 'type'>[]): Record<AttentionFilter, number> {
  const of = (t: AttentionType) => items.filter((i) => i.type === t).length
  return { all: items.length, checkIn: of('checkIn'), inactivity: of('inactivity'), due: of('due') }
}

/** Adesão da semana atual e a variação em pontos contra a anterior. */
export function adherenceSummary(weeks: { pct: number }[]): { current: number; deltaPts: number } {
  const current = Math.round(weeks.at(-1)?.pct ?? 0)
  const previous = weeks.length > 1 ? Math.round(weeks.at(-2)!.pct) : current
  return { current, deltaPts: current - previous }
}

/** Rótulo da semana no gráfico: "S43" */
export const weekLabel = (weekStartIso: string) => `S${getISOWeek(parseIsoDate(weekStartIso))}`

/** Variação com sinal tipográfico: 3 → "+3" · -4 → "−4" · 0 → "0" */
export function formatSigned(n: number): string {
  if (n === 0) return '0'
  return `${n > 0 ? '+' : '−'}${Math.abs(n)}`
}
