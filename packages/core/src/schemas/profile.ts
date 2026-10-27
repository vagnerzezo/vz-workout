import { z } from 'zod'

/** Resposta de GET /me/profile */
export const StudentProfile = z.object({
  fullName: z.string(),
  birthDate: z.iso.date(),
  goal: z.string(), // "Hipertrofia"
  level: z.string(), // "Intermediário"
  memberSince: z.iso.date(), // início na consultoria
  totalWorkouts: z.number().int().min(0),
  streakDays: z.number().int().min(0),
  coach: z.object({ name: z.string() }),
  subscription: z.object({ planLabel: z.string(), endsAt: z.iso.date() }).nullable(), // "trimestral"
  /** Próximo check-in; null quando não há nenhum pendente */
  checkIn: z
    .object({
      label: z.string(), // "Check-in quinzenal"
      dueDate: z.iso.date(),
      photoCount: z.number().int().min(0),
      questionCount: z.number().int().min(0),
    })
    .nullable(),
  weightGoal: z.object({ startKg: z.number().positive(), startDate: z.iso.date(), goalKg: z.number().positive() }).nullable(),
  currentWeightKg: z.number().positive().nullable(), // último peso registrado
})
export type StudentProfile = z.infer<typeof StudentProfile>
