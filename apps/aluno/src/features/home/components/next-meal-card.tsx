import { Link } from 'react-router'
import { ChevronRight, Utensils } from 'lucide-react'
import type { NextMeal } from '@workspace/core'
import { formatInt } from '@workspace/core'

export function NextMealCard({ meal }: { meal: NextMeal }) {
  return (
    <Link
      to={`/dieta/refeicoes/${meal.id}`}
      aria-label={`Próxima refeição: ${meal.name} às ${meal.time}`}
      className="flex items-center gap-3.5 rounded-[20px] border bg-card px-4.5 py-4 outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-primary/15 text-primary">
        <Utensils aria-hidden="true" className="size-5.5" strokeWidth={1.9} />
      </span>
      <span className="flex grow flex-col gap-0.5">
        <span className="text-[11px] font-extrabold tracking-[1.2px] text-muted-foreground">
          PRÓXIMA REFEIÇÃO · {meal.time}
        </span>
        <span className="text-lg font-extrabold">{meal.name}</span>
        <span className="text-[13px] text-muted-foreground">
          {meal.foodCount} {meal.foodCount === 1 ? 'alimento' : 'alimentos'} · {formatInt(meal.kcal)} kcal
        </span>
      </span>
      <ChevronRight aria-hidden="true" className="size-5 text-muted-foreground" strokeWidth={2} />
    </Link>
  )
}
