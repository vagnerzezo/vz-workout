import { Link } from 'react-router'
import { formatInt, formatLiters, parseIsoDate, shortDate, type DietVariant } from '@workspace/core'
import { buttonVariants } from '@workspace/ui/components/button'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { cn } from '@workspace/ui/lib/utils'
import { useStudentDiet } from '../api/queries'
import { cardClass } from './card'

const tag: Record<DietVariant['kind'], [string, string]> = {
  training: ['Ativa', 'bg-primary/14 text-primary'],
  rest: ['Ativa', 'bg-primary/14 text-primary'],
  free: ['Semanal', 'bg-violet/16 text-violet'],
}

/** Dieta: metas do dia de treino, adesão às refeições e as fichas do aluno. */
export function DietTab({ studentId }: { studentId: string }) {
  const { data, isError } = useStudentDiet(studentId)
  if (isError) return <p className="text-sm text-destructive">Não foi possível carregar a dieta.</p>
  if (!data) return <Skeleton aria-label="Carregando a dieta" className="h-64 rounded-[20px]" />
  if (!data.plan) {
    return (
      <section className={cn(cardClass, 'items-center py-10 text-center')}>
        <h2 className="text-base font-extrabold">Sem ficha de dieta</h2>
        <p className="text-sm text-muted-foreground">Monte a dieta do aluno ou parta de um modelo.</p>
        <Link to={`/dietas/nova?aluno=${studentId}`} className={cn(buttonVariants({ size: 'lg' }))}>
          Nova ficha de dieta
        </Link>
      </section>
    )
  }

  const { plan, author } = data
  const goals = (plan.variants.find((v) => v.kind === 'training') ?? plan.variants[0]!).goals
  const canEdit = author === null // a dieta da nutricionista o treinador só vê
  const targets = [
    { label: 'Calorias', value: `${formatInt(goals.kcal)} kcal` },
    { label: 'Água', value: formatLiters(data.waterGoalMl) },
    { label: 'Proteína', value: `${formatInt(goals.protein)} g` },
    { label: 'Carboidrato', value: `${formatInt(goals.carbs)} g` },
    { label: 'Gordura', value: `${formatInt(goals.fat)} g` },
  ]

  return (
    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-5">
      <section aria-labelledby="metas" className={cardClass}>
        <h2 id="metas" className="text-base font-extrabold">
          Metas diárias
        </h2>
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {targets.map((t) => (
            <div key={t.label} className="flex flex-col gap-0.5 rounded-xl bg-secondary px-3 py-2.5">
              <dt className="text-[11.5px] text-muted-foreground">{t.label}</dt>
              <dd className="text-base font-extrabold">{t.value}</dd>
            </div>
          ))}
        </dl>
        {data.adherence7d !== null && (
          <span className="text-[13px] text-foreground-2">
            Refeições concluídas nos últimos 7 dias: <strong className="text-primary">{Math.round(data.adherence7d)}%</strong>
          </span>
        )}
      </section>

      <section aria-labelledby="fichas-dieta" className={cardClass}>
        <h2 id="fichas-dieta" className="text-base font-extrabold">
          Fichas de dieta
        </h2>
        <ul className="flex flex-col gap-2">
          {plan.variants.map((v) => {
            const [label, className] = tag[v.kind]
            return (
              <li key={v.id} className="flex items-center gap-3 rounded-2xl border bg-[#1a1c21] p-3">
                <div className="flex grow flex-col gap-0.5">
                  <span className="text-sm font-extrabold">{v.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {v.meals.length === 1 ? '1 refeição' : `${v.meals.length} refeições`} · {formatInt(v.goals.kcal)} kcal · atualizada em {shortDate(parseIsoDate(plan.updatedAt))}
                  </span>
                </div>
                <span className={cn('flex h-6 shrink-0 items-center rounded-full px-2 text-[11px] font-extrabold', className)}>{label}</span>
                {canEdit && (
                  <Link to={`/dietas/${v.id}?aluno=${studentId}`} className={cn(buttonVariants({ variant: 'outline', size: 'sm', className: 'h-9 font-bold' }))}>
                    Editar
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
        {canEdit ? (
          <Link to={`/dietas/nova?aluno=${studentId}`} className={cn(buttonVariants({ variant: 'outline', className: 'h-10 border-dashed font-bold' }))}>
            + Nova ficha de dieta
          </Link>
        ) : (
          <p className="text-xs leading-[1.45] text-muted-foreground">
            Dieta montada por {author.name} ({author.credential}). Você pode ver, mas a edição é da nutricionista.
          </p>
        )}
      </section>
    </div>
  )
}
