import { z } from 'zod'

export const ChargeStatus = z.enum(['open', 'in_review', 'rejected', 'paid'])
export type ChargeStatus = z.infer<typeof ChargeStatus>

/** Cobrança da renovação, paga por Pix com envio de comprovante para o treinador conferir. */
export const Charge = z.object({
  id: z.string(),
  planLabel: z.string(), // "Trimestral"
  amount: z.number().positive(), // em reais
  dueDate: z.iso.date(),
  renewsUntil: z.iso.date(), // até quando o plano vai depois de pago
  status: ChargeStatus,
  pix: z.object({
    key: z.string(), // como vai no BR Code: "12345678000190"
    keyLabel: z.string(), // "Chave CNPJ"
    keyDisplay: z.string(), // "12.345.678/0001-90"
    receiver: z.string(),
    city: z.string(),
    txid: z.string(), // "RENATO1512TRI"
  }),
  proof: z.object({ fileName: z.string(), sentAt: z.iso.datetime() }).nullable(),
  rejectionReason: z.string().nullable(), // quando o treinador recusa o comprovante
})
export type Charge = z.infer<typeof Charge>

/** Resposta de GET /me/billing */
export const Billing = z.object({
  coachName: z.string(),
  charge: Charge.nullable(), // null = nada a pagar agora
  history: z.array(z.object({ id: z.string(), planLabel: z.string(), amount: z.number(), paidAt: z.iso.date(), method: z.enum(['pix']) })),
})
export type Billing = z.infer<typeof Billing>
