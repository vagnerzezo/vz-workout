import { z } from 'zod'
import { MessageBody } from './chat'

/** Mensagem como o treinador vê: quem enviou (no grupo, o nome) e, nas dele, se o aluno já leu. */
export const CoachMessage = z.object({
  id: z.string(),
  from: z.enum(['student', 'coach']),
  author: z.string().nullable(), // só em grupos
  sentAt: z.iso.datetime(),
  status: z.enum(['sent', 'delivered', 'read']).nullable(), // só nas do treinador
  body: MessageBody,
})
export type CoachMessage = z.infer<typeof CoachMessage>

export const ConversationKind = z.enum(['student', 'group'])

/** Linha da lista de conversas. */
export const CoachConversationSummary = z.object({
  id: z.string(),
  kind: ConversationKind,
  title: z.string(),
  studentId: z.string().nullable(),
  online: z.boolean(),
  unread: z.number().int().min(0),
  /** A última mensagem é do treinador e o aluno não respondeu há 3 dias ou mais */
  awaitingReply: z.boolean(),
  last: CoachMessage.nullable(),
})
export type CoachConversationSummary = z.infer<typeof CoachConversationSummary>

export const AutoReply = z.object({
  enabled: z.boolean(),
  hours: z.string(), // "seg–sex, 8h–20h"
  text: z.string(),
})
export type AutoReply = z.infer<typeof AutoReply>

/** Públicos da transmissão, com quantos alunos cada um alcança. */
export const BroadcastAudience = z.enum(['active', 'online', 'presencial', 'expiring'])
export type BroadcastAudience = z.infer<typeof BroadcastAudience>

/** GET /coach/conversations */
export const CoachInbox = z.object({
  conversations: z.array(CoachConversationSummary), // mais recentes primeiro
  autoReply: AutoReply,
  audiences: z.record(BroadcastAudience, z.number().int().min(0)),
})
export type CoachInbox = z.infer<typeof CoachInbox>

/** GET /coach/conversations/:id (abrir marca como lida) */
export const CoachConversation = z.object({
  id: z.string(),
  kind: ConversationKind,
  title: z.string(),
  studentId: z.string().nullable(),
  online: z.boolean(),
  notes: z.string(), // notas privadas: o aluno não vê
  muted: z.boolean(),
  group: z.object({ description: z.string(), members: z.array(z.string()), memberCount: z.number().int(), onlyCoach: z.boolean() }).nullable(),
  messages: z.array(CoachMessage), // da mais antiga para a mais nova
})
export type CoachConversation = z.infer<typeof CoachConversation>

/** O que dá para compartilhar pelo clipe: vira um cartão na conversa. */
export const ShareKind = z.enum(['plan', 'diet'])
export type ShareKind = z.infer<typeof ShareKind>
