import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { CoachLibrary, ExerciseDetail, LibraryExercise, type NewExercise } from '@workspace/core'
import { api } from '../../../shared/api/client'

export const libraryKeys = { all: ['library'] as const, exercise: (id: string) => ['library', 'exercise', id] as const }

export function useLibrary() {
  return useQuery({ queryKey: libraryKeys.all, queryFn: () => api('/coach/library', CoachLibrary) })
}

export function useExerciseDetail(id: string | null) {
  return useQuery({ queryKey: libraryKeys.exercise(id ?? ''), enabled: !!id, queryFn: () => api(`/coach/library/exercises/${id}`, ExerciseDetail) })
}

/** Exercício novo ou duplicado: a biblioteca e a lista do editor de ficha recarregam. */
function useAddExercise<V>(fn: (v: V) => Promise<LibraryExercise>) {
  const qc = useQueryClient()
  return useMutation({ mutationFn: fn, onSuccess: () => Promise.all([qc.invalidateQueries({ queryKey: libraryKeys.all }), qc.invalidateQueries({ queryKey: ['exercises'] })]) })
}

export const useCreateExercise = () => useAddExercise((n: NewExercise) => api('/coach/library/exercises', LibraryExercise, { method: 'POST', body: JSON.stringify(n) }))
export const useDuplicateExercise = () => useAddExercise((id: string) => api(`/coach/library/exercises/${id}/duplicate`, LibraryExercise, { method: 'POST' }))

export function useSendExercise() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, studentIds }: { id: string; studentIds: string[] }) => api(`/coach/library/exercises/${id}/send`, z.object({ sent: z.number() }), { method: 'POST', body: JSON.stringify({ studentIds }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chat'] }),
  })
}

export function useShareMaterial() {
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/coach/library/materials/${id}/share`, { method: 'POST', credentials: 'include' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
    },
  })
}
