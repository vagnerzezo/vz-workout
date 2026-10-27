import { z } from 'zod'

/** "2026-10" */
export const YearMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/)

export const HistoryExercise = z.object({
  name: z.string(),
  best: z.object({ kg: z.number().min(0), reps: z.number().int().min(0) }), // melhor série do dia (maior 1RM estimado)
  deltaKg: z.number().nullable(), // diferença de carga para a vez anterior; null = primeira vez
  isRecord: z.boolean(),
})
export type HistoryExercise = z.infer<typeof HistoryExercise>

export const HistorySession = z.object({
  id: z.string(),
  dayId: z.string(),
  letter: z.enum(['A', 'B', 'C', 'D', 'E', 'F']),
  name: z.string(), // "Push"
  date: z.iso.date(), // dia em que treinou, no fuso do aluno
  durationMin: z.number().min(0),
  volumeKg: z.number().min(0),
  comment: z.string().nullable(), // o que o aluno escreveu no resumo
  exercises: z.array(HistoryExercise),
})
export type HistorySession = z.infer<typeof HistorySession>

/** Resposta de GET /me/sessions?month=2026-10 */
export const MonthHistory = z.object({
  month: YearMonth,
  sessions: z.array(HistorySession), // da mais recente para a mais antiga
  previousMonthVolumeKg: z.number().min(0).nullable(), // null = não treinou no mês anterior
  weeklyGoal: z.number().int().positive(),
  firstMonth: YearMonth, // mês do primeiro treino: até onde dá para voltar
})
export type MonthHistory = z.infer<typeof MonthHistory>
