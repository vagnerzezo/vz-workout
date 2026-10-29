import { describe, expect, it } from 'vitest'
import { NewStudent } from '../schemas/new-student'
import { formatPhone, inviteMessage, phoneDigits, planPriceLabel, subscriptionEnd, whatsAppLink } from './new-student'

const valid = {
  fullName: 'Fernanda Luz',
  phone: '(51) 99812-4470',
  email: '',
  mode: 'online',
  planId: 'mensal',
  startsOn: '2026-10-26',
  paid: false,
  workoutTemplateId: null,
  dietOptionId: 'nutri',
  channel: 'whatsapp',
} as const

const errors = (over: Partial<Record<keyof typeof valid, unknown>>) => {
  const r = NewStudent.safeParse({ ...valid, ...over })
  return r.success ? {} : Object.fromEntries(r.error.issues.map((i) => [i.path.join('.'), i.message]))
}

describe('NewStudent', () => {
  it('aceita o formulário do canvas (e-mail é opcional)', () => {
    expect(errors({})).toEqual({})
    expect(errors({ email: 'fernanda.luz@email.com', channel: 'email' })).toEqual({})
  })

  it('pede nome e sobrenome, DDD + 9 dígitos e e-mail válido', () => {
    expect(errors({ fullName: '  Fernanda ' })).toEqual({ fullName: 'Digite nome e sobrenome' })
    expect(errors({ phone: '51 9981-244' })).toEqual({ phone: 'DDD + 9 dígitos' })
    expect(errors({ email: 'fernanda@' })).toEqual({ email: 'E-mail inválido' })
  })

  it('envio por e-mail precisa do e-mail', () => {
    expect(errors({ channel: 'email' })).toEqual({ channel: 'Preencha o e-mail para enviar por e-mail' })
  })

  it('tira os espaços do nome', () => {
    expect(NewStudent.parse({ ...valid, fullName: '  Fernanda Luz ' }).fullName).toBe('Fernanda Luz')
  })
})

describe('telefone', () => {
  it('só números e formatado', () => {
    expect(phoneDigits('(51) 99812-4470')).toBe('51998124470')
    expect(formatPhone('51998124470')).toBe('(51) 99812-4470')
    expect(formatPhone('5199')).toBe('5199')
  })

  it('link do WhatsApp com a mensagem', () => {
    expect(whatsAppLink('(51) 99812-4470', 'Oi, Fernanda!')).toBe('https://wa.me/5551998124470?text=Oi%2C%20Fernanda!')
  })
})

describe('plano', () => {
  it('vence somando os meses (fim de mês não pula)', () => {
    expect(subscriptionEnd('2026-10-26', 1)).toBe('2026-11-26')
    expect(subscriptionEnd('2026-10-26', 6)).toBe('2027-04-26')
    expect(subscriptionEnd('2027-01-31', 1)).toBe('2027-02-28')
  })

  it('preço por mês ou pelo período', () => {
    expect(planPriceLabel(230, 1)).toBe('R$ 230,00 / mês')
    expect(planPriceLabel(600, 3)).toBe('R$ 600,00 / 3 meses')
  })
})

describe('inviteMessage', () => {
  it('monta a mensagem do canvas', () => {
    expect(inviteMessage({ firstName: 'Fernanda', coachFirstName: 'Kaue', appName: 'Team Oliveira', link: 'https://app.test/a/K7M2QX', code: 'K7M-2QX' })).toBe(
      'Oi, Fernanda! Aqui é o Kaue, da Team Oliveira. Seu acesso ao app já está pronto:\n\nhttps://app.test/a/K7M2QX\nCódigo: K7M-2QX\n\nNo primeiro acesso você cria sua senha e responde umas perguntas rápidas para eu montar seu treino.',
    )
  })
})
