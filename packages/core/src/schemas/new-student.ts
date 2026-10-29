import { z } from 'zod'

const digits = (t: string) => t.replace(/\D/g, '')

export const StudentMode = z.enum(['online', 'presencial'])
export type StudentMode = z.infer<typeof StudentMode>

export const InviteChannel = z.enum(['whatsapp', 'email', 'qr'])
export type InviteChannel = z.infer<typeof InviteChannel>

/**
 * POST /coach/students: o formulário "Novo aluno". O mesmo schema valida a tela e a API.
 * O WhatsApp pode vir formatado ("(51) 99812-4470"); vale o que tiver 11 números.
 */
export const NewStudent = z
  .object({
    fullName: z
      .string()
      .trim()
      .refine((t) => t.split(/\s+/).filter(Boolean).length >= 2, 'Digite nome e sobrenome'),
    phone: z.string().refine((t) => digits(t).length === 11, 'DDD + 9 dígitos'),
    email: z.union([z.literal(''), z.email('E-mail inválido')]), // vazio = sem e-mail
    mode: StudentMode,
    planId: z.string().min(1),
    startsOn: z.iso.date('Escolha a data de início'),
    paid: z.boolean(),
    workoutTemplateId: z.string().nullable(), // null = montar depois da anamnese
    dietOptionId: z.string().min(1),
    channel: InviteChannel,
  })
  .refine((v) => v.channel !== 'email' || v.email !== '', { path: ['channel'], message: 'Preencha o e-mail para enviar por e-mail' })
export type NewStudent = z.infer<typeof NewStudent>

/** GET /coach/students/new/options: planos de venda do treinador e o conteúdo que pode ir junto. */
export const NewStudentOptions = z.object({
  plans: z.array(z.object({ id: z.string(), name: z.string(), price: z.number().positive(), months: z.number().int().positive() })),
  workoutTemplates: z.array(z.object({ id: z.string(), label: z.string() })),
  dietOptions: z.array(z.object({ id: z.string(), label: z.string() })),
})
export type NewStudentOptions = z.infer<typeof NewStudentOptions>

/** Resposta do POST: o aluno pendente e o convite de primeiro acesso. */
export const CreatedStudent = z.object({
  studentId: z.string(),
  invite: z.object({
    code: z.string(), // "K7M2QX" (a tela mostra K7M-2QX)
    link: z.url(),
    expiresOn: z.iso.date(),
  }),
  subscriptionEndsOn: z.iso.date(),
})
export type CreatedStudent = z.infer<typeof CreatedStudent>

/** GET /coach/students/lookup?phone=: o aluno que já usa este WhatsApp (404 se ninguém). */
export const PhoneOwner = z.object({ id: z.string(), fullName: z.string() })
export type PhoneOwner = z.infer<typeof PhoneOwner>
