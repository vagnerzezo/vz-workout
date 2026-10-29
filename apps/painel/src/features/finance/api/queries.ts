import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CoachFinance, type BillingRules, type PixSettings } from '@workspace/core'
import { api } from '../../../shared/api/client'
import { coachKeys } from '../../../shared/api/coach'
import { dashboardKeys } from '../../dashboard/api/queries'

export const financeKeys = { all: ['finance'] as const }

export function useFinance() {
  return useQuery({ queryKey: financeKeys.all, queryFn: () => api('/coach/finance', CoachFinance) })
}

async function send(path: string, method: 'POST' | 'PUT', body?: unknown) {
  const res = await fetch(`/api${path}`, { method, credentials: 'include', headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}

/** Decidir um comprovante muda o contador do menu e o dashboard também. */
function useFinanceMutation<V>(fn: (v: V) => Promise<void>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => Promise.all([qc.invalidateQueries({ queryKey: financeKeys.all }), qc.invalidateQueries({ queryKey: coachKeys.counters }), qc.invalidateQueries({ queryKey: dashboardKeys.all })]),
  })
}

export const useConfirmCharge = () => useFinanceMutation((id: string) => send(`/coach/charges/${id}/confirm`, 'POST'))
export const useRejectCharge = () => useFinanceMutation(({ id, reason }: { id: string; reason: string }) => send(`/coach/charges/${id}/reject`, 'POST', { reason }))
export const useRemindCharge = () => useFinanceMutation((id: string) => send(`/coach/charges/${id}/remind`, 'POST'))
export const useSavePix = () => useFinanceMutation((pix: PixSettings) => send('/coach/finance/pix', 'PUT', pix))
export const useSaveRules = () => useFinanceMutation((rules: BillingRules) => send('/coach/finance/rules', 'PUT', rules))
export const useTogglePlan = () => useFinanceMutation(({ id, active }: { id: string; active: boolean }) => send(`/coach/finance/plans/${id}`, 'PUT', { active }))
