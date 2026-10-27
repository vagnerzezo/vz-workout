import { http, HttpResponse } from 'msw'
import type { StudentProgress } from '@workspace/core'
import { currentScenario, db, latency } from '../db'
import { renatoMeasurements } from '../fixtures/renato-progress'
import { exerciseLibrary, renatoPlan } from '../fixtures/renato-plan'
import { allSessions } from './workout'

const library = new Map(exerciseLibrary.map((e) => [e.id, e]))

export const progressHandlers = [
  http.get('/api/me/progress', async () => {
    await latency()
    const scenario = currentScenario()
    if (scenario === 'erro') return HttpResponse.json({ message: 'Erro simulado' }, { status: 500 })
    const isNew = scenario === 'novo'
    const sessions = allSessions(new Date(), isNew || scenario === 'sem-ficha')

    // Exercício principal de cada dia: o primeiro da ficha (A, B e C, como no canvas)
    const lifts = renatoPlan.days.slice(0, 3).map((day) => {
      const id = day.exercises[0]!.exerciseId
      const name = library.get(id)?.name ?? id
      const sets = sessions.flatMap((s) => s.exercises.filter((e) => e.name === name).map((e) => ({ date: s.date, ...e.best })))
      return { exerciseId: id, name, sets: sets.filter((s) => s.reps > 0).reverse() }
    })

    return HttpResponse.json<StudentProgress>({
      weights: isNew ? db.weights.filter((w) => w.id.startsWith('kg_')) : db.weights, // aluno novo: só o que registrou no app
      weightGoalKg: 76,
      lifts,
      measurements: isNew ? [] : renatoMeasurements,
      photos: isNew ? db.photos.filter((p) => !p.id.startsWith('ph_2026')) : db.photos, // aluno novo: só as que enviou
    })
  }),
]
