import { useId, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { MealFood, Substitution } from '@workspace/core'
import { formatInt } from '@workspace/core'
import { cn } from '@workspace/ui/lib/utils'

type MealFoodCardProps = {
  food: MealFood
  chosen: Substitution | null // substituto escolhido no dia
  onChoose: (substituteId: string | null) => void
}

/** Alimento da refeição com a porção; abre a lista de substituições liberadas pela nutri. */
export function MealFoodCard({ food, chosen, onChoose }: MealFoodCardProps) {
  const [open, setOpen] = useState(false)
  const optionsId = useId()
  const served = chosen ?? food
  const options = [food, ...food.substitutes]
  const Chevron = open ? ChevronUp : ChevronDown

  return (
    <li className={cn('flex flex-col gap-2.5 rounded-[18px] border bg-card p-3.5', open && 'border-line-strong')}>
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 grow flex-col gap-0.5">
          <h3 className="text-[15px] font-extrabold">{served.name}</h3>
          <p className="text-xs text-muted-foreground">
            {formatInt(served.kcal)} kcal · <abbr title="Proteína" className="no-underline">P</abbr> {formatInt(served.protein)} ·{' '}
            <abbr title="Carboidrato" className="no-underline">C</abbr> {formatInt(served.carbs)} ·{' '}
            <abbr title="Gordura" className="no-underline">G</abbr> {formatInt(served.fat)}
          </p>
        </div>
        <span className="flex h-7.5 shrink-0 items-center rounded-full bg-primary px-3 text-[13px] font-extrabold text-primary-foreground">
          {served.portion}
        </span>
      </div>

      {chosen && (
        <p className="text-xs text-muted-foreground">
          Substituição escolhida · original: {food.name} {food.portion}
        </p>
      )}

      {food.substitutes.length > 0 && (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={optionsId}
          onClick={() => setOpen(!open)}
          className="flex min-h-8 items-center gap-1.5 self-start rounded-md text-[13px] font-extrabold text-primary outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Chevron aria-hidden="true" className="size-3.5" strokeWidth={2.4} />
          {open ? 'Ocultar opções' : `Ver ${food.substitutes.length} ${food.substitutes.length === 1 ? 'substituição' : 'substituições'}`}
        </button>
      )}

      {open && (
        <fieldset id={optionsId} className="flex flex-col gap-1.5">
          <legend className="sr-only">Opções para {food.name}</legend>
          {options.map((o) => {
            const checked = o.foodId === served.foodId
            return (
              <label
                key={o.foodId}
                className={cn(
                  'flex min-h-12 cursor-pointer items-center justify-between gap-2.5 rounded-xl border px-3 py-2 has-focus-visible:ring-3 has-focus-visible:ring-ring/50',
                  checked ? 'border-primary bg-primary/14' : 'bg-secondary',
                )}
              >
                <input
                  type="radio"
                  name={optionsId}
                  className="sr-only"
                  checked={checked}
                  onChange={() => onChoose(o === food ? null : o.foodId)}
                />
                <span className="flex flex-col gap-px">
                  <span className="text-sm font-bold">{o.name}</span>
                  <span className="text-xs text-muted-foreground">{formatInt(o.kcal)} kcal</span>
                </span>
                <span className="text-[13px] font-extrabold text-foreground-2">{o.portion}</span>
              </label>
            )
          })}
        </fieldset>
      )}
    </li>
  )
}
