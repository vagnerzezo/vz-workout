import type { Macros, Meal } from '../schemas/diet'

const zero: Macros = { kcal: 0, protein: 0, carbs: 0, fat: 0 }

const add = (a: Macros, b: Macros): Macros => ({
  kcal: a.kcal + b.kcal,
  protein: a.protein + b.protein,
  carbs: a.carbs + b.carbs,
  fat: a.fat + b.fat,
})

type SwappableFood = Macros & { foodId: string; substitutes?: (Macros & { foodId: string })[] }

/** Substituições do dia numa refeição: alimento → substituto escolhido. */
export type MealSwaps = Record<string, string>

/** Substituto que o aluno escolheu para o alimento; null se não trocou (ou a nutri tirou a opção). */
export function chosenSubstitute<S extends { foodId: string }>(
  food: { foodId: string; substitutes?: S[] },
  swaps: MealSwaps = {},
): S | null {
  const id = swaps[food.foodId]
  return (id && food.substitutes?.find((s) => s.foodId === id)) || null
}

/** Soma dos alimentos da refeição, com as substituições escolhidas no lugar dos originais. */
export const mealTotals = (meal: { foods: SwappableFood[] }, swaps: MealSwaps = {}): Macros =>
  meal.foods.map((f) => chosenSubstitute(f, swaps) ?? f).reduce(add, zero)

/** O que o aluno já comeu no dia: soma das refeições marcadas como concluídas. */
export function dayTotals(
  meals: (Pick<Meal, 'id'> & { foods: SwappableFood[] })[],
  doneMealIds: string[],
  swaps: Record<string, MealSwaps> = {},
): Macros {
  const done = new Set(doneMealIds)
  return meals
    .filter((m) => done.has(m.id))
    .map((m) => mealTotals(m, swaps[m.id]))
    .reduce(add, zero)
}

/** Primeira refeição ainda não feita, na ordem do dia. */
export function nextPendingMeal<M extends Pick<Meal, 'id'>>(meals: M[], doneMealIds: string[]): M | null {
  const done = new Set(doneMealIds)
  return meals.find((m) => !done.has(m.id)) ?? null
}

/** Percentual da meta, arredondado. Meta zero conta como 0%. */
export const percentOf = (value: number, goal: number) => (goal > 0 ? Math.round((value / goal) * 100) : 0)
