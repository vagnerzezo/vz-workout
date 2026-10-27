import { Link } from 'react-router'
import { List, Moon, Play } from 'lucide-react'
import type { TodayWorkout } from '@workspace/core'
import { Button } from '@workspace/ui/components/button'
import { SurfaceCard } from '../../../shared/components/surface-card'

export function TodayWorkoutCard({ workout }: { workout: TodayWorkout | null }) {
  if (!workout) return <RestDayCard />

  const details = [
    `${workout.exerciseCount} exercícios`,
    `~${workout.estimatedMinutes} min`,
    workout.muscles.join(', '),
  ].filter(Boolean)

  return (
    <section aria-labelledby="treino-de-hoje" className="flex flex-col gap-4 rounded-3xl bg-primary p-5 text-primary-foreground">
      <div className="flex items-center justify-between">
        <span className="text-xs font-extrabold tracking-[1.4px]">TREINO DE HOJE</span>
        <span className="flex h-6.5 items-center rounded-full bg-primary-foreground/12 px-2.5 text-xs font-bold">
          Treino {workout.position} de {workout.totalInWeek}
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        <h2 id="treino-de-hoje" className="text-[30px] leading-[1.05] font-extrabold tracking-[-0.6px]">
          Treino {workout.letter} — {workout.name}
        </h2>
        <p className="text-sm font-semibold opacity-80">{details.join(' · ')}</p>
      </div>
      <div className="flex gap-2">
        <Link
          to={`/treinos/${workout.dayId}/ativo`}
          className="flex h-13 grow items-center justify-center gap-2 rounded-full bg-primary-foreground text-[15px] font-bold text-primary-inverse-foreground outline-none focus-visible:ring-3 focus-visible:ring-primary-foreground/50"
        >
          <Play aria-hidden="true" className="size-4" fill="currentColor" strokeWidth={0} />
          Começar treino
        </Link>
        <Link
          to="/treinos"
          aria-label="Ver exercícios do treino"
          className="flex size-13 items-center justify-center rounded-full border-[1.5px] border-primary-foreground/35 outline-none focus-visible:ring-3 focus-visible:ring-primary-foreground/50"
        >
          <List aria-hidden="true" className="size-5" strokeWidth={2} />
        </Link>
      </div>
    </section>
  )
}

function RestDayCard() {
  return (
    <SurfaceCard role="region" aria-labelledby="treino-de-hoje" className="gap-4 rounded-3xl p-5">
      <span className="flex items-center gap-2 text-xs font-extrabold tracking-[1.4px] text-muted-foreground">
        <Moon aria-hidden="true" className="size-4" />
        DIA DE DESCANSO
      </span>
      <div className="flex flex-col gap-1.5">
        <h2 id="treino-de-hoje" className="text-[26px] leading-[1.1] font-extrabold tracking-[-0.4px]">
          Hoje não tem treino
        </h2>
        <p className="text-sm text-muted-foreground">Descansar faz parte do plano. Aproveite para cuidar da água e da dieta.</p>
      </div>
      <Button variant="outline" size="lg" nativeButton={false} render={<Link to="/treinos" />}>
        Ver treinos da semana
      </Button>
    </SurfaceCard>
  )
}
