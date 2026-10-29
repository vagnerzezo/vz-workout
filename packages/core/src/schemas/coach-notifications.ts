import { z } from 'zod'

/** Aviso que chega para o treinador (aba "Recebidas"). */
export const CoachInboxItem = z.object({
  id: z.string(),
  kind: z.enum(['message', 'pain', 'payment', 'inactive', 'checkIn', 'plan', 'birthday']),
  title: z.string(),
  body: z.string(),
  cta: z.string(), // "Revisar check-in"
  link: z.string().startsWith('/'),
  primary: z.boolean(), // botão cheio (ação que pede resposta)
  createdAt: z.iso.datetime(),
  read: z.boolean(),
})
export type CoachInboxItem = z.infer<typeof CoachInboxItem>

export const Automation = z.object({
  id: z.string(),
  name: z.string(),
  trigger: z.string(), // "1 h antes do horário habitual"
  audience: z.enum(['student', 'coach', 'both']),
  stats: z.string().nullable(), // "41% abertas"
  enabled: z.boolean(),
})
export type Automation = z.infer<typeof Automation>

export const NotificationTarget = z.enum(['home', 'workout', 'diet', 'checkIn', 'chat'])
export type NotificationTarget = z.infer<typeof NotificationTarget>

export const SentNotification = z.object({
  id: z.string(),
  at: z.iso.datetime(), // envio (ou o horário agendado)
  title: z.string(),
  body: z.string(),
  audienceLabel: z.string(), // "Todos os ativos", "Tag: Online", "3 alunos"
  target: NotificationTarget,
  status: z.enum(['sent', 'scheduled', 'canceled']),
  sent: z.number().int().nullable(),
  push: z.number().int().nullable(),
  openRate: z.number().min(0).max(100).nullable(),
})
export type SentNotification = z.infer<typeof SentNotification>

export const CoachPrefKey = z.enum(['checkIn', 'payment', 'message', 'inactive', 'plan', 'quietHours'])
export type CoachPrefKey = z.infer<typeof CoachPrefKey>

/** GET /coach/notifications */
export const CoachNotifications = z.object({
  inbox: z.array(CoachInboxItem), // mais recentes primeiro
  automations: z.array(Automation),
  history: z.array(SentNotification), // mais recentes primeiro
  push: z.object({ enabled: z.number().int(), students: z.number().int() }),
  sent30d: z.number().int(),
  openRate: z.number(),
  prefs: z.record(CoachPrefKey, z.boolean()),
})
export type CoachNotifications = z.infer<typeof CoachNotifications>

/** GET /coach/notifications/audience: quem pode receber, e quem tem push no celular. */
export const NotificationAudience = z.object({
  students: z.array(z.object({ id: z.string(), name: z.string(), tags: z.array(z.string()), push: z.boolean() })),
  tags: z.array(z.string()),
  /** Exemplo da pré-visualização (o Renato) */
  sample: z.object({ name: z.string(), workout: z.string(), coach: z.string() }),
})
export type NotificationAudience = z.infer<typeof NotificationAudience>

/** POST /coach/notifications */
export const NewNotification = z
  .object({
    audience: z.enum(['all', 'tags', 'students']),
    tags: z.array(z.string()),
    studentIds: z.array(z.string()),
    title: z.string().trim().min(1).max(50),
    body: z.string().trim().min(1).max(150),
    target: NotificationTarget,
    scheduledAt: z.iso.datetime().nullable(), // null = agora
  })
  .refine((n) => n.audience !== 'tags' || n.tags.length > 0, { path: ['tags'], message: 'Escolha ao menos uma tag' })
  .refine((n) => n.audience !== 'students' || n.studentIds.length > 0, { path: ['studentIds'], message: 'Escolha ao menos um aluno' })
export type NewNotification = z.infer<typeof NewNotification>
