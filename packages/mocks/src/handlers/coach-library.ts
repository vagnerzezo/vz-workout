import { http, HttpResponse } from 'msw'
import type { CoachLibrary, ExerciseDetail, Exercise, LibraryExercise, LibraryFood } from '@workspace/core'
import { NewExercise } from '@workspace/core'
import { db, latency, newId } from '../db'
import { coachExercises, exerciseExtras, genericSteps, materials } from '../fixtures/coach-library'
import { foodTable } from '../fixtures/diet-templates'
import { exerciseLibrary } from '../fixtures/renato-plan'
import { conversationOf, sendFromCoach } from './coach-chat'
import { students } from './coach'
import { allDietTemplates } from './coach-diets'
import { exerciseUsage } from './coach-plans'

/** Duração estável por exercício (15 a 31 s), para os que têm vídeo. */
const seconds = (id: string) => 15 + ([...id].reduce((n, c) => n + c.charCodeAt(0), 0) % 17)

function enrich(e: Exercise & Partial<LibraryExercise>, base: Exercise[]): LibraryExercise {
  const extra = exerciseExtras[e.id] ?? {}
  const sameMuscle = base.filter((x) => x.id !== e.id && x.primary === e.primary).map((x) => x.id)
  return {
    ...e,
    level: e.level ?? extra.level ?? 'beginner',
    steps: e.steps ?? extra.steps ?? genericSteps,
    alternatives: e.alternatives ?? extra.alternatives ?? sameMuscle.slice(0, 3),
    videoSeconds: e.videoSeconds !== undefined ? e.videoSeconds : extra.videoSeconds !== undefined ? extra.videoSeconds : seconds(e.id),
    uses: exerciseUsage(e.id).count,
  }
}

/** Toda a biblioteca: os do treinador (cadastrados e os do canvas) e a base. O editor de ficha usa esta mesma lista. */
export function libraryExercises(): LibraryExercise[] {
  const raw = [...db.coach.library.mine, ...coachExercises, ...exerciseLibrary]
  return raw.map((e) => enrich(e, raw))
}

function libraryFoods(): LibraryFood[] {
  const templates = allDietTemplates()
  return foodTable.map((f) => ({ ...f, origin: f.id === 'whey' ? 'label' : 'taco', diets: templates.filter((t) => t.meals.some((m) => m.foods.some((x) => x.foodId === f.id))).length }))
}

const find = (id: unknown) => libraryExercises().find((e) => e.id === id)
const notFound = () => HttpResponse.json({ message: 'Exercício não encontrado' }, { status: 404 })

export const coachLibraryHandlers = [
  http.get('/api/coach/library', async () => {
    await latency()
    return HttpResponse.json<CoachLibrary>({ exercises: libraryExercises(), foods: libraryFoods(), materials })
  }),

  http.get('/api/coach/library/exercises/:id', async ({ params }) => {
    const exercise = find(params.id)
    if (!exercise) return notFound()
    await latency()
    const usage = exerciseUsage(exercise.id)
    return HttpResponse.json<ExerciseDetail>({ exercise, usedIn: usage.items, templates: usage.templates, students: usage.students })
  }),

  // Exercício novo do treinador (o vídeo de verdade sobe na fase da API; aqui fica só o nome do arquivo)
  http.post('/api/coach/library/exercises', async ({ request }) => {
    const parsed = NewExercise.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return HttpResponse.json({ message: 'Exercício inválido', issues: parsed.error.issues }, { status: 422 })
    await latency()
    const n = parsed.data
    const ex: LibraryExercise = { id: newId('ex_coach'), name: n.name, primary: n.primary, secondary: n.secondary, equipment: n.equipment, videoUrl: n.youtubeUrl || null, origin: 'coach', level: 'intermediate', steps: n.steps, alternatives: [], videoSeconds: n.videoName || n.youtubeUrl ? 30 : null, uses: 0 }
    db.coach.library.mine = [ex, ...db.coach.library.mine]
    return HttpResponse.json<LibraryExercise>(ex, { status: 201 })
  }),

  // "Duplicar e personalizar": vira um exercício seu, que você pode mudar
  http.post('/api/coach/library/exercises/:id/duplicate', async ({ params }) => {
    const source = find(params.id)
    if (!source) return notFound()
    await latency()
    const copy: LibraryExercise = { ...source, id: newId('ex_coach'), name: `${source.name} (minha versão)`, origin: 'coach', uses: 0 }
    db.coach.library.mine = [copy, ...db.coach.library.mine]
    return HttpResponse.json<LibraryExercise>(copy, { status: 201 })
  }),

  // "Enviar para aluno": um cartão com o vídeo e o passo a passo no chat de cada um
  http.post('/api/coach/library/exercises/:id/send', async ({ params, request }) => {
    const ex = find(params.id)
    if (!ex) return notFound()
    const { studentIds } = ((await request.json().catch(() => null)) ?? {}) as { studentIds?: unknown }
    const ids = Array.isArray(studentIds) ? studentIds.filter((x): x is string => typeof x === 'string') : []
    const now = new Date()
    const targets = students(now).filter((s) => ids.includes(s.id) && conversationOf(s))
    if (targets.length === 0) return HttpResponse.json({ message: 'Escolha os alunos' }, { status: 422 })
    await latency()
    const meta = ex.videoSeconds ? `Vídeo de ${ex.videoSeconds} s · ${ex.steps.length} passos` : `${ex.steps.length} passos`
    for (const s of targets) sendFromCoach(conversationOf(s)!, { type: 'event', event: 'exercise', title: ex.name, meta, link: '/treinos' }, now)
    return HttpResponse.json({ sent: targets.length })
  }),

  http.post('/api/coach/library/materials/:id/share', async ({ params }) => {
    if (!materials.some((m) => m.id === params.id)) return HttpResponse.json({ message: 'Material não encontrado' }, { status: 404 })
    await latency()
    if (!db.coach.library.shared.includes(params.id as string)) db.coach.library.shared.push(params.id as string)
    return new HttpResponse(null, { status: 204 })
  }),
]
