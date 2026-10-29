import { http, HttpResponse } from 'msw'
import type { AppNotification, CoachNotifications, NotificationAudience, NotificationKind, NotificationTarget, SentNotification, StudentListItem } from '@workspace/core'
import { audienceLabel, CoachPrefKey, fillNotification, NewNotification, notificationReach, notificationTargetLink, quietHoursAdjust, workoutForDate } from '@workspace/core'
import { db, latency, newId } from '../db'
import { automations, automationsOff, coachInbox, initiallyRead, initialPrefs, sentHistory } from '../fixtures/coach-notifications'
import { coachName, renatoMe } from '../fixtures/renato'
import { appPlan } from '../live-plan'
import { students } from './coach'

/** Quem tem push ativo: 41 dos 52 ativos (o Marcos, do canvas, não tem). */
function audienceOf(now: Date): NotificationAudience['students'] {
  return students(now)
    .filter((s) => s.status === 'active')
    .map((s: StudentListItem, i) => ({ id: s.id, name: s.fullName, tags: s.tags, push: s.id !== 'stu_marcos' && i % 5 !== 4 }))
}

/** Histórico de envios (os do canvas na primeira vez; os novos entram no topo). */
const history = (now: Date) => (db.coach.notif.history ??= sentHistory(now))

const isRead = (id: string) => db.coach.notif.read.includes(id) || initiallyRead.includes(id)

/** Treino de hoje do Renato (o exemplo da pré-visualização). */
function todaysWorkout(now: Date): string {
  const d = workoutForDate(appPlan().days, now)
  return d ? `Treino ${d.letter} — ${d.name}` : 'treino de hoje'
}

/** Avisos da caixa do treinador ainda não lidos (contador do menu). */
export const unreadCoachNotifications = (now: Date) => coachInbox(now).filter((n) => !isRead(n.id)).length

/** O que o treinador mandou ao Renato aparece na central do app dele. */
export const coachNotificationsForRenato = () => db.coach.notif.toRenato

const kindOf: Record<NotificationTarget, NotificationKind> = { home: 'plan', workout: 'workout', diet: 'meal', checkIn: 'checkIn', chat: 'message' }

export const coachNotificationHandlers = [
  http.get('/api/coach/notifications', async () => {
    await latency()
    const now = new Date()
    const aud = audienceOf(now)
    const list = [...history(now)].sort((a, b) => b.at.localeCompare(a.at))
    return HttpResponse.json<CoachNotifications>({
      inbox: coachInbox(now).map((n) => ({ ...n, read: isRead(n.id) })),
      automations: automations.map((a) => ({ ...a, enabled: db.coach.notif.automations[a.id] ?? !automationsOff.includes(a.id) })),
      history: list,
      push: { enabled: aud.filter((s) => s.push).length, students: aud.length },
      sent30d: 1248 + list.filter((h) => h.id.startsWith('sn_')).reduce((n, h) => n + (h.sent ?? 0), 0),
      openRate: 38,
      prefs: Object.fromEntries(CoachPrefKey.options.map((k) => [k, db.coach.notif.prefs[k] ?? initialPrefs[k]])) as CoachNotifications['prefs'],
    })
  }),

  http.get('/api/coach/notifications/audience', async () => {
    await latency()
    const now = new Date()
    const list = audienceOf(now)
    const tags = [...new Set(list.flatMap((s) => s.tags))].sort((a, b) => list.filter((s) => s.tags.includes(b)).length - list.filter((s) => s.tags.includes(a)).length)
    return HttpResponse.json<NotificationAudience>({ students: list, tags, sample: { name: renatoMe.fullName, workout: todaysWorkout(now), coach: coachName } })
  }),

  http.post('/api/coach/notifications/:id/read', async ({ params }) => {
    await latency()
    if (!db.coach.notif.read.includes(params.id as string)) db.coach.notif.read.push(params.id as string)
    return new HttpResponse(null, { status: 204 })
  }),

  http.post('/api/coach/notifications/read-all', async () => {
    await latency()
    db.coach.notif.read = coachInbox(new Date()).map((n) => n.id)
    return new HttpResponse(null, { status: 204 })
  }),

  http.put('/api/coach/automations/:id', async ({ params, request }) => {
    const { enabled } = ((await request.json().catch(() => null)) ?? {}) as { enabled?: unknown }
    if (!automations.some((a) => a.id === params.id)) return HttpResponse.json({ message: 'Automação não encontrada' }, { status: 404 })
    await latency()
    db.coach.notif.automations[params.id as string] = enabled === true
    return new HttpResponse(null, { status: 204 })
  }),

  // "O que eu recebo": o que vira push no celular do treinador
  http.put('/api/coach/notification-prefs', async ({ request }) => {
    const body = ((await request.json().catch(() => null)) ?? {}) as Record<string, unknown>
    await latency()
    for (const k of CoachPrefKey.options) if (typeof body[k] === 'boolean') db.coach.notif.prefs[k] = body[k]
    return new HttpResponse(null, { status: 204 })
  }),

  // "Testar em mim": só confirma (no app real chega no celular do treinador)
  http.post('/api/coach/notifications/test', async () => {
    await latency()
    return new HttpResponse(null, { status: 204 })
  }),

  // Enviar agora ou agendar (entre 22h e 7h fica para as 7h)
  http.post('/api/coach/notifications', async ({ request }) => {
    const parsed = NewNotification.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return HttpResponse.json({ message: 'Notificação inválida', issues: parsed.error.issues }, { status: 422 })
    const n = parsed.data
    const now = new Date()
    const reach = notificationReach(audienceOf(now), n)
    if (reach.total === 0) return HttpResponse.json({ message: 'Ninguém neste público' }, { status: 422 })
    await latency()
    const when = n.scheduledAt ? quietHoursAdjust(new Date(n.scheduledAt)).at : now
    const entry: SentNotification = {
      id: newId('sn'),
      at: when.toISOString(),
      title: n.title,
      body: n.body,
      audienceLabel: audienceLabel(n),
      target: n.target,
      status: n.scheduledAt ? 'scheduled' : 'sent',
      sent: n.scheduledAt ? null : reach.total,
      push: n.scheduledAt ? null : reach.push,
      openRate: n.scheduledAt ? null : 0,
    }
    db.coach.notif.history = [entry, ...history(now)]
    const renato = reach.students.find((s) => s.id === renatoMe.id)
    if (!n.scheduledAt && renato) {
      const vars = { name: renato.name, workout: todaysWorkout(now), coach: coachName }
      const note: AppNotification = { id: `coach_${entry.id}`, kind: kindOf[n.target], title: fillNotification(n.title, vars), body: fillNotification(n.body, vars), link: notificationTargetLink[n.target], createdAt: now.toISOString(), read: false }
      db.coach.notif.toRenato = [note, ...db.coach.notif.toRenato]
      db.unreadNotifications = [...db.unreadNotifications, note.id]
    }
    return HttpResponse.json({ sent: reach.total, push: reach.push, at: entry.at, status: entry.status }, { status: 201 })
  }),

  // "Você pode cancelar em Enviadas"
  http.post('/api/coach/notifications/:id/cancel', async ({ params }) => {
    const item = history(new Date()).find((h) => h.id === params.id && h.status === 'scheduled')
    if (!item) return HttpResponse.json({ message: 'Só dá para cancelar envio agendado' }, { status: 409 })
    await latency()
    item.status = 'canceled'
    return new HttpResponse(null, { status: 204 })
  }),
]
