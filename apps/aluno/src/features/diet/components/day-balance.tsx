import type { Macros } from '@workspace/core'
import { formatInt } from '@workspace/core'
import { RingProgress } from '@workspace/ui/blocks/ring-progress'
import { SurfaceCard } from '../../../shared/components/surface-card'

const macros = [
  { key: 'protein', label: 'Proteínas', text: 'text-protein', bar: 'bg-protein' },
  { key: 'carbs', label: 'Carboidratos', text: 'text-carb', bar: 'bg-carb' },
  { key: 'fat', label: 'Gorduras', text: 'text-fat', bar: 'bg-fat' },
] as const

export function DayBalance({ totals, goals, isToday }: { totals: Macros; goals: Macros; isToday: boolean }) {
  const left = Math.max(goals.kcal - totals.kcal, 0)
  return (
    <SurfaceCard role="region" aria-label="Balanço do dia" className="gap-4 rounded-[22px] py-4.5">
      <div className="flex items-center gap-4.5">
        <RingProgress
          value={totals.kcal / goals.kcal}
          size={116}
          strokeWidth={10}
          label={`${formatInt(totals.kcal)} de ${formatInt(goals.kcal)} kcal`}
        >
          <span className="text-2xl leading-none font-extrabold">{formatInt(totals.kcal)}</span>
          <span className="text-[11px] text-muted-foreground">/ {formatInt(goals.kcal)} kcal</span>
        </RingProgress>
        <dl className="flex grow flex-col gap-3">
          {macros.map((m) => {
            const value = totals[m.key]
            const goal = goals[m.key]
            return (
              <div key={m.key} className="flex flex-col gap-1.25">
                <div className="flex items-baseline justify-between">
                  <dt className="text-[13px] text-foreground-2">{m.label}</dt>
                  <dd className="text-[13px] text-muted-foreground">
                    <strong className={`text-[15px] ${m.text}`}>{formatInt(value)}</strong> / {formatInt(goal)} g
                  </dd>
                </div>
                <span aria-hidden="true" className="block h-1.5 overflow-hidden rounded-full bg-border">
                  <span className={`block h-1.5 rounded-full ${m.bar}`} style={{ width: `${Math.min((value / goal) * 100, 100)}%` }} />
                </span>
              </div>
            )
          })}
        </dl>
      </div>
      <p className="border-t pt-3 text-center text-sm text-muted-foreground">
        {left > 0 ? (
          <>
            Faltam <strong className="text-foreground">{formatInt(left)} kcal</strong> no plano {isToday ? 'de hoje' : 'do dia'}
          </>
        ) : (
          <strong className="text-foreground">Meta de calorias do dia cumprida</strong>
        )}
      </p>
    </SurfaceCard>
  )
}
