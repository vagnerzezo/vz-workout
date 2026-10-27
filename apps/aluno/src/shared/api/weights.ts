import { useMutation, useQueryClient } from '@tanstack/react-query'
import { WeightEntry } from '@workspace/core'
import { api } from './client'

/** Registra uma pesagem; a Home ("Último peso"), o Perfil (objetivo de peso) e o Progresso recarregam. */
export function useLogWeight() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (kg: number) => api('/me/weights', WeightEntry, { method: 'POST', body: JSON.stringify({ kg }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['home'] })
      qc.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}
