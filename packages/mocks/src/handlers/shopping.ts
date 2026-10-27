import { http, HttpResponse } from 'msw'
import type { ShoppingListState } from '@workspace/core'
import { currentScenario, db, latency, newId } from '../db'

const failed = () => HttpResponse.json({ message: 'Erro simulado' }, { status: 500 })

/** Lista de compras: os itens vêm da dieta (calculados no app); aqui fica só o que o aluno marcou e acrescentou. */
export const shoppingHandlers = [
  http.get('/api/me/shopping-list', async () => {
    await latency()
    if (currentScenario() === 'erro') return failed()
    return HttpResponse.json<ShoppingListState>(db.shopping)
  }),

  http.put('/api/me/shopping-list/items/:id', async ({ params, request }) => {
    const { checked } = (await request.json()) as { checked: boolean }
    await latency()
    const id = String(params.id)
    const rest = db.shopping.checkedIds.filter((c) => c !== id)
    db.shopping = { ...db.shopping, checkedIds: checked ? [...rest, id] : rest }
    return HttpResponse.json<ShoppingListState>(db.shopping)
  }),

  http.post('/api/me/shopping-list/extras', async ({ request }) => {
    const { name, quantity } = (await request.json()) as { name: string; quantity: string }
    if (!name?.trim() || name.trim().length > 60) return HttpResponse.json({ message: 'Nome inválido' }, { status: 422 })
    await latency()
    const extra = { id: newId('extra'), name: name.trim(), quantity: (quantity ?? '').trim() }
    db.shopping = { ...db.shopping, extras: [...db.shopping.extras, extra] }
    return HttpResponse.json<ShoppingListState>(db.shopping, { status: 201 })
  }),

  http.delete('/api/me/shopping-list/extras/:id', async ({ params }) => {
    const id = String(params.id)
    if (!db.shopping.extras.some((e) => e.id === id)) return HttpResponse.json({ message: 'Item não encontrado' }, { status: 404 })
    await latency()
    db.shopping = {
      checkedIds: db.shopping.checkedIds.filter((c) => c !== id),
      extras: db.shopping.extras.filter((e) => e.id !== id),
    }
    return HttpResponse.json<ShoppingListState>(db.shopping)
  }),
]
