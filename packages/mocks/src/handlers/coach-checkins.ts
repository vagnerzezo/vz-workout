import { http, HttpResponse } from 'msw'
import type { CheckInReview, CoachCheckIns, LateCheckIn, StudentListItem } from '@workspace/core'
import { toIsoDate } from '@workspace/core'
import { db, latency } from '../db'
import { answeredReplies, lateSeeds, RATING_DIMS, waitingSeeds, type CheckInSeed } from '../fixtures/coach-checkins'
import { students } from './coach'

const day = (now: Date, offset: number) => {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  d.setDate(d.getDate() + offset)
  return d
}

function review(seed: CheckInSeed, s: StudentListItem, now: Date): CheckInReview {
  const weights = s.id === 'stu_renato' ? db.weights : []
  const [w, wp] = seed.weight ?? [weights.at(-1)?.kg ?? 80, weights.at(-2)?.kg ?? null]
  const reply = db.coach.checkInReplies[seed.id]
  return {
    id: seed.id,
    studentId: s.id,
    studentName: s.fullName,
    kind: 'quinzenal',
    sentAt: new Date(now.getTime() - seed.hoursAgo * 3_600_000).toISOString(),
    previousOn: toIsoDate(day(now, -14)),
    weight: { now: w, previous: wp },
    waist: { now: seed.waist[0], previous: seed.waist[1] },
    poses: ['front', 'side', 'back'],
    ratings: RATING_DIMS.map((label, i) => ({ label, value: seed.now[i]!, previous: seed.previous[i]! })),
    history: seed.history,
    comment: seed.comment,
    pain: seed.pain,
    reply: reply ? { ...reply, read: false } : null,
  }
}

/** Fila do treinador: os 6 do canvas aguardando e os já respondidos (os de hoje entram no topo). */
export function coachCheckIns(now: Date): CoachCheckIns {
  const list = students(now)
  const byId = new Map(list.map((s) => [s.id, s]))
  const all = waitingSeeds.flatMap((seed) => {
    const s = byId.get(seed.studentId)
    return s && s.status !== 'archived' ? [review(seed, s, now)] : []
  })
  const waiting = all.filter((c) => !c.reply)
  const repliedNow = all.filter((c) => c.reply).sort((a, b) => b.reply!.at.localeCompare(a.reply!.at))

  // Respondidos antes: o Thiago e os primeiros alunos ativos fora da fila, cada um com um check-in de 1 a 7 dias atrás
  const queue = new Set(waitingSeeds.map((s) => s.studentId))
  const others = [byId.get('stu_thiago'), ...list.filter((s) => s.status === 'active' && !queue.has(s.id) && s.id !== 'stu_thiago')].filter((s): s is StudentListItem => !!s).slice(0, 14)
  const older = others.map((s, i): CheckInReview => {
    const [daysAgo, text, read] = answeredReplies[i % answeredReplies.length]!
    const sent = day(now, -(daysAgo + Math.floor(i / 4)))
    const seed = waitingSeeds[(i + 3) % waitingSeeds.length]!
    return {
      ...review({ ...seed, id: `ci_${s.id.replace('stu_', '')}_r`, weight: seed.weight ?? [80, 80.4] }, s, now),
      sentAt: new Date(sent.getTime() + 9 * 3_600_000).toISOString(),
      comment: 'Semana tranquila, sem dores.',
      pain: null,
      reply: { text: i === 0 ? text : text.replace('Thiago', s.fullName.split(' ')[0]!), at: new Date(sent.getTime() + 20 * 3_600_000).toISOString(), read },
    }
  })

  const late: LateCheckIn[] = lateSeeds.flatMap((l) => {
    const s = byId.get(l.studentId)
    return s && s.status !== 'archived' ? [{ studentId: s.id, studentName: s.fullName, kind: l.kind, dueOn: toIsoDate(day(now, -l.daysLate)), note: l.note, conversationId: s.conversationId, remindedAt: db.coach.checkInReminders[s.id] ?? null }] : []
  })

  return { waiting, answered: [...repliedNow, ...older], late, onTimeRate: 87 }
}

export const coachCheckInHandlers = [
  http.get('/api/coach/check-ins', async () => {
    await latency()
    return HttpResponse.json<CoachCheckIns>(coachCheckIns(new Date()))
  }),

  // "Enviar e marcar como respondido": o aluno vê a resposta no app
  http.post('/api/coach/check-ins/:id/reply', async ({ params, request }) => {
    const body = (await request.json().catch(() => null)) as { text?: unknown } | null
    const text = typeof body?.text === 'string' ? body.text.trim() : ''
    if (!text) return HttpResponse.json({ message: 'Escreva a resposta' }, { status: 422 })
    if (!waitingSeeds.some((s) => s.id === params.id)) return HttpResponse.json({ message: 'Check-in não encontrado' }, { status: 404 })
    if (db.coach.checkInReplies[params.id as string]) return HttpResponse.json({ message: 'Check-in já respondido' }, { status: 409 })
    await latency()
    db.coach.checkInReplies[params.id as string] = { text, at: new Date().toISOString() }
    return new HttpResponse(null, { status: 204 })
  }),

  // Lembrete para quem está com o check-in atrasado (vai como notificação no app)
  http.post('/api/coach/check-ins/remind', async ({ request }) => {
    const body = (await request.json().catch(() => null)) as { studentIds?: unknown } | null
    const ids = Array.isArray(body?.studentIds) ? body.studentIds.filter((id): id is string => typeof id === 'string') : []
    if (ids.length === 0) return HttpResponse.json({ message: 'Informe os alunos' }, { status: 422 })
    await latency()
    const at = new Date().toISOString()
    for (const id of ids) db.coach.checkInReminders[id] = at
    return new HttpResponse(null, { status: 204 })
  }),
]
