import { describe, expect, it } from 'vitest'
import { dayTotals, mealTotals, nextPendingMeal, percentOf } from './meals'

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
