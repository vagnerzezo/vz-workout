import { format, getISOWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/** "Bom dia" das 5h às 11h59, "Boa tarde" até 17h59, "Boa noite" no resto. */
export function greetingFor(date: Date): string {
  const h = date.getHours()
  if (h >= 5 && h < 12) return 'Bom dia'
  if (h >= 12 && h < 18) return 'Boa tarde'
  return 'Boa noite'
}

/** "Quarta-feira, 21 de outubro" */
export function dayLabel(date: Date): string {
  const label = format(date, "EEEE, d 'de' MMMM", { locale: ptBR })
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}`
}

/** "Quarta-feira, 21 de outubro · Semana 43" */
export function homeDateLabel(date: Date): string {
  return `${dayLabel(date)} · Semana ${getISOWeek(date)}`
}

/** Letra do dia na faixa da semana: S T Q Q S S D */
export function weekdayLetter(date: Date): string {
  return format(date, 'EEEEE', { locale: ptBR }).toUpperCase()
}

/** "quarta-feira" */
export function weekdayName(date: Date): string {
  return format(date, 'EEEE', { locale: ptBR })
}

/** "Segunda" para o dia ISO (1 = segunda … 7 = domingo) */
export function weekdayLabel(isoWeekday: number): string {
  const label = format(new Date(2026, 0, 4 + isoWeekday), 'EEEE', { locale: ptBR }).replace('-feira', '')
  return label.charAt(0).toUpperCase() + label.slice(1)
}

/** "21/09" */
export function shortDate(date: Date): string {
  return format(date, 'dd/MM')
}

/** Lê "2026-10-21" como data local (new Date("2026-10-21") seria UTC e pode virar o dia anterior). */
export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y!, m! - 1, d!)
}

/** "2026-10-21" no fuso do aparelho */
export function toIsoDate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}
