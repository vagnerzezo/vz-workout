import { http, HttpResponse } from 'msw'
import { addMonths } from 'date-fns'
import type { CoachCharge, CoachFinance, SalePlan, StudentListItem } from '@workspace/core'
import { BillingRules, PixSettings, REJECTION_REASONS, toIsoDate, validatePixKey, yearMonthOf } from '@workspace/core'
import { db, latency } from '../db'
import { chargeSeeds, initialPix, initialRules, PLAN_DESCRIPTIONS, PLAN_STUDENTS, type ChargeSeed } from '../fixtures/coach-finance'
import { renatoMe } from '../fixtures/renato'
import { students } from './coach'
import { newStudentOptions } from './coach-new-student'

const day = (now: Date, offset: number, h = 12, m = 0) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, h, m)
const iso = (now: Date, offset: number) => toIsoDate(day(now, offset))
const months = { Mensal: 1, Trimestral: 3, Semestral: 6 } as const

export const pixSettings = () => db.coach.finance.pix ?? initialPix
const rules = () => db.coach.finance.rules ?? initialRules

function fromSeed(seed: ChargeSeed, s: StudentListItem, now: Date): CoachCharge {
  const decision = db.coach.finance.decisions[seed.id]
  const status = decision ? decision.status : seed.status
  return {
    id: seed.id,
    studentId: s.id,
    studentName: s.fullName,
    plan: seed.plan,
    amount: seed.amount,
    dueOn: iso(now, seed.dueIn),
    status,
    paidOn: status === 'paid' ? (decision ? toIsoDate(new Date(decision.at)) : iso(now, seed.paidIn ?? seed.dueIn)) : null,
    proof: seed.proof ? { fileName: seed.proof.file, sentAt: day(now, seed.proof.sentIn[0], seed.proof.sentIn[1], seed.proof.sentIn[2]).toISOString(), amount: seed.proof.amount, paidOn: iso(now, seed.proof.paidIn), destinationKey: seed.proof.key } : null,
    rejectionReason: decision?.status === 'rejected' ? decision.reason : null,
    remindedAt: db.coach.finance.reminded[seed.id] ?? null,
    renewsUntil: toIsoDate(addMonths(day(now, seed.dueIn), months[seed.plan])),
  }
}

/** A cobrança do Renato entra quando ele manda o comprovante pelo app (ou depois que o treinador decide). */
function renatoCharge(s: StudentListItem): CoachCharge | null {
  const c = db.charge
  const decision = db.coach.finance.decisions[c?.id ?? 'chg_2026_12']
  if (!c && !decision) return null
  if (c && c.status === 'open' && !decision) return null
  const base = c ?? { id: 'chg_2026_12', planLabel: 'Trimestral', amount: 600, dueDate: '2026-12-15', renewsUntil: '2027-03-15', proof: null }
  const status = decision?.status ?? (c!.status === 'rejected' ? 'rejected' : 'review')
  return {
    id: base.id,
    studentId: s.id,
    studentName: s.fullName,
    plan: base.planLabel,
    amount: base.amount,
    dueOn: base.dueDate,
    status,
    paidOn: decision?.status === 'paid' ? toIsoDate(new Date(decision.at)) : null,
    proof: base.proof ? { fileName: base.proof.fileName, sentAt: base.proof.sentAt, amount: base.amount, paidOn: toIsoDate(new Date(base.proof.sentAt)), destinationKey: pixSettings().key } : null,
    rejectionReason: decision?.status === 'rejected' ? decision.reason : null,
    remindedAt: null,
    renewsUntil: base.renewsUntil,
  }
}

export function coachCharges(now: Date): CoachCharge[] {
  const byId = new Map(students(now).map((s) => [s.id, s]))
  const list = chargeSeeds.flatMap((seed) => {
    const s = byId.get(seed.studentId)
    return s && s.status !== 'archived' ? [fromSeed(seed, s, now)] : []
  })
  const renato = byId.get(renatoMe.id)
  const r = renato && renatoCharge(renato)
  return r ? [r, ...list] : list
}

/** Comprovantes a conferir (contador do menu). */
export const pendingProofs = (now: Date) => coachCharges(now).filter((c) => c.status === 'review').length

const findCharge = (id: unknown) => coachCharges(new Date()).find((c) => c.id === id)
const notFound = () => HttpResponse.json({ message: 'Cobrança não encontrada' }, { status: 404 })

export const coachFinanceHandlers = [
  http.get('/api/coach/finance', async () => {
    await latency()
    const now = new Date()
    const plans: SalePlan[] = newStudentOptions.plans.map((p) => ({ ...p, description: PLAN_DESCRIPTIONS[p.id] ?? '', active: db.coach.finance.plansActive[p.id] ?? p.id !== 'treino', students: PLAN_STUDENTS[p.id] ?? 0 }))
    return HttpResponse.json<CoachFinance>({ month: yearMonthOf(now), charges: coachCharges(now), plans, rules: rules(), pix: pixSettings() })
  }),

  // "Confirmar pagamento e renovar plano": no app do Renato, a cobrança some
  http.post('/api/coach/charges/:id/confirm', async ({ params }) => {
    const c = findCharge(params.id)
    if (!c) return notFound()
    if (c.status === 'paid') return HttpResponse.json({ message: 'Já confirmado' }, { status: 409 })
    await latency()
    db.coach.finance.decisions[c.id] = { status: 'paid', reason: null, at: new Date().toISOString() }
    if (db.charge?.id === c.id) db.charge = null
    return new HttpResponse(null, { status: 204 })
  }),

  // Recusar com motivo: o aluno vê o motivo no app e pode enviar outro comprovante
  http.post('/api/coach/charges/:id/reject', async ({ params, request }) => {
    const c = findCharge(params.id)
    if (!c) return notFound()
    const { reason } = ((await request.json().catch(() => null)) ?? {}) as { reason?: unknown }
    if (typeof reason !== 'string' || !(REJECTION_REASONS as readonly string[]).includes(reason)) return HttpResponse.json({ message: 'Escolha o motivo' }, { status: 422 })
    await latency()
    db.coach.finance.decisions[c.id] = { status: 'rejected', reason, at: new Date().toISOString() }
    if (db.charge?.id === c.id) db.charge = { ...db.charge, status: 'rejected', rejectionReason: reason }
    return new HttpResponse(null, { status: 204 })
  }),

  // "Lembrar" (a vencer) e "Enviar notificação" (cobrar): push com o Pix da cobrança
  http.post('/api/coach/charges/:id/remind', async ({ params }) => {
    const c = findCharge(params.id)
    if (!c) return notFound()
    await latency()
    db.coach.finance.reminded[c.id] = new Date().toISOString()
    return new HttpResponse(null, { status: 204 })
  }),

  http.put('/api/coach/finance/pix', async ({ request }) => {
    const parsed = PixSettings.safeParse(await request.json().catch(() => null))
    if (!parsed.success || !validatePixKey(parsed.data.keyType, parsed.data.key).ok || !parsed.data.receiverName.trim() || !parsed.data.city.trim()) {
      return HttpResponse.json({ message: 'Confira a chave, o nome e a cidade' }, { status: 422 })
    }
    await latency()
    db.coach.finance.pix = parsed.data
    return new HttpResponse(null, { status: 204 })
  }),

  http.put('/api/coach/finance/rules', async ({ request }) => {
    const parsed = BillingRules.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return HttpResponse.json({ message: 'Regras inválidas' }, { status: 422 })
    await latency()
    db.coach.finance.rules = parsed.data
    return new HttpResponse(null, { status: 204 })
  }),

  http.put('/api/coach/finance/plans/:id', async ({ params, request }) => {
    const { active } = ((await request.json().catch(() => null)) ?? {}) as { active?: unknown }
    if (!newStudentOptions.plans.some((p) => p.id === params.id)) return HttpResponse.json({ message: 'Plano não encontrado' }, { status: 404 })
    await latency()
    db.coach.finance.plansActive[params.id as string] = active === true
    return new HttpResponse(null, { status: 204 })
  }),
]
