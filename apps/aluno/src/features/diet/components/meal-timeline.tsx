import { Link } from 'react-router'
import { Check } from 'lucide-react'
import type { Meal, MealSwaps } from '@workspace/core'
import { formatInt, mealTotals } from '@workspace/core'
import { cn } from '@workspace/ui/lib/utils'

type MealTimelineProps = {
  meals: Meal[]
  doneIds: string[]
  swaps: Record<string, MealSwaps>
  nextId: string | null // só no dia de hoje
  date: string
  canCheck: boolean // dias futuros: só leitura
  onToggle: (mealId: string, done: boolean) => void
}

export function MealTimeline({ meals, doneIds, swaps, nextId, date, canCheck, onToggle }: MealTimelineProps) {
  const done = new Set(doneIds)
  return (
    <section aria-labelledby="refeicoes" className="flex flex-col gap-1">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 id="refeicoes" className="text-[17px] font-extrabold">
          Refeições
        </h2>
        <p className="text-[13px] text-muted-foreground">
          {meals.filter((m) => done.has(m.id)).length} de {meals.length} concluídas
        </p>
      </div>
      <ol className="flex flex-col">
        {meals.map((meal, i) => {
          const isDone = done.has(meal.id)
          const isNext = meal.id === nextId
          const prevDone = i > 0 && done.has(meals[i - 1]!.id)
          const t = mealTotals(meal, swaps[meal.id])
          return (
            <li key={meal.id} className="grid grid-cols-[44px_18px_minmax(0,1fr)] gap-x-2">
              <span className={cn('pt-5.5 text-[13px] font-bold', isNext ? 'text-primary' : isDone ? 'text-foreground-2' : 'text-muted-foreground')}>
                <time>{meal.time}</time>
              </span>
              <span aria-hidden="true" className="flex flex-col items-center">
                <span className={cn('h-5.5 w-0.5', i === 0 ? 'bg-transparent' : (isDone || isNext) && prevDone ? 'bg-primary' : 'bg-border')} />
                <span
                  className={cn(
                    'size-3.5 shrink-0 rounded-full border-2',
                    isDone ? 'border-primary bg-primary' : isNext ? 'border-primary bg-background' : 'border-line-strong bg-background',
                  )}
                />
                <span className={cn('w-0.5 grow', i === meals.length - 1 ? 'bg-transparent' : isDone ? 'bg-primary' : 'bg-border')} />
              </span>
              <div className="pt-1.5 pb-2">
                <div className={cn('flex items-center gap-2.5 rounded-[18px] bg-card py-3 pr-2.5 pl-3.5', isNext ? 'border-2 border-primary' : 'border')}>
                  <Link
                    to={`/dieta/refeicoes/${meal.id}?dia=${date}`}
                    className="flex min-w-0 grow flex-col gap-0.75 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base font-extrabold">{meal.name}</span>
                      {isNext && (
                        <span className="flex h-5 items-center rounded-full bg-primary px-1.75 text-[10.5px] font-extrabold text-primary-foreground">
                          PRÓXIMA
                        </span>
                      )}
                    </span>
                    <span className="text-[13px] text-muted-foreground">
                      {meal.foods.length} {meal.foods.length === 1 ? 'alimento' : 'alimentos'} · {formatInt(t.kcal)} kcal
                    </span>
                    <span className="text-xs text-muted-foreground">
                      <abbr title="Proteína" className="no-underline">P</abbr> {formatInt(t.protein)} g ·{' '}
                      <abbr title="Carboidrato" className="no-underline">C</abbr> {formatInt(t.carbs)} g ·{' '}
                      <abbr title="Gordura" className="no-underline">G</abbr> {formatInt(t.fat)} g
                    </span>
                  </Link>
                  <button
                    type="button"
                    aria-pressed={isDone}
                    aria-label={`${isDone ? 'Desmarcar' : 'Concluir'} ${meal.name}`}
                    disabled={!canCheck}
                    onClick={() => onToggle(meal.id, !isDone)}
                    className={cn(
                      'flex size-11 shrink-0 items-center justify-center rounded-full border outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-40',
                      isDone ? 'border-primary bg-primary text-primary-foreground' : 'border-line-strong text-muted-foreground hover:bg-accent',
                    )}
                  >
                    <Check aria-hidden="true" className="size-4.5" strokeWidth={2.8} />
                  </button>
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
