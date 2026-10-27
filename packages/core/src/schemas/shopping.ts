import { z } from 'zod'

/** Item que o aluno pôs na lista por conta própria ("Adicionar item fora do plano"). */
export const ShoppingExtra = z.object({
  id: z.string(),
  name: z.string().min(1),
  quantity: z.string(), // texto livre: "1 pacote", "" quando não informou
})
export type ShoppingExtra = z.infer<typeof ShoppingExtra>

/** Resposta de GET /me/shopping-list: o que já foi comprado e os itens fora do plano. */
export const ShoppingListState = z.object({
  checkedIds: z.array(z.string()), // itemId do plano ou id do item fora do plano
  extras: z.array(ShoppingExtra),
})
export type ShoppingListState = z.infer<typeof ShoppingListState>
