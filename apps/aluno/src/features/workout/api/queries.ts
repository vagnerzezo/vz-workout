import { useQuery } from '@tanstack/react-query'
import { StudentPlan } from '@workspace/core'
import { api } from '../../../shared/api/client'

export const workoutKeys = {
  all: ['workout'] as const,
  plan: () => [...workoutKeys.all, 'plan'] as const,
}

export function useCurrentPlan() {
  return useQuery({
    queryKey: workoutKeys.plan(),
    queryFn: () => api('/me/workout-plan', StudentPlan),
    staleTime: 5 * 60_000, // a ficha muda pouco; não precisa buscar a cada foco
  })
}
