import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Settings } from 'lucide-react'
import { toIsoDate, YearMonth, yearMonthOf } from '@workspace/core'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { ErrorState } from '../../../shared/components/error-state'
import { useProfile } from '../api/queries'
import { CheckInCard, CoachCard, ProfileCard, ProfileLinks, WeightGoalCard } from '../components/profile-sections'
import { WorkoutCalendar } from '../components/workout-calendar'

const iconButton =
  'flex size-11 items-center justify-center rounded-full border bg-card outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50'

/** Perfil do aluno. O mês do calendário fica na URL (?mes=2026-09). */
export default function ProfilePage() {
  const [params, setParams] = useSearchParams()
  const [today] = useState(() => new Date())
  const currentMonth = yearMonthOf(today)
  const mes = YearMonth.safeParse(params.get('mes'))
  const month = mes.success && mes.data <= currentMonth ? mes.data : currentMonth
  const profile = useProfile()

  const setMonth = (m: string) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (m === currentMonth) next.delete('mes')
        else next.set('mes', m)
        return next
      },
      { replace: true, preventScrollReset: true },
    )

  const p = profile.data
  return (
    <main className="flex flex-col gap-4.5 px-5 pt-[max(24px,env(safe-area-inset-top))] pb-[calc(120px+env(safe-area-inset-bottom))]">
      <header className="flex items-center justify-between">
        <h1 className="text-[30px] font-extrabold tracking-[-0.6px]">Perfil</h1>
        <Link to="/perfil/configuracoes" aria-label="Configurações" className={iconButton}>
          <Settings aria-hidden="true" className="size-5" strokeWidth={1.8} />
        </Link>
      </header>

      {profile.isError ? (
        <ErrorState title="Não foi possível carregar seu perfil" onRetry={() => profile.refetch()} retrying={profile.isFetching} />
      ) : !p ? (
        <ProfileSkeleton />
      ) : (
        <>
          <ProfileCard profile={p} today={today} />
          {p.checkIn && <CheckInCard checkIn={p.checkIn} coachFirstName={p.coach.name.split(' ')[0]!} today={today} />}
          <CoachCard profile={p} />
          {p.weightGoal && <WeightGoalCard goal={p.weightGoal} currentKg={p.currentWeightKg} />}
          <WorkoutCalendar month={month} currentMonth={currentMonth} todayIso={toIsoDate(today)} onMonthChange={setMonth} />
          <ProfileLinks />
        </>
      )}
    </main>
  )
}

function ProfileSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando seu perfil" className="flex flex-col gap-4.5">
      <Skeleton className="h-44 rounded-[22px]" />
      <Skeleton className="h-40 rounded-[22px]" />
      <Skeleton className="h-19 rounded-[20px]" />
      <Skeleton className="h-44 rounded-[22px]" />
    </div>
  )
}
