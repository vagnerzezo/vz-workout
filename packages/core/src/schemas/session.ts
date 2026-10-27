import { z } from 'zod'
import { Exercise, Phase, WorkoutDay } from './workout'

export const SetKind = z.enum(['warmup', 'prep', 'working'])
export type SetKind = z.infer<typeof SetKind>

export const PreviousSet = z.object({
  kind: SetKind,
  kg: z.number().min(0),
  reps: z.number().int().min(0),
})
export type PreviousSet = z.infer<typeof PreviousSet>

/** O que o aluno precisa para executar um exercício prescrito hoje. */
export const SessionItem = z.object({
  prescribedId: z.string(),
  note: z.string().nullable(), // observação do treinador para este exercício
  rir: z.string().nullable(), // "1–2"
  restRange: z.tuple([z.number().int().positive(), z.number().int().positive()]), // faixa do treinador, em segundos
  targetKg: z.number().min(0).nullable(), // carga sugerida para as séries válidas
  previous: z.array(PreviousSet), // última vez que fez este treino, na ordem das séries
  bestE1rm: z.number().min(0).nullable(), // melhor 1RM estimado até hoje, para marcar recorde
})
export type SessionItem = z.infer<typeof SessionItem>

/** Resposta de GET /me/workout-days/:dayId/template */
export const SessionTemplate = z.object({
  day: WorkoutDay,
  phase: Phase.nullable(),
  exercises: z.array(Exercise),
  items: z.array(SessionItem),
})
export type SessionTemplate = z.infer<typeof SessionTemplate>

export const LoggedSet = z.object({
  key: z.string(), // "day_c_1:v2"
  prescribedId: z.string(),
  kind: SetKind,
  kg: z.number().min(0),
  reps: z.number().int().min(0),
  doneAt: z.iso.datetime().nullable(), // null = desmarcada
})
export type LoggedSet = z.infer<typeof LoggedSet>

export const FinishSessionRequest = z.object({
  dayId: z.string(),
  startedAt: z.iso.datetime(),
  finishedAt: z.iso.datetime(),
  sets: z.array(LoggedSet),
  effort: z.number().int().min(1).max(10).nullable(), // esforço percebido (RPE)
  comment: z.string().max(1000).nullable(), // comentário para o treinador
})
export type FinishSessionRequest = z.infer<typeof FinishSessionRequest>

export const WorkoutSession = FinishSessionRequest.extend({
  id: z.string(),
})
export type WorkoutSession = z.infer<typeof WorkoutSession>
