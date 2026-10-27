import { z } from 'zod'

/** GET /public/branding: a marca do treinador antes do login (tela de entrar, primeiro acesso). */
export const PublicBranding = z.object({
  appName: z.string(),
  coachName: z.string(),
  brandColor: z.string(),
})
export type PublicBranding = z.infer<typeof PublicBranding>

/** POST /auth/recovery: para onde o código foi (sempre responde igual, exista ou não o cadastro). */
export const RecoveryStarted = z.object({ sentTo: z.string() })

/** POST /auth/recovery/verify: código certo devolve um token curto para trocar a senha. */
export const RecoveryVerified = z.object({ token: z.string() })

/** GET /auth/invites/:code: o convite que o treinador criou (código errado ou usado → 404). */
export const Invite = z.object({
  code: z.string(),
  fullName: z.string(),
  phone: z.string(), // "(51) 99812-4470"
  email: z.string(),
  coachName: z.string(),
})
export type Invite = z.infer<typeof Invite>

export const Goal = z.enum(['lose', 'gain', 'health', 'performance'])
export const Experience = z.enum(['beginner', 'intermediate', 'advanced'])
export const PainArea = z.enum(['knee', 'lowerBack', 'shoulder', 'hip', 'other'])

/** POST /me/anamnesis: "Conte sobre você", base do primeiro treino. */
export const Anamnesis = z
  .object({
    goal: Goal,
    weightKg: z.number().min(25).max(400),
    heightCm: z.number().int().min(100).max(250),
    experience: Experience,
    daysPerWeek: z.number().int().min(1).max(7),
    pains: z.array(PainArea), // vazio = nenhuma
    painDetails: z.string().trim().max(500).nullable(),
  })
export type Anamnesis = z.infer<typeof Anamnesis>
