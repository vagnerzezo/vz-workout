import { z } from 'zod'

export const CoachChargeStatus = z.enum(['review', 'paid', 'late', 'upcoming', 'rejected'])
export type CoachChargeStatus = z.infer<typeof CoachChargeStatus>

/** Cobrança de um aluno no mês, como o treinador acompanha. */
export const CoachCharge = z.object({
  id: z.string(),
  studentId: z.string(),
  studentName: z.string(),
  plan: z.string(), // "Mensal"
  amount: z.number().positive(),
  dueOn: z.iso.date(),
  status: CoachChargeStatus,
  paidOn: z.iso.date().nullable(),
  /** Comprovante enviado pelo aluno e o que foi lido dele */
  proof: z
    .object({ fileName: z.string(), sentAt: z.iso.datetime(), amount: z.number(), paidOn: z.iso.date(), destinationKey: z.string() })
    .nullable(),
  rejectionReason: z.string().nullable(),
  remindedAt: z.iso.datetime().nullable(),
  renewsUntil: z.iso.date(), // até quando o plano vai depois de pago
})
export type CoachCharge = z.infer<typeof CoachCharge>

export const PixKeyType = z.enum(['cpf', 'cnpj', 'email', 'phone', 'random'])
export type PixKeyType = z.infer<typeof PixKeyType>

export const PixSettings = z.object({
  keyType: PixKeyType,
  key: z.string(), // como o treinador digitou
  receiverName: z.string().max(25),
  city: z.string().max(15),
  qrMode: z.enum(['auto', 'upload']),
  requireProof: z.boolean(),
  instructions: z.string().max(300),
})
export type PixSettings = z.infer<typeof PixSettings>

export const ReminderOffset = z.enum(['d-3', 'd0', 'd+1', 'd+5'])
export type ReminderOffset = z.infer<typeof ReminderOffset>

export const BillingRules = z.object({
  reminders: z.array(ReminderOffset),
  toleranceDays: z.number().int().min(0).max(15),
  blockAfterTolerance: z.boolean(),
})
export type BillingRules = z.infer<typeof BillingRules>

export const SalePlan = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number().positive(),
  months: z.number().int().positive(),
  description: z.string(),
  active: z.boolean(),
  students: z.number().int().min(0),
})
export type SalePlan = z.infer<typeof SalePlan>

/** GET /coach/finance */
export const CoachFinance = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  charges: z.array(CoachCharge),
  plans: z.array(SalePlan),
  rules: BillingRules,
  pix: PixSettings,
})
export type CoachFinance = z.infer<typeof CoachFinance>
