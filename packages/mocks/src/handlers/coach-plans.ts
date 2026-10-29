import { http, HttpResponse } from 'msw'
import { addDays, addWeeks } from 'date-fns'
import type { AssignedPlan, CoachPlans, Exercise, PlanTemplate, PlanTemplateSummary } from '@workspace/core'
import { AssignPlan, parseIsoDate, planSplit, toIsoDate, WorkoutPlan } from '@workspace/core'
import { db, latency, newId } from '../db'
import { coachStudents } from '../fixtures/coach-students'
import { initialUsage, planTemplates } from '../fixtures/plan-templates'
import { renatoMe } from '../fixtures/renato'
import { exerciseLibrary } from '../fixtures/renato-plan'
import { templatePlan } from '../fixtures/template-plans'
import { coachPlan } from '../live-plan'
import { students } from './coach'

const templates = () => (db.coach.templates ??= planTemplates(new Date()))

/** A ficha inteira do modelo (montada na primeira vez que o editor abre). */
const planOf = (t: PlanTemplateSummary) => (db.coach.templatePlans[t.id] ??= templatePlan(t))

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

const withUsage = (t: PlanTemplateSummary) => coachPlans().templates.find((x) => x.id === t.id) ?? t

export const coachPlanHandlers = [
  http.get('/api/coach/plans', async () => {
    await latency()
    return HttpResponse.json<CoachPlans>(coachPlans())
  }),

  // Biblioteca de exercícios (a do editor de ficha)
  http.get('/api/coach/exercises', async () => {
    await latency()
    return HttpResponse.json<Exercise[]>(exerciseLibrary)
  }),

  // "Nova ficha": um modelo vazio com o Treino A, que o editor abre em seguida
  http.post('/api/coach/plans', async () => {
    await latency()
    const today = toIsoDate(new Date())
    const t: PlanTemplateSummary = { id: newId('tpl'), name: 'Nova ficha', split: 'A · Novo treino', goal: 'hypertrophy', level: 'intermediate', atHome: false, daysPerWeek: 1, durationWeeks: 8, phaseCount: 3, studentsUsing: 0, updatedAt: today, archived: false }
    const base = templatePlan(t)
    db.coach.templatePlans[t.id] = { ...base, days: [{ id: `${t.id}_a`, letter: 'A', name: 'Novo treino', weekday: 1, focus: [], exercises: [] }] }
    templates().unshift(t)
    return HttpResponse.json<PlanTemplateSummary>(t, { status: 201 })
  }),

  http.get('/api/coach/plans/:id', async ({ params }) => {
    const t = templates().find((x) => x.id === params.id)
    if (!t) return notFound()
    await latency()
    return HttpResponse.json<PlanTemplate>({ summary: withUsage(t), plan: planOf(t) })
  }),

  // "Salvar" no editor: a ficha inteira. O card da lista acompanha (nome, divisão, dias, semanas, fases)
  http.put('/api/coach/plans/:id', async ({ params, request }) => {
    const t = templates().find((x) => x.id === params.id)
    if (!t) return notFound()
    const body = (await request.json().catch(() => null)) as { plan?: unknown } | null
    const parsed = WorkoutPlan.safeParse(body?.plan)
    if (!parsed.success) return HttpResponse.json({ message: 'Ficha inválida', issues: parsed.error.issues }, { status: 422 })
    await latency()
    const plan = { ...parsed.data, id: t.id, updatedAt: toIsoDate(new Date()) }
    const dayCountChanged = plan.days.length !== planOf(t).days.length // o 5x5 é AB alternado 3x: só muda se mexeram nos dias
    db.coach.templatePlans[t.id] = plan
    Object.assign(t, { name: plan.name, split: planSplit(plan.days), durationWeeks: plan.durationWeeks, phaseCount: plan.phases.length, updatedAt: plan.updatedAt, ...(dayCountChanged ? { daysPerWeek: plan.days.length } : {}) })
    return HttpResponse.json<PlanTemplate>({ summary: withUsage(t), plan })
  }),

  // Cópia do modelo para editar sem mexer no original
  http.post('/api/coach/plans/:id/duplicate', async ({ params }) => {
    const source = templates().find((t) => t.id === params.id)
    if (!source) return notFound()
    await latency()
    const copy: PlanTemplateSummary = { ...source, id: newId('tpl'), name: `${source.name} (cópia)`, updatedAt: toIsoDate(new Date()), studentsUsing: 0, archived: false }
    db.coach.templatePlans[copy.id] = { ...structuredClone(planOf(source)), id: copy.id, name: copy.name, updatedAt: copy.updatedAt }
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
