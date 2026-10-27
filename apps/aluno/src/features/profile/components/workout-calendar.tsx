import { Link } from 'react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { monthGrid, monthName, parseIsoDate, shiftMonth } from '@workspace/core'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { cn } from '@workspace/ui/lib/utils'
import { useMonthHistory } from '../../workout/api/history'

const navButton =
  'flex size-9 items-center justify-center rounded-full border border-line-strong outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 disabled:border-border disabled:text-line-strong disabled:hover:bg-transparent'

type WorkoutCalendarProps = {
  month: string
  currentMonth: string
  todayIso: string
  onMonthChange: (month: string) => void
}

/** Mês com os dias treinados; tocar num dia abre o treino no histórico. */
export function WorkoutCalendar({ month, currentMonth, todayIso, onMonthChange }: WorkoutCalendarProps) {
  const history = useMonthHistory(month)
  const sessions = history.data?.month === month ? history.data.sessions : []
  const trained = new Set(sessions.map((s) => s.date))
  const name = monthName(month)
  const count = trained.size

  return (
    <section aria-labelledby="calendario" className="flex flex-col gap-3.5 rounded-[22px] border bg-card p-4.5">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <h2 id="calendario" className="text-[15px] font-bold">
            Calendário de treinos
          </h2>
          <p aria-live="polite" className="text-xs text-muted-foreground">
            {!history.data ? 'Carregando…' : `${count === 0 ? 'Nenhum treino' : count === 1 ? '1 treino' : `${count} treinos`} em ${name}`}
          </p>
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            aria-label="Mês anterior"
            className={navButton}
            disabled={!history.data || month <= history.data.firstMonth}
            onClick={() => onMonthChange(shiftMonth(month, -1))}
          >
            <ChevronLeft aria-hidden="true" className="size-4" strokeWidth={2.2} />
          </button>
          <button
            type="button"
            aria-label="Próximo mês"
            className={navButton}
            disabled={month >= currentMonth}
            onClick={() => onMonthChange(shiftMonth(month, 1))}
          >
            <ChevronRight aria-hidden="true" className="size-4" strokeWidth={2.2} />
          </button>
        </div>
      </div>

      <div aria-hidden="true" className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-bold text-muted-foreground">
        {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>

      {!history.data ? (
        <Skeleton className="h-60 rounded-2xl" />
      ) : (
        <div className="grid grid-cols-7 gap-1.5">
          {monthGrid(month).map((date, i) => {
            if (!date) return <span key={`vazio-${i}`} aria-hidden="true" />
            const day = parseIsoDate(date).getDate()
            const isToday = date === todayIso
            const cell = cn('flex h-10 items-center justify-center rounded-full text-[13px]', isToday && 'border-2 border-primary font-extrabold')
            if (trained.has(date)) {
              return (
                <Link
                  key={date}
                  to={`/treinos/historico?dia=${date}`}
                  aria-label={`${day} de ${name}${isToday ? ', hoje' : ''}: treinou`}
                  className={cn(cell, 'bg-primary font-extrabold text-primary-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50')}
                >
                  {day}
                </Link>
              )
            }
            return (
              <span
                key={date}
                className={cn(cell, date > todayIso ? 'text-muted-foreground' : 'bg-secondary font-semibold', isToday && 'bg-transparent')}
              >
                {day}
              </span>
            )
          })}
        </div>
      )}

      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2.5 rounded-full bg-primary" />
          Treino feito
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2.5 rounded-full border-2 border-primary" />
          Hoje
        </span>
      </div>
    </section>
  )
}
