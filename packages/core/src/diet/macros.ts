import type { Macros } from '../schemas/diet'
import type { Food, TemplateMeal } from '../schemas/diet-templates'

/** Proteína e gordura em g/kg; o carboidrato completa a meta (nunca negativo). */
export function macroTargets(kcal: number, proteinPerKg: number, fatPerKg: number, weightKg: number): Macros {
  const protein = Math.round(proteinPerKg * weightKg)
  const fat = Math.round(fatPerKg * weightKg)
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4))
  return { kcal, protein, carbs, fat }
}

/** Macros de uma porção (a tabela é por 100 g). */
export function foodMacros(food: Pick<Food, 'per100'>, grams: number): Macros {
  const k = grams / 100
  return { kcal: food.per100.kcal * k, protein: food.per100.protein * k, carbs: food.per100.carbs * k, fat: food.per100.fat * k }
}

const add = (a: Macros, b: Macros): Macros => ({ kcal: a.kcal + b.kcal, protein: a.protein + b.protein, carbs: a.carbs + b.carbs, fat: a.fat + b.fat })
const ZERO: Macros = { kcal: 0, protein: 0, carbs: 0, fat: 0 }

/** Soma de uma refeição (alimentos que não estão na tabela ficam de fora). */
export const templateMealTotals = (meal: Pick<TemplateMeal, 'foods'>, foods: Record<string, Food>): Macros =>
  meal.foods.reduce((sum, f) => (foods[f.foodId] ? add(sum, foodMacros(foods[f.foodId]!, f.grams)) : sum), ZERO)

export const templateTotals = (meals: Pick<TemplateMeal, 'foods'>[], foods: Record<string, Food>): Macros => meals.reduce((sum, m) => add(sum, templateMealTotals(m, foods)), ZERO)

