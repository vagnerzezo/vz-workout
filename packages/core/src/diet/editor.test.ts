import { describe, expect, it } from 'vitest'
import type { Food, TemplateMeal } from '../schemas/diet-templates'
import { addFood, addSubstitute, householdMeasure, newMeal, planVsTarget, quantityStep, remainingAlternatives, removeFood, removeSubstitute, setGrams } from './editor'

const ovo: Food = { id: 'ovo', name: 'Ovo', group: 'protein', per100: { kcal: 146, protein: 13.3, carbs: 0.6, fat: 9.5 }, unit: 'un.', unitGrams: 50, alternatives: ['queijo', 'tofu'] }
const arroz: Food = { id: 'arroz', name: 'Arroz', group: 'carbs', per100: { kcal: 128, protein: 2.5, carbs: 28.1, fat: 0.2 }, unit: null, unitGrams: null, alternatives: ['batata'] }
const meals: TemplateMeal[] = [
  { id: 'cafe', name: 'Café', time: '07:30', foods: [{ id: 'r1', foodId: 'ovo', grams: 100, substitutes: ['queijo'] }] },
  { id: 'almoco', name: 'Almoço', time: '12:30', foods: [] },
]
const foodsOf = (ms: TemplateMeal[], id: string) => ms.find((m) => m.id === id)!.foods

describe('porções', () => {
  it('passo e medida caseira', () => {
    expect(quantityStep(ovo)).toBe(50)
    expect(quantityStep(arroz)).toBe(10)
    expect(quantityStep({ unitGrams: 130 })).toBe(10)
    expect(householdMeasure(ovo, 75)).toBe('1,5 un.')
    expect(householdMeasure(arroz, 150)).toBe('pesado pronto')
  })

  it('gramas nunca abaixo de um passo', () => {
    expect(foodsOf(setGrams(meals, 'cafe', 'r1', 0, 50), 'cafe')[0]!.grams).toBe(50)
    expect(foodsOf(setGrams(meals, 'cafe', 'r1', 150, 50), 'cafe')[0]!.grams).toBe(150)
  })
})

describe('alimentos e substituições', () => {
  it('adiciona com uma medida caseira (ou 100 g) e remove', () => {
    const next = addFood(meals, 'almoco', arroz, 'r2')
    expect(foodsOf(next, 'almoco')).toEqual([{ id: 'r2', foodId: 'arroz', grams: 100, substitutes: [] }])
    expect(foodsOf(addFood(meals, 'almoco', ovo, 'r3'), 'almoco')[0]!.grams).toBe(50)
    expect(foodsOf(removeFood(meals, 'cafe', 'r1'), 'cafe')).toEqual([])
    expect(foodsOf(meals, 'almoco')).toEqual([]) // não mexe no original
  })

  it('substituições: as que faltam, adicionar e tirar', () => {
    expect(remainingAlternatives(ovo, ['queijo'])).toEqual(['tofu'])
    const added = addSubstitute(meals, 'cafe', 'r1', 'tofu')
    expect(foodsOf(added, 'cafe')[0]!.substitutes).toEqual(['queijo', 'tofu'])
    expect(addSubstitute(added, 'cafe', 'r1', 'tofu')).toEqual(added)
    expect(foodsOf(removeSubstitute(added, 'cafe', 'r1', 'queijo'), 'cafe')[0]!.substitutes).toEqual(['tofu'])
  })

  it('nova refeição 2 h depois da última, até 23:30', () => {
    expect(newMeal(meals, 'n')).toEqual({ id: 'n', name: 'Nova refeição', time: '14:30', foods: [] })
    expect(newMeal([{ ...meals[0]!, time: '22:30' }], 'n').time).toBe('23:30')
    expect(newMeal([], 'n').time).toBe('07:30')
  })
})

describe('planVsTarget', () => {
  it('até 5% conta como dentro da meta', () => {
    const { rows, off } = planVsTarget({ kcal: 2100.4, protein: 160, carbs: 230, fat: 70 }, { kcal: 2127, protein: 174, carbs: 194, fat: 73 })
    expect(rows.map((r) => [r.label, r.diff, r.within])).toEqual([
      ['Calorias', -27, true],
      ['Proteína', -14, false],
      ['Carboidrato', 36, false],
      ['Gordura', -3, true],
    ])
    expect(off).toBe(2)
  })
})
