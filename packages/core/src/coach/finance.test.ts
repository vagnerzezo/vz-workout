import { describe, expect, it } from 'vitest'
import type { CoachCharge } from '../schemas/coach-finance'
import { chargeSubtitle, chargesToCsv, chargeTxid, filterCharges, financeSummary, proofChecks, sortCharges, suggestedRejection, validatePixKey } from './finance'

const now = new Date(2026, 9, 21, 20, 0)
const c = (over: Partial<CoachCharge>): CoachCharge => ({
  id: 'c',
  studentId: 's',
  studentName: 'Júlia Castro',
  plan: 'Mensal',
  amount: 230,
  dueOn: '2026-10-20',
  status: 'upcoming',
  paidOn: null,
  proof: null,
  rejectionReason: null,
  remindedAt: null,
  renewsUntil: '2026-11-20',
  ...over,
})
const pix = { key: '12.345.678/0001-90', keyType: 'cnpj' as const }

describe('financeiro', () => {
  it('ordem, filtro e resumo do mês', () => {
    const list = [c({ id: 'p', status: 'paid', amount: 1080 }), c({ id: 'u', status: 'upcoming', dueOn: '2026-10-28' }), c({ id: 'r', status: 'review' }), c({ id: 'x', status: 'rejected' }), c({ id: 'l', status: 'late', dueOn: '2026-10-12' })]
    expect(sortCharges(list).map((x) => x.id)).toEqual(['r', 'l', 'x', 'u', 'p'])
    expect(filterCharges(list, 'late').map((x) => x.id)).toEqual(['x', 'l'])
    expect(financeSummary(list)).toEqual({ received: 1080, expected: 2000, review: { count: 1, amount: 230 }, late: { count: 2, amount: 460 }, upcoming: { count: 1, amount: 230 } })
  })

  it('subtítulo de cada cobrança', () => {
    expect(chargeSubtitle(c({ status: 'late', dueOn: '2026-10-12' }), now)).toBe('9 dias de atraso')
    expect(chargeSubtitle(c({ status: 'upcoming', dueOn: '2026-10-21' }), now)).toBe('vence hoje')
    expect(chargeSubtitle(c({ status: 'upcoming', dueOn: '2026-10-28' }), now)).toBe('vence 28/10')
    expect(chargeSubtitle(c({ status: 'paid', paidOn: '2026-10-09' }), now)).toBe('pago 09/10')
  })

  it('conferência do comprovante e motivo sugerido', () => {
    const ok = proofChecks(c({ proof: { fileName: 'a.jpg', sentAt: now.toISOString(), amount: 230, paidOn: '2026-10-20', destinationKey: '12.345.678/0001-90' } }), pix, 3)
    expect(ok.map((k) => k.tone)).toEqual(['ok', 'ok', 'ok'])
    expect(suggestedRejection(ok)).toBeNull()

    const bad = proofChecks(c({ proof: { fileName: 'b.jpg', sentAt: now.toISOString(), amount: 200, paidOn: '2026-10-21', destinationKey: '(51) 98877-1234' } }), pix, 3)
    expect(bad.map((k) => [k.label, k.tone])).toEqual([
      ['Valor diferente da cobrança', 'warning'],
      ['Pago dentro da tolerância', 'warning'],
      ['Chave de destino diferente', 'danger'],
    ])
    expect(bad[0]!.detail).toBe('Pago R$ 200,00 · cobrança R$ 230,00 · faltam R$ 30,00')
    expect(suggestedRejection(bad)).toBe('Valor diferente')
  })

  it('chave Pix e identificador', () => {
    expect(validatePixKey('cnpj', '12.345.678/0001-90')).toEqual({ ok: true, normalized: '12345678000190', message: 'CNPJ com 14 dígitos' })
    expect(validatePixKey('phone', '(51) 99812-4470').normalized).toBe('+5551998124470')
    expect(validatePixKey('email', 'kaue@').ok).toBe(false)
    expect(chargeTxid({ studentName: 'Júlia Castro', dueOn: '2026-10-20', plan: 'Mensal' })).toBe('JULIA2010MEN')
  })

  it('CSV com ; e BOM', () => {
    expect(chargesToCsv([c({ status: 'paid', paidOn: '2026-10-19' })])).toBe('﻿Aluno;Plano;Valor;Vencimento;Status;Pago em\nJúlia Castro;Mensal;230,00;20/10;Confirmado;19/10')
  })
})
