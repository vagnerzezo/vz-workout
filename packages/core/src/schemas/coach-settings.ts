import { z } from 'zod'
import { CheckInFrequency } from './student-detail'
import { HexColor } from './student'

export const TeamRole = z.enum(['owner', 'nutritionist', 'assistant'])
export type TeamRole = z.infer<typeof TeamRole>

export const PermissionArea = z.enum(['students', 'workouts', 'diets', 'checkIns', 'chat', 'finance', 'settings'])
export type PermissionArea = z.infer<typeof PermissionArea>

export const Permission = z.enum(['edit', 'view', 'none'])
export type Permission = z.infer<typeof Permission>

export const CheckInQuestionType = z.enum(['rating', 'number', 'yesNo', 'text', 'photo'])
export type CheckInQuestionType = z.infer<typeof CheckInQuestionType>

export const Weekday = z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])
export type Weekday = z.infer<typeof Weekday>

export const CoachSettings = z.object({
  profile: z.object({
    name: z.string().trim().min(3).max(60),
    cref: z.string(),
    email: z.email(),
    phone: z.string(),
    bio: z.string().max(280),
    specialties: z.array(z.string()),
    inviteLink: z.string(),
  }),
  branding: z.object({
    appName: z.string().trim().min(1).max(30),
    brandColor: HexColor,
    logoName: z.string().nullable(), // arquivo escolhido (o upload real fica para a API)
  }),
  team: z.array(z.object({ id: z.string(), name: z.string(), role: TeamRole, meta: z.string(), pending: z.boolean() })),
  permissions: z.record(PermissionArea, z.record(TeamRole, Permission)),
  checkIn: z.object({ frequency: CheckInFrequency, questions: z.array(z.object({ id: z.string(), text: z.string().trim().min(1).max(120), type: CheckInQuestionType })) }),
  hours: z.object({
    days: z.record(Weekday, z.object({ on: z.boolean(), from: z.string().regex(/^\d{2}:\d{2}$/), to: z.string().regex(/^\d{2}:\d{2}$/) })),
    responseTime: z.string().max(60),
    autoReplyText: z.string().max(200),
  }),
  defaults: z.object({ restSeconds: z.number().int().min(15).max(600) }),
  security: z.object({
    twoFactor: z.boolean(),
    biometrics: z.boolean(), // "Entrar com biometria" neste celular
    sessions: z.array(z.object({ id: z.string(), device: z.string(), meta: z.string(), current: z.boolean() })),
  }),
  plan: z.object({ name: z.string(), price: z.number(), studentLimit: z.number().int(), renewsOn: z.iso.date() }),
})
export type CoachSettings = z.infer<typeof CoachSettings>
