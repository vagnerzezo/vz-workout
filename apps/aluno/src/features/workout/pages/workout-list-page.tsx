import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ClipboardList, History } from 'lucide-react'
import { workoutForDate } from '@workspace/core'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { ErrorState } from '../../../shared/components/error-state'
import { useCurrentPlan } from '../api/queries'
import { CurrentPlanCard } from '../components/current-plan-card'
import { WorkoutDayCard } from '../components/workout-day-card'

export default function WorkoutListPage() {
  const { data, isError, isFetching, refetch } = useCurrentPlan()
  const [today] = useState(() => new Date())
  const exercises = useMemo(() => new Map(data?.exercises.map((e) => [e.id, e])), [data])

  return (
    <main className="flex flex-col gap-4.5 px-5 pt-[max(24px,env(safe-area-inset-top))] pb-[calc(120px+env(safe-area-inset-bottom))]">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-[30px] font-extrabold tracking-[-0.6px]">Treinos</h1>
        <Link
          to="/treinos/historico"
          aria-label="Histórico de treinos"
          className="flex size-11 items-center justify-center rounded-full border bg-card outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <History aria-hidden="true" className="size-5" strokeWidth={1.8} />
        </Link>
      </header>

      {isError ? (
        <ErrorState title="Não foi possível carregar seus treinos" onRetry={() => refetch()} retrying={isFetching} />
      ) : !data ? (
        <WorkoutListSkeleton />
      ) : !data.plan ? (
        <NoPlan />
      ) : (
        <>
          <CurrentPlanCard plan={data.plan} today={today} />
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-muted-foreground">Treinos da ficha ({data.plan.days.length})</h2>
            <p className="text-[13px] text-muted-foreground">
              {data.doneThisWeek.length} de {data.plan.days.length} feitos na semana
            </p>
          </div>
          {data.plan.days.map((day) => (
            <WorkoutDayCard
              key={day.id}
              day={day}
              exercises={exercises}
              isToday={workoutForDate(data.plan!.days, today)?.id === day.id}
              done={data.doneThisWeek.includes(day.id)}
            />
          ))}
        </>
      )}
    </main>
  )
}

function WorkoutListSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando seus treinos" className="flex flex-col gap-4.5">
      <Skeleton className="h-36 rounded-[20px]" />
      <Skeleton className="h-5 w-full" />
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton key={i} className="h-60 rounded-[20px]" />
      ))}
    </div>
  )
}

function NoPlan() {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
        <ClipboardList aria-hidden="true" className="size-6" />
      </span>
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-extrabold">Sua ficha ainda não chegou</h2>
        <p className="text-sm text-muted-foreground">Assim que seu treinador montar seus treinos, eles aparecem aqui.</p>
      </div>
    </div>
  )
}
