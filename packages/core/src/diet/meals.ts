import type { Macros, Meal } from '../schemas/diet'

const zero: Macros = { kcal: 0, protein: 0, carbs: 0, fat: 0 }

const add = (a: Macros, b: Macros): Macros => ({
  kcal: a.kcal + b.kcal,
  protein: a.protein + b.protein,
  carbs: a.carbs + b.carbs,
  fat: a.fat + b.fat,
})

/** Soma dos alimentos da refeição. */
export const mealTotals = (meal: Pick<Meal, 'foods'>): Macros => meal.foods.reduce(add, zero)

/** O que o aluno já comeu no dia: soma das refeições marcadas como concluídas. */
export function dayTotals(meals: Pick<Meal, 'id' | 'foods'>[], doneMealIds: string[]): Macros {
  const done = new Set(doneMealIds)
  return meals.filter((m) => done.has(m.id)).map(mealTotals).reduce(add, zero)
}

/** Primeira refeição ainda não feita, na ordem do dia. */
export function nextPendingMeal<M extends Pick<Meal, 'id'>>(meals: M[], doneMealIds: string[]): M | null {
  const done = new Set(doneMealIds)
  return meals.find((m) => !done.has(m.id)) ?? null
}

/** Percentual da meta, arredondado. Meta zero conta como 0%. */
export const percentOf = (value: number, goal: number) => (goal > 0 ? Math.round((value / goal) * 100) : 0)
