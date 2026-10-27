import { http, HttpResponse } from 'msw'
import type { AppNotification } from '@workspace/core'
import { currentScenario, db, latency } from '../db'
import { renatoNotifications } from '../fixtures/renato-notifications'

/** Caixa de notificações; o aluno novo ainda não tem nenhuma. */
export function inbox(now: Date): AppNotification[] {
  if (currentScenario() === 'novo') return []
  return renatoNotifications(now).map((n) => ({ ...n, read: !db.unreadNotifications.includes(n.id) }))
}

export const notificationHandlers = [
  http.get('/api/me/notifications', async () => {
    await latency()
    if (currentScenario() === 'erro') return HttpResponse.json({ message: 'Erro simulado' }, { status: 500 })
    return HttpResponse.json<AppNotification[]>(inbox(new Date()))
  }),

  http.post('/api/me/notifications/:id/read', async ({ params }) => {
    await latency()
    db.unreadNotifications = db.unreadNotifications.filter((id) => id !== params.id)
    return new HttpResponse(null, { status: 204 })
  }),

  http.post('/api/me/notifications/read-all', async () => {
    await latency()
    db.unreadNotifications = []
    return new HttpResponse(null, { status: 204 })
  }),
]
