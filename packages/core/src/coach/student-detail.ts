import { differenceInCalendarDays } from 'date-fns'
import { parseIsoDate } from '../format/date'
import type { CheckInFrequency } from '../schemas/student-detail'

/** Peso atual e quanto mudou desde a primeira pesagem do período. */
export function weightChange(weights: { kg: number }[]): { currentKg: number; deltaKg: number } | null {
  if (weights.length === 0) return null
  const currentKg = weights.at(-1)!.kg
  return { currentKg, deltaKg: Math.round((currentKg - weights[0]!.kg) * 10) / 10 }
}

/** Só as pesagens das últimas N semanas (o gráfico do Resumo mostra 12). */
export function recentWeights<T extends { date: string }>(weights: T[], now: Date, weeks = 12): T[] {
  return weights.filter((w) => differenceInCalendarDays(now, parseIsoDate(w.date)) <= weeks * 7)
}

/**
 * Pontos da linha do peso num quadro `width` × `height`, com a meta dentro da escala
 * (assim a linha tracejada da meta sempre aparece). Devolve também o y da meta.
 */
export function weightChart(weights: { kg: number }[], goalKg: number | null, width: number, height: number, pad = 8) {
  const values = [...weights.map((w) => w.kg), ...(goalKg ? [goalKg] : [])]
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const y = (kg: number) => Math.round((pad + ((max - kg) / span) * (height - 2 * pad)) * 10) / 10
  const step = weights.length > 1 ? width / (weights.length - 1) : 0
  return {
    points: weights.map((w, i) => `${Math.round(i * step * 10) / 10},${y(w.kg)}`).join(' '),
    goalY: goalKg ? y(goalKg) : null,
  }
}

export type EffortTone = 'easy' | 'hard' | 'max'

/** Esforço do treino: 9–10 vermelho, 7–8 amarelo, abaixo disso na cor da marca. */
export const effortTone = (effort: number): EffortTone => (effort >= 9 ? 'max' : effort >= 7 ? 'hard' : 'easy')

export const checkInFrequencyLabel: Record<CheckInFrequency, string> = {
  weekly: 'Semanal',
  biweekly: 'Quinzenal',
  monthly: 'Mensal',
}

/** Nota de 1 a 5: 4–5 bom, 3 atenção, 1–2 ruim. */
export const ratingTone = (v: number) => (v >= 4 ? 'good' : v === 3 ? 'warning' : 'bad')

/** Fases da periodização, como o canvas escreve. */
export const phaseLabel: Record<'adaptation' | 'accumulation' | 'intensification' | 'deload', string> = {
  adaptation: 'Adaptação',
  accumulation: 'Acumulação',
  intensification: 'Intensificação',
  deload: 'Deload',
}
