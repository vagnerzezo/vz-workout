import { http, HttpResponse } from 'msw'
import type { Coach, CoachCounters, CoachDashboard, StudentList, StudentListItem } from '@workspace/core'
import { currentScenario, db, latency } from '../db'
import { kaueCoach, kaueCounters, kaueDashboard } from '../fixtures/coach'
import { coachStudents, filterTags } from '../fixtures/coach-students'
import { renatoMe } from '../fixtures/renato'
import { isOverdue } from '@workspace/core'
import { unreadChats } from './coach-chat'
import { unreadCoachNotifications } from './coach-notifications'
import { coachCheckIns } from './coach-checkins'
import { allSessions } from './workout'

/** Carteira do treinador com o que já foi arquivado ou reativado nesta sessão. */
export function students(now: Date): StudentListItem[] {
  return [...coachStudents(now), ...db.coach.created.map((c) => c.student)].map((student) => {
    const added = db.coach.addedTags[student.id] ?? []
    const s = { ...student, tags: [...new Set([...student.tags, ...added])] }
    // O Renato é o aluno do app: o último treino vem das sessões dele (inclui as que ele salvar agora)
    if (s.id === renatoMe.id) s.lastWorkoutOn = allSessions(now, false)[0]?.date ?? s.lastWorkoutOn
    const assigned = db.coach.planAssignments[s.id]
    if (assigned) s.planEndsOn = assigned.endsOn
    if (db.coach.archived.includes(s.id)) return { ...s, status: 'archived' }
    if (db.coach.unarchived.includes(s.id)) return { ...s, status: 'active' }
    return s
  })
}

const activeCount = () => students(new Date()).filter((s) => s.status === 'active').length

async function idsFrom(request: Request): Promise<string[] | null> {
  const body = (await request.json().catch(() => null)) as { ids?: unknown } | null
  return Array.isArray(body?.ids) && body.ids.every((id) => typeof id === 'string') ? body.ids : null
}

const failed = () => HttpResponse.json({ message: 'Erro simulado' }, { status: 500 })

/** Painel do treinador: tudo sob /api/coach. */
export const coachHandlers = [
  http.get('/api/coach/me', async () => {
    await latency()
    return HttpResponse.json<Coach>({ ...kaueCoach, activeStudents: activeCount() })
  }),

  http.get('/api/coach/counters', async () => {
    await latency()
    return HttpResponse.json<CoachCounters>({ ...kaueCounters, students: activeCount(), pendingCheckIns: coachCheckIns(new Date()).waiting.length, unreadChats: unreadChats(new Date()), unreadNotifications: unreadCoachNotifications(new Date()) })
  }),

  http.get('/api/coach/dashboard', async () => {
    await latency()
    if (currentScenario() === 'erro') return failed()
    const now = new Date()
    const dashboard = kaueDashboard(now)
    const { waiting } = coachCheckIns(now)
    return HttpResponse.json<CoachDashboard>({
      ...dashboard,
      activeStudents: { ...dashboard.activeStudents, count: activeCount() },
      pendingCheckIns: { count: waiting.length, over48h: waiting.filter((c) => isOverdue(c, now)).length },
      // Check-in respondido sai da atenção
      attention: dashboard.attention.filter((a) => !db.coach.resolvedAttention.includes(a.id) && !(a.targetId && db.coach.checkInReplies[a.targetId])),
      birthdays: dashboard.birthdays.map((b) => ({ ...b, congratulated: db.coach.congratulated.includes(b.studentId) })),
    })
  }),

  // "Marcar como resolvido" (✓) na lista de atenção
  http.post('/api/coach/attention/:id/resolve', async ({ params }) => {
    await latency()
    if (!db.coach.resolvedAttention.includes(params.id as string)) db.coach.resolvedAttention.push(params.id as string)
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('/api/coach/students', async () => {
    await latency()
    if (currentScenario() === 'erro') return failed()
    return HttpResponse.json<StudentList>({ students: students(new Date()), filterTags })
  }),

  // Ação em massa (ou do menu ⋮): arquivar libera a vaga do plano; o aluno perde o acesso ao app
  http.post('/api/coach/students/archive', async ({ request }) => {
    const ids = await idsFrom(request)
    if (!ids?.length) return HttpResponse.json({ message: 'Informe os alunos' }, { status: 422 })
    await latency()
    db.coach.archived = [...new Set([...db.coach.archived, ...ids])]
    db.coach.unarchived = db.coach.unarchived.filter((id) => !ids.includes(id))
    return new HttpResponse(null, { status: 204 })
  }),

  http.post('/api/coach/students/unarchive', async ({ request }) => {
    const ids = await idsFrom(request)
    if (!ids?.length) return HttpResponse.json({ message: 'Informe os alunos' }, { status: 422 })
    await latency()
    db.coach.unarchived = [...new Set([...db.coach.unarchived, ...ids])]
    db.coach.archived = db.coach.archived.filter((id) => !ids.includes(id))
    return new HttpResponse(null, { status: 204 })
  }),

  http.post('/api/coach/students/tags', async ({ request }) => {
    const body = (await request.clone().json().catch(() => null)) as { tag?: unknown } | null
    const ids = await idsFrom(request)
    const tag = typeof body?.tag === 'string' ? body.tag.trim() : ''
    if (!ids?.length || !tag) return HttpResponse.json({ message: 'Informe os alunos e a tag' }, { status: 422 })
    await latency()
    for (const id of ids) db.coach.addedTags[id] = [...new Set([...(db.coach.addedTags[id] ?? []), tag])]
    return new HttpResponse(null, { status: 204 })
  }),

  http.post('/api/coach/students/:id/invite/resend', async ({ params }) => {
    await latency()
    db.coach.resentInvites.push(params.id as string)
    return new HttpResponse(null, { status: 204 })
  }),

  // "Parabenizar": manda a mensagem de aniversário pelo chat
  http.post('/api/coach/students/:id/congratulate', async ({ params }) => {
    await latency()
    if (!db.coach.congratulated.includes(params.id as string)) db.coach.congratulated.push(params.id as string)
    return new HttpResponse(null, { status: 204 })
  }),
]
