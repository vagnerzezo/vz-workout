import { http, HttpResponse } from 'msw'
import type { HomeSummary, Me } from '@workspace/core'
import { toIsoDate } from '@workspace/core'
import { currentScenario, db, finishedThisWeek, latency, newId } from '../db'
import { renatoHome, renatoMe } from '../fixtures/renato'
import { renatoPlan } from '../fixtures/renato-plan'
import { hasUnreadMessages } from './chat'
import { homeNutrition } from './diet'
import { inbox } from './notifications'

function homeFor(today: Date): HomeSummary {
  const lastWeightKg = db.weights.at(-1)?.kg ?? null
  const plan = currentScenario() === 'sem-ficha' ? null : renatoPlan
  const home = { ...renatoHome(plan, today, homeNutrition(today), lastWeightKg, finishedThisWeek(today)), unreadNotifications: inbox(today).filter((n) => !n.read).length, hasUnreadMessages: hasUnreadMessages(today) }

  switch (currentScenario()) {
    case 'descanso':
      return { ...home, todayWorkout: null }
    case 'novo':
      return {
        ...home,
        streakDays: 0,
        unreadNotifications: 0,
        hasUnreadMessages: false,
        lastWeightKg: null,
        week: home.week.map((d) => ({ ...d, trained: false })),
        todayWorkout: home.todayWorkout && { ...home.todayWorkout, position: 1 },
        weeklyWorkouts: { done: 0, goal: 5 },
        activity: [],
      }
    default:
      return home
  }
}

export const homeHandlers = [
  http.get('/api/me', async () => {
    await latency()
    // Pausado até a cobrança vencida ser paga (o comprovante enviado ainda espera o treinador)
    const paused = currentScenario() === 'pausado' && db.charge?.status !== 'paid'
    const name = db.newStudent?.fullName
    const who = name ? { id: 'stu_novo', fullName: name, firstName: name.split(' ')[0]! } : {}
    return HttpResponse.json<Me>({ ...renatoMe, ...who, access: paused ? 'paused' : 'active' })
  }),

  http.get('/api/me/home', async () => {
    await latency()
    if (currentScenario() === 'erro') {
      return HttpResponse.json({ message: 'Erro simulado' }, { status: 500 })
    }
    return HttpResponse.json(homeFor(new Date()))
  }),

  http.post('/api/me/weights', async ({ request }) => {
    const { kg } = (await request.json()) as { kg: number }
    if (typeof kg !== 'number' || kg < 20 || kg > 400) {
      return HttpResponse.json({ message: 'Peso inválido' }, { status: 422 })
    }
    await latency()
    const entry = { id: newId('kg'), kg, date: toIsoDate(new Date()) }
    db.weights.push(entry)
    return HttpResponse.json(entry, { status: 201 })
  }),
]
