import { http, HttpResponse } from 'msw'
import { differenceInCalendarDays } from 'date-fns'
import type { BroadcastAudience, CoachConversation, CoachConversationSummary, CoachInbox, CoachMessage, Message, MessageBody, StudentListItem } from '@workspace/core'
import { BroadcastAudience as AudienceSchema, personalize, ShareKind } from '@workspace/core'
import { db, latency, newId } from '../db'
import { AUTO_REPLY, chatSeeds, groupInfo, renatoCoachEvents, type At, type ChatSeed } from '../fixtures/coach-chat'
import { renatoMe } from '../fixtures/renato'
import { coachPlan } from '../live-plan'
import { conversation as renatoConversation } from './chat'
import { students } from './coach'

const RENATO = 'conv_renato'
const at = (now: Date, [d, h, m]: At) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - d, h, m).toISOString()
const seedOf = (id: string): ChatSeed | undefined => chatSeeds.find((s) => s.id === id)

/** A conversa do Renato é a do app: o que um lado manda, o outro vê. */
function renatoMessages(now: Date): CoachMessage[] {
  return renatoConversation(now).map((m: Message): CoachMessage => {
    const ev = renatoCoachEvents[m.id]
    const body = ev && m.body.type === 'event' ? { ...m.body, ...ev } : m.body
    return { id: m.id, from: m.from, author: null, sentAt: m.sentAt, status: m.from === 'coach' ? (m.id.startsWith('msg') ? 'sent' : 'read') : null, body }
  })
}

function messagesOf(id: string, now: Date): CoachMessage[] {
  if (id === RENATO) return renatoMessages(now)
  const seed = seedOf(id)
  const base = seed?.messages.map((m, i): CoachMessage => ({ id: `${id}_${i + 1}`, from: m.from, author: m.author ?? null, sentAt: at(now, m.at), status: m.from === 'coach' ? (m.status ?? 'read') : null, body: m.body })) ?? []
  return [...base, ...(db.coach.chat.sent[id] ?? [])].filter((m) => m.sentAt <= now.toISOString())
}

const studentByConv = (id: string, list: StudentListItem[]) => list.find((s) => s.conversationId === id)

function conversationIds(): string[] {
  return [...new Set([RENATO, ...chatSeeds.map((s) => s.id), ...Object.keys(db.coach.chat.sent)])]
}

function readAt(id: string, now: Date): string {
  if (db.coach.chat.read[id]) return db.coach.chat.read[id]!
  if (id === RENATO) return at(now, [0, 8, 11]) // leu até a ficha atualizada; o áudio e o "Ok!" estão novos
  const seed = seedOf(id)
  return seed ? at(now, seed.readAt) : now.toISOString()
}

function summary(id: string, now: Date, list: StudentListItem[]): CoachConversationSummary | null {
  const seed = seedOf(id)
  const student = id === RENATO ? list.find((s) => s.id === renatoMe.id) : studentByConv(id, list)
  if (!seed && !student) return null
  const messages = messagesOf(id, now)
  const last = messages.at(-1) ?? null
  const since = readAt(id, now)
  return {
    id,
    kind: seed?.kind ?? 'student',
    title: seed?.title ?? student!.fullName,
    studentId: student?.id ?? null,
    online: id === RENATO || !!seed?.online,
    unread: messages.filter((m) => m.from === 'student' && m.sentAt > since).length,
    awaitingReply: !!last && last.from === 'coach' && last.status !== 'read' && differenceInCalendarDays(now, new Date(last.sentAt)) >= 3,
    last,
  }
}

/** Contador do menu: mensagens de alunos ainda não lidas, somando as conversas. */
export function unreadChats(now: Date): number {
  const list = students(now)
  return conversationIds().reduce((n, id) => n + (summary(id, now, list)?.unread ?? 0), 0)
}

function audienceOf(a: BroadcastAudience, list: StudentListItem[], now: Date): StudentListItem[] {
  const active = list.filter((s) => s.status === 'active' && s.conversationId)
  if (a === 'online') return active.filter((s) => s.tags.includes('Online'))
  if (a === 'presencial') return active.filter((s) => s.tags.includes('Presencial'))
  if (a === 'expiring') return active.filter((s) => s.subscriptionEndsOn && differenceInCalendarDays(new Date(s.subscriptionEndsOn), now) <= 7)
  return active
}

/** Mensagem do treinador: na conversa do Renato vai para o app dele; nas outras, fica no painel. */
export function sendFromCoach(id: string, body: MessageBody, now: Date): CoachMessage {
  if (id === RENATO) {
    const m: Message = { id: newId('msg'), from: 'coach', sentAt: now.toISOString(), status: null, body }
    db.sentMessages = [...db.sentMessages, m]
    return { ...m, author: null, status: 'sent' }
  }
  const m: CoachMessage = { id: newId('msg'), from: 'coach', author: null, sentAt: now.toISOString(), status: 'sent', body }
  db.coach.chat.sent[id] = [...(db.coach.chat.sent[id] ?? []), m]
  return m
}

/** Conversa individual do aluno (a do Renato é a do app). */
export const conversationOf = (s: StudentListItem) => (s.id === renatoMe.id ? RENATO : s.conversationId)

const notFound = () => HttpResponse.json({ message: 'Conversa não encontrada' }, { status: 404 })

export const coachChatHandlers = [
  http.get('/api/coach/conversations', async () => {
    await latency()
    const now = new Date()
    const list = students(now)
    const conversations = conversationIds()
      .flatMap((id) => summary(id, now, list) ?? [])
      .sort((a, b) => (b.last?.sentAt ?? '').localeCompare(a.last?.sentAt ?? ''))
    const audiences = Object.fromEntries(AudienceSchema.options.map((a) => [a, audienceOf(a, list, now).length])) as CoachInbox['audiences']
    return HttpResponse.json<CoachInbox>({ conversations, autoReply: { enabled: db.coach.chat.autoReply, ...AUTO_REPLY }, audiences })
  }),

  // Abrir a conversa marca as mensagens como lidas
  http.get('/api/coach/conversations/:id', async ({ params }) => {
    const id = params.id as string
    const now = new Date()
    const s = summary(id, now, students(now))
    if (!s) return notFound()
    await latency()
    db.coach.chat.read[id] = now.toISOString()
    const seed = seedOf(id)
    return HttpResponse.json<CoachConversation>({
      id,
      kind: s.kind,
      title: s.title,
      studentId: s.studentId,
      online: s.online,
      notes: db.coach.chat.notes[id] ?? seed?.notes ?? (id === RENATO ? 'Joelho direito sensível na descida do hack. Trocado por leg press até 05/11. Reavaliar no próximo check-in.' : ''),
      muted: db.coach.chat.muted[id] ?? false,
      group: s.kind === 'group' ? { ...groupInfo, onlyCoach: db.coach.chat.onlyCoach } : null,
      messages: messagesOf(id, now),
    })
  }),

  // Texto ({ text }) ou cartão compartilhado ({ share: 'plan' | 'diet' })
  http.post('/api/coach/conversations/:id/messages', async ({ params, request }) => {
    const id = params.id as string
    const now = new Date()
    const s = summary(id, now, students(now))
    if (!s) return notFound()
    const body = (await request.json().catch(() => null)) as { text?: unknown; share?: unknown } | null
    let message: MessageBody
    const share = ShareKind.safeParse(body?.share)
    if (share.success) {
      if (!s.studentId) return HttpResponse.json({ message: 'Compartilhe com um aluno' }, { status: 422 })
      message =
        share.data === 'plan'
          ? { type: 'event', event: 'plan', title: `Ficha compartilhada · ${coachPlan(s.studentId).name}`, meta: 'Toque para abrir no app', link: '/treinos' }
          : { type: 'event', event: 'diet', title: 'Dieta compartilhada', meta: 'Toque para abrir no app', link: '/dieta' }
    } else {
      const text = typeof body?.text === 'string' ? body.text.trim() : ''
      if (!text || text.length > 2000) return HttpResponse.json({ message: 'Mensagem vazia' }, { status: 422 })
      message = { type: 'text', text }
    }
    await latency()
    return HttpResponse.json<CoachMessage>(sendFromCoach(id, message, now), { status: 201 })
  }),

  http.put('/api/coach/conversations/:id/notes', async ({ params, request }) => {
    const { notes } = ((await request.json().catch(() => null)) ?? {}) as { notes?: unknown }
    if (typeof notes !== 'string') return HttpResponse.json({ message: 'Notas inválidas' }, { status: 422 })
    await latency()
    db.coach.chat.notes[params.id as string] = notes.slice(0, 2000)
    return new HttpResponse(null, { status: 204 })
  }),

  http.put('/api/coach/conversations/:id/muted', async ({ params, request }) => {
    const { muted } = ((await request.json().catch(() => null)) ?? {}) as { muted?: unknown }
    await latency()
    db.coach.chat.muted[params.id as string] = muted === true
    return new HttpResponse(null, { status: 204 })
  }),

  // "Só o treinador envia" no grupo
  http.put('/api/coach/conversations/:id/only-coach', async ({ request }) => {
    const { onlyCoach } = ((await request.json().catch(() => null)) ?? {}) as { onlyCoach?: unknown }
    await latency()
    db.coach.chat.onlyCoach = onlyCoach === true
    return new HttpResponse(null, { status: 204 })
  }),

  http.put('/api/coach/chat/auto-reply', async ({ request }) => {
    const { enabled } = ((await request.json().catch(() => null)) ?? {}) as { enabled?: unknown }
    await latency()
    db.coach.chat.autoReply = enabled === true
    return new HttpResponse(null, { status: 204 })
  }),

  // Transmissão: cada aluno recebe no chat individual, com {nome} trocado pelo primeiro nome
  http.post('/api/coach/broadcasts', async ({ request }) => {
    const body = (await request.json().catch(() => null)) as { audience?: unknown; text?: unknown } | null
    const audience = AudienceSchema.safeParse(body?.audience)
    const text = typeof body?.text === 'string' ? body.text.trim() : ''
    if (!audience.success || !text) return HttpResponse.json({ message: 'Escolha o público e escreva a mensagem' }, { status: 422 })
    await latency()
    const now = new Date()
    const targets = audienceOf(audience.data, students(now), now)
    for (const s of targets) sendFromCoach(conversationOf(s)!, { type: 'text', text: personalize(text, s.fullName) }, now)
    return HttpResponse.json({ sent: targets.length })
  }),
]
