import type { WeeklyActivity } from '../schemas/home'
import { formatDuration, formatInt } from '../format/numbers'

export type ActivityMetric = 'duration' | 'volume' | 'reps'

const valueOf: Record<ActivityMetric, (w: WeeklyActivity) => number> = {
  duration: (w) => w.durationMin,
  volume: (w) => w.volumeKg,
  reps: (w) => w.reps,
}

// Médias arredondadas para não passar falsa precisão: volume em centenas, repetições em dezenas.
const roundAverage: Record<ActivityMetric, (n: number) => number> = {
  duration: (n) => Math.round(n),
  volume: (n) => Math.round(n / 100) * 100,
  reps: (n) => Math.round(n / 10) * 10,
}

const formatValue: Record<ActivityMetric, (n: number) => string> = {
  duration: formatDuration,
  volume: (n) => `${formatInt(n)} kg`,
  reps: (n) => `${formatInt(n)} reps`,
}

export type ActivitySummary = {
  values: number[]
  headline: string
  caption: string
}

/**
 * Resumo do card "Atividade" da Home. A última semana é a atual (ainda em andamento);
 * a média usa só as semanas anteriores, que estão completas.
 */
export function activitySummary(weeks: WeeklyActivity[], metric: ActivityMetric): ActivitySummary {
  const values = weeks.map(valueOf[metric])
  const current = values.at(-1) ?? 0
  const previous = values.slice(0, -1)
  const average = previous.length ? previous.reduce((a, b) => a + b, 0) / previous.length : null
  const avgText = average === null ? null : formatValue[metric](roundAverage[metric](average))

  const headline = formatValue[metric](current)
  const caption =
    metric === 'reps'
      ? `nesta semana${avgText ? ` · média de ${avgText}` : ''}`
      : `${metric === 'duration' ? 'de treino' : 'de volume'} nesta semana${avgText ? ` · média de ${avgText}` : ''}`

  return { values, headline, caption }
}
