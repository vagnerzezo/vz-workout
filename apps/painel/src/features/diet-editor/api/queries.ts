import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { DietTemplate, DietTemplateSummary, Food, StudentDetail } from '@workspace/core'
import { api } from '../../../shared/api/client'
import { dietKeys } from '../../diets/api/queries'
import { studentProfileKeys } from '../../student-profile/api/queries'

export function useFoods() {
  return useQuery({ queryKey: ['foods'], queryFn: () => api('/coach/foods', z.array(Food)), staleTime: 5 * 60_000 })
}

/** Modelo (`/coach/diets/:id`) ou a cópia de um aluno (`/coach/students/:sid/diets/:id`). */
const pathOf = (id: string, studentId: string | null) => (studentId ? `/coach/students/${studentId}/diets/${id}` : `/coach/diets/${id}`)
const dietKey = (id: string, studentId: string | null) => [...dietKeys.all, id, studentId ?? 'modelo'] as const

export function useDietTemplate(id: string, studentId: string | null) {
  return useQuery({ queryKey: dietKey(id, studentId), queryFn: () => api(pathOf(id, studentId), DietTemplate) })
}

/** Nome do aluno no cabeçalho (só no modo aluno). */
export function useStudentName(studentId: string | null) {
  return useQuery({ queryKey: studentProfileKeys.detail(studentId ?? ''), enabled: !!studentId, queryFn: () => api(`/coach/students/${studentId}`, StudentDetail), select: (d) => d.student.fullName })
}

/** Salva a ficha inteira; a lista de dietas e a aba Dieta do perfil recarregam. */
export function useSaveDiet(id: string, studentId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (template: DietTemplate) => api(pathOf(id, studentId), DietTemplate, { method: 'PUT', body: JSON.stringify({ template }) }),
    onSuccess: (saved) => {
      qc.setQueryData(dietKey(id, studentId), saved)
      return Promise.all([qc.invalidateQueries({ queryKey: dietKeys.all, exact: true }), studentId && qc.invalidateQueries({ queryKey: studentProfileKeys.all(studentId) })])
    },
  })
}

export function useCreateDiet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api('/coach/diets', DietTemplateSummary, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: dietKeys.all, exact: true }),
  })
}
