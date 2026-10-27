import type { Billing, Charge } from '@workspace/core'

/** Renovação do plano trimestral, como no canvas: vence junto com o plano (15/12). */
export const renatoCharge = (): Charge => ({
  id: 'chg_2026_12',
  planLabel: 'Trimestral',
  amount: 600,
  dueDate: '2026-12-15',
  renewsUntil: '2027-03-15',
  status: 'open',
  pix: {
    key: '12345678000190',
    keyLabel: 'Chave CNPJ',
    keyDisplay: '12.345.678/0001-90',
    receiver: 'CARLOS OLIVEIRA',
    city: 'Novo Hamburgo',
    txid: 'RENATO1512TRI',
  },
  proof: null,
  rejectionReason: null,
})

export const renatoPayments: Billing['history'] = [
  { id: 'pay_2026_09', planLabel: 'Trimestral', amount: 600, paidAt: '2026-09-14', method: 'pix' },
  { id: 'pay_2026_06', planLabel: 'Trimestral', amount: 600, paidAt: '2026-06-15', method: 'pix' },
]
