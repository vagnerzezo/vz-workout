import { Link } from 'react-router'
import type { HomeSummary } from '@workspace/core'
import { formatInt } from '@workspace/core'
import { RingProgress } from '@workspace/ui/blocks/ring-progress'
import { SurfaceCard, SurfaceCardTitle } from '../../../shared/components/surface-card'

type Nutrition = HomeSummary['nutrition']

const macros = [
  { key: 'protein', short: 'PROT', name: 'Proteína', text: 'text-protein', bar: 'bg-protein' },
  { key: 'carbs', short: 'CARB', name: 'Carboidrato', text: 'text-carb', bar: 'bg-carb' },
  { key: 'fat', short: 'GORD', name: 'Gordura', text: 'text-fat', bar: 'bg-fat' },
] as const

export function NutritionCard({ nutrition }: { nutrition: Nutrition }) {
  const { kcal } = nutrition
  return (
    <SurfaceCard role="region" aria-labelledby="nutricao-de-hoje" className="gap-4">
      <div className="flex items-center justify-between">
        <SurfaceCardTitle id="nutricao-de-hoje">Nutrição de hoje</SurfaceCardTitle>
        <Link to="/dieta" className="text-[13px] font-bold text-primary hover:underline">
          Ver dieta
        </Link>
      </div>
      <div className="flex items-center gap-4.5">
        <RingProgress
          value={kcal.consumed / kcal.goal}
          label={`${formatInt(kcal.consumed)} de ${formatInt(kcal.goal)} kcal consumidas`}
        >
          <span className="text-xl leading-none font-extrabold">{formatInt(kcal.consumed)}</span>
          <span className="text-[11px] text-muted-foreground">/ {formatInt(kcal.goal)} kcal</span>
        </RingProgress>
        <ul className="grid grow grid-cols-3 gap-2.5">
          {macros.map((m) => {
            const { consumed, goal } = nutrition[m.key]
            const pct = Math.min(Math.round((consumed / goal) * 100), 100)
            return (
              <li key={m.key} className="flex flex-col gap-1">
                <span className={`text-lg font-extrabold ${m.text}`}>{formatInt(consumed)}g</span>
                <span className="text-[11px] text-muted-foreground">de {formatInt(goal)} g</span>
                <span aria-hidden="true" className="block h-1 overflow-hidden rounded-full bg-border">
                  <span className={`block h-1 ${m.bar}`} style={{ width: `${pct}%` }} />
                </span>
                <span className="text-[11px] font-bold tracking-[0.8px] text-muted-foreground">
                  <abbr title={m.name} className="no-underline">
                    {m.short}
                  </abbr>
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </SurfaceCard>
  )
}
