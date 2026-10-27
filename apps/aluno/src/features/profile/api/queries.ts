import { useQuery } from '@tanstack/react-query'
import { StudentProfile, StudentProgress } from '@workspace/core'
import { api } from '../../../shared/api/client'

export const profileKeys = {
  all: ['profile'] as const,
  progress: () => [...profileKeys.all, 'progress'] as const,
}

export function useProfile() {
  return useQuery({ queryKey: profileKeys.all, queryFn: () => api('/me/profile', StudentProfile) })
}

export function useProgress() {
  return useQuery({ queryKey: profileKeys.progress(), queryFn: () => api('/me/progress', StudentProgress) })
}
