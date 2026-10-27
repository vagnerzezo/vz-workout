import { z } from 'zod'

export const Muscle = z.enum([
  'chest', 'lats', 'upperBack', 'shoulders', 'sideDelts', 'biceps', 'triceps',
  'quads', 'hamstrings', 'glutes', 'adductors', 'calves', 'core',
])
export type Muscle = z.infer<typeof Muscle>

export const Exercise = z.object({
  id: z.string(),
  name: z.string(),
  primary: Muscle,
  secondary: z.array(Muscle),
  equipment: z.string(),
  videoUrl: z.url().nullable(),
  origin: z.enum(['base', 'coach']),
})
export type Exercise = z.infer<typeof Exercise>

export const PrescribedExercise = z.object({
  id: z.string(),
  exerciseId: z.string(),
  warmupSets: z.number().int().min(0),
  prepSets: z.number().int().min(0),
  workingSets: z.number().int().min(1).max(8),
  reps: z.string(), // "8–12"
  restSeconds: z.number().int().positive(),
  technique: z.string().nullable(), // "Drop-set"
})
export type PrescribedExercise = z.infer<typeof PrescribedExercise>

export const Phase = z.object({
  id: z.enum(['adaptation', 'accumulation', 'intensification', 'deload']),
  weeks: z.tuple([z.number(), z.number()]),
  setMultiplier: z.number(), // 0.7 · 1 · 0.8 · 0.5
  rir: z.number().int(), // 3 · 2 · 1 · 4
})
export type Phase = z.infer<typeof Phase>

/** 1 = segunda … 7 = domingo (ISO 8601) */
export const IsoWeekday = z.number().int().min(1).max(7)

export const WorkoutDay = z.object({
  id: z.string(),
  letter: z.enum(['A', 'B', 'C', 'D', 'E', 'F']),
  name: z.string(), // "Push"
  weekday: IsoWeekday,
  focus: z.array(z.string()), // escrito pelo treinador: "Peito", "Ombro", "Tríceps"
  exercises: z.array(PrescribedExercise),
})
export type WorkoutDay = z.infer<typeof WorkoutDay>

export const CoachNote = z.object({
  title: z.string(), // "RIR"
  text: z.string(),
})

export const WorkoutPlan = z.object({
  id: z.string(),
  name: z.string(),
  days: z.array(WorkoutDay),
  phases: z.array(Phase),
  currentPhaseId: Phase.shape.id,
  startsOn: z.iso.date(),
  durationWeeks: z.number().int().positive(),
  updatedAt: z.iso.date(),
  validUntil: z.iso.date(),
  notes: z.array(CoachNote),
})
export type WorkoutPlan = z.infer<typeof WorkoutPlan>

/** Resposta de GET /me/workout-plan: a ficha, os exercícios que ela usa e os dias já feitos na semana. */
export const StudentPlan = z.object({
  plan: WorkoutPlan.nullable(), // null = o treinador ainda não atribuiu ficha
  exercises: z.array(Exercise),
  doneThisWeek: z.array(z.string()), // ids de WorkoutDay
})
export type StudentPlan = z.infer<typeof StudentPlan>
