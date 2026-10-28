import { adherenceSummary, formatSigned, weekLabel, type CoachDashboard } from '@workspace/core'
import { cn } from '@workspace/ui/lib/utils'
import { panelClass } from './panel'

/** Adesão por semana em barras, com a linha da meta. A semana atual fica na cor da marca. */
export function AdherenceChart({ weeks, goal }: { weeks: CoachDashboard['adherence']; goal: number }) {
  const { current, deltaPts } = adherenceSummary(weeks)
  const summary = weeks.map((w) => `${weekLabel(w.weekStart)}: ${Math.round(w.pct)}%`).join(', ')

  return (
    <section aria-labelledby="adesao-titulo" className={cn(panelClass, 'gap-3 lg:gap-4')}>
      <div className="flex items-end justify-between gap-2 lg:flex-wrap lg:gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 id="adesao-titulo" className="text-[15px] font-extrabold lg:text-lg">
            Adesão aos treinos
          </h2>
          <span className="text-xs text-muted-foreground lg:text-[13px]">
            <span className="hidden lg:inline">Treinos feitos ÷ treinos previstos, todos os alunos ativos</span>
            <span className="lg:hidden">Feitos ÷ previstos, por semana</span>
          </span>
        </div>
        <div className="flex flex-col items-end lg:flex-row lg:items-baseline lg:gap-2">
          <span className="text-[22px] font-extrabold lg:text-[28px]">{current}%</span>
          <span className={cn('text-[11.5px] font-bold lg:text-[13px]', deltaPts < 0 ? 'text-warning' : 'text-primary')}>
            {formatSigned(deltaPts)} pts<span className="hidden lg:inline"> na semana</span>
          </span>
        </div>
      </div>

      {/* Barras: altura em % da área útil; a régua da meta usa a mesma escala */}
      <figure role="img" aria-label={`Adesão por semana, meta de ${goal}%. ${summary}`} className="relative flex h-35 items-end gap-1.5 lg:h-45 lg:gap-3 lg:pt-2">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 bottom-5.5 lg:top-7.5">
          <div className="absolute inset-x-0 border-t border-dashed border-[#5a606a]" style={{ bottom: `${goal}%` }} />
          <span className="absolute right-0 mb-1 text-[10.5px] text-muted-foreground lg:text-[11px]" style={{ bottom: `${goal}%` }}>
            meta {goal}%
          </span>
        </div>
        {weeks.map((w, i) => {
          const last = i === weeks.length - 1
          return (
            <div key={w.weekStart} aria-hidden="true" className="flex h-full flex-1 flex-col items-center justify-end gap-1.25 lg:gap-1.5">
              <span className={cn('hidden text-xs font-bold lg:block', last ? 'text-foreground' : 'text-muted-foreground')}>{Math.round(w.pct)}%</span>
              <div className="flex w-full grow items-end justify-center">
                <div className={cn('w-full rounded-md lg:max-w-14 lg:rounded-lg', last ? 'bg-primary' : 'bg-input')} style={{ height: `${w.pct}%` }} />
              </div>
              <span className={cn('text-[10.5px] lg:text-xs', last ? 'text-foreground lg:text-muted-foreground' : 'text-muted-foreground')}>{weekLabel(w.weekStart)}</span>
            </div>
          )
        })}
      </figure>
    </section>
  )
}
