/** O que o aluno digitou em "Celular ou e-mail": e-mail, ou celular com DDD (11 números). */
export type LoginId = { kind: 'email'; value: string } | { kind: 'phone'; value: string }

export function parseLoginId(text: string): LoginId | null {
  const t = text.trim()
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(t)) return { kind: 'email', value: t.toLowerCase() }
  const digits = t.replace(/\D/g, '')
  const local = digits.length === 13 && digits.startsWith('55') ? digits.slice(2) : digits // +55 opcional
  return local.length === 11 ? { kind: 'phone', value: local } : null
}

export const MIN_PASSWORD = 8

const fold = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

/**
 * Regras da senha nova, na ordem da tela. Com `personal` (primeiro acesso), a senha também não pode
 * conter o nome nem os últimos números do celular.
 */
export function passwordRules(pw: string, personal?: { name: string; phone: string }): { label: string; ok: boolean }[] {
  const rules = [
    { label: `Pelo menos ${MIN_PASSWORD} caracteres`, ok: pw.length >= MIN_PASSWORD },
    { label: 'Uma letra e um número', ok: /\p{L}/u.test(pw) && /\d/.test(pw) },
  ]
  if (!personal) return rules
  const p = fold(pw)
  const names = fold(personal.name).split(/\s+/).filter((n) => n.length >= 3)
  const digits = personal.phone.replace(/\D/g, '')
  const usesPersonal = names.some((n) => p.includes(n)) || (digits.length >= 4 && pw.includes(digits.slice(-4)))
  return [...rules, { label: 'Diferente do seu celular e nome', ok: pw.length > 0 && !usesPersonal }]
}

/** Código do convite: 6 letras e números, sem traço e em maiúsculas ("k7m-2qx" → "K7M2QX"). */
export const normalizeInviteCode = (text: string) => text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)

/** "K7M2QX" → "K7M-2QX" (como vem na mensagem do treinador) */
export const formatInviteCode = (code: string) => (code.length > 3 ? `${code.slice(0, 3)}-${code.slice(3)}` : code)

/** Para mostrar onde o código foi: "(51) •••••-2201" · "r••••@email.com" */
export function maskLoginId(id: LoginId): string {
  if (id.kind === 'phone') return `(${id.value.slice(0, 2)}) •••••-${id.value.slice(-4)}`
  const [user, domain] = id.value.split('@') as [string, string]
  return `${user[0]}••••@${domain}`
}
