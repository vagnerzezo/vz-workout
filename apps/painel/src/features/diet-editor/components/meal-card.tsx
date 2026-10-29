import { ChevronDown, X } from 'lucide-react'
import { equivalentGrams, foodMacros, formatInt, householdMeasure, quantityStep, remainingAlternatives, templateMealTotals, type Food, type TemplateMeal } from '@workspace/core'
import { Stepper } from '@workspace/ui/blocks/stepper'
import { Button } from '@workspace/ui/components/button'
import { cn } from '@workspace/ui/lib/utils'

type MealCardProps = {
  meal: TemplateMeal
  foods: Record<string, Food>
  open: boolean
  desktop: boolean
  onToggle: () => void
  onGrams: (rowId: string, grams: number, step: number) => void
  onRemove: (rowId: string) => void
  onAddSub: (rowId: string, foodId: string) => void
  onRemoveSub: (rowId: string, foodId: string) => void
  /** Celular: abre a tabela de alimentos para esta refeição */
  onAddFood: () => void
}

const one = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',')

/** Refeição em sanfona: fechada mostra calorias e macros; aberta, os alimentos com quantidade e substituições. */
export function MealCard({ meal, foods, open, desktop, onToggle, onGrams, onRemove, onAddSub, onRemoveSub, onAddFood }: MealCardProps) {
  const t = templateMealTotals(meal, foods)
  const head = `${meal.foods.length} ${meal.foods.length === 1 ? 'alimento' : 'alimentos'}`
  return (
    <article aria-label={meal.name} className={cn('rounded-[18px] border bg-card', open && 'border-primary')}>
      <button type="button" aria-expanded={open} onClick={onToggle} className="flex w-full items-center gap-3 p-3.5 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 lg:px-4">
        <span className={cn('w-11 shrink-0 text-[13px] font-extrabold', open ? 'text-primary' : 'text-muted-foreground')}>{meal.time}</span>
        <span className="flex min-w-0 grow flex-col">
          <span className="text-[15px] font-extrabold">{meal.name}</span>
          <span className="text-xs text-muted-foreground">
            {head}
            {!desktop && ` · P ${Math.round(t.protein)} · C ${Math.round(t.carbs)} · G ${Math.round(t.fat)}`}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end">
          <span className="text-sm font-extrabold">{formatInt(Math.round(t.kcal))} kcal</span>
          {desktop && (
            <span className="text-[11px] text-muted-foreground">
              P {Math.round(t.protein)} · C {Math.round(t.carbs)} · G {Math.round(t.fat)}
            </span>
          )}
        </span>
        <ChevronDown aria-hidden="true" className={cn('size-4.5 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="flex flex-col gap-2 border-t border-[#22252b] p-3.5 lg:px-4">
          {desktop && meal.foods.length > 0 && (
            <div aria-hidden="true" className="grid grid-cols-[minmax(0,1fr)_150px_48px_40px_40px_40px_32px] gap-2 px-1 text-[10.5px] font-extrabold tracking-[0.8px] text-muted-foreground">
              <span>ALIMENTO</span>
              <span>QUANTIDADE</span>
              <span className="text-right">KCAL</span>
              <span className="text-right">P</span>
              <span className="text-right">C</span>
              <span className="text-right">G</span>
              <span />
            </div>
          )}
          <ul className="flex flex-col gap-2">
            {meal.foods.map((row) => {
              const food = foods[row.foodId]
              if (!food) return null
              const m = foodMacros(food, row.grams)
              const step = quantityStep(food)
              const left = remainingAlternatives(food, row.substitutes)
              const stepper = <Stepper label={`Quantidade de ${food.name}`} value={row.grams} min={step} step={step} format={(v) => `${v} g`} onChange={(v) => onGrams(row.id, v, step)} />
              const remove = (
                <Button variant="ghost" size="icon-sm" aria-label={`Remover ${food.name}`} onClick={() => onRemove(row.id)} className="text-destructive hover:text-destructive">
                  <X aria-hidden="true" />
                </Button>
              )
              const name = (
                <span className="flex min-w-0 flex-col">
                  <span className="text-[13.5px] font-bold">{food.name}</span>
                  <span className="text-[11px] text-muted-foreground">{householdMeasure(food, row.grams)}</span>
                </span>
              )
              return (
                <li key={row.id} aria-label={food.name} className="flex flex-col gap-1.5 rounded-xl bg-[#1a1c21] p-2.5">
                  {desktop ? (
                    <div className="grid grid-cols-[minmax(0,1fr)_150px_48px_40px_40px_40px_32px] items-center gap-2 text-[13px]">
                      {name}
                      {stepper}
                      <span className="text-right font-bold">{Math.round(m.kcal)}</span>
                      <span className="text-right text-protein">{one(m.protein)}</span>
                      <span className="text-right text-carb">{one(m.carbs)}</span>
                      <span className="text-right text-fat">{one(m.fat)}</span>
                      {remove}
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        {name}
                        {remove}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-40 shrink-0">{stepper}</div>
                        <span className="flex flex-col text-right">
                          <span className="text-[13px] font-extrabold">{Math.round(m.kcal)} kcal</span>
                          <span className="text-[11px] text-muted-foreground">
                            <span className="text-protein">P {one(m.protein)}</span> · <span className="text-carb">C {one(m.carbs)}</span> · <span className="text-fat">G {one(m.fat)}</span>
                          </span>
                        </span>
                      </div>
                    </>
                  )}
                  {(row.substitutes.length > 0 || left.length > 0) && (
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="text-[10.5px] font-extrabold tracking-[0.8px] text-muted-foreground">OU</span>
                      {row.substitutes.map((id) => {
                        const sub = foods[id]
                        if (!sub) return null
                        return (
                          <span key={id} className="flex h-7 items-center gap-1 rounded-full bg-secondary pr-1 pl-2.5 text-foreground-2">
                            {sub.name} <strong className="text-foreground">{equivalentGrams(food, sub, row.grams)} g</strong>
                            <button type="button" aria-label={`Remover substituição ${sub.name}`} onClick={() => onRemoveSub(row.id, id)} className="flex size-5.5 items-center justify-center rounded-full outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50">
                              <X aria-hidden="true" className="size-3" />
                            </button>
                          </span>
                        )
                      })}
                      {left[0] && foods[left[0]] && (
                        <button type="button" onClick={() => onAddSub(row.id, left[0]!)} className="h-7 rounded-full border border-dashed border-line-strong px-2.5 font-bold text-foreground-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                          + {foods[left[0]]!.name}
                        </button>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
          {meal.foods.length === 0 && <p className="text-[13px] text-muted-foreground">Refeição sem alimentos.</p>}
          {!desktop && (
            <Button variant="outline" onClick={onAddFood} className="h-10 border-dashed font-bold">
              + Adicionar alimento
            </Button>
          )}
          <span className="text-[11px] text-muted-foreground">Substituições calculadas pela mesma energia (kcal) do alimento principal{desktop ? ' · use a tabela ao lado para adicionar a esta refeição' : ''}</span>
        </div>
      )}
    </article>
  )
}
