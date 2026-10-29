import { z } from 'zod'
import { Experience } from './auth'

export const PlanGoal = z.enum(['hypertrophy', 'fatLoss', 'strength', 'conditioning'])
export type PlanGoal = z.infer<typeof PlanGoal>

/** Card da lista de fichas: um modelo que o treinador atribui a vários alunos. */
export const PlanTemplateSummary = z.object({
  id: z.string(),
  name: z.string(),
  split: z.string(), // "ABCDE · Push, Pull, Legs, Upper, Lower"
  goal: PlanGoal,
  level: Experience,
  atHome: z.boolean(),
  daysPerWeek: z.number().int().min(1).max(7),
  durationWeeks: z.number().int().positive(),
  phaseCount: z.number().int().min(1),
  studentsUsing: z.number().int().min(0),
  updatedAt: z.iso.date(),
  archived: z.boolean(),
})
export type PlanTemplateSummary = z.infer<typeof PlanTemplateSummary>

/** Aba "Atribuídas a alunos": a cópia de cada aluno, que pode ser ajustada sem mudar o modelo. */
export const AssignedPlan = z.object({
  studentId: z.string(),
  studentName: z.string(),
  planName: z.string(),
  templateId: z.string().nullable(), // null = montada do zero para o aluno
  validUntil: z.iso.date(),
})
export type AssignedPlan = z.infer<typeof AssignedPlan>

/** GET /coach/plans */
export const CoachPlans = z.object({
  templates: z.array(PlanTemplateSummary),
  assigned: z.array(AssignedPlan),
})
export type CoachPlans = z.infer<typeof CoachPlans>

/** POST /coach/plans/:id/assign */
export const AssignPlan = z.object({
  studentIds: z.array(z.string()).min(1),
  startsOn: z.iso.date(),
})
export type AssignPlan = z.infer<typeof AssignPlan>
