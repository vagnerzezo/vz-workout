import { http, HttpResponse } from 'msw'
import type { StudentProfile } from '@workspace/core'
import { NotificationSettings } from '@workspace/core'
import { toIsoDate } from '@workspace/core'
import { currentScenario, db, latency } from '../db'
import { coachName, renatoMe } from '../fixtures/renato'
import { pendingCheckIn } from './checkin'
import { allSessions } from './workout'

const goalLabels = { lose: 'Emagrecimento', gain: 'Hipertrofia', health: 'Saúde e disposição', performance: 'Performance' } as const
const levelLabels = { beginner: 'Iniciante', intermediate: 'Intermediário', advanced: 'Avançado' } as const

export const profileHandlers = [
  http.get('/api/me/profile', async () => {
    await latency()
    const scenario = currentScenario()
    if (scenario === 'erro') return HttpResponse.json({ message: 'Erro simulado' }, { status: 500 })
    const today = new Date()
    const isNew = scenario === 'novo'
    const checkIn = pendingCheckIn(today)
    return HttpResponse.json<StudentProfile>({
      fullName: db.newStudent?.fullName ?? renatoMe.fullName,
      birthDate: '1993-05-12',
      goal: goalLabels[db.newStudent?.anamnesis?.goal ?? 'gain'],
      level: levelLabels[db.newStudent?.anamnesis?.experience ?? 'intermediate'],
      memberSince: isNew ? toIsoDate(today) : '2026-06-10',
      totalWorkouts: allSessions(today, isNew || scenario === 'sem-ficha').length,
      streakDays: isNew ? 0 : 3, // o mesmo da Home
      coach: { name: coachName },
      subscription: { planLabel: 'trimestral', endsAt: '2026-12-15' },
      checkIn: checkIn && {
        label: checkIn.label,
        dueDate: checkIn.dueDate,
        photoCount: checkIn.poses.length,
        questionCount: checkIn.questions.length + 1, // + a pergunta da dor
      },
      weightGoal: { startKg: 85, startDate: '2026-08-01', goalKg: 76 },
      currentWeightKg: isNew ? null : (db.weights.at(-1)?.kg ?? null),
    })
  }),

  http.get('/api/me/settings', async () => {
    await latency()
    if (currentScenario() === 'erro') return HttpResponse.json({ message: 'Erro simulado' }, { status: 500 })
    return HttpResponse.json<NotificationSettings>(db.notifications)
  }),

  // Atualização parcial: só as chaves enviadas mudam
  http.put('/api/me/settings', async ({ request }) => {
    const patch = NotificationSettings.partial().strict().safeParse(await request.json())
    if (!patch.success) return HttpResponse.json({ message: 'Preferência inválida' }, { status: 422 })
    await latency()
    db.notifications = { ...db.notifications, ...patch.data }
    return HttpResponse.json<NotificationSettings>(db.notifications)
  }),
]
