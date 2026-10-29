import { addMonths } from 'date-fns'
import { parseIsoDate, toIsoDate } from '../format/date'
import { formatBRL } from '../format/numbers'

/** Só os números do WhatsApp: "(51) 99812-4470" → "51998124470". */
export const phoneDigits = (text: string) => text.replace(/\D/g, '')

/** "51998124470" → "(51) 99812-4470". Enquanto não tem 11 números, devolve o que veio. */
export function formatPhone(text: string): string {
  const d = phoneDigits(text)
  return d.length === 11 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}` : text
}

/** "Vence em": a data de início somada aos meses do plano. */
export const subscriptionEnd = (startsOn: string, months: number) => toIsoDate(addMonths(parseIsoDate(startsOn), months))

/** Preço do plano no cartão: "R$ 230,00 / mês" ou "R$ 600,00 / 3 meses". */
export function planPriceLabel(price: number, months: number): string {
  return `${formatBRL(price)} / ${months === 1 ? 'mês' : `${months} meses`}`
}

/** Mensagem pronta que vai para o aluno (WhatsApp, e-mail ou copiar). */
export function inviteMessage(p: { firstName: string; coachFirstName: string; appName: string; link: string; code: string }): string {
  return [
    `Oi, ${p.firstName}! Aqui é o ${p.coachFirstName}, da ${p.appName}. Seu acesso ao app já está pronto:`,
    '',
    p.link,
    `Código: ${p.code}`,
    '',
    'No primeiro acesso você cria sua senha e responde umas perguntas rápidas para eu montar seu treino.',
  ].join('\n')
}

/** Link do WhatsApp com a mensagem já escrita (número brasileiro com DDD). */
export const whatsAppLink = (phone: string, text: string) => `https://wa.me/55${phoneDigits(phone)}?text=${encodeURIComponent(text)}`
