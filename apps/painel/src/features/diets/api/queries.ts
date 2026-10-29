import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CoachDiets, DietTemplateSummary, type AssignDiet } from '@workspace/core'
import { api } from '../../../shared/api/client'

export const dietKeys = { all: ['diets'] as const }

export function useDiets() {
  return useQuery({ queryKey: dietKeys.all, queryFn: () => api('/coach/diets', CoachDiets) })
}

/** Respostas 204: sem corpo para validar. */
async function post(path: string, body?: unknown) {
  const res = await fetch(`/api${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}

function useRefreshDiets<V, R>(fn: (vars: V) => Promise<R>) {
  const qc = useQueryClient()
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries({ queryKey: dietKeys.all }) })
}

export const useDuplicateDiet = () => useRefreshDiets((id: string) => api(`/coach/diets/${id}/duplicate`, DietTemplateSummary, { method: 'POST' }))
export const useArchiveDiet = () => useRefreshDiets((id: string) => post(`/coach/diets/${id}/archive`))
export const useUnarchiveDiet = () => useRefreshDiets((id: string) => post(`/coach/diets/${id}/unarchive`))
export const useAssignDiet = () => useRefreshDiets(({ templateId, ...body }: AssignDiet & { templateId: string }) => post(`/coach/diets/${templateId}/assign`, body))
