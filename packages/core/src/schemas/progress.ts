import { z } from 'zod'
import { WeightEntry } from './home'

export const Measurement = z.object({
  date: z.iso.date(),
  waist: z.number().positive(), // cintura, cm
  hips: z.number().positive(), // quadril
  chest: z.number().positive(), // peito
  arm: z.number().positive(), // braço contraído
  thigh: z.number().positive(), // coxa
})
export type Measurement = z.infer<typeof Measurement>

export const ProgressPhoto = z.object({
  id: z.string(),
  date: z.iso.date(),
  pose: z.enum(['front', 'side', 'back']),
  weightKg: z.number().positive().nullable(), // peso no dia da foto
  url: z.string().nullable(), // null: o aluno enviou o check-in, mas a foto ainda está processando
})
export type ProgressPhoto = z.infer<typeof ProgressPhoto>

/** Melhor série válida de um exercício num treino. */
export const LiftSet = z.object({ date: z.iso.date(), kg: z.number().min(0), reps: z.number().int().positive() })
export type LiftSet = z.infer<typeof LiftSet>

/** Resposta de GET /me/progress */
export const StudentProgress = z.object({
  weights: z.array(WeightEntry), // do mais antigo para o mais recente
  weightGoalKg: z.number().positive().nullable(),
  /** Exercícios principais da ficha (um por dia de treino), com a melhor série de cada treino */
  lifts: z.array(z.object({ exerciseId: z.string(), name: z.string(), sets: z.array(LiftSet) })),
  measurements: z.array(Measurement), // uma por check-in, do mais antigo para o mais recente
  photos: z.array(ProgressPhoto),
})
export type StudentProgress = z.infer<typeof StudentProgress>
