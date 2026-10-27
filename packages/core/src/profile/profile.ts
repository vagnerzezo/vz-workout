import { differenceInCalendarDays, differenceInMonths, differenceInYears } from 'date-fns'
import { parseIsoDate } from '../format/date'

/** "Renato Alves" → "RA" · "Carlos" → "C" · "Ana Maria de Souza" → "AS" */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  const first = parts[0]!.charAt(0)
  const last = parts.length > 1 ? parts.at(-1)!.charAt(0) : ''
  return (first + last).toUpperCase()
}

/** Idade completa na data. */
export const ageOn = (birthDate: string, today: Date) => differenceInYears(today, parseIsoDate(birthDate))

/** Tempo desde uma data: "4 meses", "1 mês", "1 ano e 2 meses", "menos de 1 mês". */
export function timeSince(isoDate: string, today: Date): string {
  const months = differenceInMonths(today, parseIsoDate(isoDate))
  if (months < 1) return 'menos de 1 mês'
  const y = Math.floor(months / 12)
  const m = months % 12
  const monthsText = m === 1 ? '1 mês' : `${m} meses`
  if (y === 0) return monthsText
  const yearsText = y === 1 ? '1 ano' : `${y} anos`
  return m === 0 ? yearsText : `${yearsText} e ${monthsText}`
}

/** Prazo do check-in: "Vence hoje", "Vence amanhã", "Vence em 2 dias", "Atrasado há 3 dias". */
export function dueLabel(dueDate: string, today: Date): string {
  const days = differenceInCalendarDays(parseIsoDate(dueDate), today)
  if (days === 0) return 'Vence hoje'
  if (days === 1) return 'Vence amanhã'
  if (days > 1) return `Vence em ${days} dias`
  return days === -1 ? 'Atrasado há 1 dia' : `Atrasado há ${-days} dias`
}

export type WeightProgress = {
  doneKg: number // quanto já andou na direção da meta (negativo se foi para o lado contrário)
  totalKg: number // distância entre o início e a meta
  percent: number // 0 a 100
}

/** Progresso até a meta de peso, para perder ou para ganhar. Arredonda a 0,1 kg. */
export function weightProgress(startKg: number, currentKg: number, goalKg: number): WeightProgress {
  const round = (n: number) => Math.round(n * 10) / 10
  const direction = goalKg < startKg ? -1 : 1
  const totalKg = round(Math.abs(goalKg - startKg))
  const doneKg = round((currentKg - startKg) * direction)
  const percent = totalKg === 0 ? 100 : Math.min(100, Math.max(0, Math.round((doneKg / totalKg) * 100)))
  return { doneKg, totalKg, percent }
}

/** Quando a ficha foi baixada: "hoje, 07:12" · "ontem, 21:40" · "em 18/10". */
export function syncedLabel(iso: string, now: Date): string {
  const at = new Date(iso)
  const days = differenceInCalendarDays(now, at)
  const time = `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`
  if (days === 0) return `hoje, ${time}`
  if (days === 1) return `ontem, ${time}`
  return `em ${String(at.getDate()).padStart(2, '0')}/${String(at.getMonth() + 1).padStart(2, '0')}`
}
