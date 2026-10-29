import { adherenceTone, formatDecimal, formatDeltaKg, lastWorkoutLabel, parseIsoDate, shortDate, weightChange, type StudentDetail } from '@workspace/core'
import { cn } from '@workspace/ui/lib/utils'
import { adherenceText } from '../../students/components/tones'

/**
 * Números do aluno. Desktop: faixa acima das abas ("Resumo do aluno").
 * Celular: grade de 2 dentro da aba Resumo ("Números"), como no canvas.
 */
export function ProfileStats({ detail: d, now, variant }: { detail: StudentDetail; now: Date; variant: 'desktop' | 'mobile' }) {
  const s = d.student
  const weight = weightChange(d.weights)
  const date = (iso: string | null) => (iso ? shortDate(parseIsoDate(iso)) : '—')
  const stats = [
    { label: 'Adesão 30 dias', value: s.adherence30d === null ? '—' : `${Math.round(s.adherence30d)}%`, className: adherenceText[adherenceTone(s.adherence30d)] },
    { label: 'Último treino', value: lastWorkoutLabel(s.lastWorkoutOn, now) },
    {
      label: 'Peso atual',
      value: weight ? `${formatDecimal(weight.currentKg)} kg` : '—',
      extra: weight && weight.deltaKg !== 0 ? formatDeltaKg(weight.deltaKg) : null,
    },
    { label: 'Plano', value: `até ${date(d.subscription.endsOn)}` },
    { label: 'Próximo check-in', value: date(d.nextCheckInOn) },
  ]

  return (
    <section
      aria-label={variant === 'desktop' ? 'Resumo do aluno' : 'Números'}
      className={cn(variant === 'desktop' ? 'hidden lg:grid' : 'grid lg:hidden', 'grid-cols-2 gap-2.5 lg:grid-cols-5 lg:gap-0 lg:rounded-[20px] lg:border lg:bg-card')}
    >
      {stats.map((st, i) => (
        <div
          key={st.label}
          className={cn(
            'flex flex-col gap-1 rounded-2xl border bg-card p-3.5 lg:rounded-none lg:border-0 lg:bg-transparent lg:px-5 lg:py-4',
            i > 0 && 'lg:border-l lg:border-l-border',
            i === stats.length - 1 && 'col-span-2 lg:col-span-1',
          )}
        >
          <span className="text-xs text-muted-foreground">{st.label}</span>
          <span className={cn('text-lg font-extrabold', st.className)}>
            {st.value}
            {st.extra && <span className="ml-1.5 text-[13px] font-bold text-info">{st.extra}</span>}
          </span>
        </div>
      ))}
    </section>
  )
}
