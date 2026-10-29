import { z } from 'zod'
import { WeightEntry } from './home'
import { PhotoPose } from './checkin'
import { StudentListItem } from './coach'
import { MealPlan } from './diet'
import { Exercise, WorkoutPlan } from './workout'

/** Treino concluído, como o treinador vê (Histórico e "Últimos treinos"). */
export const CoachWorkout = z.object({
  id: z.string(),
  date: z.iso.date(),
  name: z.string(), // "Treino C — Legs"
  durationMin: z.number().min(0),
  volumeKg: z.number().min(0),
  effort: z.number().int().min(1).max(10).nullable(), // esforço que o aluno marcou no resumo
  records: z.number().int().min(0),
  comment: z.string().nullable(),
})
export type CoachWorkout = z.infer<typeof CoachWorkout>

export const CheckInFrequency = z.enum(['weekly', 'biweekly', 'monthly'])
export type CheckInFrequency = z.infer<typeof CheckInFrequency>

/** Chaves da seção "Configurações do aluno" (PUT parcial). */
export const StudentAppSettings = z.object({
  appAccess: z.boolean(), // desligado bloqueia o login do aluno
  showDiet: z.boolean(),
  allowSwaps: z.boolean(),
  suggestLastLoad: z.boolean(),
  askPhotos: z.boolean(),
  checkInFrequency: CheckInFrequency,
})
export type StudentAppSettings = z.infer<typeof StudentAppSettings>

const Field = z.object({ label: z.string(), value: z.string(), highlight: z.boolean().default(false) })

/** GET /coach/students/:id — perfil do aluno no painel. */
export const StudentDetail = z.object({
  student: StudentListItem,
  phone: z.string().nullable(),
  birthDate: z.iso.date().nullable(),
  sex: z.enum(['male', 'female']).nullable(),
  heightCm: z.number().positive().nullable(),
  city: z.string().nullable(),
  memberSince: z.iso.date(),
  weights: z.array(WeightEntry), // da mais antiga para a mais nova
  weightGoalKg: z.number().positive().nullable(),
  nextCheckInOn: z.iso.date().nullable(),
  /** "Pontos de atenção" do Resumo: dor relatada, inatividade, pagamento… */
  attention: z.array(z.object({ title: z.string(), detail: z.string(), checkInId: z.string().nullable() })),
  recentWorkouts: z.array(CoachWorkout), // os 3 mais recentes
  anamnesis: z.object({ answeredOn: z.iso.date(), fields: z.array(Field) }).nullable(),
  subscription: z.object({
    planLabel: z.string(), // "Consultoria online · trimestral"
    startedOn: z.iso.date(),
    endsOn: z.iso.date(),
    payment: z.enum(['ok', 'late', 'pending']),
  }),
  lastSeenAt: z.iso.datetime().nullable(), // último acesso ao app
  settings: StudentAppSettings,
})
export type StudentDetail = z.infer<typeof StudentDetail>

/** Um check-in: notas de 1 a 5, comentário e dor relatada pelo aluno, e a resposta do treinador. */
export const StudentCheckIn = z.object({
  id: z.string(),
  date: z.iso.date(),
  kind: z.string(), // "quinzenal", "inicial"
  status: z.enum(['waiting', 'answered']),
  summary: z.string(), // "Peso 82,6 kg · 3 fotos"
  answeredOn: z.iso.date().nullable(),
  poses: z.array(PhotoPose),
  ratings: z.array(z.object({ label: z.string(), value: z.number().int().min(1).max(5) })),
  comment: z.string().nullable(),
  pain: z.string().nullable(),
  reply: z.string().nullable(),
})
export type StudentCheckIn = z.infer<typeof StudentCheckIn>

/** GET /coach/students/:id/workout-plan — a ficha do aluno como o treinador edita. */
export const CoachStudentPlan = z.object({
  plan: WorkoutPlan.nullable(), // null = ainda sem ficha
  exercises: z.array(Exercise),
  /** Treinos fora do app do aluno (rascunhos) */
  hiddenDayIds: z.array(z.string()),
})
export type CoachStudentPlan = z.infer<typeof CoachStudentPlan>

/** GET /coach/students/:id/diet */
export const CoachStudentDiet = z.object({
  plan: MealPlan.nullable(),
  waterGoalMl: z.number().int().positive(),
  /** Refeições concluídas ÷ previstas nos últimos 7 dias, 0 a 100 */
  adherence7d: z.number().min(0).max(100).nullable(),
  /** Quando a nutricionista montou: o treinador só vê */
  author: z.object({ name: z.string(), credential: z.string() }).nullable(),
})
export type CoachStudentDiet = z.infer<typeof CoachStudentDiet>

export const Skinfolds = z.object({
  chest: z.number().positive(),
  midaxillary: z.number().positive(),
  triceps: z.number().positive(),
  subscapular: z.number().positive(),
  abdominal: z.number().positive(),
  suprailiac: z.number().positive(),
  thigh: z.number().positive(),
})
export type Skinfolds = z.infer<typeof Skinfolds>

export const Assessment = z.object({
  id: z.string(),
  date: z.iso.date(),
  weightKg: z.number().positive(),
  heightCm: z.number().positive(),
  skinfolds: Skinfolds.nullable(), // mm
  bioimpedance: z.object({ fatPct: z.number(), waterPct: z.number(), visceralLevel: z.number(), bmrKcal: z.number() }).nullable(),
  perimeters: z.object({ waist: z.number(), hips: z.number(), chest: z.number(), arm: z.number(), thigh: z.number(), calf: z.number() }), // cm
})
export type Assessment = z.infer<typeof Assessment>

/** GET /coach/students/:id/assessments — da mais antiga para a mais nova. */
export const StudentAssessments = z.object({
  sex: z.enum(['male', 'female']),
  birthDate: z.iso.date(),
  items: z.array(Assessment),
})
export type StudentAssessments = z.infer<typeof StudentAssessments>
