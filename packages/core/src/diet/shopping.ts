import type { Aisle, GroceryNeed, MealFood } from '../schemas/diet'

export const aisleLabels: Record<Aisle, string> = {
  produce: 'Hortifrúti',
  protein: 'Carnes e ovos',
  grains: 'Grãos e cereais',
  dairy: 'Laticínios',
  other: 'Outros',
}

export type ShoppingItem = Omit<GroceryNeed, 'aisle'>
export type ShoppingGroup = { aisle: Aisle; items: ShoppingItem[] }

/**
 * Lista de compras de um período: soma o que cada alimento pede por porção, uma porção por dia.
 * Itens repetidos em refeições diferentes viram uma linha só; grupos na ordem do mercado.
 */
export function shoppingList(meals: { foods: Pick<MealFood, 'groceries'>[] }[], days: number): ShoppingGroup[] {
  const items = new Map<string, GroceryNeed>()
  for (const need of meals.flatMap((m) => m.foods.flatMap((f) => f.groceries))) {
    const prev = items.get(need.itemId)
    items.set(need.itemId, { ...need, amount: (prev?.amount ?? 0) + need.amount * days })
  }
  return (Object.keys(aisleLabels) as Aisle[])
    .map((aisle) => ({
      aisle,
      items: [...items.values()].filter((i) => i.aisle === aisle).map(({ itemId, name, amount, unit }) => ({ itemId, name, amount, unit })),
    }))
    .filter((g) => g.items.length > 0)
}

const oneDecimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })

/**
 * Quantidade de compra, sempre arredondada para cima: ninguém compra 1.050 g.
 * 1050 g → "1,1 kg" · 320 g → "350 g" · 1300 ml → "1,3 L" · 6.3 un → "7 un."
 */
export function formatPurchase(amount: number, unit: GroceryNeed['unit']): string {
  if (unit === 'un') return `${Math.ceil(amount - 1e-9)} un.`
  const [small, big] = unit === 'g' ? ['g', 'kg'] : ['ml', 'L']
  if (amount < 1000) return `${Math.ceil(amount / 50 - 1e-9) * 50} ${small}`
  return `${oneDecimal.format(Math.ceil(amount / 100 - 1e-9) / 10)} ${big}`
}
