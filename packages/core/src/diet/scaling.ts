import type { TemplateMeal } from '../schemas/diet-templates'

/** "Ajustar ao peso de cada aluno": porções na proporção do peso, arredondadas a 5 g. */
export function scaleMeals(meals: TemplateMeal[], refWeightKg: number, weightKg: number): TemplateMeal[] {
  const k = weightKg / refWeightKg
  return meals.map((m) => ({ ...m, foods: m.foods.map((f) => ({ ...f, grams: Math.max(5, Math.round((f.grams * k) / 5) * 5) })) }))
}

