import { useReducer } from 'react'
import { addFood, addSubstitute, newMeal, removeFood, removeSubstitute, setGrams, type DietTemplate, type Food, type TemplateMeal } from '@workspace/core'

type Action =
  | { type: 'load'; template: DietTemplate }
  | { type: 'patch'; patch: Partial<Pick<DietTemplate, 'name' | 'activityFactor' | 'calorieMode' | 'manualKcal' | 'proteinPerKg' | 'fatPerKg' | 'notes'>> }
  | { type: 'grams'; mealId: string; rowId: string; grams: number; step: number }
  | { type: 'addFood'; mealId: string; food: Pick<Food, 'id' | 'unitGrams'> }
  | { type: 'removeFood'; mealId: string; rowId: string }
  | { type: 'addSub'; mealId: string; rowId: string; foodId: string }
  | { type: 'removeSub'; mealId: string; rowId: string; foodId: string }
  | { type: 'addMeal' }

type State = { template: DietTemplate | null; dirty: boolean; seq: number }

function reducer(state: State, action: Action): State {
  if (action.type === 'load') return { template: action.template, dirty: false, seq: state.seq }
  const t = state.template
  if (!t) return state
  const seq = state.seq + 1 // ids novos: únicos dentro do rascunho
  const meals = (m: TemplateMeal[]): State => ({ template: { ...t, meals: m }, dirty: true, seq })
  switch (action.type) {
    case 'patch':
      return { template: { ...t, ...action.patch }, dirty: true, seq }
    case 'grams':
      return meals(setGrams(t.meals, action.mealId, action.rowId, action.grams, action.step))
    case 'addFood':
      return meals(addFood(t.meals, action.mealId, action.food, `${action.mealId}_novo${seq}`))
    case 'removeFood':
      return meals(removeFood(t.meals, action.mealId, action.rowId))
    case 'addSub':
      return meals(addSubstitute(t.meals, action.mealId, action.rowId, action.foodId))
    case 'removeSub':
      return meals(removeSubstitute(t.meals, action.mealId, action.rowId, action.foodId))
    case 'addMeal':
      return meals([...t.meals, newMeal(t.meals, `${t.id}_ref${seq}`)])
  }
}

/** A dieta em edição: tudo muda só aqui até o "Salvar". `load` recomeça do que veio da API. */
export function useDietDraft() {
  const [state, dispatch] = useReducer(reducer, { template: null, dirty: false, seq: 0 })
  return { ...state, dispatch }
}
