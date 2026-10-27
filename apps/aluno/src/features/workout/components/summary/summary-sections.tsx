import { Trophy } from 'lucide-react'
import { effortLabel, formatKg, recordKindLabel } from '@workspace/core'
import { cn } from '@workspace/ui/lib/utils'
import { SurfaceCard, SurfaceCardTitle } from '../../../../shared/components/surface-card'
import type { MuscleSets, SummaryRecord } from '../../hooks/use-session-summary'

export function StatTiles({ items }: { items: { label: string; value: string; highlight?: boolean }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-2.5">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-0.5 rounded-[18px] border bg-card px-4 py-3.5">
          <dt className="text-xs text-muted-foreground">{item.label}</dt>
          <dd className={cn('text-2xl font-extrabold', item.highlight && 'text-warning')}>{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

const setText = (s: { kg: number; reps: number }) => `${formatKg(s.kg)} kg × ${s.reps}`

export function RecordsCard({ records }: { records: SummaryRecord[] }) {
  return (
    <SurfaceCard role="region" aria-labelledby="recordes" className="gap-3 py-4">
      <SurfaceCardTitle id="recordes">Recordes pessoais</SurfaceCardTitle>
      <ul className="flex flex-col gap-3">
        {records.map((r) => (
          <li key={r.exerciseName} className="flex items-center gap-3">
            <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-warning/16 text-warning">
              <Trophy className="size-5" strokeWidth={2} />
            </span>
            <div className="flex grow flex-col gap-px">
              <span className="text-sm font-extrabold">{r.exerciseName}</span>
              <span className="text-[13px] text-muted-foreground">
                {recordKindLabel[r.kind]}
                {r.before ? ` · antes ${setText(r.before)}` : ' · primeira vez'}
              </span>
            </div>
            <span className="text-[15px] font-extrabold">{setText(r.now)}</span>
          </li>
        ))}
      </ul>
    </SurfaceCard>
  )
}

export function MuscleSetsCard({ muscles }: { muscles: MuscleSets[] }) {
  const max = Math.max(1, ...muscles.map((m) => m.sets))
  return (
    <SurfaceCard role="region" aria-labelledby="series-por-musculo" className="gap-3 py-4">
      <div className="flex items-baseline justify-between">
        <SurfaceCardTitle id="series-por-musculo">Séries válidas por músculo</SurfaceCardTitle>
        <span className="text-xs text-muted-foreground">neste treino</span>
      </div>
      {muscles.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma série válida concluída.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {muscles.map((m) => (
            <li key={m.muscle} className="grid grid-cols-[112px_minmax(0,1fr)_32px] items-center gap-2.5">
              <span className="text-[13px] text-foreground-2">{m.label}</span>
              <span aria-hidden="true" className="block h-2.5 overflow-hidden rounded-full bg-secondary">
                <span className="block h-2.5 rounded-full bg-primary" style={{ width: `${Math.round((m.sets / max) * 100)}%` }} />
              </span>
              <span className="text-right text-sm font-extrabold">{formatKg(m.sets)}</span>
            </li>
          ))}
        </ul>
      )}
    </SurfaceCard>
  )
}

export function EffortScale({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  return (
    <section aria-labelledby="esforco" className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between">
        <h2 id="esforco" className="text-[15px] font-bold">
          Como foi o esforço?
        </h2>
        {value && (
          <span className="text-[13px] font-bold text-primary">
            {value} · {effortLabel[value]}
          </span>
        )}
      </div>
      <div className="grid grid-cols-10 gap-1">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const on = value === n
          return (
            <button
              key={n}
              type="button"
              aria-pressed={on}
              aria-label={`Esforço ${n} de 10: ${effortLabel[n]}`}
              onClick={() => onChange(on ? null : n)}
              className={cn(
                'h-11 rounded-[10px] border text-sm font-extrabold outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                on ? 'border-primary bg-primary text-primary-foreground' : 'bg-card text-foreground-2 hover:bg-accent',
              )}
            >
              {n}
            </button>
          )
        })}
      </div>
      <div aria-hidden="true" className="flex justify-between text-xs text-muted-foreground">
        <span>Muito leve</span>
        <span>Máximo</span>
      </div>
    </section>
  )
}
