import { differenceInCalendarDays } from 'date-fns'
import { formatBRL } from '../format/numbers'
import { parseIsoDate, shortDate } from '../format/date'
import type { CoachCharge, CoachChargeStatus, PixKeyType, PixSettings } from '../schemas/coach-finance'

export const chargeStatusLabel: Record<CoachChargeStatus, string> = { review: 'A conferir', paid: 'Confirmado', late: 'Em atraso', upcoming: 'A vencer', rejected: 'Recusado' }

/** Ordem da lista: a conferir, atrasados (e recusados), a vencer, pagos; dentro, pelo vencimento. */
const order: Record<CoachChargeStatus, number> = { review: 0, late: 1, rejected: 1, upcoming: 2, paid: 3 }
export const sortCharges = (list: CoachCharge[]) => [...list].sort((a, b) => order[a.status] - order[b.status] || a.dueOn.localeCompare(b.dueOn))

export type ChargeFilter = 'all' | CoachChargeStatus
/** "Em atraso" inclui os recusados (o aluno ainda deve). */
export const filterCharges = (list: CoachCharge[], f: ChargeFilter) => (f === 'all' ? list : list.filter((c) => c.status === f || (f === 'late' && c.status === 'rejected')))

const sum = (list: CoachCharge[]) => list.reduce((s, c) => s + c.amount, 0)

/** Resumo do mês: recebido × previsto e quanto está em cada situação. */
export function financeSummary(list: CoachCharge[]) {
  const of = (...s: CoachChargeStatus[]) => list.filter((c) => s.includes(c.status))
  return {
    received: sum(of('paid')),
    expected: sum(list),
    review: { count: of('review').length, amount: sum(of('review')) },
    late: { count: of('late', 'rejected').length, amount: sum(of('late', 'rejected')) },
    upcoming: { count: of('upcoming').length, amount: sum(of('upcoming')) },
  }
}

/** Linha de baixo na lista: "pago 09/10", "enviado 21/10", "7 dias de atraso", "vence hoje", "vence 28/10". */
export function chargeSubtitle(c: CoachCharge, now: Date): string {
  if (c.status === 'paid') return c.paidOn ? `pago ${shortDate(parseIsoDate(c.paidOn))}` : 'pago'
  if (c.status === 'review') return c.proof ? `enviado ${shortDate(new Date(c.proof.sentAt))}` : 'enviado'
  if (c.status === 'rejected') return 'comprovante recusado'
  const days = differenceInCalendarDays(now, parseIsoDate(c.dueOn))
  if (c.status === 'late') return days === 1 ? '1 dia de atraso' : `${days} dias de atraso`
  return days === 0 ? 'vence hoje' : `vence ${shortDate(parseIsoDate(c.dueOn))}`
}

export type ProofCheck = { label: string; detail: string; tone: 'ok' | 'warning' | 'danger' }

/**
 * O que a conferência lê do comprovante: valor, data (com a tolerância) e a chave de destino.
 * A chave compara só letras e números (o comprovante mostra com pontuação).
 */
export function proofChecks(c: Pick<CoachCharge, 'amount' | 'dueOn' | 'proof'>, pix: Pick<PixSettings, 'key' | 'keyType'>, toleranceDays: number): ProofCheck[] {
  if (!c.proof) return []
  const p = c.proof
  const diff = c.amount - p.amount
  const late = differenceInCalendarDays(parseIsoDate(p.paidOn), parseIsoDate(c.dueOn))
  const norm = (k: string) => k.replace(/[^0-9a-z@.+]/gi, '').toLowerCase()
  const keyOk = norm(p.destinationKey) === norm(pix.key)
  return [
    diff === 0
      ? { label: 'Valor confere', detail: `Pago ${formatBRL(p.amount)} · cobrança ${formatBRL(c.amount)}`, tone: 'ok' }
      : { label: 'Valor diferente da cobrança', detail: `Pago ${formatBRL(p.amount)} · cobrança ${formatBRL(c.amount)}${diff > 0 ? ` · faltam ${formatBRL(diff)}` : ''}`, tone: 'warning' },
    {
      label: late <= 0 ? 'Pago no prazo' : late <= toleranceDays ? 'Pago dentro da tolerância' : 'Pago após a tolerância',
      detail: `Pago ${shortDate(parseIsoDate(p.paidOn))} · vencimento ${shortDate(parseIsoDate(c.dueOn))} · tolerância ${toleranceDays} dias`,
      tone: late <= 0 ? 'ok' : late <= toleranceDays ? 'warning' : 'danger',
    },
    keyOk
      ? { label: 'Chave de destino é a sua', detail: `No comprovante: ${p.destinationKey}`, tone: 'ok' }
      : { label: 'Chave de destino diferente', detail: `No comprovante: ${p.destinationKey} · sua chave: ${pix.key}`, tone: 'danger' },
  ]
}

export const REJECTION_REASONS = ['Valor diferente', 'Chave errada', 'Comprovante ilegível', 'Comprovante repetido'] as const

/** Motivo sugerido para recusar, pelo que a conferência achou. */
export function suggestedRejection(checks: ProofCheck[]): (typeof REJECTION_REASONS)[number] | null {
  if (checks[0]?.tone !== 'ok') return 'Valor diferente'
  if (checks[2]?.tone !== 'ok') return 'Chave errada'
  return null
}

/** Valida e normaliza a chave Pix como ela vai no BR Code. */
export function validatePixKey(type: PixKeyType, value: string): { ok: boolean; normalized: string; message: string } {
  const digits = value.replace(/\D/g, '')
  if (type === 'cpf') return { ok: digits.length === 11, normalized: digits, message: digits.length === 11 ? 'CPF com 11 dígitos' : 'Digite os 11 números do CPF' }
  if (type === 'cnpj') return { ok: digits.length === 14, normalized: digits, message: digits.length === 14 ? 'CNPJ com 14 dígitos' : 'Digite os 14 números do CNPJ' }
  if (type === 'phone') {
    const d = digits.replace(/^55(?=\d{11}$)/, '')
    return { ok: d.length === 11, normalized: `+55${d}`, message: d.length === 11 ? `Será enviado como +55${d}` : 'DDD + 9 dígitos' }
  }
  const t = value.trim().toLowerCase()
  if (type === 'email') {
    const ok = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(t)
    return { ok, normalized: t, message: ok ? 'E-mail válido' : 'Digite um e-mail válido' }
  }
  const ok = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(t)
  return { ok, normalized: t, message: ok ? 'Chave aleatória válida' : 'Formato: 8-4-4-4-12 caracteres' }
}

/** Identificador da cobrança no Pix (até 25 letras e números): ajuda a achar o pagamento no extrato. */
export const chargeTxid = (c: Pick<CoachCharge, 'studentName' | 'dueOn' | 'plan'>) =>
  `${c.studentName.split(' ')[0]}${c.dueOn.slice(8, 10)}${c.dueOn.slice(5, 7)}${c.plan.slice(0, 3)}`
    .normalize('NFD')
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
    .slice(0, 25)

/** Exportar CSV (; e BOM, como a lista de alunos). */
export function chargesToCsv(list: CoachCharge[]): string {
  const cell = (v: string) => (/[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
  const rows = list.map((c) => [c.studentName, c.plan, c.amount.toFixed(2).replace('.', ','), shortDate(parseIsoDate(c.dueOn)), chargeStatusLabel[c.status], c.paidOn ? shortDate(parseIsoDate(c.paidOn)) : ''].map(cell).join(';'))
  return `﻿${['Aluno;Plano;Valor;Vencimento;Status;Pago em', ...rows].join('\n')}`
}
