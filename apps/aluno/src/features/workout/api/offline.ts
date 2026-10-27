import { useEffect } from 'react'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { SessionTemplate, StudentPlan } from '@workspace/core'
import { api } from '../../../shared/api/client'
import { useDevicePrefs } from '../../../shared/prefs/device-prefs'
import { workoutKeys } from './queries'
import { sessionKeys } from './session'

const RESYNC_MS = 12 * 60 * 60 * 1000

/**
 * Baixa a ficha e o roteiro de cada dia. Com o PWA ligado, o service worker guarda as respostas
 * (cache "api", NetworkFirst) e o treino abre sem internet; o cache do app também fica preenchido.
 */
export async function downloadPlanForOffline(qc: QueryClient) {
  const plan = await qc.fetchQuery({ queryKey: workoutKeys.plan(), queryFn: () => api('/me/workout-plan', StudentPlan), staleTime: 0 })
  await Promise.all(
    (plan.plan?.days ?? []).map((d) =>
      qc.fetchQuery({
        queryKey: sessionKeys.template(d.id),
        queryFn: () => api(`/me/workout-days/${d.id}/template`, SessionTemplate),
        staleTime: 0,
      }),
    ),
  )
  useDevicePrefs.getState().set({ offlineSyncedAt: new Date().toISOString() })
}

/** Com "Baixar ficha atual" ligado, baixa de novo ao abrir o app se a última vez foi há mais de 12 h. */
export function useOfflinePlanSync() {
  const qc = useQueryClient()
  const { offlinePlan, offlineSyncedAt } = useDevicePrefs()
  useEffect(() => {
    if (!offlinePlan || !navigator.onLine) return
    if (offlineSyncedAt && Date.now() - Date.parse(offlineSyncedAt) < RESYNC_MS) return
    downloadPlanForOffline(qc).catch(() => {}) // tenta de novo na próxima abertura
  }, [qc, offlinePlan, offlineSyncedAt])
}
