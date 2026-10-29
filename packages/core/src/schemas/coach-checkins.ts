import { z } from 'zod'
import { PhotoPose } from './checkin'

/** Um check-in como o treinador revisa: medidas antes/agora, respostas com a nota anterior e o histórico. */
export const CheckInReview = z.object({
  id: z.string(),
  studentId: z.string(),
  studentName: z.string(),
  kind: z.string(), // "quinzenal", "semanal"
  sentAt: z.iso.datetime(),
  previousOn: z.iso.date().nullable(), // check-in anterior, usado na comparação
  weight: z.object({ now: z.number(), previous: z.number().nullable() }),
  waist: z.object({ now: z.number(), previous: z.number().nullable() }).nullable(),
  poses: z.array(PhotoPose),
  ratings: z.array(z.object({ label: z.string(), value: z.number().int().min(1).max(5), previous: z.number().int().min(1).max(5).nullable() })),
  /** Média das respostas nos últimos check-ins (o último é este) */
  history: z.array(z.number()),
  comment: z.string().nullable(),
  /** Onde dói, curto: "joelho direito" */
  pain: z.string().nullable(),
  reply: z.object({ text: z.string(), at: z.iso.datetime(), read: z.boolean() }).nullable(),
})
export type CheckInReview = z.infer<typeof CheckInReview>

export const LateCheckIn = z.object({
  studentId: z.string(),
  studentName: z.string(),
  kind: z.string(),
  dueOn: z.iso.date(),
  note: z.string().nullable(), // "sem treinar há 7 dias"
  conversationId: z.string().nullable(),
  remindedAt: z.iso.datetime().nullable(),
})
export type LateCheckIn = z.infer<typeof LateCheckIn>

/** GET /coach/check-ins */
export const CoachCheckIns = z.object({
  waiting: z.array(CheckInReview),
  answered: z.array(CheckInReview), // mais recentes primeiro
  late: z.array(LateCheckIn),
  /** Envio no prazo nos últimos 30 dias, 0 a 100 */
  onTimeRate: z.number().min(0).max(100),
})
export type CoachCheckIns = z.infer<typeof CoachCheckIns>
