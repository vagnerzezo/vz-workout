import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { StudentList } from '@workspace/core'
import { ApiError, api } from '../../../shared/api/client'
import { coachKeys } from '../../../shared/api/coach'
import { dashboardKeys } from '../../dashboard/api/queries'

export const studentKeys = {
  all: ['students'] as const,
}

export function useStudents() {
  return useQuery({
    queryKey: studentKeys.all,
    queryFn: () => api('/coach/students', StudentList),
  })
}

/** Respostas 204: sem corpo para validar. O status vai no ApiError (409 = regra de negócio). */
async function post(path: string, body?: unknown, method: 'POST' | 'DELETE' = 'POST') {
  const res = await fetch(`/api${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new ApiError(res.status, await res.text())
}

/** Depois de mexer na carteira: a lista, os contadores do menu e o dashboard recarregam. */
export const refreshPortfolio = (qc: QueryClient) =>
  Promise.all([
    qc.invalidateQueries({ queryKey: studentKeys.all }),
    qc.invalidateQueries({ queryKey: coachKeys.me }),
    qc.invalidateQueries({ queryKey: dashboardKeys.all }),
  ])

function useRefreshAfter<V>(fn: (vars: V) => Promise<void>) {
  const qc = useQueryClient()
  return useMutation({ mutationFn: fn, onSuccess: () => refreshPortfolio(qc) })
}

export const useArchiveStudents = () => useRefreshAfter((ids: string[]) => post('/coach/students/archive', { ids }))
export const useUnarchiveStudents = () => useRefreshAfter((ids: string[]) => post('/coach/students/unarchive', { ids }))
export const useTagStudents = () => useRefreshAfter(({ ids, tag }: { ids: string[]; tag: string }) => post('/coach/students/tags', { ids, tag }))

export function useResendInvite() {
  return useMutation({ mutationFn: (studentId: string) => post(`/coach/students/${studentId}/invite/resend`) })
}

/** Excluir de vez: só convite pendente (a API devolve 409 para quem já tem histórico). */
export const useDeleteStudent = () => useRefreshAfter((id: string) => post(`/coach/students/${id}`, undefined, 'DELETE'))
