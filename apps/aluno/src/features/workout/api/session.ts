import { useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { LoggedSet, SessionTemplate, WorkoutSession, type FinishSessionRequest } from '@workspace/core'
import { api } from '../../../shared/api/client'
import { useOnline } from '../../../shared/hooks/use-online'
import { toLoggedSet, useActiveWorkout } from '../store/active-workout'
import { workoutKeys } from './queries'

export const sessionKeys = {
  template: (dayId: string) => [...workoutKeys.all, 'template', dayId] as const,
}

export function useSessionTemplate(dayId: string) {
  return useQuery({
    queryKey: sessionKeys.template(dayId),
    queryFn: () => api(`/me/workout-days/${dayId}/template`, SessionTemplate),
    staleTime: 30 * 60_000, // não muda durante o treino
  })
}

/**
 * Envia as séries pendentes quando há internet. Cada envio é um upsert (PUT),
 * então repetir depois de uma falha não duplica nada.
 */
export function useSyncPendingSets() {
  const online = useOnline()
  const sessionId = useActiveWorkout((s) => s.sessionId)
  const pending = useActiveWorkout((s) => s.pendingSync)
  const inFlight = useRef(new Set<string>())

  useEffect(() => {
    if (!online || !sessionId) return
    const { entries, markSynced } = useActiveWorkout.getState()
    for (const [key, version] of Object.entries(pending)) {
      const flightId = `${key}@${version}`
      const entry = entries[key]
      if (!entry || inFlight.current.has(flightId)) continue
      inFlight.current.add(flightId)
      api(`/me/sessions/${sessionId}/sets/${encodeURIComponent(key)}`, LoggedSet, {
        method: 'PUT',
        body: JSON.stringify(toLoggedSet(key, entry)),
      })
        .then(() => markSynced(key, version))
        .catch(() => {}) // continua pendente; tenta de novo na próxima mudança ou quando a internet voltar
        .finally(() => inFlight.current.delete(flightId))
    }
  }, [online, sessionId, pending])
}

export function useFinishSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, body }: { sessionId: string; body: FinishSessionRequest }) =>
      api(`/me/sessions/${sessionId}/finish`, WorkoutSession, { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workoutKeys.all }) // ficha (feitos na semana) e histórico
      qc.invalidateQueries({ queryKey: ['home'] })
    },
  })
}

/** Avisa a API para apagar as séries já enviadas. Se falhar (offline), o servidor descarta a sessão aberta depois. */
export function discardSession(sessionId: string) {
  fetch(`/api/me/sessions/${sessionId}`, { method: 'DELETE', credentials: 'include' }).catch(() => {})
}
