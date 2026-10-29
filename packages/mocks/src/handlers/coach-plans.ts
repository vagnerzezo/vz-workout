import { http, HttpResponse } from 'msw'
import { addDays, addWeeks } from 'date-fns'
import type { AssignedPlan, CoachPlans, PlanTemplateSummary } from '@workspace/core'
import { AssignPlan, parseIsoDate, toIsoDate } from '@workspace/core'
import { db, latency, newId } from '../db'
import { coachStudents } from '../fixtures/coach-students'
import { initialUsage, planTemplates } from '../fixtures/plan-templates'
import { renatoMe } from '../fixtures/renato'
import { coachPlan } from '../live-plan'
import { students } from './coach'

const templates = () => (db.coach.templates ??= planTemplates(new Date()))

/** Modelo de onde saiu a ficha de cada aluno ativo do fixture, na ordem da carteira (18 no PPL, 9 no Upper/Lower…). */
function baseTemplates(): Map<string, string> {
  const queue = initialUsage.flatMap(([id, n]) => Array<string>(n).fill(id))
  const active = coachStudents(new Date()).filter((s) => s.status === 'active')
  return new Map(active.flatMap((s, i) => (queue[i] ? [[s.id, queue[i]] as const] : [])))
}

const templateOf = (studentId: string, base: Map<string, string>) => db.coach.planAssignments[studentId]?.templateId ?? base.get(studentId) ?? null

/** Lista com as contagens de "alunos usando" calculadas da carteira atual (arquivar um aluno libera a vaga). */
function coachPlans(): CoachPlans {
  const base = baseTemplates()
  const list = students(new Date()).filter((s) => s.status !== 'archived')
  const byId = new Map(templates().map((t) => [t.id, t]))
  const assigned: AssignedPlan[] = list.flatMap((s) => {
    const templateId = templateOf(s.id, base)
    if (!templateId || !s.planEndsOn) return []
    const own = s.id === renatoMe.id && !db.coach.planAssignments[s.id] // a ficha do Renato foi ajustada para ele
    return [{ studentId: s.id, studentName: s.fullName, planName: own ? coachPlan(s.id).name : (byId.get(templateId)?.name ?? 'Ficha'), templateId, validUntil: s.planEndsOn }]
  })
  const using = (id: string) => assigned.filter((a) => a.templateId === id).length
  return { templates: templates().map((t) => ({ ...t, studentsUsing: using(t.id) })), assigned }
}

const notFound = () => HttpResponse.json({ message: 'Ficha não encontrada' }, { status: 404 })

export const coachPlanHandlers = [
  http.get('/api/coach/plans', async () => {
    await latency()
    return HttpResponse.json<CoachPlans>(coachPlans())
  }),

  // Cópia do modelo para editar sem mexer no original
  http.post('/api/coach/plans/:id/duplicate', async ({ params }) => {
    const source = templates().find((t) => t.id === params.id)
    if (!source) return notFound()
    await latency()
    const copy: PlanTemplateSummary = { ...source, id: newId('tpl'), name: `${source.name} (cópia)`, updatedAt: toIsoDate(new Date()), studentsUsing: 0, archived: false }
    templates().splice(templates().indexOf(source) + 1, 0, copy)
    return HttpResponse.json<PlanTemplateSummary>(copy, { status: 201 })
  }),

  http.post('/api/coach/plans/:id/archive', async ({ params }) => {
    const t = templates().find((x) => x.id === params.id)
    if (!t) return notFound()
    await latency()
    t.archived = true // quem já usa continua com a cópia dele
    return new HttpResponse(null, { status: 204 })
  }),

  http.post('/api/coach/plans/:id/unarchive', async ({ params }) => {
    const t = templates().find((x) => x.id === params.id)
    if (!t) return notFound()
    await latency()
    t.archived = false
    return new HttpResponse(null, { status: 204 })
  }),

  // Cada aluno recebe uma cópia; a anterior deixa de valer
  http.post('/api/coach/plans/:id/assign', async ({ params, request }) => {
    const t = templates().find((x) => x.id === params.id && !x.archived)
    if (!t) return notFound()
    const body = AssignPlan.safeParse(await request.json().catch(() => null))
    if (!body.success) return HttpResponse.json({ message: 'Escolha os alunos e a data de início' }, { status: 422 })
    const known = new Set(students(new Date()).filter((s) => s.status !== 'archived').map((s) => s.id))
    if (!body.data.studentIds.every((id) => known.has(id))) return HttpResponse.json({ message: 'Aluno não encontrado' }, { status: 422 })
    await latency()
    const endsOn = toIsoDate(addDays(addWeeks(parseIsoDate(body.data.startsOn), t.durationWeeks), -1))
    for (const id of body.data.studentIds) db.coach.planAssignments[id] = { templateId: t.id, startsOn: body.data.startsOn, endsOn }
    return new HttpResponse(null, { status: 204 })
  }),
]
