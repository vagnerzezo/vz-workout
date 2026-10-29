import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CreatedStudent, NewStudentOptions, PhoneOwner, phoneDigits, type NewStudent } from '@workspace/core'
import { ApiError, api } from '../../../shared/api/client'
import { refreshPortfolio } from '../../students/api/queries'

export function useNewStudentOptions() {
  return useQuery({ queryKey: ['students', 'new', 'options'], queryFn: () => api('/coach/students/new/options', NewStudentOptions), staleTime: Infinity })
}

/** Quem já usa este WhatsApp (o login do aluno não pode repetir). Só pergunta com os 11 números. */
export function usePhoneOwner(phone: string) {
  const digits = phoneDigits(phone)
  return useQuery({
    queryKey: ['students', 'lookup', digits],
    enabled: digits.length === 11,
    queryFn: async () => {
      try {
        return await api(`/coach/students/lookup?phone=${digits}`, PhoneOwner)
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) return null
        throw e
      }
    },
  })
}

/** Cria o aluno pendente e o convite; a lista, o menu e o dashboard recarregam. */
export function useCreateStudent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (form: NewStudent) => api('/coach/students', CreatedStudent, { method: 'POST', body: JSON.stringify({ ...form, phone: phoneDigits(form.phone) }) }),
    onSuccess: () => refreshPortfolio(qc),
  })
}
