import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { CoachDashboard } from '@workspace/core'
import { cn } from '@workspace/ui/lib/utils'
import { panelClass } from './panel'

/** "Mais frequentes" do mês. Só no desktop, como no canvas. */
export function RankingCard({ ranking, now }: { ranking: CoachDashboard['ranking']; now: Date }) {
  if (ranking.length === 0) return null
  return (
    <section aria-labelledby="ranking-titulo" className={cn(panelClass, 'hidden gap-3 lg:flex')}>
      <div className="flex items-baseline justify-between">
        <h2 id="ranking-titulo" className="text-base font-extrabold">
          Mais frequentes
        </h2>
        <span className="text-xs text-muted-foreground">{format(now, 'MMMM', { locale: ptBR })}</span>
      </div>
      <ol className="flex flex-col gap-3">
        {ranking.map((p, i) => (
          <li key={p.studentId} className="flex items-center gap-3">
            <span className={cn('w-6 text-sm font-extrabold', i === 0 ? 'text-primary' : 'text-muted-foreground')}>{i + 1}</span>
            <span className="grow text-sm font-semibold">{p.name}</span>
            <span className="text-[13px] text-muted-foreground">
              <strong className="text-foreground">{p.workouts}</strong> {p.workouts === 1 ? 'treino' : 'treinos'}
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}
