import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CoachDashboard } from '@workspace/core'
import { api } from '../../../shared/api/client'

export const dashboardKeys = {
  all: ['dashboard'] as const,
}

export function useDashboard() {
  return useQuery({
    queryKey: dashboardKeys.all,
    queryFn: () => api('/coach/dashboard', CoachDashboard),
  })
}

/** Respostas 204: sem corpo para validar. */
async function post(path: string) {
  const res = await fetch(`/api${path}`, { method: 'POST', credentials: 'include' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}

/** Some da tela na hora; se a API recusar, o dashboard volta como estava. */
function useOptimistic(path: (id: string) => string, change: (d: CoachDashboard, id: string) => CoachDashboard) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => post(path(id)),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: dashboardKeys.all })
      const previous = qc.getQueryData<CoachDashboard>(dashboardKeys.all)
      qc.setQueryData<CoachDashboard>(dashboardKeys.all, (old) => old && change(old, id))
      return { previous }
    },
    onError: (_e, _id, context) => {
      if (context?.previous) qc.setQueryData(dashboardKeys.all, context.previous)
    },
  })
}

/** ✓ "Marcar como resolvido" num item de "Precisa da sua atenção". */
export const useResolveAttention = () =>
  useOptimistic(
    (id) => `/coach/attention/${id}/resolve`,
    (d, id) => ({ ...d, attention: d.attention.filter((a) => a.id !== id) }),
  )

/** "Parabenizar": a mensagem de aniversário vai pelo chat. */
export const useCongratulate = () =>
  useOptimistic(
    (studentId) => `/coach/students/${studentId}/congratulate`,
    (d, studentId) => ({ ...d, birthdays: d.birthdays.map((b) => (b.studentId === studentId ? { ...b, congratulated: true } : b)) }),
  )
