import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { NotificationSettings } from '@workspace/core'
import { api } from '../../../shared/api/client'
import { profileKeys } from './queries'

const key = [...profileKeys.all, 'settings'] as const

export function useNotificationSettings() {
  return useQuery({ queryKey: key, queryFn: () => api('/me/settings', NotificationSettings) })
}

/** Liga/desliga na hora; se a API recusar, volta. */
export function useUpdateNotificationSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (patch: Partial<NotificationSettings>) => api('/me/settings', NotificationSettings, { method: 'PUT', body: JSON.stringify(patch) }),
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData<NotificationSettings>(key)
      qc.setQueryData<NotificationSettings>(key, (old) => old && { ...old, ...patch })
      return { previous }
    },
    onError: (_e, _p, context) => {
      if (context?.previous) qc.setQueryData(key, context.previous)
    },
    onSuccess: (settings) => qc.setQueryData(key, settings),
  })
}
