import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { HistorySession } from '@workspace/core'
import { monthGrid, monthLabel, parseIsoDate } from '@workspace/core'
import { cn } from '@workspace/ui/lib/utils'

type HistoryCalendarProps = {
  month: string
  sessions: HistorySession[]
  todayIso: string
  selectedDate: string | null
  canGoBack: boolean
  canGoForward: boolean
  weekText: string | null
  onMonthChange: (delta: number) => void
  onSelectDate: (date: string) => void
}

const navButton =
  'flex size-10 items-center justify-center rounded-full bg-secondary outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 disabled:text-line-strong disabled:hover:bg-secondary'

export function HistoryCalendar(props: HistoryCalendarProps) {
  const { month, sessions, todayIso, selectedDate, canGoBack, canGoForward, weekText, onMonthChange, onSelectDate } = props
  const label = monthLabel(month)
  const byDate = new Map<string, HistorySession[]>()
  for (const s of sessions) byDate.set(s.date, [...(byDate.get(s.date) ?? []), s])

  return (
    <section aria-labelledby="mes-atual" className="flex flex-col gap-2.5 rounded-[20px] border bg-card p-3.5">
      <div className="flex items-center justify-between">
        <button type="button" aria-label="Mês anterior" className={navButton} disabled={!canGoBack} onClick={() => onMonthChange(-1)}>
          <ChevronLeft aria-hidden="true" className="size-4" strokeWidth={2.4} />
        </button>
        <h2 id="mes-atual" aria-live="polite" className="text-[15px] font-extrabold">
          {label}
        </h2>
        <button type="button" aria-label="Próximo mês" className={navButton} disabled={!canGoForward} onClick={() => onMonthChange(1)}>
          <ChevronRight aria-hidden="true" className="size-4" strokeWidth={2.4} />
        </button>
      </div>

      <div aria-hidden="true" className="grid grid-cols-7 gap-1 text-center text-[11px] font-extrabold text-muted-foreground">
        {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {monthGrid(month).map((date, i) => {
          if (!date) return <span key={`vazio-${i}`} aria-hidden="true" />
          const day = parseIsoDate(date).getDate()
          const daySessions = byDate.get(date)
          const isToday = date === todayIso
          const cell = cn('flex h-10.5 flex-col items-center justify-center rounded-xl', isToday && 'border-[1.5px] border-foreground')

          // Só dias com treino são botões: os outros não fazem nada ao toque
          if (!daySessions) {
            return (
              <span key={date} className={cn(cell, date > todayIso ? 'text-line-strong' : 'text-muted-foreground')}>
                <span className="text-[12.5px] font-bold">{day}</span>
                <span aria-hidden="true" className="h-2.75" />
              </span>
            )
          }
          const selected = date === selectedDate
          const names = daySessions.map((s) => `Treino ${s.letter} — ${s.name}`).join(' e ')
          return (
            <button
              key={date}
              type="button"
              aria-pressed={selected}
              aria-label={`${day} de ${label.split(' ')[0]!.toLowerCase()}${isToday ? ', hoje' : ''}, ${names}`}
              onClick={() => onSelectDate(date)}
              className={cn(
                cell,
                'outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                selected ? 'bg-primary text-primary-foreground' : 'bg-primary/15 text-primary hover:bg-primary/25',
              )}
            >
              <span className="text-[12.5px] font-bold">{day}</span>
              <span aria-hidden="true" className="h-2.75 text-[9.5px] leading-none font-extrabold">
                {daySessions.map((s) => s.letter).join('')}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-3 text-[11.5px] text-muted-foreground">
        <span className="flex items-center gap-1.25">
          <span aria-hidden="true" className="size-2.5 rounded-[3px] bg-primary" />
          Treinou
        </span>
        <span className="flex items-center gap-1.25">
          <span aria-hidden="true" className="size-2.5 rounded-[3px] border-[1.5px] border-foreground" />
          Hoje
        </span>
        {weekText && <span>{weekText}</span>}
      </div>
    </section>
  )
}
