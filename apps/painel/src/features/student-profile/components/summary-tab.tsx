import { Link } from 'react-router'
import { TriangleAlert } from 'lucide-react'
import { formatDecimal, formatDeltaKg, parseIsoDate, recentWeights, shortDate, weightChange, weightChart, type StudentDetail } from '@workspace/core'
import { buttonVariants } from '@workspace/ui/components/button'
import { cn } from '@workspace/ui/lib/utils'
import { cardClass } from './card'
import { ProfileStats } from './profile-stats'
import { RecordsBadge, workoutLine } from './workout-meta'

const W = 326
const H = 110

function WeightCard({ detail: d, now }: { detail: StudentDetail; now: Date }) {
  const weights = recentWeights(d.weights, now)
  const change = weightChange(weights)
  if (!change || weights.length < 2) {
    return (
      <section aria-labelledby="peso-titulo" className={cardClass}>
        <h2 id="peso-titulo" className="text-[15px] font-extrabold">
          Peso · 12 semanas
        </h2>
        <p className="text-sm text-muted-foreground">Ainda não há pesagens suficientes para o gráfico.</p>
      </section>
    )
  }
  const first = weights[0]!
  const last = weights.at(-1)!
  const { points, goalY } = weightChart(weights, d.weightGoalKg, W, H)
  const label = `Peso de ${formatDecimal(first.kg)} kg em ${shortDate(parseIsoDate(first.date))} para ${formatDecimal(last.kg)} kg em ${shortDate(parseIsoDate(last.date))}${d.weightGoalKg ? `, meta de ${formatDecimal(d.weightGoalKg)} kg` : ''}`

  return (
    <section aria-labelledby="peso-titulo" className={cardClass}>
      <div className="flex items-baseline justify-between">
        <h2 id="peso-titulo" className="text-[15px] font-extrabold">
          Peso · 12 semanas
        </h2>
        <span className="text-[13px] font-extrabold text-info">{formatDeltaKg(change.deltaKg)} kg</span>
      </div>
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={label}>
        {goalY !== null && <line x1="0" y1={goalY} x2={W} y2={goalY} className="stroke-[#5a606a]" strokeWidth="1" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />}
        <polyline points={points} fill="none" className="stroke-primary" strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <div aria-hidden="true" className="flex justify-between text-[11.5px] text-muted-foreground">
        <span>
          {shortDate(parseIsoDate(first.date))} · {formatDecimal(first.kg)} kg
        </span>
        {d.weightGoalKg && <span>meta {formatDecimal(d.weightGoalKg)} kg</span>}
        <span>
          {shortDate(parseIsoDate(last.date))} · {formatDecimal(last.kg)} kg
        </span>
      </div>
    </section>
  )
}

/** Resumo: o que precisa de atenção, o peso e os últimos treinos. */
export function SummaryTab({ detail: d, now }: { detail: StudentDetail; now: Date }) {
  return (
    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-5">
      {d.attention.length > 0 && (
        <section aria-labelledby="atencao-aluno" className="flex flex-col gap-2.5 rounded-[20px] border border-warning/50 bg-warning/8 p-4 lg:col-span-2">
          <span id="atencao-aluno" className="text-[11px] font-extrabold tracking-[0.8px] text-warning">
            PONTOS DE ATENÇÃO
          </span>
          {d.attention.map((a) => (
            <div key={a.title} className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-2.5">
                <TriangleAlert aria-hidden="true" className="mt-0.5 size-4.5 shrink-0 text-warning" />
                <div className="flex flex-col gap-0.5">
                  <strong className="text-[15px]">{a.title}</strong>
                  <span className="text-[13px] leading-[1.45] text-foreground-2">{a.detail}</span>
                </div>
              </div>
              {a.checkInId && (
                <div className="flex gap-2">
                  <Link to={`/check-ins/revisar/${a.checkInId}`} className={cn(buttonVariants({ size: 'sm', className: 'h-10 grow lg:grow-0' }))}>
                    Responder check-in
                  </Link>
                  <Link to="?aba=treino" replace className={cn(buttonVariants({ variant: 'outline', size: 'sm', className: 'h-10 grow font-bold lg:grow-0' }))}>
                    Ajustar treino
                  </Link>
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      <ProfileStats detail={d} now={now} variant="mobile" />
      <WeightCard detail={d} now={now} />

      <section aria-labelledby="ultimos-treinos" className={cardClass}>
        <div className="flex items-baseline justify-between">
          <h2 id="ultimos-treinos" className="text-[15px] font-extrabold">
            Últimos treinos
          </h2>
          <Link to="?aba=historico" replace className="text-[13px] font-extrabold text-primary">
            Ver histórico
          </Link>
        </div>
        {d.recentWorkouts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum treino registrado ainda.</p>
        ) : (
          <ul className="flex flex-col">
            {d.recentWorkouts.map((w, i) => (
              <li key={w.id} className={cn('flex items-center gap-3 py-2.5', i > 0 && 'border-t border-[#22252b]')}>
                <div className="flex grow flex-col gap-0.5">
                  <span className="text-sm font-extrabold">{w.name}</span>
                  <span className="text-xs text-muted-foreground">{workoutLine(w)}</span>
                </div>
                <RecordsBadge count={w.records} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
