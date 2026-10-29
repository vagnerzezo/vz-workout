import { formatInt, planVsTarget, type Macros } from '@workspace/core'
import { cn } from '@workspace/ui/lib/utils'

const barColor = { kcal: 'bg-primary', protein: 'bg-protein', carbs: 'bg-carb', fat: 'bg-fat' } as const
const sign = (n: number) => (n > 0 ? `+${formatInt(n)}` : n < 0 ? `−${formatInt(-n)}` : '±0')

/** "Plano × meta": o que as refeições somam contra as metas (até 5% conta como dentro). */
export function ComparePanel({ plan, target }: { plan: Macros; target: Macros }) {
  const { rows, off } = planVsTarget(plan, target)
  return (
    <section aria-labelledby="plano-meta" className="flex flex-col gap-3 rounded-[20px] border bg-card p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="plano-meta" className="text-[15px] font-extrabold">
          Plano × meta
        </h2>
        <span role="status" className={cn('text-xs font-bold', off === 0 ? 'text-primary' : 'text-warning')}>
          {off === 0 ? 'Dentro da meta' : off === 1 ? '1 item fora da meta' : `${off} itens fora da meta`}
        </span>
      </div>
      <ul className="flex flex-col gap-2.5">
        {rows.map((r) => {
          const unit = r.key === 'kcal' ? ' kcal' : ' g'
          return (
            <li key={r.key} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-2 text-[13px]">
                <span className="text-foreground-2">{r.label}</span>
                <span>
                  <strong>
                    {formatInt(r.plan)}
                    {unit}
                  </strong>
                  <span className="text-muted-foreground">
                    {' '}
                    / {formatInt(r.target)}
                    {unit}
                  </span>{' '}
                  <strong className={r.within ? 'text-primary' : 'text-warning'}>{sign(r.diff)}</strong>
                </span>
              </div>
              <span aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-secondary">
                <span className={cn('block h-full rounded-full', barColor[r.key])} style={{ width: `${Math.min((r.plan / (r.target || 1)) * 100, 100).toFixed(1)}%` }} />
              </span>
            </li>
          )
        })}
      </ul>
      <span className="text-[11px] text-muted-foreground">Diferença de até 5% conta como dentro da meta</span>
    </section>
  )
}
