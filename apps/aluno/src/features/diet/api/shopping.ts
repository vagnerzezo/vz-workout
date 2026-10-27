import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ShoppingListState } from '@workspace/core'
import { api } from '../../../shared/api/client'

const key = ['shopping-list'] as const

export function useShoppingList() {
  return useQuery({ queryKey: key, queryFn: () => api('/me/shopping-list', ShoppingListState) })
}

/** Marcar como comprado aparece na hora; se a API recusar, volta. */
export function useToggleShoppingItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, checked }: { id: string; checked: boolean }) =>
      api(`/me/shopping-list/items/${id}`, ShoppingListState, { method: 'PUT', body: JSON.stringify({ checked }) }),
    onMutate: async ({ id, checked }) => {
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData<ShoppingListState>(key)
      qc.setQueryData<ShoppingListState>(key, (old) => {
        if (!old) return old
        const rest = old.checkedIds.filter((c) => c !== id)
        return { ...old, checkedIds: checked ? [...rest, id] : rest }
      })
      return { previous }
    },
    onError: (_error, _v, context) => {
      if (context?.previous) qc.setQueryData(key, context.previous)
    },
    onSuccess: (state) => qc.setQueryData(key, state),
  })
}

export function useAddShoppingExtra() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (extra: { name: string; quantity: string }) =>
      api('/me/shopping-list/extras', ShoppingListState, { method: 'POST', body: JSON.stringify(extra) }),
    onSuccess: (state) => qc.setQueryData(key, state),
  })
}

export function useRemoveShoppingExtra() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api(`/me/shopping-list/extras/${id}`, ShoppingListState, { method: 'DELETE' }),
    onSuccess: (state) => qc.setQueryData(key, state),
  })
}
