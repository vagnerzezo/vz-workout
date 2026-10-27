import { http, HttpResponse } from 'msw'
import type { HistorySession, MonthHistory, SessionTemplate, StudentPlan, WorkoutSession } from '@workspace/core'
import { FinishSessionRequest, LoggedSet, shiftMonth, YearMonth, yearMonthOf } from '@workspace/core'
import { currentScenario, db, finishedThisWeek, latency, newId } from '../db'
import { doneDayIds } from '../fixtures/renato'
import { exerciseLibrary, renatoPlan } from '../fixtures/renato-plan'
import { sessionItem } from '../fixtures/renato-sessions'
import { generatedHistory, historyFromSession } from '../fixtures/renato-history'

const failed = () => HttpResponse.json({ message: 'Erro simulado' }, { status: 500 })

export const workoutHandlers = [
  http.get('/api/me/workout-plan', async () => {
    await latency()
    const scenario = currentScenario()
    if (scenario === 'erro') return failed()
    if (scenario === 'sem-ficha') {
      return HttpResponse.json<StudentPlan>({ plan: null, exercises: [], doneThisWeek: [] })
    }
    const today = new Date()
    const used = new Set(renatoPlan.days.flatMap((d) => d.exercises.map((e) => e.exerciseId)))
    const done = scenario === 'novo' ? [] : doneDayIds(renatoPlan, today)
    return HttpResponse.json<StudentPlan>({
      plan: renatoPlan,
      exercises: exerciseLibrary.filter((e) => used.has(e.id)),
      doneThisWeek: [...new Set([...done, ...finishedThisWeek(today).map((f) => f.dayId)])],
    })
  }),

  http.get('/api/me/workout-days/:dayId/template', async ({ params }) => {
    await latency()
    if (currentScenario() === 'erro') return failed()
    const day = renatoPlan.days.find((d) => d.id === params.dayId)
    if (!day) return HttpResponse.json({ message: 'Treino não encontrado' }, { status: 404 })
    const used = new Set(day.exercises.map((e) => e.exerciseId))
    return HttpResponse.json<SessionTemplate>({
      day,
      phase: renatoPlan.phases.find((p) => p.id === renatoPlan.currentPhaseId) ?? null,
      exercises: exerciseLibrary.filter((e) => used.has(e.id)),
      items: day.exercises.map(sessionItem),
    })
  }),

  // Upsert de uma série durante o treino: idempotente, então o app pode reenviar depois de ficar offline
  http.put('/api/me/sessions/:sessionId/sets/:setKey', async ({ params, request }) => {
    const parsed = LoggedSet.safeParse(await request.json())
    if (!parsed.success || parsed.data.key !== params.setKey) {
      return HttpResponse.json({ message: 'Série inválida' }, { status: 422 })
    }
    await latency()
    const sessionId = String(params.sessionId)
    db.liveSets[sessionId] = { ...db.liveSets[sessionId], [parsed.data.key]: parsed.data }
    return HttpResponse.json(parsed.data)
  }),

  http.post('/api/me/sessions/:sessionId/finish', async ({ params, request }) => {
    const parsed = FinishSessionRequest.safeParse(await request.json())
    if (!parsed.success) return HttpResponse.json({ message: 'Sessão inválida' }, { status: 422 })
    await latency()
    const id = String(params.sessionId) || newId('ses')
    const session: WorkoutSession = { id, ...parsed.data }
    db.sessions = [...db.sessions.filter((s) => s.id !== id), session]
    delete db.liveSets[id]
    return HttpResponse.json(session, { status: 201 })
  }),

  http.delete('/api/me/sessions/:sessionId', async ({ params }) => {
    await latency()
    delete db.liveSets[String(params.sessionId)]
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('/api/me/sessions', async ({ request }) => {
    await latency()
    const scenario = currentScenario()
    if (scenario === 'erro') return failed()
    const today = new Date()
    const month = YearMonth.safeParse(new URL(request.url).searchParams.get('month'))
    if (!month.success) return HttpResponse.json({ message: 'Informe o mês: ?month=2026-10' }, { status: 422 })

    const all = allSessions(today, scenario === 'novo' || scenario === 'sem-ficha')
    const inMonth = (m: string) => all.filter((s) => s.date.startsWith(m))
    const previousVolume = inMonth(shiftMonth(month.data, -1)).reduce((sum, s) => sum + s.volumeKg, 0)
    return HttpResponse.json<MonthHistory>({
      month: month.data,
      sessions: inMonth(month.data),
      previousMonthVolumeKg: previousVolume || null,
      weeklyGoal: renatoPlan.days.length,
      firstMonth: all.at(-1)?.date.slice(0, 7) ?? yearMonthOf(today),
    })
  }),
]

/** Histórico gerado + treinos salvos pelo app, do mais recente para o mais antigo. */
function allSessions(today: Date, isNew: boolean): HistorySession[] {
  const saved = db.sessions.map(historyFromSession).filter((s): s is HistorySession => s !== null)
  const generated = isNew ? [] : generatedHistory(today)
  return [...saved, ...generated].sort((a, b) => b.date.localeCompare(a.date))
}
