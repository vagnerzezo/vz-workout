import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { HomeSummary, WeightEntry } from '@workspace/core'
import { api } from '../../../shared/api/client'

export const homeKeys = {
  all: ['home'] as const,
  summary: () => [...homeKeys.all, 'summary'] as const,
}

export function useHomeSummary() {
  return useQuery({
    queryKey: homeKeys.summary(),
    queryFn: () => api('/me/home', HomeSummary),
  })
}

export function useLogWeight() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (kg: number) => api('/me/weights', WeightEntry, { method: 'POST', body: JSON.stringify({ kg }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: homeKeys.summary() }),
  })
}
