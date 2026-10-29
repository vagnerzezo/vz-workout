import { describe, expect, it } from 'vitest'
import type { Food, TemplateMeal } from '../schemas/diet-templates'
import { mifflinStJeor, targetKcal, tdee, templateTargets } from './energy'
import { foodMacros, macroTargets, templateTotals } from './macros'
import { scaleMeals } from './scaling'
import { equivalentGrams, substitutionCount } from './substitutions'

const food = (id: string, kcal: number, protein: number, carbs: number, fat: number): Food => ({ id, name: id, per100: { kcal, protein, carbs, fat }, unit: null, unitGrams: null, alternatives: [] })
const arroz = food('arroz', 128, 2.5, 28.1, 0.2)
const batata = food('batata', 77, 0.6, 18.4, 0.1)
const frango = food('frango', 159, 32, 0, 2.5)

describe('gasto energético', () => {
  it('Mifflin-St Jeor do canvas: 91,6 kg, 182 cm, 33 anos, homem', () => {
    expect(mifflinStJeor({ weightKg: 91.6, heightCm: 182, age: 33, sex: 'male' })).toBeCloseTo(1893.5, 1)
    expect(mifflinStJeor({ weightKg: 60, heightCm: 165, age: 30, sex: 'female' })).toBeCloseTo(1320.25, 2)
    expect(Math.round(tdee(1893.5, 1.55))).toBe(2935)
  })

  it.each([
    ['deficit20', 2373],
    ['deficit500', 2466],
    ['maintenance', 2966],
    ['surplus10', 3263],
    ['manual', 2127],
  ] as const)('meta %s', (mode, kcal) => expect(targetKcal(2966, mode, 2127)).toBe(kcal))

  it('carboidrato completa a meta e não fica negativo', () => {
    expect(macroTargets(2127, 1.9, 0.8, 91.6)).toEqual({ kcal: 2127, protein: 174, carbs: 194, fat: 73 })
    expect(macroTargets(800, 2.5, 1.2, 100).carbs).toBe(0)
  })

  it('metas do modelo no peso de outro aluno (a meta manual escala junto)', () => {
    const t = { reference: { weightKg: 91.6, heightCm: 182, age: 33, sex: 'male' as const }, activityFactor: 1.55, calorieMode: 'manual' as const, manualKcal: 2127, proteinPerKg: 1.9, fatPerKg: 0.8 }
    expect(templateTargets(t).targets.kcal).toBe(2127)
    expect(templateTargets(t, 64).targets).toMatchObject({ kcal: 1486, protein: 122, fat: 51 })
  })
})

describe('porções', () => {
  it('macros por grama', () => {
    expect(foodMacros(frango, 150)).toEqual({ kcal: 238.5, protein: 48, carbs: 0, fat: 3.75 })
  })

  it('totais da ficha', () => {
    const meals: TemplateMeal[] = [{ id: 'a', name: 'Almoço', time: '12:30', foods: [{ id: '1', foodId: 'arroz', grams: 100, substitutes: [] }, { id: '2', foodId: 'frango', grams: 100, substitutes: [] }, { id: '3', foodId: 'nao-existe', grams: 50, substitutes: [] }] }]
    expect(templateTotals(meals, { arroz, frango })).toEqual({ kcal: 287, protein: 34.5, carbs: 28.1, fat: 2.7 })
  })

  it('substituição pela mesma energia, em múltiplos de 5 g', () => {
    expect(equivalentGrams(arroz, batata, 150)).toBe(250) // 192 kcal ÷ 0,77
    expect(equivalentGrams(frango, arroz, 2)).toBe(5)
    const meals: TemplateMeal[] = [{ id: 'a', name: 'A', time: '07:00', foods: [{ id: '1', foodId: 'arroz', grams: 150, substitutes: ['batata', 'x'] }, { id: '2', foodId: 'frango', grams: 100, substitutes: ['y'] }] }]
    expect(substitutionCount(meals)).toBe(3)
  })

  it('ajuste ao peso: proporcional e arredondado a 5 g', () => {
    const meals: TemplateMeal[] = [{ id: 'a', name: 'A', time: '07:00', foods: [{ id: '1', foodId: 'arroz', grams: 150, substitutes: [] }, { id: '2', foodId: 'frango', grams: 8, substitutes: [] }] }]
    expect(scaleMeals(meals, 91.6, 64)[0]!.foods.map((f) => f.grams)).toEqual([105, 5])
  })
})
