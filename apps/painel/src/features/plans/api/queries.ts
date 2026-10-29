import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CoachPlans, PlanTemplateSummary, type AssignPlan } from '@workspace/core'
import { api } from '../../../shared/api/client'
import { refreshPortfolio } from '../../students/api/queries'

export const planKeys = { all: ['plans'] as const }

export function usePlans() {
  return useQuery({ queryKey: planKeys.all, queryFn: () => api('/coach/plans', CoachPlans) })
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

function useRefreshPlans<V, R>(fn: (vars: V) => Promise<R>) {
  const qc = useQueryClient()
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries({ queryKey: planKeys.all }) })
}

export const useDuplicatePlan = () => useRefreshPlans((id: string) => api(`/coach/plans/${id}/duplicate`, PlanTemplateSummary, { method: 'POST' }))
export const useArchivePlan = () => useRefreshPlans((id: string) => post(`/coach/plans/${id}/archive`))
export const useUnarchivePlan = () => useRefreshPlans((id: string) => post(`/coach/plans/${id}/unarchive`))

/** Atribuir muda a vigência da ficha dos alunos: a carteira (lista, dashboard) também recarrega. */
export function useAssignPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ templateId, ...body }: AssignPlan & { templateId: string }) => post(`/coach/plans/${templateId}/assign`, body),
    onSuccess: () => Promise.all([qc.invalidateQueries({ queryKey: planKeys.all }), refreshPortfolio(qc)]),
  })
}
