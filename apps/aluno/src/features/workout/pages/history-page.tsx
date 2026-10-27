import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ChevronLeft, History } from 'lucide-react'
import {
  historyStats,
  sessionsThisWeek,
  shiftMonth,
  toIsoDate,
  YearMonth,
  yearMonthOf,
} from '@workspace/core'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { cn } from '@workspace/ui/lib/utils'
import { ErrorState } from '../../../shared/components/error-state'
import { useMonthHistory } from '../api/history'
import { useCurrentPlan } from '../api/queries'
import { HistoryCalendar } from '../components/history/history-calendar'
import { HistorySessionCard } from '../components/history/history-session-card'
import { HistoryStats } from '../components/history/history-stats'

/**
 * Estado na URL (seção 7 do guia): ?mes=2026-10 · ?treino=day_a · ?dia=2026-10-20.
 * Recarregar mantém tudo e dá para abrir um treino por link (`?dia=` vindo de outra tela).
 */
export default function HistoryPage() {
  const [params, setParams] = useSearchParams()
  const [today] = useState(() => new Date())
  const todayIso = toIsoDate(today)
  const currentMonth = yearMonthOf(today)

  const day = params.get('dia')
  const monthParam = YearMonth.safeParse(params.get('mes') ?? day?.slice(0, 7))
  const month = monthParam.success && monthParam.data <= currentMonth ? monthParam.data : currentMonth
  const filter = params.get('treino')

  const history = useMonthHistory(month)
  const plan = useCurrentPlan()

  const update = (patch: Record<string, string | null>) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [k, v] of Object.entries(patch)) {
          if (v === null) next.delete(k)
          else next.set(k, v)
        }
        return next
      },
      { replace: true, preventScrollReset: true },
    )

  const data = history.data // ao trocar de mês, é o anterior (esmaecido) até o novo chegar
  const sessions = data?.sessions ?? []
  const visible = filter ? sessions.filter((s) => s.dayId === filter) : sessions
  const stats = historyStats(sessions, data?.previousMonthVolumeKg ?? null)
  const days = plan.data?.plan?.days ?? []

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col gap-4 px-5 pt-[max(24px,env(safe-area-inset-top))] pb-[max(40px,env(safe-area-inset-bottom))]">
      <header className="flex items-center gap-2.5">
        <Link
          to="/treinos"
          aria-label="Voltar para treinos"
          className="flex size-11 shrink-0 items-center justify-center rounded-full border bg-card outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ChevronLeft aria-hidden="true" className="size-5" strokeWidth={2} />
        </Link>
        <h1 className="grow text-2xl font-extrabold tracking-[-0.4px]">Histórico</h1>
      </header>

      {history.isError && !data ? (
        <ErrorState title="Não foi possível carregar o histórico" onRetry={() => history.refetch()} retrying={history.isFetching} />
      ) : !data ? (
        <HistorySkeleton />
      ) : (
        <div className={cn('flex flex-col gap-4', history.isPlaceholderData && 'opacity-60')} aria-busy={history.isPlaceholderData}>
          <HistoryStats stats={stats} month={month} weeklyGoal={data.weeklyGoal} today={today} />

          <HistoryCalendar
            month={month}
            sessions={sessions}
            todayIso={todayIso}
            selectedDate={day}
            canGoBack={month > data.firstMonth}
            canGoForward={month < currentMonth}
            weekText={month === currentMonth ? `Esta semana: ${sessionsThisWeek(sessions, today)} de ${data.weeklyGoal} treinos` : null}
            onMonthChange={(delta) => update({ mes: shiftMonth(month, delta), dia: null })}
            onSelectDate={(date) => update({ dia: date === day ? null : date, mes: month, treino: null })}
          />

          {days.length > 0 && (
            <div role="group" aria-label="Filtrar por treino" className="-mx-5 flex gap-1.5 overflow-x-auto px-5">
              {[{ id: null, label: 'Todos' }, ...days.map((d) => ({ id: d.id, label: `${d.letter} · ${d.name}` }))].map((f) => {
                const on = filter === f.id
                return (
                  <button
                    key={f.label}
                    type="button"
                    aria-pressed={on}
                    onClick={() => update({ treino: f.id })}
                    className={cn(
                      'h-9 shrink-0 rounded-full border px-3.5 text-[12.5px] font-bold whitespace-nowrap outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                      on ? 'border-primary bg-primary/15 text-primary' : 'border-input text-foreground-2 hover:bg-accent',
                    )}
                  >
                    {f.label}
                  </button>
                )
              })}
            </div>
          )}

          <section aria-label="Treinos feitos" className="flex flex-col gap-2">
            {visible.length === 0 ? (
              <EmptyMonth filtered={!!filter && sessions.length > 0} />
            ) : (
              visible.map((s) => (
                <HistorySessionCard
                  key={s.id}
                  session={s}
                  open={s.date === day}
                  onToggle={() => update({ dia: s.date === day ? null : s.date, mes: month })}
                />
              ))
            )}
          </section>
        </div>
      )}
    </main>
  )
}

function EmptyMonth({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[18px] border border-dashed border-line-strong px-6 py-10 text-center">
      <History aria-hidden="true" className="size-6 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        {filtered ? 'Este treino não foi feito neste mês.' : 'Nenhum treino registrado neste mês.'}
      </p>
    </div>
  )
}

function HistorySkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando o histórico" className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-21 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-[20px]" />
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton key={i} className="h-17 rounded-[18px]" />
      ))}
    </div>
  )
}
