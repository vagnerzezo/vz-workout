import { http, HttpResponse } from 'msw'
import type { Coach, CoachCounters, CoachDashboard } from '@workspace/core'
import { currentScenario, db, latency } from '../db'
import { kaueCoach, kaueCounters, kaueDashboard } from '../fixtures/coach'

const failed = () => HttpResponse.json({ message: 'Erro simulado' }, { status: 500 })

/** Painel do treinador: tudo sob /api/coach. */
export const coachHandlers = [
  http.get('/api/coach/me', async () => {
    await latency()
    return HttpResponse.json<Coach>(kaueCoach)
  }),

  http.get('/api/coach/counters', async () => {
    await latency()
    return HttpResponse.json<CoachCounters>(kaueCounters)
  }),

  http.get('/api/coach/dashboard', async () => {
    await latency()
    if (currentScenario() === 'erro') return failed()
    const dashboard = kaueDashboard(new Date())
    return HttpResponse.json<CoachDashboard>({
      ...dashboard,
      attention: dashboard.attention.filter((a) => !db.coach.resolvedAttention.includes(a.id)),
      birthdays: dashboard.birthdays.map((b) => ({ ...b, congratulated: db.coach.congratulated.includes(b.studentId) })),
    })
  }),

  // "Marcar como resolvido" (✓) na lista de atenção
  http.post('/api/coach/attention/:id/resolve', async ({ params }) => {
    await latency()
    if (!db.coach.resolvedAttention.includes(params.id as string)) db.coach.resolvedAttention.push(params.id as string)
    return new HttpResponse(null, { status: 204 })
  }),

  // "Parabenizar": manda a mensagem de aniversário pelo chat
  http.post('/api/coach/students/:id/congratulate', async ({ params }) => {
    await latency()
    if (!db.coach.congratulated.includes(params.id as string)) db.coach.congratulated.push(params.id as string)
    return new HttpResponse(null, { status: 204 })
  }),
]
