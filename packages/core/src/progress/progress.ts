import { addWeeks, getISOWeek, startOfISOWeek, subDays } from 'date-fns'
import { toIsoDate } from '../format/date'
import type { WeightEntry } from '../schemas/home'
import type { LiftSet, Measurement } from '../schemas/progress'
import { estimatedOneRepMax } from '../workout/session'

/** Pesagens dos últimos `days` dias (hoje incluso), em ordem de data. */
export function weightWindow(entries: WeightEntry[], days: number, today: Date): WeightEntry[] {
  const from = toIsoDate(subDays(today, days - 1))
  return entries.filter((e) => e.date >= from).sort((a, b) => a.date.localeCompare(b.date))
}

/** Faixa do eixo Y do gráfico: cobre os pesos e a meta, com folga de 0,5 kg em cada ponta. */
export function weightDomain(values: number[], goalKg: number | null): [number, number] {
  const all = goalKg === null ? values : [...values, goalKg]
  return [Math.min(...all) - 0.5, Math.max(...all) + 0.5]
}

type Box = { width: number; height: number; padX: number; padY: number; min: number; max: number }

/** Y em pixels para um valor (maior fica em cima). */
export const chartY = (value: number, box: Box) =>
  box.padY + ((box.max - value) / (box.max - box.min || 1)) * (box.height - 2 * box.padY)

/** Pontos do gráfico de linha, espalhados por igual na largura. Um ponto só fica no meio. */
export function linePoints(values: number[], box: Box): { x: number; y: number }[] {
  const span = box.width - 2 * box.padX
  return values.map((v, i) => ({
    x: values.length === 1 ? box.width / 2 : box.padX + (i * span) / (values.length - 1),
    y: chartY(v, box),
  }))
}

export type WeekLoad = { weekStart: string; label: string; set: LiftSet | null }

/**
 * Melhor série (maior 1RM estimado) de cada uma das últimas `weeks` semanas, terminando na semana de hoje.
 * Semana sem treino do exercício vem com `set: null`. Rótulo "S42" = semana ISO.
 */
export function weeklyBestLoads(sets: LiftSet[], weeks: number, today: Date): WeekLoad[] {
  const current = startOfISOWeek(today)
  return Array.from({ length: weeks }, (_, i) => {
    const start = addWeeks(current, i - weeks + 1)
    const from = toIsoDate(start)
    const to = toIsoDate(addWeeks(start, 1))
    const inWeek = sets.filter((s) => s.date >= from && s.date < to)
    const set = inWeek.reduce<LiftSet | null>(
      (best, s) => (!best || estimatedOneRepMax(s.kg, s.reps) > estimatedOneRepMax(best.kg, best.reps) ? s : best),
      null,
    )
    return { weekStart: from, label: `S${getISOWeek(start)}`, set }
  })
}

/** Ganho de carga no período: última semana com treino menos a primeira. null com menos de duas semanas. */
export function loadGain(weeks: WeekLoad[]): number | null {
  const done = weeks.filter((w) => w.set)
  if (done.length < 2) return null
  return done.at(-1)!.set!.kg - done[0]!.set!.kg
}

export const measurementLabels: Record<Exclude<keyof Measurement, 'date'>, string> = {
  waist: 'Cintura',
  hips: 'Quadril',
  chest: 'Peito',
  arm: 'Braço (contraído)',
  thigh: 'Coxa',
}

export type MeasurementRow = { key: keyof typeof measurementLabels; label: string; before: number; after: number; diff: number }

/** Linhas da tabela "antes → agora", com a diferença arredondada a 0,1 cm. */
export function measurementRows(before: Measurement, after: Measurement): MeasurementRow[] {
  return (Object.keys(measurementLabels) as (keyof typeof measurementLabels)[]).map((key) => ({
    key,
    label: measurementLabels[key],
    before: before[key],
    after: after[key],
    diff: Math.round((after[key] - before[key]) * 10) / 10,
  }))
}

