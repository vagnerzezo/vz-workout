import { useIsMutating, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { WaterLog } from '@workspace/core'
import { api } from './client'

/** Água de hoje: a Home e a Dieta usam o mesmo cache, então registrar numa tela atualiza a outra. */
export const waterKeys = {
  today: ['water', 'today'] as const,
}

const waterMutationKey = ['water', 'mutation'] as const

export function useWaterToday() {
  return useQuery({
    queryKey: waterKeys.today,
    queryFn: () => api('/me/water', WaterLog),
  })
}

function useWaterMutation<V>(request: (v: V) => Promise<WaterLog>, optimistic: (water: WaterLog, v: V) => WaterLog) {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: waterMutationKey,
    mutationFn: request,
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: waterKeys.today })
      const previous = qc.getQueryData<WaterLog>(waterKeys.today)
      if (previous) qc.setQueryData(waterKeys.today, optimistic(previous, v))
      return { previous }
    },
    onError: (_error, _v, context) => {
      if (context?.previous) qc.setQueryData(waterKeys.today, context.previous)
    },
    onSuccess: (water) => qc.setQueryData(waterKeys.today, water),
  })
}

export function useAddWater() {
  return useWaterMutation(
    (ml: number) => api('/me/water', WaterLog, { method: 'POST', body: JSON.stringify({ ml }) }),
    (water, ml) => ({
      ...water,
      consumedMl: water.consumedMl + ml,
      entries: [...water.entries, { id: `pendente-${Date.now()}`, ml }],
    }),
  )
}

/** Desfaz o último registro de água do dia. */
export function useUndoWater() {
  return useWaterMutation(
    (entryId: string) => api(`/me/water/entries/${entryId}`, WaterLog, { method: 'DELETE' }),
    (water, entryId) => {
      const entry = water.entries.find((e) => e.id === entryId)
      if (!entry) return water
      return {
        ...water,
        consumedMl: Math.max(0, water.consumedMl - entry.ml),
        entries: water.entries.filter((e) => e.id !== entryId),
      }
    },
  )
}

/** Enquanto um registro de água está indo para o servidor, o "Desfazer" espera. */
export const useIsSavingWater = () => useIsMutating({ mutationKey: waterMutationKey }) > 0

/** Ações dos botões de água com os avisos de erro: igual nas duas telas. */
export const WATER_ERRORS = {
  add: 'Não foi possível registrar a água. Tente de novo.',
  undo: 'Não foi possível desfazer. Tente de novo.',
}
