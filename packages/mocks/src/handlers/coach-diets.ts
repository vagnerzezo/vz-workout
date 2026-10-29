import { http, HttpResponse } from 'msw'
import { addDays, addWeeks } from 'date-fns'
import type { CoachDiets, DietTemplateSummary, DietVariant, Food, MealFood, MealPlan, StudentListItem } from '@workspace/core'
import { AssignDiet, DietTemplate, equivalentGrams, foodMacros, parseIsoDate, scaleMeals, substitutionCount, templateTargets, toIsoDate } from '@workspace/core'
import { db, latency, newId } from '../db'
import { coachStudents } from '../fixtures/coach-students'
import { dietTemplates, foodTable, initialDietUsage, nutritionist } from '../fixtures/diet-templates'
import { students } from './coach'
import { weightOf } from './coach-student'

const templates = () => (db.coach.dietTemplates ??= dietTemplates(new Date()))

/** Todos os modelos de dieta (a biblioteca conta em quantos cada alimento aparece). */
export const allDietTemplates = () => templates()
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
const foods = new Map(foodTable.map((f) => [f.id, f]))

/** As dietas que o aluno tem hoje (atribuída na lista ou a do fixture) e se as porções seguem o peso dele. */
function dietsOf(s: StudentListItem): { ids: string[]; scaled: boolean } | null {
  const assigned = db.coach.dietAssignments[s.id]
  if (assigned) return { ids: assigned.templateIds, scaled: assigned.scaled }
  const ids = s.planEndsOn ? baseDiets().get(s.id) : undefined
  return ids ? { ids, scaled: true } : null
}

/** A cópia do aluno: a editada no painel ou o modelo no peso dele. */
function studentCopy(s: StudentListItem, templateId: string): DietTemplate | null {
  const diets = dietsOf(s)
  const t = find(templateId)
  if (!t || !diets?.ids.includes(templateId)) return null
  const saved = db.coach.studentDiets[s.id]?.[templateId]
  if (saved) return saved
  if (!diets.scaled) return structuredClone(t)
  const w = weightOf(s, new Date())
  const k = w / t.reference.weightKg
  return { ...structuredClone(t), reference: { ...t.reference, weightKg: w }, manualKcal: t.manualKcal && Math.round(t.manualKcal * k), meals: scaleMeals(t.meals, t.reference.weightKg, w) }
}

const r1 = (n: number) => Math.round(n * 10) / 10

/** A dieta em gramas no formato que o app (e a aba Dieta do perfil) mostra. */
function toVariant(t: DietTemplate): DietVariant {
  const meals = t.meals.map((m) => ({
    id: m.id,
    name: m.name,
    time: m.time,
    note: null,
    foods: m.foods.flatMap((row): MealFood[] => {
      const food = foods.get(row.foodId)
      if (!food) return []
      const mac = foodMacros(food, row.grams)
      const portion = (f: Food, g: number) => ({ foodId: f.id, name: f.name, portion: `${g} g`, ...Object.fromEntries(Object.entries(foodMacros(f, g)).map(([k, v]) => [k, r1(v)])) }) as MealFood
      return [
        {
          ...portion(food, row.grams),
          kcal: r1(mac.kcal),
          substitutes: row.substitutes.flatMap((id) => {
            const sub = foods.get(id)
            return sub ? [portion(sub, equivalentGrams(food, sub, row.grams))] : []
          }),
          groceries: [],
        },
      ]
    }),
  }))
  return { id: t.id, label: t.appLabel, kind: /descanso/i.test(t.appLabel) ? 'rest' : 'training', goals: templateTargets(t).targets, meals }
}

/** Plano de dieta do aluno montado pelo treinador (null = sem dieta). */
export function coachDietPlan(s: StudentListItem): MealPlan | null {
  const diets = dietsOf(s)
  const copies = diets?.ids.flatMap((id) => studentCopy(s, id) ?? []) ?? []
  if (copies.length === 0) return null
  return { id: `diet_${s.id}`, updatedAt: copies.map((c) => c.updatedAt).sort().at(-1)!, authorRole: 'coach', notes: [{ title: 'Orientações', text: copies[0]!.notes }], variants: copies.map(toVariant) }
}

const findStudent = (id: unknown) => students(new Date()).find((s) => s.id === id)
const notFound = () => HttpResponse.json({ message: 'Dieta não encontrada' }, { status: 404 })

export const coachDietHandlers = [
  http.get('/api/coach/diets', async () => {
    await latency()
    return HttpResponse.json<CoachDiets>(coachDiets())
  }),

  // "Nova ficha de dieta": um modelo com café, almoço e jantar vazios, que o editor abre em seguida
  http.post('/api/coach/diets', async () => {
    await latency()
    const id = newId('diet')
    const t: DietTemplate = {
      id, name: 'Nova dieta', appLabel: 'Dieta', goal: 'recomposition', reference: { weightKg: 75, heightCm: 172, age: 30, sex: 'male' }, activityFactor: 1.55, calorieMode: 'maintenance', manualKcal: null, proteinPerKg: 1.8, fatPerKg: 0.8,
      meals: [['Café da manhã', '07:30'], ['Almoço', '12:30'], ['Jantar', '20:00']].map(([name, time], i) => ({ id: `${id}_m${i + 1}`, name: name!, time: time!, foods: [] })),
      notes: '', updatedAt: toIsoDate(new Date()), archived: false,
    }
    templates().unshift(t)
    return HttpResponse.json<DietTemplateSummary>(summaryOf(t, 0), { status: 201 })
  }),

  http.get('/api/coach/diets/:id', async ({ params }) => {
    const t = find(params.id)
    if (!t) return notFound()
    await latency()
    return HttpResponse.json<DietTemplate>(t)
  }),

  // "Salvar" no editor: a ficha inteira (o card da lista recalcula metas, refeições e substituições)
  http.put('/api/coach/diets/:id', async ({ params, request }) => {
    const t = find(params.id)
    if (!t) return notFound()
    const body = (await request.json().catch(() => null)) as { template?: unknown } | null
    const parsed = DietTemplate.safeParse(body?.template)
    if (!parsed.success) return HttpResponse.json({ message: 'Dieta inválida', issues: parsed.error.issues }, { status: 422 })
    await latency()
    Object.assign(t, { ...parsed.data, id: t.id, archived: t.archived, updatedAt: toIsoDate(new Date()) })
    return HttpResponse.json<DietTemplate>(t)
  }),

  // Cópia de um aluno (editor aberto pela aba Dieta do perfil)
  http.get('/api/coach/students/:sid/diets/:id', async ({ params }) => {
    const s = findStudent(params.sid)
    const copy = s && studentCopy(s, params.id as string)
    if (!copy) return notFound()
    await latency()
    return HttpResponse.json<DietTemplate>(copy)
  }),

  http.put('/api/coach/students/:sid/diets/:id', async ({ params, request }) => {
    const s = findStudent(params.sid)
    if (!s || !studentCopy(s, params.id as string)) return notFound()
    const body = (await request.json().catch(() => null)) as { template?: unknown } | null
    const parsed = DietTemplate.safeParse(body?.template)
    if (!parsed.success) return HttpResponse.json({ message: 'Dieta inválida' }, { status: 422 })
    await latency()
    const saved = { ...parsed.data, id: params.id as string, updatedAt: toIsoDate(new Date()) }
    db.coach.studentDiets[s.id] = { ...db.coach.studentDiets[s.id], [saved.id]: saved }
    return HttpResponse.json<DietTemplate>(saved)
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
