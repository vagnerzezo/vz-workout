import { z } from 'zod'
import { Branding } from './student'

/** Treinador logado no painel, com a marca que os alunos veem e o uso do plano. */
export const Coach = z.object({
  id: z.string(),
  firstName: z.string(),
  fullName: z.string(),
  branding: Branding,
  plan: z.object({
    name: z.string(), // "Pro"
    studentLimit: z.number().int().positive(),
  }),
  activeStudents: z.number().int().min(0),
})
export type Coach = z.infer<typeof Coach>

/** Contadores do menu (sidebar e barra inferior). Atualizam sozinhos de tempos em tempos. */
export const CoachCounters = z.object({
  students: z.number().int().min(0),
  pendingCheckIns: z.number().int().min(0),
  unreadChats: z.number().int().min(0),
  pendingProofs: z.number().int().min(0), // comprovantes a conferir (Financeiro)
  unreadNotifications: z.number().int().min(0),
})
export type CoachCounters = z.infer<typeof CoachCounters>

export const AttentionType = z.enum(['checkIn', 'inactivity', 'due'])
export type AttentionType = z.infer<typeof AttentionType>

/** O que o botão da linha faz; a tela escolhe o rótulo e a rota. */
export const AttentionAction = z.enum(['reply', 'viewCheckIn', 'message', 'charge', 'renewPlan'])
export type AttentionAction = z.infer<typeof AttentionAction>

/**
 * Item de "Precisa da sua atenção". `at` muda de sentido com o tipo:
 * check-in = quando foi enviado · inatividade = data do último treino · vencimento = data que vence.
 */
export const AttentionItem = z.object({
  id: z.string(),
  studentId: z.string(),
  studentName: z.string(),
  type: AttentionType,
  reason: z.string(),
  at: z.union([z.iso.datetime(), z.iso.date()]),
  action: AttentionAction,
  /** Check-in a revisar ou conversa a abrir, quando a ação leva a um item específico */
  targetId: z.string().nullable(),
})
export type AttentionItem = z.infer<typeof AttentionItem>

export const ActivityKind = z.enum(['workout', 'record', 'checkIn', 'weight', 'dietSwap', 'proof'])
export type ActivityKind = z.infer<typeof ActivityKind>

export const ActivityEvent = z.object({
  id: z.string(),
  kind: ActivityKind,
  studentName: z.string(),
  text: z.string(), // "concluiu Treino C — Legs com 2 recordes pessoais"
  at: z.iso.datetime(),
})
export type ActivityEvent = z.infer<typeof ActivityEvent>

export const Birthday = z.object({
  studentId: z.string(),
  name: z.string(),
  age: z.number().int().positive(),
  congratulated: z.boolean(),
})
export type Birthday = z.infer<typeof Birthday>

export const CoachDashboard = z.object({
  activeStudents: z.object({ count: z.number().int().min(0), newThisMonth: z.number().int() }),
  /** Treinos feitos ÷ previstos, de 0 a 100, da semana mais antiga para a atual */
  adherence: z.array(z.object({ weekStart: z.iso.date(), pct: z.number().min(0).max(100) })).min(1),
  adherenceGoal: z.number().min(0).max(100),
  pendingCheckIns: z.object({ count: z.number().int().min(0), over48h: z.number().int().min(0) }),
  dueIn7Days: z.object({ count: z.number().int().min(0), dueTomorrow: z.number().int().min(0) }),
  trainedToday: z.number().int().min(0),
  plansExpiring: z.number().int().min(0), // fichas vencendo em 7 dias
  withoutPlan: z.number().int().min(0), // "Sem vigência"
  overdueStudents: z.number().int().min(0),
  pendingProofs: z.number().int().min(0), // comprovantes a conferir
  attention: z.array(AttentionItem),
  activity: z.array(ActivityEvent), // da mais nova para a mais antiga
  birthdays: z.array(Birthday),
  /** Mais frequentes no mês: treinos concluídos */
  ranking: z.array(z.object({ studentId: z.string(), name: z.string(), workouts: z.number().int().min(0) })),
})
export type CoachDashboard = z.infer<typeof CoachDashboard>
