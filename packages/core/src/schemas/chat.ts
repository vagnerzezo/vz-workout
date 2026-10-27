import { z } from 'zod'

/** Conteúdo de uma mensagem. `event` é um cartão automático (treino concluído, check-in, ficha atualizada). */
export const MessageBody = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), text: z.string().min(1).max(2000) }),
  z.object({ type: z.literal('audio'), url: z.string().nullable(), durationSec: z.number().int().positive() }),
  z.object({ type: z.literal('image'), url: z.string().nullable() }),
  z.object({ type: z.literal('video'), url: z.string().nullable() }),
  z.object({
    type: z.literal('event'),
    event: z.enum(['workout', 'checkIn', 'plan']),
    title: z.string(), // "Você concluiu o Treino C — Legs"
    meta: z.string(), // "58 min · 9.870 kg · 2 recordes"
    link: z.string().startsWith('/'),
  }),
])
export type MessageBody = z.infer<typeof MessageBody>

export const Message = z.object({
  id: z.string(),
  from: z.enum(['student', 'coach']),
  sentAt: z.iso.datetime(),
  /** Só nas mensagens do aluno: o treinador já viu? */
  status: z.enum(['sent', 'read']).nullable(),
  body: MessageBody,
})
export type Message = z.infer<typeof Message>

/** Resposta de GET /me/conversation (abrir a conversa marca as mensagens do treinador como lidas). */
export const Conversation = z.object({
  coach: z.object({ name: z.string(), responseTime: z.string() }), // "responde em até 2 h"
  messages: z.array(Message), // da mais antiga para a mais nova
})
export type Conversation = z.infer<typeof Conversation>
