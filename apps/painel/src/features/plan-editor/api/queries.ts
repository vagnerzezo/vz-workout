import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { CoachStudentPlan, Exercise, PlanTemplate, PlanTemplateSummary, StudentDetail, type WorkoutPlan } from '@workspace/core'
import { api } from '../../../shared/api/client'
import { studentPlanKey, studentProfileKeys } from '../../student-profile/api/queries'
import { planKeys } from '../../plans/api/queries'

/** A biblioteca muda pouco durante a edição. */
export function useExercises() {
  return useQuery({ queryKey: ['exercises'], queryFn: () => api('/coach/exercises', z.array(Exercise)), staleTime: 5 * 60_000 })
}

const templateKey = (id: string) => [...planKeys.all, id] as const

export function useTemplate(id: string, enabled: boolean) {
  return useQuery({ queryKey: templateKey(id), enabled, queryFn: () => api(`/coach/plans/${id}`, PlanTemplate) })
}

/** Salva o modelo inteiro; a lista de fichas (nome, divisão) recarrega. */
export function useSaveTemplate(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (plan: WorkoutPlan) => api(`/coach/plans/${id}`, PlanTemplate, { method: 'PUT', body: JSON.stringify({ plan }) }),
    onSuccess: (saved) => {
      qc.setQueryData(templateKey(id), saved)
      return qc.invalidateQueries({ queryKey: planKeys.all, exact: true })
    },
  })
}

/** Salva a cópia do aluno: o perfil (aba Treino) e o app dele passam a mostrar a ficha nova. */
export function useSaveStudentPlan(studentId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (plan: WorkoutPlan) => {
      const res = await fetch(`/api/coach/students/${studentId}/workout-plan`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan }) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: studentPlanKey(studentId) }),
  })
}

export function useCreateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api('/coach/plans', PlanTemplateSummary, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: planKeys.all, exact: true }),
  })
}

/** Ficha de um aluno (editor aberto pelo perfil): a cópia dele e o nome para o cabeçalho. */
export function useStudentSource(studentId: string | null) {
  const plan = useQuery({ queryKey: studentPlanKey(studentId ?? ''), enabled: !!studentId, queryFn: () => api(`/coach/students/${studentId}/workout-plan`, CoachStudentPlan) })
  const detail = useQuery({ queryKey: studentProfileKeys.detail(studentId ?? ''), enabled: !!studentId, queryFn: () => api(`/coach/students/${studentId}`, StudentDetail) })
  return { plan, detail }
}
