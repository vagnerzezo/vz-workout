import type { Food, TemplateMeal } from '../schemas/diet-templates'

/** Substituição pela mesma energia, arredondada a 5 g (mínimo 5 g). */
export function equivalentGrams(food: Pick<Food, 'per100'>, substitute: Pick<Food, 'per100'>, grams: number): number {
  if (substitute.per100.kcal <= 0) return grams
  const raw = (food.per100.kcal * grams) / substitute.per100.kcal
  return Math.max(5, Math.round(raw / 5) * 5)
}

/** Quantas substituições a ficha oferece (o "14 substituições" do card). */
export const substitutionCount = (meals: Pick<TemplateMeal, 'foods'>[]) => meals.reduce((n, m) => n + m.foods.reduce((k, f) => k + f.substitutes.length, 0), 0)
