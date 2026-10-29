import type { Macros } from '../schemas/diet'
import type { Food, FoodGroup, TemplateMeal } from '../schemas/diet-templates'

/**
 * Regras do editor de dieta (painel). Tudo devolve refeições novas: o editor guarda a ficha em
 * rascunho e só manda para a API ao salvar.
 */

export const foodGroupLabel: Record<FoodGroup, string> = {
  protein: 'Proteínas',
  carbs: 'Carboidratos',
  fruit: 'Frutas',
  dairy: 'Laticínios',
  vegetables: 'Vegetais',
  fats: 'Gorduras',
}

/** O −/+ anda uma medida caseira pequena (ovo, colher) ou 10 g. */
export const quantityStep = (food: Pick<Food, 'unitGrams'>) => (food.unitGrams && food.unitGrams <= 50 ? food.unitGrams : 10)

/** "2 un.", "1,5 colher de sopa" ou "pesado pronto". */
export function householdMeasure(food: Pick<Food, 'unit' | 'unitGrams'>, grams: number): string {
  if (!food.unit || !food.unitGrams) return 'pesado pronto'
  const units = Math.round((grams / food.unitGrams) * 10) / 10
  return `${String(units).replace('.', ',')} ${food.unit}`
}

const onMeal = (meals: TemplateMeal[], mealId: string, fn: (m: TemplateMeal) => TemplateMeal) => meals.map((m) => (m.id === mealId ? fn(m) : m))
const onFood = (meals: TemplateMeal[], mealId: string, rowId: string, fn: (f: TemplateMeal['foods'][number]) => TemplateMeal['foods'][number]) =>
  onMeal(meals, mealId, (m) => ({ ...m, foods: m.foods.map((f) => (f.id === rowId ? fn(f) : f)) }))

/** Nunca abaixo de um passo (não zera o alimento; para tirar, remova). */
export const setGrams = (meals: TemplateMeal[], mealId: string, rowId: string, grams: number, step: number) => onFood(meals, mealId, rowId, (f) => ({ ...f, grams: Math.max(step, grams) }))

/** Alimento novo no fim da refeição: uma medida caseira ou 100 g. */
export const addFood = (meals: TemplateMeal[], mealId: string, food: Pick<Food, 'id' | 'unitGrams'>, rowId: string) =>
  onMeal(meals, mealId, (m) => ({ ...m, foods: [...m.foods, { id: rowId, foodId: food.id, grams: food.unitGrams ?? 100, substitutes: [] }] }))

export const removeFood = (meals: TemplateMeal[], mealId: string, rowId: string) => onMeal(meals, mealId, (m) => ({ ...m, foods: m.foods.filter((f) => f.id !== rowId) }))

/** As alternativas da tabela que ainda não viraram substituição (a primeira é o botão "+ …"). */
export const remainingAlternatives = (food: Pick<Food, 'id' | 'alternatives'>, substitutes: string[]) => food.alternatives.filter((a) => a !== food.id && !substitutes.includes(a))

export const addSubstitute = (meals: TemplateMeal[], mealId: string, rowId: string, foodId: string) =>
  onFood(meals, mealId, rowId, (f) => (f.substitutes.includes(foodId) ? f : { ...f, substitutes: [...f.substitutes, foodId] }))

export const removeSubstitute = (meals: TemplateMeal[], mealId: string, rowId: string, foodId: string) => onFood(meals, mealId, rowId, (f) => ({ ...f, substitutes: f.substitutes.filter((s) => s !== foodId) }))

/** "+ Nova refeição": vazia, 2 h depois da última (no máximo 23:30). */
export function newMeal(meals: TemplateMeal[], id: string): TemplateMeal {
  const last = meals.at(-1)?.time ?? '05:30'
  const [h, m] = last.split(':').map(Number) as [number, number]
  const minutes = Math.min(h * 60 + m + 120, 23 * 60 + 30)
  const time = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
  return { id, name: 'Nova refeição', time, foods: [] }
}

export type CompareRow = { key: keyof Macros; label: string; plan: number; target: number; diff: number; within: boolean }

/** "Plano × meta": diferença de até 5% conta como dentro da meta. */
export function planVsTarget(plan: Macros, target: Macros): { rows: CompareRow[]; off: number } {
  const labels: [keyof Macros, string][] = [['kcal', 'Calorias'], ['protein', 'Proteína'], ['carbs', 'Carboidrato'], ['fat', 'Gordura']]
  const rows = labels.map(([key, label]) => {
    const p = Math.round(plan[key])
    const t = Math.round(target[key])
    return { key, label, plan: p, target: t, diff: p - t, within: t === 0 ? p === 0 : Math.abs(p - t) / t <= 0.05 }
  })
  return { rows, off: rows.filter((r) => !r.within).length }
}
