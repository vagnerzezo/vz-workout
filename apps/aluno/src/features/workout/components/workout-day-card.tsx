import { Link } from 'react-router'
import { Check, Play } from 'lucide-react'
import type { Exercise, WorkoutDay } from '@workspace/core'
import { estimateDuration, weekdayLabel } from '@workspace/core'
import { cn } from '@workspace/ui/lib/utils'

type WorkoutDayCardProps = {
  day: WorkoutDay
  exercises: Map<string, Exercise>
  isToday: boolean
  done: boolean
}

export function WorkoutDayCard({ day, exercises, isToday, done }: WorkoutDayCardProps) {
  const title = `Treino ${day.letter} — ${day.name}`
  const titleId = `treino-${day.id}`
  const meta = `${weekdayLabel(day.weekday)} · ${day.exercises.length} exercícios · ~${estimateDuration(day)} min`
  const names = day.exercises.map((p) => exercises.get(p.exerciseId)?.name).filter(Boolean)

  return (
    <article
      aria-labelledby={titleId}
      className={cn(
        'flex flex-col gap-3 rounded-[20px] bg-card px-4.5 py-4',
        isToday ? 'border-2 border-primary' : 'border',
      )}
    >
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 id={titleId} className="text-lg font-extrabold">
            {title}
          </h3>
          {isToday && (
            <span className="flex h-5.5 items-center rounded-full bg-primary px-2 text-[11px] font-extrabold text-primary-foreground">
              HOJE
            </span>
          )}
          {done && (
            <span className="flex h-5.5 items-center gap-1 rounded-full bg-secondary px-2 text-[11px] font-extrabold text-muted-foreground">
              <Check aria-hidden="true" className="size-3" strokeWidth={3} />
              FEITO
            </span>
          )}
        </div>
        <p className="text-[13px] text-muted-foreground">{meta}</p>
      </div>
      <p className="text-sm leading-[1.45] text-foreground-2">{names.join(', ')}</p>
      {day.focus.length > 0 && (
        <ul aria-label="Músculos trabalhados" className="flex flex-wrap gap-1.5">
          {day.focus.map((f) => (
            <li key={f} className="flex h-6.5 items-center rounded-full border border-input px-2.5 text-xs font-semibold text-foreground-2">
              {f}
            </li>
          ))}
        </ul>
      )}
      <Link
        to={`/treinos/${day.id}/ativo`}
        aria-label={`Começar ${title}`}
        className={cn(
          'flex h-12 items-center justify-center gap-2 rounded-full text-[15px] font-extrabold outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
          isToday ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'border border-line-strong text-foreground hover:bg-accent',
        )}
      >
        <Play aria-hidden="true" className="size-3.5" fill="currentColor" strokeWidth={0} />
        Começar treino
      </Link>
    </article>
  )
}
