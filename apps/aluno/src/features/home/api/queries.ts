import { useQuery } from '@tanstack/react-query'
import { HomeSummary } from '@workspace/core'
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
