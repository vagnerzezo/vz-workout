import { useSearchParams } from 'react-router'
import type { ActivityMetric, WeeklyActivity } from '@workspace/core'
import { activitySummary, parseIsoDate, shortDate } from '@workspace/core'
import { cn } from '@workspace/ui/lib/utils'
import { SurfaceCard } from '../../../shared/components/surface-card'

// Aba na URL (?atividade=volume): recarregar mantém a aba e o voltar funciona
const tabs: { param: string; metric: ActivityMetric; label: string }[] = [
  { param: 'duracao', metric: 'duration', label: 'Duração' },
  { param: 'volume', metric: 'volume', label: 'Volume' },
  { param: 'repeticoes', metric: 'reps', label: 'Repetições' },
]

const CHART_HEIGHT = 118
const MIN_BAR = 6

export function ActivityCard({ weeks }: { weeks: WeeklyActivity[] }) {
  const [params, setParams] = useSearchParams()
  const active = tabs.find((t) => t.param === params.get('atividade')) ?? tabs[0]!

  const pick = (param: string) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (param === tabs[0]!.param) next.delete('atividade')
        else next.set('atividade', param)
        return next
      },
      { replace: true, preventScrollReset: true },
    )

  return (
    <SurfaceCard role="region" aria-label="Atividade" className="gap-3.5">
      <div className="flex gap-2">
        {tabs.map((t) => {
          const on = t.param === active.param
          return (
            <button
              key={t.param}
              type="button"
              aria-pressed={on}
              onClick={() => pick(t.param)}
              className={cn(
                'h-9 rounded-full border px-3.5 text-[13px] font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                on ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-transparent text-foreground hover:bg-accent',
              )}
            >
              {t.label}
            </button>
          )
        })}
      </div>
      {weeks.length === 0 ? (
        <p className="py-6 text-sm text-muted-foreground">Seus números aparecem aqui depois do primeiro treino.</p>
      ) : (
        <ActivityChart weeks={weeks} metric={active.metric} />
      )}
    </SurfaceCard>
  )
}

function ActivityChart({ weeks, metric }: { weeks: WeeklyActivity[]; metric: ActivityMetric }) {
  const { values, headline, caption } = activitySummary(weeks, metric)
  const max = Math.max(...values, 1)
  const labels = weeks.map((w) => shortDate(parseIsoDate(w.weekStart)))
  const description = `${headline} ${caption}. Semanas de ${labels[0]} a ${labels.at(-1)}.`

  return (
    <>
      <div className="flex flex-col gap-0.5" aria-live="polite">
        <span className="text-[28px] font-extrabold tracking-[-0.5px]">{headline}</span>
        <span className="text-[13px] text-muted-foreground">{caption}</span>
      </div>
      <div role="img" aria-label={description} className="flex h-37.5 items-end gap-2">
        {values.map((v, i) => {
          const current = i === values.length - 1
          return (
            <div key={weeks[i]!.weekStart} className="flex h-full grow basis-0 flex-col items-center justify-end gap-1.5">
              <div
                className={cn('w-full rounded-md', current ? 'bg-primary' : 'bg-input')}
                style={{ height: Math.max(Math.round((v / max) * CHART_HEIGHT), MIN_BAR) }}
              />
              <span className={cn('text-[11px]', current ? 'text-foreground' : 'text-muted-foreground')}>{labels[i]}</span>
            </div>
          )
        })}
      </div>
    </>
  )
}
