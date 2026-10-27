import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import type { CheckInAnswers, PhotoPose } from '@workspace/core'
import { PendingCheckIn, StudentProfile, StudentProgress } from '@workspace/core'
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

export const checkInKeys = {
  pending: ['check-in'] as const,
}

export function usePendingCheckIn() {
  return useQuery({ queryKey: checkInKeys.pending, queryFn: () => api('/me/check-in', PendingCheckIn.nullable()) })
}

/** Envia fotos e respostas. Depois, Perfil, Progresso e Home recarregam (peso novo, fotos, cartão do check-in). */
export function useSendCheckIn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, answers, photos }: { id: string; answers: CheckInAnswers; photos: Partial<Record<PhotoPose, File>> }) => {
      const body = new FormData()
      body.set('answers', JSON.stringify(answers))
      for (const [pose, file] of Object.entries(photos)) body.set(`photo_${pose}`, file)
      return api(`/me/check-ins/${id}`, z.object({ id: z.string() }), { method: 'POST', body })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: checkInKeys.pending })
      qc.invalidateQueries({ queryKey: profileKeys.all })
      qc.invalidateQueries({ queryKey: ['home'] })
    },
  })
}
