import { z } from 'zod'

export const PhotoPose = z.enum(['front', 'side', 'back'])
export type PhotoPose = z.infer<typeof PhotoPose>

/** Resposta de GET /me/check-in: o check-in que o aluno precisa enviar (null = nenhum pendente). */
export const PendingCheckIn = z.object({
  id: z.string(),
  label: z.string(), // "Check-in quinzenal"
  dueDate: z.iso.date(),
  coachName: z.string(),
  poses: z.array(PhotoPose), // fotos pedidas
  /** Perguntas de nota 1 a 5 que o treinador montou */
  questions: z.array(z.object({ id: z.string(), label: z.string() })),
  lastWeightKg: z.number().positive().nullable(), // ponto de partida do peso de hoje
})
export type PendingCheckIn = z.infer<typeof PendingCheckIn>

export const Rating = z.number().int().min(1).max(5)

/** Campo `answers` (JSON) do POST /me/check-ins/:id; as fotos vão no mesmo FormData como `photo_<pose>`. */
export const CheckInAnswers = z
  .object({
    weightKg: z.number().min(20).max(400),
    ratings: z.record(z.string(), Rating),
    pain: z.boolean(),
    painWhere: z.string().trim().max(200).nullable(), // obrigatório quando teve dor
    notes: z.string().trim().max(1000).nullable(),
  })
  .refine((a) => !a.pain || !!a.painWhere, { message: 'Diga onde doeu', path: ['painWhere'] })
export type CheckInAnswers = z.infer<typeof CheckInAnswers>
