import { useQuery } from '@tanstack/react-query'
import { Coach, CoachCounters } from '@workspace/core'
import { api } from './client'

export const coachKeys = {
  me: ['coach'] as const,
  counters: ['coach', 'counters'] as const,
}

/** Treinador logado e o uso do plano. Muda pouco: busca uma vez por sessão. */
export function useCoach() {
  return useQuery({
    queryKey: coachKeys.me,
    queryFn: () => api('/coach/me', Coach),
    staleTime: Infinity,
  })
}

/** Contadores do menu (check-ins, conversas, comprovantes…). */
export function useCounters() {
  return useQuery({
    queryKey: coachKeys.counters,
    queryFn: () => api('/coach/counters', CoachCounters),
    refetchInterval: 60_000,
  })
}
