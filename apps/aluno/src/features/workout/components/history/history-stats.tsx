import type { HistoryStats as Stats } from '@workspace/core'
import { formatDuration, formatTons, monthName, relativeDay, shiftMonth } from '@workspace/core'
import { cn } from '@workspace/ui/lib/utils'

type HistoryStatsProps = {
  stats: Stats
  month: string
  weeklyGoal: number
  today: Date
}

export function HistoryStats({ stats, month, weeklyGoal, today }: HistoryStatsProps) {
  const change = stats.volumeChangePct
  const tiles = [
    { label: 'Treinos no mês', value: String(stats.count), note: `meta ${weeklyGoal} por semana` },
    {
      label: 'Tempo treinando',
      value: formatDuration(stats.totalMinutes),
      note: stats.averageMinutes === null ? 'nenhum treino' : `média de ${Math.round(stats.averageMinutes)} min`,
    },
    {
      label: 'Volume levantado',
      value: formatTons(stats.volumeKg),
      note: change === null ? 'primeiro mês com treinos' : `${change >= 0 ? '+' : '−'}${Math.abs(change)}% vs ${monthName(shiftMonth(month, -1))}`,
      className: 'text-primary',
    },
    {
      label: 'Recordes',
      value: String(stats.records),
      note: stats.lastRecordDate ? `último ${relativeDay(stats.lastRecordDate, today)}` : 'nenhum neste mês',
      className: 'text-warning',
    },
  ]

  return (
    <dl className="grid grid-cols-2 gap-2">
      {tiles.map((t) => (
        <div key={t.label} className="flex flex-col gap-0.5 rounded-2xl border bg-card px-3.5 py-3">
          <dt className="text-xs text-muted-foreground">{t.label}</dt>
          <dd className={cn('text-xl font-extrabold', t.className)}>{t.value}</dd>
          <dd className="text-[11.5px] text-muted-foreground">{t.note}</dd>
        </div>
      ))}
    </dl>
  )
}
