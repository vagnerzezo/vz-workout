import { http, HttpResponse } from 'msw'
import type {
  Assessment,
  CoachStudentDiet,
  CoachStudentPlan,
  CoachWorkout,
  StudentAppSettings,
  StudentAssessments,
  StudentCheckIn,
  StudentDetail,
  StudentListItem,
  WeightEntry,
} from '@workspace/core'
import { formatDecimal, formatPhone, parseIsoDate, shortDate, StudentAppSettings as SettingsSchema, toIsoDate, WorkoutPlan as WorkoutPlanSchema } from '@workspace/core'
import { currentScenario, db, latency } from '../db'
import { renatoMe } from '../fixtures/renato'
import { renatoDiet } from '../fixtures/renato-diet'
import { exerciseLibrary } from '../fixtures/renato-plan'
import { renatoMeasurements } from '../fixtures/renato-progress'
import { coachPlan, editablePlan, hiddenDays } from '../live-plan'
import { students } from './coach'
import { coachDietPlan } from './coach-diets'
import { allSessions } from './workout'

const day = (now: Date, offset: number) => {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  d.setDate(d.getDate() + offset)
  return d
}
const iso = (now: Date, offset: number) => toIsoDate(day(now, offset))

/** Número estável por aluno, para os dados gerados não mudarem a cada recarga. */
const seedOf = (id: string) => [...id].reduce((n, c) => (n * 31 + c.charCodeAt(0)) % 9973, 7)

const defaultSettings: StudentAppSettings = { appAccess: true, showDiet: true, allowSwaps: true, suggestLastLoad: true, askPhotos: true, checkInFrequency: 'biweekly' }
const settingsOf = (id: string) => db.coach.settings[id] ?? defaultSettings

const DAY_NAMES = ['Push', 'Pull', 'Legs', 'Upper', 'Lower']
const EFFORTS = [8, 7, 8, 7, 9, 8, 7]

/** Renato: o mesmo histórico que ele vê no app (inclui os treinos que salvar agora). */
function renatoWorkouts(now: Date): CoachWorkout[] {
  return allSessions(now, false).map((s, i) => ({
    id: s.id,
    date: s.date,
    name: `Treino ${s.letter} — ${s.name}`,
    durationMin: s.durationMin,
    volumeKg: s.volumeKg,
    effort: db.sessions.find((x) => x.id === s.id)?.effort ?? EFFORTS[i % EFFORTS.length]!,
    records: s.exercises.filter((e) => e.isRecord).length,
    comment: s.comment,
  }))
}

function generatedWorkouts(s: StudentListItem, now: Date): CoachWorkout[] {
  if (!s.lastWorkoutOn) return []
  const seed = seedOf(s.id)
  const last = parseIsoDate(s.lastWorkoutOn)
  return Array.from({ length: 16 }, (_, i) => {
    const d = new Date(last)
    d.setDate(d.getDate() - i * 2 - (i % 3 === 2 ? 1 : 0))
    const letter = 'ABCD'[(i + seed) % 4]!
    return {
      id: `${s.id}_w${i}`,
      date: toIsoDate(d),
      name: `Treino ${letter} — ${DAY_NAMES[(i + seed) % 4]}`,
      durationMin: 42 + ((seed + i * 7) % 20),
      volumeKg: 5200 + ((seed * 13 + i * 410) % 4200),
      effort: EFFORTS[(i + seed) % EFFORTS.length]!,
      records: (seed + i) % 5 === 0 ? 1 : 0,
      comment: null,
    }
  }).filter((w) => parseIsoDate(w.date) <= now)
}

function generatedWeights(s: StudentListItem, now: Date): WeightEntry[] {
  if (s.status === 'pending') return []
  const seed = seedOf(s.id)
  const start = 62 + (seed % 30)
  return Array.from({ length: 12 }, (_, i) => ({
    id: `${s.id}_kg${i}`,
    date: iso(now, -(11 - i) * 7),
    kg: Math.round((start - i * 0.25 + ((seed + i) % 3) * 0.1) * 10) / 10,
  }))
}

function workoutsOf(s: StudentListItem, now: Date) {
  return s.id === renatoMe.id ? renatoWorkouts(now) : generatedWorkouts(s, now)
}

function weightsOf(s: StudentListItem, now: Date) {
  return s.id === renatoMe.id ? db.weights : generatedWeights(s, now)
}

/** Peso atual. Pendentes ainda não pesaram: o da anamnese (estimado pelo seed, como o canvas mostra). */
export function weightOf(s: StudentListItem, now: Date): number {
  return weightsOf(s, now).at(-1)?.kg ?? 55 + (seedOf(s.id) % 35)
}

const createdOf = (s: Pick<StudentListItem, 'id'>) => db.coach.created.find((c) => c.student.id === s.id)

/** WhatsApp do aluno. O do Pedro é o do canvas (o "número já cadastrado" do Novo aluno). */
export function phoneOf(s: Pick<StudentListItem, 'id'>): string {
  const created = createdOf(s)
  if (created) return formatPhone(created.form.phone)
  if (s.id === renatoMe.id) return '(51) 99876-5432'
  if (s.id === 'stu_pedro') return '(51) 98877-1234'
  const seed = seedOf(s.id)
  return `(51) 9${String(8000 + seed).padStart(4, '0')}-${String(1000 + ((seed * 7) % 9000)).padStart(4, '0')}`
}

/** Perfil no painel. O Renato segue o canvas; os outros têm dados genéricos coerentes com a lista. */
function detailOf(s: StudentListItem, now: Date): StudentDetail {
  const renato = s.id === renatoMe.id
  const created = createdOf(s)
  const seed = seedOf(s.id)
  const female = /a$/.test(s.fullName.split(' ')[0]!)
  const lateDays = s.lastWorkoutOn ? Math.round((day(now, 0).getTime() - parseIsoDate(s.lastWorkoutOn).getTime()) / 86_400_000) : 0
  const attention: StudentDetail['attention'] = renato
    ? [{ title: 'Dor no joelho direito', detail: `Relatada no check-in de ${shortDate(now)}, na descida do agachamento hack.`, checkInId: 'ci_renato_9' }]
    : [
        ...(lateDays >= 5 ? [{ title: `Sem treinar há ${lateDays} dias`, detail: 'Vale uma mensagem para entender o que aconteceu.', checkInId: null }] : []),
        ...s.alerts.filter((a) => a.tone !== 'info').map((a) => ({ title: a.label, detail: a.tone === 'danger' ? 'Resolva no Financeiro ou combine com o aluno pelo chat.' : 'Confira antes do próximo check-in.', checkInId: null })),
      ]

  return {
    student: s,
    phone: phoneOf(s),
    birthDate: renato ? '1993-05-12' : `${1985 + (seed % 18)}-0${1 + (seed % 9)}-1${seed % 10}`,
    sex: renato ? 'male' : female ? 'female' : 'male',
    heightCm: renato ? 182 : (female ? 158 : 170) + (seed % 18),
    city: renato ? 'Novo Hamburgo, RS' : ['Porto Alegre, RS', 'Canoas, RS', 'São Leopoldo, RS', 'Gravataí, RS'][seed % 4]!,
    memberSince: renato ? '2026-06-10' : s.status === 'pending' ? iso(now, 0) : iso(now, -(60 + (seed % 200))),
    weights: weightsOf(s, now),
    weightGoalKg: renato ? 76 : null,
    nextCheckInOn: s.status === 'active' ? iso(now, renato ? 2 : 1 + (seed % 13)) : null,
    attention,
    recentWorkouts: workoutsOf(s, now).slice(0, 3),
    anamnesis:
      s.status === 'pending'
        ? null
        : {
            answeredOn: renato ? '2026-06-10' : iso(now, -(60 + (seed % 200))),
            fields: renato
              ? [
                  { label: 'Objetivo principal', value: 'Ganhar massa magra e reduzir gordura abdominal', highlight: false },
                  { label: 'Experiência', value: '3 anos de musculação, com pausas', highlight: false },
                  { label: 'Disponibilidade', value: '5 dias por semana, das 18h às 19h30', highlight: false },
                  { label: 'Lesões ou dores', value: `Desconforto no joelho direito (relatado em ${shortDate(now)})`, highlight: true },
                  { label: 'Medicamentos', value: 'Nenhum', highlight: false },
                  { label: 'Restrições alimentares', value: 'Não consome leite integral', highlight: false },
                ]
              : [
                  { label: 'Objetivo principal', value: s.tags.includes('Emagrecimento') ? 'Perder gordura' : s.tags.includes('Força') ? 'Ganhar força' : 'Ganhar massa muscular', highlight: false },
                  { label: 'Experiência', value: ['Iniciante', '1 ano de musculação', '2 anos de musculação'][seed % 3]!, highlight: false },
                  { label: 'Disponibilidade', value: `${3 + (seed % 3)} dias por semana`, highlight: false },
                  { label: 'Lesões ou dores', value: 'Nenhuma', highlight: false },
                ],
          },
    subscription: created
      ? { planLabel: created.planLabel, startedOn: created.form.startsOn, endsOn: s.subscriptionEndsOn!, payment: created.form.paid ? 'ok' : 'pending' }
      : {
          planLabel: `Consultoria ${s.tags.includes('Presencial') ? 'presencial' : 'online'} · ${['trimestral', 'mensal', 'semestral'][seed % 3]}`,
          startedOn: renato ? '2026-09-15' : iso(now, -(30 + (seed % 60))),
          endsOn: s.subscriptionEndsOn ?? iso(now, 30),
          payment: s.alerts.some((a) => a.label === 'Pagamento atrasado') ? 'late' : s.status === 'pending' ? 'pending' : 'ok',
        },
    lastSeenAt: s.status === 'active' && s.lastWorkoutOn ? new Date(parseIsoDate(s.lastWorkoutOn).getTime() + 19.2 * 3_600_000).toISOString() : null,
    settings: settingsOf(s.id),
  }
}

const RATING_LABELS = ['Energia', 'Sono', 'Fome', 'Aderência treino', 'Aderência dieta']

function checkInsOf(s: StudentListItem, now: Date): StudentCheckIn[] {
  if (s.status === 'pending') return []
  const weights = weightsOf(s, now)
  const weightOn = (date: string) => [...weights].reverse().find((w) => w.date <= date) ?? weights[0]
  const summary = (date: string) => {
    const w = weightOn(date)
    return `${w ? `Peso ${formatDecimal(w.kg)} kg · ` : ''}3 fotos`
  }
  const answered = (offset: number, i: number): StudentCheckIn => {
    const date = iso(now, offset)
    return {
      id: `ci_${s.id.replace('stu_', '')}_${8 - i}`,
      date,
      kind: 'quinzenal',
      status: 'answered',
      summary: summary(date),
      answeredOn: iso(now, offset + 1),
      poses: ['front', 'side', 'back'],
      ratings: RATING_LABELS.map((label, k) => ({ label, value: [4, 3, 2, 4, 5, 4, 4][(k + i) % 7]! })),
      comment: i === 0 ? 'Semana corrida no trabalho, perdi o treino de sábado. Dieta tranquila, só senti mais fome à noite.' : null,
      pain: null,
      reply: i === 0 ? 'Boa evolução! Vamos subir 100 kcal no jantar para controlar a fome noturna.' : 'Tudo certo, seguimos o plano.',
    }
  }
  const list = [answered(-14, 0), answered(-28, 1), answered(-42, 2)]
  if (s.id === renatoMe.id && !db.coach.answeredCheckIns.includes('ci_renato_9')) {
    list.unshift({
      id: 'ci_renato_9',
      date: iso(now, 0),
      kind: 'quinzenal',
      status: 'waiting',
      summary: 'Enviado hoje · relatou dor no joelho',
      answeredOn: null,
      poses: ['front', 'side', 'back'],
      ratings: [4, 3, 2, 4, 5].map((value, k) => ({ label: RATING_LABELS[k]!, value })),
      comment: 'Treinos bem, mas o joelho direito incomodou no hack. Dieta tranquila.',
      pain: 'Joelho direito, na descida do agachamento hack (intensidade 4 de 10)',
      reply: null,
    })
  }
  return list
}

function planOf(s: StudentListItem): CoachStudentPlan {
  if (s.status === 'pending') return { plan: null, exercises: [], hiddenDayIds: [] }
  const plan = coachPlan(s.id)
  const used = new Set(plan.days.flatMap((d) => d.exercises.map((e) => e.exerciseId)))
  return { plan, exercises: exerciseLibrary.filter((e) => used.has(e.id)), hiddenDayIds: hiddenDays(s.id) }
}

/** O Renato segue com a dieta da nutricionista (a do app) até o treinador atribuir outra; os demais têm a do painel. */
function dietOf(s: StudentListItem): CoachStudentDiet {
  const nutri = s.id === renatoMe.id && !db.coach.dietAssignments[s.id]
  if (nutri) return { plan: renatoDiet, waterGoalMl: 3500, adherence7d: 86, author: { name: 'Paula Mendes', credential: 'CRN-2 12345' } }
  const plan = coachDietPlan(s)
  return { plan, waterGoalMl: 3500, adherence7d: plan && s.status !== 'pending' ? 60 + (seedOf(s.id) % 38) : null, author: null }
}

/** Renato: as dobras do canvas e as medidas que ele já vê no Progresso do app. */
function assessmentsOf(s: StudentListItem, detail: StudentDetail): StudentAssessments | null {
  if (s.status === 'pending' || !detail.birthDate || !detail.sex || !detail.heightCm) return null
  const heightCm = detail.heightCm
  const weightOn = (date: string) => [...detail.weights].reverse().find((w) => w.date <= date)?.kg ?? detail.weights[0]?.kg ?? 75
  if (s.id === renatoMe.id) {
    const [before, after] = renatoMeasurements
    const item = (id: string, m: typeof before, skin: number[], bio: Assessment['bioimpedance'], calf: number): Assessment => ({
      id,
      date: m!.date,
      weightKg: weightOn(m!.date),
      heightCm,
      skinfolds: { chest: skin[0]!, midaxillary: skin[1]!, triceps: skin[2]!, subscapular: skin[3]!, abdominal: skin[4]!, suprailiac: skin[5]!, thigh: skin[6]! },
      bioimpedance: bio,
      perimeters: { waist: m!.waist, hips: m!.hips, chest: m!.chest, arm: m!.arm, thigh: m!.thigh, calf },
    })
    return {
      sex: detail.sex,
      birthDate: detail.birthDate,
      items: [
        item('av_renato_1', before, [18, 20, 16, 24, 32, 26, 22], { fatPct: 23.1, waterPct: 54.2, visceralLevel: 9, bmrKcal: 1960 }, 39),
        item('av_renato_2', after, [15, 17, 14, 21, 27, 22, 20], { fatPct: 20.4, waterPct: 56, visceralLevel: 8, bmrKcal: 1985 }, 39.5),
      ],
    }
  }
  const seed = seedOf(s.id)
  const base = 10 + (seed % 12)
  const female = detail.sex === 'female'
  const gen = (i: number): Assessment => {
    const k = i === 0 ? 0 : -2
    const date = detail.weights[i === 0 ? 0 : detail.weights.length - 1]?.date ?? detail.memberSince
    return {
      id: `av_${s.id}_${i + 1}`,
      date,
      weightKg: weightOn(date),
      heightCm,
      skinfolds: { chest: base + k, midaxillary: base + 2 + k, triceps: base + (female ? 8 : 0) + k, subscapular: base + 5 + k, abdominal: base + 10 + k, suprailiac: base + 6 + k, thigh: base + (female ? 12 : 4) + k },
      bioimpedance: null,
      perimeters: { waist: 80 + (seed % 15) + k, hips: 96 + (seed % 10), chest: 92 + (seed % 14), arm: 30 + (seed % 7) - k / 2, thigh: 54 + (seed % 8), calf: 35 + (seed % 4) },
    }
  }
  return { sex: detail.sex, birthDate: detail.birthDate, items: [gen(0), gen(1)] }
}

const find = (id: string) => students(new Date()).find((s) => s.id === id)
const notFound = () => HttpResponse.json({ message: 'Aluno não encontrado' }, { status: 404 })

export const coachStudentHandlers = [
  http.get('/api/coach/students/:id', async ({ params }) => {
    await latency()
    if (currentScenario() === 'erro') return HttpResponse.json({ message: 'Erro simulado' }, { status: 500 })
    const s = find(params.id as string)
    return s ? HttpResponse.json<StudentDetail>(detailOf(s, new Date())) : notFound()
  }),

  http.get('/api/coach/students/:id/workouts', async ({ params }) => {
    await latency()
    const s = find(params.id as string)
    return s ? HttpResponse.json<CoachWorkout[]>(workoutsOf(s, new Date())) : notFound()
  }),

  http.get('/api/coach/students/:id/check-ins', async ({ params }) => {
    await latency()
    const s = find(params.id as string)
    return s ? HttpResponse.json<StudentCheckIn[]>(checkInsOf(s, new Date())) : notFound()
  }),

  http.get('/api/coach/students/:id/workout-plan', async ({ params }) => {
    await latency()
    const s = find(params.id as string)
    return s ? HttpResponse.json<CoachStudentPlan>(planOf(s)) : notFound()
  }),

  // Visível para o aluno ou rascunho (o app do aluno só mostra os visíveis)
  // Editor de ficha aberto pelo perfil: salva a cópia do aluno inteira (o app dele passa a ver na hora)
  http.put('/api/coach/students/:id/workout-plan', async ({ params, request }) => {
    const s = find(params.id as string)
    if (!s) return notFound()
    const body = (await request.json().catch(() => null)) as { plan?: unknown } | null
    const parsed = WorkoutPlanSchema.safeParse(body?.plan)
    if (!parsed.success) return HttpResponse.json({ message: 'Ficha inválida' }, { status: 422 })
    await latency()
    db.coach.plans[s.id] = { ...parsed.data, updatedAt: toIsoDate(new Date()) }
    return new HttpResponse(null, { status: 204 })
  }),

  http.put('/api/coach/students/:id/workout-plan/days/:dayId/visibility', async ({ params, request }) => {
    const s = find(params.id as string)
    if (!s) return notFound()
    const { visible } = (await request.json()) as { visible?: unknown }
    if (typeof visible !== 'boolean') return HttpResponse.json({ message: 'Informe visible' }, { status: 422 })
    await latency()
    const dayId = params.dayId as string
    const rest = hiddenDays(s.id).filter((d) => d !== dayId)
    db.coach.hiddenDays[s.id] = visible ? rest : [...rest, dayId]
    return new HttpResponse(null, { status: 204 })
  }),

  // Séries válidas de um exercício (o −/+ do celular)
  http.patch('/api/coach/students/:id/workout-plan/days/:dayId/exercises/:itemId', async ({ params, request }) => {
    const s = find(params.id as string)
    if (!s) return notFound()
    const { workingSets } = (await request.json()) as { workingSets?: unknown }
    if (typeof workingSets !== 'number' || !Number.isInteger(workingSets) || workingSets < 1 || workingSets > 8) {
      return HttpResponse.json({ message: 'Séries válidas entre 1 e 8' }, { status: 422 })
    }
    const item = editablePlan(s.id).days.find((d) => d.id === params.dayId)?.exercises.find((e) => e.id === params.itemId)
    if (!item) return HttpResponse.json({ message: 'Exercício não encontrado' }, { status: 404 })
    await latency()
    item.workingSets = workingSets
    return new HttpResponse(null, { status: 204 })
  }),

  http.delete('/api/coach/students/:id/workout-plan/days/:dayId/exercises/:itemId', async ({ params }) => {
    const s = find(params.id as string)
    if (!s) return notFound()
    const day = editablePlan(s.id).days.find((d) => d.id === params.dayId)
    if (!day?.exercises.some((e) => e.id === params.itemId)) return HttpResponse.json({ message: 'Exercício não encontrado' }, { status: 404 })
    await latency()
    day.exercises = day.exercises.filter((e) => e.id !== params.itemId)
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('/api/coach/students/:id/diet', async ({ params }) => {
    await latency()
    const s = find(params.id as string)
    return s ? HttpResponse.json<CoachStudentDiet>(dietOf(s)) : notFound()
  }),

  http.get('/api/coach/students/:id/assessments', async ({ params }) => {
    await latency()
    const s = find(params.id as string)
    if (!s) return notFound()
    const a = assessmentsOf(s, detailOf(s, new Date()))
    return HttpResponse.json<StudentAssessments>(a ?? { sex: 'male', birthDate: '2000-01-01', items: [] })
  }),

  // Atualização parcial das configurações do aluno
  http.put('/api/coach/students/:id/settings', async ({ params, request }) => {
    const s = find(params.id as string)
    if (!s) return notFound()
    const patch = SettingsSchema.partial().strict().safeParse(await request.json())
    if (!patch.success) return HttpResponse.json({ message: 'Configuração inválida' }, { status: 422 })
    await latency()
    db.coach.settings[s.id] = { ...settingsOf(s.id), ...patch.data }
    return HttpResponse.json<StudentAppSettings>(db.coach.settings[s.id]!)
  }),
]
