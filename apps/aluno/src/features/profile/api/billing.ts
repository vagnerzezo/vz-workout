import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Billing, Charge } from '@workspace/core'
import { api } from '../../../shared/api/client'
import { profileKeys } from './queries'

const key = [...profileKeys.all, 'billing'] as const

export function useBilling() {
  return useQuery({ queryKey: key, queryFn: () => api('/me/billing', Billing) })
}

/** Envia (ou troca) o comprovante da cobrança. */
export function useSendProof() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ chargeId, file }: { chargeId: string; file: File }) => {
      const body = new FormData()
      body.set('file', file, file.name) // nome explícito: alguns ambientes mandam "blob"
      return api(`/me/charges/${chargeId}/proof`, Charge, { method: 'POST', body })
    },
    onSuccess: (charge) => qc.setQueryData<Billing>(key, (old) => old && { ...old, charge }),
  })
}
