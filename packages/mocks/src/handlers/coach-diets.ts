import { http, HttpResponse } from 'msw'
import { addDays, addWeeks } from 'date-fns'
import type { CoachDiets, DietTemplateSummary, Food } from '@workspace/core'
import { AssignDiet, DietTemplate, parseIsoDate, substitutionCount, templateTargets, toIsoDate } from '@workspace/core'
import { db, latency, newId } from '../db'
import { coachStudents } from '../fixtures/coach-students'
import { dietTemplates, foodTable, initialDietUsage, nutritionist } from '../fixtures/diet-templates'
import { students } from './coach'
import { weightOf } from './coach-student'

const templates = () => (db.coach.dietTemplates ??= dietTemplates(new Date()))
const DIET_WEEKS = 8 // vigência da dieta atribuída

/** Dietas de cada aluno ativo do fixture, na ordem da carteira (o Renato, primeiro, fica com a recomposição). */
function baseDiets(): Map<string, string[]> {
  const queue = initialDietUsage.flatMap(([ids, n]) => Array<string[]>(n).fill(ids))
  const active = coachStudents(new Date()).filter((s) => s.status === 'active')
  return new Map(active.flatMap((s, i) => (queue[i] ? [[s.id, queue[i]] as const] : [])))
}

const summaryOf = (t: DietTemplate, using: number): DietTemplateSummary => ({
  id: t.id,
  name: t.name,
  goal: t.goal,
  meals: t.meals.length,
  substitutions: substitutionCount(t.meals),
  targets: templateTargets(t).targets,
  refWeightKg: t.reference.weightKg,
  studentsUsing: using,
  updatedAt: t.updatedAt,
  archived: t.archived,
})

function coachDiets(): CoachDiets {
  const now = new Date()
  const base = baseDiets()
  const byId = new Map(templates().map((t) => [t.id, t]))
  const list = students(now).filter((s) => s.status !== 'archived')
  const dietOf = (id: string) => {
    const assigned = db.coach.dietAssignments[id]
    if (assigned) return { ids: assigned.templateIds, until: assigned.endsOn }
    const ids = base.get(id)
    const s = list.find((x) => x.id === id)
    return ids && s?.planEndsOn ? { ids, until: s.planEndsOn } : null
  }
  const names = (ids: string[]) => ids.map((id) => byId.get(id)?.name ?? 'Dieta').join(' + ')
  const assigned = list.flatMap((s) => {
    const d = dietOf(s.id)
    return d ? [{ studentId: s.id, studentName: s.fullName, planName: names(d.ids), templateId: d.ids[0] ?? null, validUntil: d.until }] : []
  })
  const using = (id: string) => list.filter((s) => dietOf(s.id)?.ids.includes(id)).length
  return {
    templates: templates().map((t) => summaryOf(t, using(t.id))),
    assigned,
    candidates: list.map((s) => {
      const d = dietOf(s.id)
      return { studentId: s.id, name: s.fullName, status: s.status, weightKg: weightOf(s, now), current: d ? { name: names(d.ids), until: d.until } : null }
    }),
    nutritionist,
  }
}

const find = (id: unknown) => templates().find((t) => t.id === id)
const notFound = () => HttpResponse.json({ message: 'Dieta não encontrada' }, { status: 404 })

export const coachDietHandlers = [
  http.get('/api/coach/diets', async () => {
    await latency()
    return HttpResponse.json<CoachDiets>(coachDiets())
  }),

  // Tabela de alimentos do editor
  http.get('/api/coach/foods', async () => {
    await latency()
    return HttpResponse.json<Food[]>(foodTable)
  }),

  http.post('/api/coach/diets/:id/duplicate', async ({ params }) => {
    const source = find(params.id)
    if (!source) return notFound()
    await latency()
    const copy: DietTemplate = { ...structuredClone(source), id: newId('diet'), name: `${source.name} (cópia)`, updatedAt: toIsoDate(new Date()), archived: false }
    templates().splice(templates().indexOf(source) + 1, 0, copy)
    return HttpResponse.json<DietTemplateSummary>(summaryOf(copy, 0), { status: 201 })
  }),

  http.post('/api/coach/diets/:id/archive', async ({ params }) => {
    const t = find(params.id)
    if (!t) return notFound()
    await latency()
    t.archived = true
    return new HttpResponse(null, { status: 204 })
  }),

  http.post('/api/coach/diets/:id/unarchive', async ({ params }) => {
    const t = find(params.id)
    if (!t) return notFound()
    await latency()
    t.archived = false
    return new HttpResponse(null, { status: 204 })
  }),

  // Cada aluno recebe uma cópia; com ajuste, as porções seguem o peso dele
  http.post('/api/coach/diets/:id/assign', async ({ params, request }) => {
    const t = find(params.id)
    if (!t || t.archived) return notFound()
    const body = AssignDiet.safeParse(await request.json().catch(() => null))
    if (!body.success) return HttpResponse.json({ message: 'Escolha os alunos e a data de início' }, { status: 422 })
    const known = new Set(students(new Date()).filter((s) => s.status !== 'archived').map((s) => s.id))
    if (!body.data.studentIds.every((id) => known.has(id))) return HttpResponse.json({ message: 'Aluno não encontrado' }, { status: 422 })
    await latency()
    const endsOn = toIsoDate(addDays(addWeeks(parseIsoDate(body.data.startsOn), DIET_WEEKS), -1))
    for (const id of body.data.studentIds) db.coach.dietAssignments[id] = { templateIds: [t.id], startsOn: body.data.startsOn, endsOn, scaled: body.data.scaleToWeight }
    return new HttpResponse(null, { status: 204 })
  }),
]
