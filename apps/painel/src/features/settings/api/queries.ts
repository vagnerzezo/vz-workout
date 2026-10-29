import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CoachSettings } from '@workspace/core'
import { api } from '../../../shared/api/client'
import { coachKeys } from '../../../shared/api/coach'

export const settingsKeys = { all: ['settings'] as const }

export function useCoachSettings() {
  return useQuery({ queryKey: settingsKeys.all, queryFn: () => api('/coach/settings', CoachSettings) })
}

/** Salva tudo; a marca nova vale na hora para o menu do painel e para o app dos alunos. */
export function useSaveSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (s: CoachSettings) => api('/coach/settings', CoachSettings, { method: 'PUT', body: JSON.stringify(s) }),
    onSuccess: (saved) => {
      qc.setQueryData(settingsKeys.all, saved)
      return qc.invalidateQueries({ queryKey: coachKeys.me })
    },
  })
}

export function useEndSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/coach/settings/sessions/${id}/end`, { method: 'POST', credentials: 'include' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: settingsKeys.all }),
  })
}
