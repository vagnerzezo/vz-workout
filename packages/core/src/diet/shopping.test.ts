import { describe, expect, it } from 'vitest'
import type { GroceryNeed } from '../schemas/diet'
import { formatPurchase, shoppingList } from './shopping'

const need = (itemId: string, aisle: GroceryNeed['aisle'], amount: number, unit: GroceryNeed['unit'] = 'g'): GroceryNeed => ({
  itemId, name: itemId, aisle, amount, unit,
})
const food = (...groceries: GroceryNeed[]) => ({ groceries })

describe('shoppingList', () => {
  const meals = [
    { foods: [food(need('ovos', 'protein', 2, 'un')), food(need('banana', 'produce', 1, 'un'))] },
    { foods: [food(need('arroz', 'grains', 50)), food(need('alface', 'produce', 0.25, 'un'), need('tomate', 'produce', 100))] },
    { foods: [food(need('ovos', 'protein', 1, 'un')), food()] },
  ]

  it('soma o mesmo item de refeições diferentes e multiplica pelos dias', () => {
    const list = shoppingList(meals, 7)
    expect(list.find((g) => g.aisle === 'protein')?.items).toEqual([{ itemId: 'ovos', name: 'ovos', amount: 21, unit: 'un' }])
    expect(list.find((g) => g.aisle === 'grains')?.items[0]?.amount).toBe(350)
  })

  it('grupos na ordem do mercado, sem grupos vazios', () => {
    expect(shoppingList(meals, 1).map((g) => g.aisle)).toEqual(['produce', 'protein', 'grains'])
    expect(shoppingList(meals, 1)[0]!.items.map((i) => i.itemId)).toEqual(['banana', 'alface', 'tomate'])
  })

  it('duas semanas é o dobro', () => {
    expect(shoppingList(meals, 14).find((g) => g.aisle === 'produce')?.items.find((i) => i.itemId === 'tomate')?.amount).toBe(1400)
  })
})

describe('formatPurchase', () => {
  it.each([
    [1050, 'g', '1,1 kg'],
    [1000, 'g', '1 kg'],
    [320, 'g', '350 g'],
    [350, 'g', '350 g'],
    [91, 'ml', '100 ml'],
    [1300, 'ml', '1,3 L'],
    [6.3, 'un', '7 un.'],
    [1.75, 'un', '2 un.'],
    [7, 'un', '7 un.'],
  ] as const)('%s %s → %s', (amount, unit, text) => {
    expect(formatPurchase(amount, unit)).toBe(text)
  })

  it('erro de ponto flutuante não sobe um degrau', () => {
    expect(formatPurchase(0.1 * 3 * 1000, 'g')).toBe('300 g') // 300.00000000000006
  })
})
