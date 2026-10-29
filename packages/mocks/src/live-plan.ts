import type { WorkoutPlan } from '@workspace/core'
import { db } from './db'
import { renatoMe } from './fixtures/renato'
import { renatoPlan } from './fixtures/renato-plan'

/** Ficha que o treinador edita no painel. Todos partem do modelo do canvas; cada aluno ganha a própria cópia ao ser editado. */
export const coachPlan = (studentId: string): WorkoutPlan => db.coach.plans[studentId] ?? renatoPlan

/** Cópia do aluno, criada na primeira edição (o modelo não muda). */
export function editablePlan(studentId: string): WorkoutPlan {
  db.coach.plans[studentId] ??= structuredClone(renatoPlan)
  return db.coach.plans[studentId]
}

export const hiddenDays = (studentId: string) => db.coach.hiddenDays[studentId] ?? []

/** O que o app do Renato mostra: a ficha do painel, sem os treinos que o treinador deixou como rascunho. */
export function appPlan(): WorkoutPlan {
  const plan = coachPlan(renatoMe.id)
  const hidden = hiddenDays(renatoMe.id)
  return { ...plan, days: plan.days.filter((d) => !hidden.includes(d.id)) }
}
