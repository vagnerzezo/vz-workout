import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { AppNotification } from '@workspace/core'
import { api } from '../../../shared/api/client'

const key = ['notifications'] as const

export function useNotifications() {
  return useQuery({ queryKey: key, queryFn: () => api('/me/notifications', z.array(AppNotification)) })
}

/** Respostas 204: sem corpo para validar. */
async function post(path: string) {
  const res = await fetch(`/api${path}`, { method: 'POST', credentials: 'include' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}

/** Marca como lida na hora (id) ou todas (null); o contador do sino na Home recarrega. */
export function useMarkRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string | null) => post(id ? `/me/notifications/${id}/read` : '/me/notifications/read-all'),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData<AppNotification[]>(key)
      qc.setQueryData<AppNotification[]>(key, (old) => old?.map((n) => (id === null || n.id === id ? { ...n, read: true } : n)))
      return { previous }
    },
    onError: (_e, _id, context) => {
      if (context?.previous) qc.setQueryData(key, context.previous)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['home'] }),
  })
}
