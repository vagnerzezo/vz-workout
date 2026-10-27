import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { Check, ChevronLeft, UtensilsCrossed } from 'lucide-react'
import { toast } from 'sonner'
import { chosenSubstitute, formatInt, mealTotals, nextPendingMeal, toIsoDate } from '@workspace/core'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { cn } from '@workspace/ui/lib/utils'
import { ErrorState } from '../../../shared/components/error-state'
import { useDiet, useSwapFood, useToggleMeal } from '../api/queries'
import { MealFoodCard } from '../components/meal-food-card'

const iconButton =
  'flex size-11 items-center justify-center rounded-full border bg-card outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50'

const macros = [
  { key: 'protein', label: 'PROT', title: 'Proteína', text: 'text-protein' },
  { key: 'carbs', label: 'CARB', title: 'Carboidrato', text: 'text-carb' },
  { key: 'fat', label: 'GORD', title: 'Gordura', text: 'text-fat' },
] as const

/** Detalhe de uma refeição do dia (?dia=2026-10-20; sem ele, hoje). */
export default function MealPage() {
  const { mealId } = useParams()
  const [params] = useSearchParams()
  const [today] = useState(() => new Date())
  const todayIso = toIsoDate(today)
  const dia = params.get('dia')
  const date = dia && /^\d{4}-\d{2}-\d{2}$/.test(dia) ? dia : todayIso
  const backTo = date === todayIso ? '/dieta' : `/dieta?dia=${date}`

  const diet = useDiet(date)
  const toggleMeal = useToggleMeal(date)
  const swapFood = useSwapFood(date)

  const plan = diet.data?.plan
  const day = diet.data?.day
  const variant = plan && day ? (plan.variants.find((v) => v.id === day.variantId) ?? plan.variants[0]!) : null
  const meal = variant?.meals.find((m) => m.id === mealId)

  const header = (
    <div className="flex h-11 items-center justify-between">
      <Link to={backTo} aria-label="Voltar para a dieta" className={iconButton}>
        <ChevronLeft aria-hidden="true" className="size-5" strokeWidth={2} />
      </Link>
      {meal && date === todayIso && nextPendingMeal(variant!.meals, day!.doneMealIds)?.id === meal.id && (
        <span className="flex h-7.5 items-center rounded-full bg-primary/14 px-3 text-xs font-extrabold text-primary">PRÓXIMA REFEIÇÃO</span>
      )}
    </div>
  )

  const shell = 'mx-auto flex min-h-svh w-full max-w-[430px] flex-col gap-4.5 px-5 pt-[max(16px,env(safe-area-inset-top))]'

  if (diet.isError) {
    return (
      <main className={cn(shell, 'pb-8')}>
        {header}
        <ErrorState title="Não foi possível carregar a refeição" onRetry={() => diet.refetch()} retrying={diet.isFetching} />
      </main>
    )
  }
  if (!diet.data) {
    return (
      <main className={cn(shell, 'pb-8')}>
        {header}
        <MealSkeleton />
      </main>
    )
  }
  if (!meal || !day) {
    return (
      <main className={cn(shell, 'pb-8')}>
        {header}
        <NotFound backTo={backTo} />
      </main>
    )
  }

  const swaps = day.swaps[meal.id] ?? {}
  const totals = mealTotals(meal, swaps)
  const done = day.doneMealIds.includes(meal.id)
  const canCheck = date <= todayIso

  const choose = (foodId: string, substituteId: string | null) =>
    swapFood.mutate(
      { mealId: meal.id, foodId, substituteId },
      { onError: () => toast.error('Não foi possível salvar a substituição. Tente de novo.') },
    )

  const conclude = () =>
    toggleMeal.mutate(
      { mealId: meal.id, done: !done },
      { onError: () => toast.error('Não foi possível salvar a refeição. Tente de novo.') },
    )

  return (
    <main className={cn(shell, 'pb-[calc(120px+env(safe-area-inset-bottom))]')}>
      {header}

      <header className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-extrabold tracking-[-0.6px]">{meal.name}</h1>
        <p className="text-sm text-muted-foreground">
          <time>{meal.time}</time> · {meal.foods.length} {meal.foods.length === 1 ? 'alimento' : 'alimentos'} · {formatInt(totals.kcal)} kcal
        </p>
      </header>

      <dl className="grid grid-cols-3 gap-2">
        {macros.map((m) => (
          <div key={m.key} className="flex flex-col gap-0.5 rounded-[14px] border bg-card px-3 py-2.5">
            <dt className="text-[11px] font-extrabold tracking-[0.8px] text-muted-foreground">
              <abbr title={m.title} className="no-underline">
                {m.label}
              </abbr>
            </dt>
            <dd className={cn('text-lg font-extrabold', m.text)}>{formatInt(totals[m.key])} g</dd>
          </div>
        ))}
      </dl>

      {meal.note && (
        <section aria-labelledby="obs-nutri" className="flex flex-col gap-1 rounded-2xl border bg-card px-3.5 py-3">
          <h2 id="obs-nutri" className="text-[11px] font-extrabold tracking-[1.2px] text-muted-foreground">
            {plan!.authorRole === 'nutritionist' ? 'OBSERVAÇÃO DA NUTRI' : 'OBSERVAÇÃO DO TREINADOR'}
          </h2>
          <p className="text-[13px] leading-[1.45] text-foreground-2">{meal.note}</p>
        </section>
      )}

      <section aria-label="Alimentos">
        <ul className="flex flex-col gap-2.5">
          {meal.foods.map((food) => (
            <MealFoodCard
              key={food.foodId}
              food={food}
              chosen={chosenSubstitute(food, swaps)}
              onChoose={(substituteId) => choose(food.foodId, substituteId)}
            />
          ))}
        </ul>
      </section>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background">
        <div className="mx-auto flex max-w-[430px] flex-col gap-2 px-5 pt-4 pb-[max(28px,env(safe-area-inset-bottom))]">
          <button
            type="button"
            aria-pressed={done}
            aria-describedby={canCheck ? undefined : 'concluir-futuro'}
            disabled={!canCheck}
            onClick={conclude}
            className={cn(
              'flex h-14 items-center justify-center gap-2 rounded-full text-base font-extrabold outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-40',
              done ? 'border-2 border-primary text-primary' : 'bg-primary text-primary-foreground',
            )}
          >
            <Check aria-hidden="true" className="size-4.5" strokeWidth={2.8} />
            {done ? 'Refeição concluída' : 'Concluir refeição'}
          </button>
          {!canCheck && (
            <p id="concluir-futuro" className="text-center text-[13px] text-muted-foreground">
              Você poderá concluir no dia da refeição.
            </p>
          )}
        </div>
      </div>
    </main>
  )
}

function NotFound({ backTo }: { backTo: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
        <UtensilsCrossed aria-hidden="true" className="size-6" />
      </span>
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-extrabold">Refeição não encontrada</h1>
        <p className="text-sm text-muted-foreground">Ela não faz parte da ficha deste dia.</p>
      </div>
      <Link to={backTo} className="text-sm font-extrabold text-primary underline-offset-4 hover:underline">
        Ver as refeições do dia
      </Link>
    </div>
  )
}

function MealSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando a refeição" className="flex flex-col gap-4.5">
      <Skeleton className="h-16 w-56 rounded-xl" />
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-16 rounded-[14px]" />
        ))}
      </div>
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton key={i} className="h-24 rounded-[18px]" />
      ))}
    </div>
  )
}
