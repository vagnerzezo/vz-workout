import { z } from 'zod'

const Progress = z.object({
  consumed: z.number().min(0),
  goal: z.number().positive(),
})

export const WeekDay = z.object({
  date: z.iso.date(),
  trained: z.boolean(),
})
export type WeekDay = z.infer<typeof WeekDay>

export const TodayWorkout = z.object({
  dayId: z.string(),
  letter: z.enum(['A', 'B', 'C', 'D', 'E', 'F']),
  name: z.string(), // "Legs"
  exerciseCount: z.number().int().positive(),
  estimatedMinutes: z.number().int().positive(),
  muscles: z.array(z.string()), // rótulos já em português: "Quadríceps"
  position: z.number().int().positive(), // "Treino 3 de 5"
  totalInWeek: z.number().int().positive(),
})
export type TodayWorkout = z.infer<typeof TodayWorkout>

export const NextMeal = z.object({
  id: z.string(),
  name: z.string(),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  foodCount: z.number().int().min(0),
  kcal: z.number().min(0),
})
export type NextMeal = z.infer<typeof NextMeal>

export const WaterLog = z.object({
  consumedMl: z.number().int().min(0),
  goalMl: z.number().int().positive(),
  entries: z.array(z.object({ id: z.string(), ml: z.number().int().positive() })),
})
export type WaterLog = z.infer<typeof WaterLog>

export const WeeklyActivity = z.object({
  weekStart: z.iso.date(),
  durationMin: z.number().min(0),
  volumeKg: z.number().min(0),
  reps: z.number().int().min(0),
})
export type WeeklyActivity = z.infer<typeof WeeklyActivity>

export const HomeSummary = z.object({
  streakDays: z.number().int().min(0),
  unreadNotifications: z.number().int().min(0),
  hasUnreadMessages: z.boolean(),
  lastWeightKg: z.number().positive().nullable(),
  week: z.array(WeekDay).length(7), // segunda a domingo
  todayWorkout: TodayWorkout.nullable(), // null = dia de descanso ou sem ficha
  weeklyWorkouts: z.object({ done: z.number().int().min(0), goal: z.number().int().positive() }),
  nutrition: z.object({
    kcal: Progress,
    protein: Progress,
    carbs: Progress,
    fat: Progress,
  }),
  nextMeal: NextMeal.nullable(),
  activity: z.array(WeeklyActivity), // da semana mais antiga para a atual
})
export type HomeSummary = z.infer<typeof HomeSummary>

export const WeightEntry = z.object({
  id: z.string(),
  kg: z.number().positive(),
  date: z.iso.date(),
})
export type WeightEntry = z.infer<typeof WeightEntry>
