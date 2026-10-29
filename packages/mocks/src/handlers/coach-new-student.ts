import { http, HttpResponse } from 'msw'
import type { CreatedStudent, NewStudentOptions, PhoneOwner, StudentListItem } from '@workspace/core'
import { NewStudent, phoneDigits, subscriptionEnd, toIsoDate } from '@workspace/core'
import { db, latency, newId } from '../db'
import { studentAppUrl } from '../fixtures/coach'
import { students } from './coach'
import { phoneOf } from './coach-student'

/** Planos de venda, fichas modelo e dietas do canvas. */
export const newStudentOptions: NewStudentOptions = {
  plans: [
    { id: 'mensal', name: 'Mensal', price: 230, months: 1 },
    { id: 'tri', name: 'Trimestral', price: 600, months: 3 },
    { id: 'sem', name: 'Semestral', price: 1080, months: 6 },
    { id: 'treino', name: 'Só treino', price: 150, months: 1 },
  ],
  workoutTemplates: [
    { id: 'tpl_ppl', label: 'Hipertrofia — PPL' },
    { id: 'tpl_ul', label: 'Upper/Lower 4x' },
    { id: 'tpl_full', label: 'Full body iniciante' },
  ],
  dietOptions: [
    { id: 'nutri', label: 'Paula monta (nutricionista)' },
    { id: 'sem', label: 'Sem dieta' },
    { id: 'tpl_cut1600', label: 'Emagrecimento 1.600' },
  ],
}

/** Sem 0/O e 1/I, que se confundem ao ditar o código. */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** Código de 6 caracteres, sempre igual para o mesmo cadastro da sessão (os testes sabem qual vem). */
function inviteCode(n: number): string {
  let x = (n * 2654435761) >>> 0
  return Array.from({ length: 6 }, () => {
    x = (x * 1103515245 + 12345) >>> 0
    return ALPHABET[(x >>> 16) % ALPHABET.length]!
  }).join('')
}

const owner = (phone: string) => students(new Date()).find((s) => s.status !== 'archived' && phoneDigits(phoneOf(s)) === phoneDigits(phone))

export const coachNewStudentHandlers = [
  http.get('/api/coach/students/new/options', async () => {
    await latency()
    return HttpResponse.json<NewStudentOptions>(newStudentOptions)
  }),

  // O WhatsApp é o login do aluno: não pode repetir
  http.get('/api/coach/students/lookup', async ({ request }) => {
    const phone = new URL(request.url).searchParams.get('phone') ?? ''
    await latency()
    const s = owner(phone)
    return s ? HttpResponse.json<PhoneOwner>({ id: s.id, fullName: s.fullName }) : HttpResponse.json({ message: 'Ninguém com este número' }, { status: 404 })
  }),

  // Cria o aluno pendente e o convite de primeiro acesso (vale 7 dias, uso único)
  http.post('/api/coach/students', async ({ request }) => {
    const parsed = NewStudent.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return HttpResponse.json({ message: 'Dados inválidos', issues: parsed.error.issues }, { status: 422 })
    const form = parsed.data
    const plan = newStudentOptions.plans.find((p) => p.id === form.planId)
    if (!plan) return HttpResponse.json({ message: 'Plano não encontrado' }, { status: 422 })
    const dup = owner(form.phone)
    if (dup) return HttpResponse.json({ message: `Este número já é de ${dup.fullName}`, studentId: dup.id }, { status: 409 })
    await latency()

    const now = new Date()
    const id = newId('stu_novo')
    const code = inviteCode(db.nextId)
    const endsOn = subscriptionEnd(form.startsOn, plan.months)
    const student: StudentListItem = {
      id,
      fullName: form.fullName,
      email: form.email || null,
      tags: [form.mode === 'online' ? 'Online' : 'Presencial'],
      status: 'pending',
      adherence30d: null,
      lastWorkoutOn: null,
      planEndsOn: null,
      subscriptionEndsOn: endsOn,
      invite: { sentAt: now.toISOString(), opened: false },
      alerts: [],
      conversationId: null,
    }
    const planLabel = `Consultoria ${form.mode} · ${plan.name.toLowerCase()}`
    db.coach.created.push({ student, form, planLabel, code })

    const expires = new Date(now)
    expires.setDate(expires.getDate() + 7)
    return HttpResponse.json<CreatedStudent>(
      { studentId: id, invite: { code, link: `${studentAppUrl}/primeiro-acesso/${code}`, expiresOn: toIsoDate(expires) }, subscriptionEndsOn: endsOn },
      { status: 201 },
    )
  }),
]
