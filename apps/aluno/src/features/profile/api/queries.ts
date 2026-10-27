import { useQuery } from '@tanstack/react-query'
import { StudentProfile } from '@workspace/core'
import { api } from '../../../shared/api/client'

export const profileKeys = {
  all: ['profile'] as const,
}

export function useProfile() {
  return useQuery({ queryKey: profileKeys.all, queryFn: () => api('/me/profile', StudentProfile) })
}
