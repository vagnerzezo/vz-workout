import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { CoachStudentDiet, CoachStudentPlan, CoachWorkout, StudentAppSettings, StudentAssessments, StudentCheckIn, StudentDetail, type WorkoutDay } from '@workspace/core'
import { api } from '../../../shared/api/client'

export const studentProfileKeys = {
  all: (id: string) => ['student', id] as const,
  detail: (id: string) => [...studentProfileKeys.all(id), 'detail'] as const,
  workouts: (id: string) => [...studentProfileKeys.all(id), 'workouts'] as const,
  checkIns: (id: string) => [...studentProfileKeys.all(id), 'check-ins'] as const,
}

export function useStudent(id: string) {
  return useQuery({ queryKey: studentProfileKeys.detail(id), queryFn: () => api(`/coach/students/${id}`, StudentDetail) })
}

/** Só busca quando a aba Histórico abre. */
export function useStudentWorkouts(id: string) {
  return useQuery({ queryKey: studentProfileKeys.workouts(id), queryFn: () => api(`/coach/students/${id}/workouts`, z.array(CoachWorkout)) })
}

export function useStudentCheckIns(id: string) {
  return useQuery({ queryKey: studentProfileKeys.checkIns(id), queryFn: () => api(`/coach/students/${id}/check-ins`, z.array(StudentCheckIn)) })
}

/** Liga/desliga na hora; se a API recusar, volta como estava. */
export function useUpdateSettings(id: string) {
  const qc = useQueryClient()
  const key = studentProfileKeys.detail(id)
  return useMutation({
    mutationFn: (patch: Partial<StudentAppSettings>) => api(`/coach/students/${id}/settings`, StudentAppSettings, { method: 'PUT', body: JSON.stringify(patch) }),
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData<StudentDetail>(key)
      qc.setQueryData<StudentDetail>(key, (old) => old && { ...old, settings: { ...old.settings, ...patch } })
      return { previous }
    },
    onError: (_e, _patch, context) => {
      if (context?.previous) qc.setQueryData(key, context.previous)
    },
  })
}

export const studentPlanKey = (id: string) => [...studentProfileKeys.all(id), 'plan'] as const

export function useStudentPlan(id: string) {
  return useQuery({ queryKey: studentPlanKey(id), queryFn: () => api(`/coach/students/${id}/workout-plan`, CoachStudentPlan) })
}

export function useStudentDiet(id: string) {
  return useQuery({ queryKey: [...studentProfileKeys.all(id), 'diet'], queryFn: () => api(`/coach/students/${id}/diet`, CoachStudentDiet) })
}

export function useStudentAssessments(id: string) {
  return useQuery({ queryKey: [...studentProfileKeys.all(id), 'assessments'], queryFn: () => api(`/coach/students/${id}/assessments`, StudentAssessments) })
}

/** Respostas 204: sem corpo para validar. */
async function send(path: string, method: 'PUT' | 'PATCH' | 'DELETE', body?: unknown) {
  const res = await fetch(`/api${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}

/** Mudança na ficha aparece na hora; se a API recusar, a ficha volta como estava. */
function usePlanChange<V>(id: string, request: (v: V) => Promise<void>, change: (p: CoachStudentPlan, v: V) => CoachStudentPlan) {
  const qc = useQueryClient()
  const key = studentPlanKey(id)
  return useMutation({
    mutationFn: request,
    onMutate: async (v: V) => {
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData<CoachStudentPlan>(key)
      qc.setQueryData<CoachStudentPlan>(key, (old) => old && change(old, v))
      return { previous }
    },
    onError: (_e, _v, context) => {
      if (context?.previous) qc.setQueryData(key, context.previous)
    },
  })
}

const mapDay = (p: CoachStudentPlan, dayId: string, fn: (d: WorkoutDay) => WorkoutDay): CoachStudentPlan =>
  p.plan ? { ...p, plan: { ...p.plan, days: p.plan.days.map((d) => (d.id === dayId ? fn(d) : d)) } } : p

export const useDayVisibility = (id: string) =>
  usePlanChange(
    id,
    ({ dayId, visible }: { dayId: string; visible: boolean }) => send(`/coach/students/${id}/workout-plan/days/${dayId}/visibility`, 'PUT', { visible }),
    (p, { dayId, visible }) => ({ ...p, hiddenDayIds: visible ? p.hiddenDayIds.filter((d) => d !== dayId) : [...p.hiddenDayIds, dayId] }),
  )

export const useWorkingSets = (id: string) =>
  usePlanChange(
    id,
    ({ dayId, itemId, workingSets }: { dayId: string; itemId: string; workingSets: number }) =>
      send(`/coach/students/${id}/workout-plan/days/${dayId}/exercises/${itemId}`, 'PATCH', { workingSets }),
    (p, { dayId, itemId, workingSets }) => mapDay(p, dayId, (d) => ({ ...d, exercises: d.exercises.map((e) => (e.id === itemId ? { ...e, workingSets } : e)) })),
  )

export const useRemoveExercise = (id: string) =>
  usePlanChange(
    id,
    ({ dayId, itemId }: { dayId: string; itemId: string }) => send(`/coach/students/${id}/workout-plan/days/${dayId}/exercises/${itemId}`, 'DELETE'),
    (p, { dayId, itemId }) => mapDay(p, dayId, (d) => ({ ...d, exercises: d.exercises.filter((e) => e.id !== itemId) })),
  )
