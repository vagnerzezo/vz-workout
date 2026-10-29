import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CoachCheckIns } from '@workspace/core'
import { api } from '../../../shared/api/client'
import { coachKeys } from '../../../shared/api/coach'
import { dashboardKeys } from '../../dashboard/api/queries'
import { studentProfileKeys } from '../../student-profile/api/queries'

export const checkInKeys = { all: ['check-ins'] as const }

export function useCheckIns() {
  return useQuery({ queryKey: checkInKeys.all, queryFn: () => api('/coach/check-ins', CoachCheckIns) })
}

/** Respostas 204: sem corpo para validar. */
async function post(path: string, body: unknown) {
  const res = await fetch(`/api${path}`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}

/** Responder tira o check-in da fila: o contador do menu, o dashboard e o perfil do aluno recarregam. */
export function useReplyCheckIn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, text }: { id: string; text: string; studentId: string }) => post(`/coach/check-ins/${id}/reply`, { text }),
    onSuccess: (_r, { studentId }) =>
      Promise.all([
        qc.invalidateQueries({ queryKey: checkInKeys.all }),
        qc.invalidateQueries({ queryKey: coachKeys.counters }),
        qc.invalidateQueries({ queryKey: dashboardKeys.all }),
        qc.invalidateQueries({ queryKey: studentProfileKeys.checkIns(studentId) }),
      ]),
  })
}

export function useRemindCheckIns() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (studentIds: string[]) => post('/coach/check-ins/remind', { studentIds }),
    onSuccess: () => qc.invalidateQueries({ queryKey: checkInKeys.all }),
  })
}
