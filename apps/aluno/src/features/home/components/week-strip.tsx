import type { WeekDay } from '@workspace/core'
import { parseIsoDate, weekdayLetter, weekdayName } from '@workspace/core'
import { cn } from '@workspace/ui/lib/utils'

type WeekStripProps = {
  week: WeekDay[]
  todayIso: string
  selectedIso: string
  onSelect: (iso: string) => void
}

export function WeekStrip({ week, todayIso, selectedIso, onSelect }: WeekStripProps) {
  return (
    <nav aria-label="Dias da semana" className="grid grid-cols-7 gap-1.5">
      {week.map((day) => {
        const date = parseIsoDate(day.date)
        const selected = day.date === selectedIso
        const isToday = day.date === todayIso
        const future = day.date > todayIso
        return (
          <button
            key={day.date}
            type="button"
            onClick={() => onSelect(day.date)}
            aria-pressed={selected}
            aria-label={`${weekdayName(date)}, ${date.getDate()}${isToday ? ', hoje' : ''}${day.trained ? ', treino feito' : ''}`}
            className={cn(
              'flex h-17 flex-col items-center justify-center gap-1 rounded-2xl border outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
              selected
                ? 'border-primary bg-primary text-primary-foreground'
                : cn('bg-transparent', isToday ? 'border-line-strong' : 'border-transparent', future ? 'text-muted-foreground' : 'text-foreground'),
            )}
          >
            <span aria-hidden="true" className="text-xs font-semibold opacity-85">
              {weekdayLetter(date)}
            </span>
            <span aria-hidden="true" className="text-lg font-extrabold">
              {date.getDate()}
            </span>
            <span
              aria-hidden="true"
              className={cn(
                'size-1.25 rounded-full',
                day.trained ? (selected ? 'bg-primary-foreground' : 'bg-primary') : 'bg-transparent',
              )}
            />
          </button>
        )
      })}
    </nav>
  )
}
