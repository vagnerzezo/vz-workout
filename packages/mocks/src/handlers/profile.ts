import { addDays } from 'date-fns'
import { http, HttpResponse } from 'msw'
import type { StudentProfile } from '@workspace/core'
import { toIsoDate } from '@workspace/core'
import { currentScenario, db, latency } from '../db'
import { renatoMe } from '../fixtures/renato'
import { allSessions } from './workout'

export const profileHandlers = [
  http.get('/api/me/profile', async () => {
    await latency()
    const scenario = currentScenario()
    if (scenario === 'erro') return HttpResponse.json({ message: 'Erro simulado' }, { status: 500 })
    const today = new Date()
    const isNew = scenario === 'novo'
    return HttpResponse.json<StudentProfile>({
      fullName: renatoMe.fullName,
      birthDate: '1993-05-12',
      goal: 'Hipertrofia',
      level: 'Intermediário',
      memberSince: isNew ? toIsoDate(today) : '2026-06-10',
      totalWorkouts: allSessions(today, isNew || scenario === 'sem-ficha').length,
      streakDays: isNew ? 0 : 3, // o mesmo da Home
      coach: { name: 'Carlos Oliveira' },
      subscription: { planLabel: 'trimestral', endsAt: '2026-12-15' },
      // Sempre vence daqui a 2 dias, como no canvas
      checkIn: isNew ? null : { label: 'Check-in quinzenal', dueDate: toIsoDate(addDays(today, 2)), photoCount: 3, questionCount: 6 },
      weightGoal: { startKg: 85, startDate: '2026-08-01', goalKg: 76 },
      currentWeightKg: isNew ? null : (db.weights.at(-1)?.kg ?? null),
    })
  }),
]
