import { effortTone, formatDuration, formatInt, parseIsoDate, shortDate, type CoachWorkout } from '@workspace/core'
import { cn } from '@workspace/ui/lib/utils'

export const effortClass = { easy: 'text-primary', hard: 'text-warning', max: 'text-destructive' } as const

export const workoutDate = (w: CoachWorkout) => shortDate(parseIsoDate(w.date))
export const workoutVolume = (w: CoachWorkout) => `${formatInt(Math.round(w.volumeKg))} kg`
export const recordsLabel = (n: number) => (n === 0 ? '—' : n === 1 ? '1 novo' : `${n} novos`)

/** "1 recorde" em amarelo, quando houver. */
export function RecordsBadge({ count, className }: { count: number; className?: string }) {
  if (count === 0) return null
  return (
    <span className={cn('flex h-6 shrink-0 items-center rounded-full bg-warning/16 px-2 text-[11px] font-extrabold text-warning', className)}>
      {count === 1 ? '1 recorde' : `${count} recordes`}
    </span>
  )
}

export function Effort({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground">—</span>
  return <span className={cn('font-extrabold', effortClass[effortTone(value)])}>{value}/10</span>
}

export const workoutLine = (w: CoachWorkout) => `${workoutDate(w)} · ${formatDuration(w.durationMin)} · ${workoutVolume(w)}`
