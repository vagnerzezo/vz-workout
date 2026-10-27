import type { StudentDiet } from '@workspace/core'
import { parseIsoDate, weekdayLetter, weekdayName } from '@workspace/core'
import { cn } from '@workspace/ui/lib/utils'

type DietWeekStripProps = {
  week: StudentDiet['week']
  todayIso: string
  selectedIso: string
  onSelect: (iso: string) => void
}

/** Dias da semana com o quanto do plano foi cumprido em cada um. */
export function DietWeekStrip({ week, todayIso, selectedIso, onSelect }: DietWeekStripProps) {
  return (
    <nav aria-label="Dias da semana" className="grid grid-cols-7 gap-1.5">
      {week.map(({ date, percent }) => {
        const d = parseIsoDate(date)
        const selected = date === selectedIso
        const isToday = date === todayIso
        const future = date > todayIso
        const pct = Math.min(percent ?? 0, 100)
        return (
          <button
            key={date}
            type="button"
            aria-pressed={selected}
            aria-label={`${weekdayName(d)}, ${d.getDate()}${isToday ? ', hoje' : ''}${percent === null ? '' : `, ${percent}% do plano`}`}
            onClick={() => onSelect(date)}
            className={cn(
              'flex h-18.5 flex-col items-center justify-center gap-1 rounded-2xl border px-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
              selected
                ? 'border-primary bg-primary text-primary-foreground'
                : cn(isToday ? 'border-line-strong' : 'border-transparent', future ? 'text-muted-foreground' : 'text-foreground'),
            )}
          >
            <span aria-hidden="true" className="text-xs font-semibold opacity-85">
              {weekdayLetter(d)}
            </span>
            <span aria-hidden="true" className="text-lg font-extrabold">
              {d.getDate()}
            </span>
            <span aria-hidden="true" className={cn('block h-1 w-full overflow-hidden rounded-full', selected ? 'bg-primary-foreground/20' : 'bg-border')}>
              <span className={cn('block h-1', selected ? 'bg-primary-foreground' : 'bg-primary')} style={{ width: `${pct}%` }} />
            </span>
          </button>
        )
      })}
    </nav>
  )
}
