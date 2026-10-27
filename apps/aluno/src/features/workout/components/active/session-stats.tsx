import { formatClock, formatInt } from '@workspace/core'
import { useNow } from '../../../../shared/hooks/use-now'

type SessionStatsProps = {
  startedAt: string
  volumeKg: number
  doneCount: number
  total: number
}

export function SessionStats({ startedAt, volumeKg, doneCount, total }: SessionStatsProps) {
  const now = useNow()
  const elapsed = (now - new Date(startedAt).getTime()) / 1000
  const pct = total ? Math.round((doneCount / total) * 100) : 0

  return (
    <div className="flex flex-col gap-2.5 border-b border-secondary px-5 pt-3.5 pb-3.5">
      <dl className="grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">Duração</dt>
          <dd className="text-xl font-extrabold text-primary">{formatClock(elapsed)}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">Volume</dt>
          <dd className="text-xl font-extrabold">{formatInt(volumeKg)} kg</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">Séries</dt>
          <dd className="text-xl font-extrabold">
            {doneCount} de {total}
          </dd>
        </div>
      </dl>
      <div
        role="progressbar"
        aria-label="Progresso do treino"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="h-1.5 overflow-hidden rounded-full bg-secondary"
      >
        <div className="h-1.5 rounded-full bg-primary motion-safe:transition-[width]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
