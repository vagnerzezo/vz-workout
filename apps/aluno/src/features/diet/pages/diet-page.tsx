import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { Salad } from 'lucide-react'
import { toast } from 'sonner'
import { dayTotals, nextPendingMeal, toIsoDate } from '@workspace/core'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { ErrorState } from '../../../shared/components/error-state'
import { useChooseVariant, useDiet, useToggleMeal } from '../api/queries'
import { DayBalance } from '../components/day-balance'
import { DietHeader } from '../components/diet-header'
import { DietWaterCard } from '../components/diet-water-card'
import { DietWeekStrip } from '../components/diet-week-strip'
import { MealTimeline } from '../components/meal-timeline'
import { VariantPicker } from '../components/variant-picker'

/** Dia escolhido na URL (?dia=2026-10-20): recarregar mantém e a refeição volta para o mesmo dia. */
export default function DietPage() {
  const [params, setParams] = useSearchParams()
  const [today] = useState(() => new Date())
  const todayIso = toIsoDate(today)
  const dia = params.get('dia')
  const date = dia && /^\d{4}-\d{2}-\d{2}$/.test(dia) ? dia : todayIso

  const diet = useDiet(date)
  const toggleMeal = useToggleMeal(date)
  const chooseVariant = useChooseVariant(date)

  const select = (iso: string) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (iso === todayIso) next.delete('dia')
        else next.set('dia', iso)
        return next
      },
      { replace: true, preventScrollReset: true },
    )

  const plan = diet.data?.plan
  const day = diet.data?.day
  const variant = plan && day ? (plan.variants.find((v) => v.id === day.variantId) ?? plan.variants[0]!) : null
  const isToday = date === todayIso

  return (
    <main className="flex flex-col gap-4.5 px-5 pt-[max(24px,env(safe-area-inset-top))] pb-[calc(120px+env(safe-area-inset-bottom))]">
      <DietHeader plan={plan ?? null} />

      {diet.isError ? (
        <ErrorState title="Não foi possível carregar sua dieta" onRetry={() => diet.refetch()} retrying={diet.isFetching} />
      ) : !diet.data ? (
        <DietSkeleton />
      ) : !plan || !day || !variant ? (
        <NoDiet />
      ) : (
        <>
          <DietWeekStrip week={diet.data.week} todayIso={todayIso} selectedIso={date} onSelect={select} />
          <VariantPicker
            variants={plan.variants}
            value={variant.id}
            onChange={(id) => chooseVariant.mutate(id, { onError: () => toast.error('Não foi possível trocar a ficha. Tente de novo.') })}
          />
          <DayBalance totals={dayTotals(variant.meals, day.doneMealIds)} goals={variant.goals} isToday={isToday} />
          <MealTimeline
            meals={variant.meals}
            doneIds={day.doneMealIds}
            nextId={isToday ? (nextPendingMeal(variant.meals, day.doneMealIds)?.id ?? null) : null}
            date={date}
            canCheck={date <= todayIso}
            onToggle={(mealId, done) =>
              toggleMeal.mutate({ mealId, done }, { onError: () => toast.error('Não foi possível salvar a refeição. Tente de novo.') })
            }
          />
          {isToday && <DietWaterCard />}
        </>
      )}
    </main>
  )
}

function NoDiet() {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
        <Salad aria-hidden="true" className="size-6" />
      </span>
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-extrabold">Sua dieta ainda não chegou</h2>
        <p className="text-sm text-muted-foreground">Assim que a nutri montar seu plano, as refeições aparecem aqui.</p>
      </div>
    </div>
  )
}

function DietSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando sua dieta" className="flex flex-col gap-4.5">
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: 7 }, (_, i) => (
          <Skeleton key={i} className="h-18.5 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-9 w-72 rounded-full" />
      <Skeleton className="h-50 rounded-[22px]" />
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-24 rounded-[18px]" />
      ))}
    </div>
  )
}
