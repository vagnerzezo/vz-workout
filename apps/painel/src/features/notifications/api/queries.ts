import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { CoachNotifications, NotificationAudience, type CoachPrefKey, type NewNotification } from '@workspace/core'
import { api } from '../../../shared/api/client'
import { coachKeys } from '../../../shared/api/coach'

export const notificationKeys = { all: ['notifications'] as const, audience: ['notifications', 'audience'] as const }

export function useCoachNotifications() {
  return useQuery({ queryKey: notificationKeys.all, queryFn: () => api('/coach/notifications', CoachNotifications) })
}

export function useNotificationAudience() {
  return useQuery({ queryKey: notificationKeys.audience, queryFn: () => api('/coach/notifications/audience', NotificationAudience) })
}

async function send(path: string, method: 'POST' | 'PUT', body?: unknown) {
  const res = await fetch(`/api${path}`, { method, credentials: 'include', headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res
}

/** Mudanças na caixa: a lista e o contador do menu recarregam. */
function useRefresh<V>(fn: (v: V) => Promise<unknown>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => Promise.all([qc.invalidateQueries({ queryKey: notificationKeys.all, exact: true }), qc.invalidateQueries({ queryKey: coachKeys.counters })]),
  })
}

export const useReadNotification = () => useRefresh((id: string) => send(`/coach/notifications/${id}/read`, 'POST'))
export const useReadAll = () => useRefresh(() => send('/coach/notifications/read-all', 'POST'))
export const useToggleAutomation = () => useRefresh(({ id, enabled }: { id: string; enabled: boolean }) => send(`/coach/automations/${id}`, 'PUT', { enabled }))
export const usePrefs = () => useRefresh((prefs: Partial<Record<CoachPrefKey, boolean>>) => send('/coach/notification-prefs', 'PUT', prefs))
export const useCancelScheduled = () => useRefresh((id: string) => send(`/coach/notifications/${id}/cancel`, 'POST'))
export const useTestNotification = () => useMutation({ mutationFn: () => send('/coach/notifications/test', 'POST') })

export function useSendNotification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (n: NewNotification) => z.object({ sent: z.number(), push: z.number(), at: z.string(), status: z.enum(['sent', 'scheduled']) }).parse(await (await send('/coach/notifications', 'POST', n)).json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationKeys.all, exact: true }),
  })
}
