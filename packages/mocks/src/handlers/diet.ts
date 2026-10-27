import { getISODay } from 'date-fns'
import { http, HttpResponse } from 'msw'
import type { DietDay, DietVariant, HomeSummary, MealPlan, StudentDiet, WaterLog } from '@workspace/core'
import { dayTotals, mealTotals, nextPendingMeal, parseIsoDate, percentOf, toIsoDate, workoutForDate } from '@workspace/core'
import { currentScenario, db, latency, newId } from '../db'
import { mondayOf } from '../fixtures/renato'
import { renatoDiet } from '../fixtures/renato-diet'
import { renatoPlan } from '../fixtures/renato-plan'

const failed = () => HttpResponse.json({ message: 'Erro simulado' }, { status: 500 })

export function currentDiet(): MealPlan | null {
  return currentScenario() === 'sem-ficha' ? null : renatoDiet
}

const variantById = (plan: MealPlan, id: string) => plan.variants.find((v) => v.id === id) ?? plan.variants[0]!

/** Ficha padrão do dia: de treino quando a ficha de treino tem treino naquele dia da semana. */
function defaultVariant(plan: MealPlan, date: Date): DietVariant {
  const kind = workoutForDate(renatoPlan.days, date) ? 'training' : 'rest'
  return plan.variants.find((v) => v.kind === kind) ?? plan.variants[0]!
}

/**
 * Dia da dieta: o que o aluno já mexeu, ou um padrão. Hoje começa com café, lanche e almoço feitos
 * (como no canvas); dias anteriores com quase tudo feito; dias futuros sem nada.
 */
export function dietDayFor(plan: MealPlan, iso: string, today: Date): DietDay {
  const saved = db.dietDays[iso]
  if (saved) return saved
  const date = parseIsoDate(iso)
  const variant = defaultVariant(plan, date)
  const todayIso = toIsoDate(today)
  let done: string[] = []
  if (currentScenario() !== 'novo') {
    if (iso === todayIso) done = variant.meals.slice(0, 3).map((m) => m.id)
    else if (iso < todayIso) done = variant.meals.filter((_, i) => getISODay(date) % 2 === 0 || i < variant.meals.length - 1).map((m) => m.id)
  }
  return { date: iso, variantId: variant.id, doneMealIds: done, swaps: {} }
}

/** "Nutrição de hoje" e "Próxima refeição" da Home, a partir da dieta do dia. */
export function homeNutrition(today: Date): Pick<HomeSummary, 'nutrition' | 'nextMeal'> {
  const plan = currentDiet()
  if (!plan) {
    const empty = { consumed: 0, goal: 1 }
    return { nutrition: { kcal: empty, protein: empty, carbs: empty, fat: empty }, nextMeal: null }
  }
  const day = dietDayFor(plan, toIsoDate(today), today)
  const variant = variantById(plan, day.variantId)
  const totals = dayTotals(variant.meals, day.doneMealIds, day.swaps)
  const next = nextPendingMeal(variant.meals, day.doneMealIds)
  return {
    nutrition: {
      kcal: { consumed: totals.kcal, goal: variant.goals.kcal },
      protein: { consumed: totals.protein, goal: variant.goals.protein },
      carbs: { consumed: totals.carbs, goal: variant.goals.carbs },
      fat: { consumed: totals.fat, goal: variant.goals.fat },
    },
    nextMeal: next && { id: next.id, name: next.name, time: next.time, foodCount: next.foods.length, kcal: mealTotals(next, day.swaps[next.id]).kcal },
  }
}

const isoParam = (value: string | null | undefined) => (value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null)

export const dietHandlers = [
  http.get('/api/me/diet', async ({ request }) => {
    await latency()
    if (currentScenario() === 'erro') return failed()
    const today = new Date()
    const iso = isoParam(new URL(request.url).searchParams.get('date')) ?? toIsoDate(today)
    const plan = currentDiet()
    const monday = mondayOf(parseIsoDate(iso))
    const week = Array.from({ length: 7 }, (_, i) => {
      const date = toIsoDate(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i))
      if (!plan || date > toIsoDate(today)) return { date, percent: null }
      const day = dietDayFor(plan, date, today)
      const variant = variantById(plan, day.variantId)
      return { date, percent: percentOf(dayTotals(variant.meals, day.doneMealIds, day.swaps).kcal, variant.goals.kcal) }
    })
    return HttpResponse.json<StudentDiet>({ plan, day: plan && dietDayFor(plan, iso, today), week })
  }),

  http.put('/api/me/diet/days/:date', async ({ params, request }) => {
    const plan = currentDiet()
    const iso = isoParam(String(params.date))
    const { variantId } = (await request.json()) as { variantId: string }
    if (!plan || !iso || !plan.variants.some((v) => v.id === variantId)) {
      return HttpResponse.json({ message: 'Ficha inválida' }, { status: 422 })
    }
    await latency()
    const day = dietDayFor(plan, iso, new Date())
    const meals = new Set(variantById(plan, variantId).meals.map((m) => m.id))
    // Refeições que existem nas duas fichas continuam feitas
    db.dietDays[iso] = { ...day, variantId, doneMealIds: day.doneMealIds.filter((id) => meals.has(id)) }
    return HttpResponse.json<DietDay>(db.dietDays[iso])
  }),

  http.put('/api/me/diet/days/:date/meals/:mealId', async ({ params, request }) => {
    const plan = currentDiet()
    const iso = isoParam(String(params.date))
    const { done } = (await request.json()) as { done: boolean }
    if (!plan || !iso) return HttpResponse.json({ message: 'Dia inválido' }, { status: 422 })
    if (iso > toIsoDate(new Date())) return HttpResponse.json({ message: 'Não dá para concluir refeição de um dia futuro' }, { status: 422 })
    await latency()
    const day = dietDayFor(plan, iso, new Date())
    const mealId = String(params.mealId)
    const rest = day.doneMealIds.filter((id) => id !== mealId)
    db.dietDays[iso] = { ...day, doneMealIds: done ? [...rest, mealId] : rest }
    return HttpResponse.json<DietDay>(db.dietDays[iso])
  }),

  // Troca um alimento da refeição por uma das substituições da nutri; substituteId null volta ao original
  http.put('/api/me/diet/days/:date/meals/:mealId/foods/:foodId', async ({ params, request }) => {
    const plan = currentDiet()
    const iso = isoParam(String(params.date))
    const { substituteId } = (await request.json()) as { substituteId: string | null }
    if (!plan || !iso) return HttpResponse.json({ message: 'Dia inválido' }, { status: 422 })
    const day = dietDayFor(plan, iso, new Date())
    const mealId = String(params.mealId)
    const foodId = String(params.foodId)
    const food = variantById(plan, day.variantId).meals.find((m) => m.id === mealId)?.foods.find((f) => f.foodId === foodId)
    if (!food) return HttpResponse.json({ message: 'Alimento não encontrado' }, { status: 404 })
    if (substituteId !== null && !food.substitutes.some((s) => s.foodId === substituteId)) {
      return HttpResponse.json({ message: 'Substituição não liberada pela nutri' }, { status: 422 })
    }
    await latency()
    const others = Object.fromEntries(Object.entries(day.swaps[mealId] ?? {}).filter(([id]) => id !== foodId))
    const mealSwaps = substituteId ? { ...others, [foodId]: substituteId } : others
    db.dietDays[iso] = { ...day, swaps: { ...day.swaps, [mealId]: mealSwaps } }
    return HttpResponse.json<DietDay>(db.dietDays[iso])
  }),
]

/** Água de hoje: a Home e a Dieta leem e escrevem aqui. */
export const waterHandlers = [
  http.get('/api/me/water', async () => {
    await latency()
    if (currentScenario() === 'erro') return failed()
    return HttpResponse.json<WaterLog>(db.water)
  }),

  http.post('/api/me/water', async ({ request }) => {
    const { ml } = (await request.json()) as { ml: number }
    if (!Number.isInteger(ml) || ml <= 0 || ml > 2000) {
      return HttpResponse.json({ message: 'Quantidade inválida' }, { status: 422 })
    }
    await latency()
    db.water = {
      ...db.water,
      consumedMl: db.water.consumedMl + ml,
      entries: [...db.water.entries, { id: newId('w'), ml }],
    }
    return HttpResponse.json<WaterLog>(db.water, { status: 201 })
  }),

  http.delete('/api/me/water/entries/:id', async ({ params }) => {
    const entry = db.water.entries.find((e) => e.id === params.id)
    if (!entry) return HttpResponse.json({ message: 'Registro não encontrado' }, { status: 404 })
    await latency()
    db.water = {
      ...db.water,
      consumedMl: Math.max(0, db.water.consumedMl - entry.ml),
      entries: db.water.entries.filter((e) => e.id !== entry.id),
    }
    return HttpResponse.json<WaterLog>(db.water)
  }),
]
