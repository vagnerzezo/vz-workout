import { describe, expect, it } from 'vitest'
import { chosenSubstitute, dayTotals, mealTotals, nextPendingMeal, percentOf } from './meals'

const food = (kcal: number, protein: number, carbs: number, fat: number) => ({
  foodId: 'f', name: 'x', portion: '1', kcal, protein, carbs, fat,
})

// Café da manhã do canvas: 420 kcal · P 30 · C 50 · G 12
const breakfast = {
  id: 'cafe',
  foods: [food(140, 6, 24, 2), food(150, 13, 1, 10), food(90, 1, 23, 0), food(40, 10, 2, 0)],
}
const lunch = { id: 'almoco', foods: [food(610, 42, 50, 20)] }
const dinner = { id: 'jantar', foods: [food(480, 38, 48, 14)] }

describe('totais de refeição e do dia', () => {
  it('soma os alimentos da refeição', () => {
    expect(mealTotals(breakfast)).toEqual({ kcal: 420, protein: 30, carbs: 50, fat: 12 })
  })

  it('o dia só conta as refeições concluídas', () => {
    expect(dayTotals([breakfast, lunch, dinner], ['cafe', 'jantar'])).toEqual({ kcal: 900, protein: 68, carbs: 98, fat: 26 })
    expect(dayTotals([breakfast], [])).toEqual({ kcal: 0, protein: 0, carbs: 0, fat: 0 })
  })
})

describe('substituições', () => {
  // Pré-treino do canvas: tapioca trocada por cuscuz
  const tapioca = { ...food(140, 0, 34, 0), foodId: 'tapioca', substitutes: [{ ...food(136, 3, 30, 1), foodId: 'cuscuz' }] }
  const pre = { id: 'pre', foods: [tapioca, food(60, 12, 1, 1)] }

  it('a refeição soma o substituto escolhido no lugar do original', () => {
    expect(mealTotals(pre)).toEqual({ kcal: 200, protein: 12, carbs: 35, fat: 1 })
    expect(mealTotals(pre, { tapioca: 'cuscuz' })).toEqual({ kcal: 196, protein: 15, carbs: 31, fat: 2 })
  })

  it('o dia usa as substituições de cada refeição', () => {
    expect(dayTotals([breakfast, pre], ['cafe', 'pre'], { pre: { tapioca: 'cuscuz' } }).kcal).toBe(616)
  })

  it('substituto que não está mais na ficha volta ao original', () => {
    expect(chosenSubstitute(tapioca, { tapioca: 'pao_frances' })).toBeNull()
    expect(chosenSubstitute(tapioca, { tapioca: 'cuscuz' })?.foodId).toBe('cuscuz')
    expect(mealTotals(pre, { tapioca: 'pao_frances' }).kcal).toBe(200)
  })
})

describe('nextPendingMeal', () => {
  it('é a primeira não feita, mesmo que uma depois já esteja feita', () => {
    expect(nextPendingMeal([breakfast, lunch, dinner], ['cafe', 'jantar'])?.id).toBe('almoco')
  })

  it('null com tudo feito', () => {
    expect(nextPendingMeal([breakfast], ['cafe'])).toBeNull()
  })
})

describe('percentOf', () => {
  it.each([
    [1240, 2127, 58],
    [2300, 2127, 108],
    [10, 0, 0],
  ])('%i de %i → %i%%', (v, goal, pct) => {
    expect(percentOf(v, goal)).toBe(pct)
  })
})
