import { http, HttpResponse } from 'msw'
import type { Invite, PublicBranding } from '@workspace/core'
import { Anamnesis, formatPhone, maskLoginId, normalizeInviteCode, parseLoginId, passwordRules } from '@workspace/core'
import { db, latency, newId, setLoggedIn } from '../db'
import { fernandaInvite, MAX_ATTEMPTS, RECOVERY_CODE, renatoLogin } from '../fixtures/renato-auth'
import { coachName, renatoMe } from '../fixtures/renato'

const isRenato = (login: string) => {
  const id = parseLoginId(login)
  return !!id && (id.value === renatoLogin.phone || id.value === renatoLogin.email)
}

/** Convite pelo código: o da Fernanda (canvas) ou um criado no painel nesta sessão. Já usado → null. */
function inviteFor(code: string): Invite | null {
  if (db.newStudent) return null // no mock só cabe um primeiro acesso por sessão
  const raw = normalizeInviteCode(code)
  if (raw === fernandaInvite.code) return fernandaInvite
  const created = db.coach.created.find((c) => c.code === raw)
  return created ? { code: raw, fullName: created.form.fullName, phone: formatPhone(created.form.phone), email: created.form.email, coachName } : null
}

const tooMany = () => HttpResponse.json({ message: 'Muitas tentativas. Espere 15 minutos ou recupere a senha.' }, { status: 429 })

export const authHandlers = [
  // Sem sessão, nada de /api/me/*: responde 401 antes dos outros handlers
  http.all('/api/me*', () => {
    if (!db.loggedIn) return HttpResponse.json({ message: 'Faça login' }, { status: 401 })
  }),

  http.get('/api/public/branding', async () => {
    await latency()
    return HttpResponse.json<PublicBranding>({ appName: renatoMe.branding.appName, coachName, brandColor: renatoMe.branding.brandColor })
  }),

  http.post('/api/auth/login', async ({ request }) => {
    const { login, password } = (await request.json()) as { login: string; password: string }
    await latency()
    if (db.loginAttempts >= MAX_ATTEMPTS) return tooMany()
    if (!isRenato(login) || password !== db.password) {
      db.loginAttempts++
      return HttpResponse.json({ message: 'Celular, e-mail ou senha incorretos.' }, { status: 401 })
    }
    db.loginAttempts = 0
    setLoggedIn(true)
    return new HttpResponse(null, { status: 204 })
  }),

  http.post('/api/auth/logout', async () => {
    await latency()
    setLoggedIn(false)
    return new HttpResponse(null, { status: 204 })
  }),

  // Sempre a mesma resposta, exista ou não o cadastro (não revela quem é aluno)
  http.post('/api/auth/recovery', async ({ request }) => {
    const { login, channel } = (await request.json()) as { login: string; channel: 'whatsapp' | 'email' }
    const id = parseLoginId(login)
    if (!id) return HttpResponse.json({ message: 'Digite seu celular com DDD ou seu e-mail.' }, { status: 422 })
    await latency()
    db.recovery = { login: id.value, attempts: 0, token: null }
    const sentTo =
      channel === 'whatsapp'
        ? `pelo WhatsApp ${id.kind === 'phone' ? maskLoginId(id) : 'cadastrado'}`
        : `para ${id.kind === 'email' ? maskLoginId(id) : 'o e-mail cadastrado'}`
    return HttpResponse.json({ sentTo })
  }),

  http.post('/api/auth/recovery/verify', async ({ request }) => {
    const { code } = (await request.json()) as { code: string }
    await latency()
    const r = db.recovery
    if (!r || r.attempts >= MAX_ATTEMPTS) return tooMany()
    if (code !== RECOVERY_CODE || !isRenato(r.login)) {
      r.attempts++
      return HttpResponse.json({ message: 'Código incorreto', attemptsLeft: MAX_ATTEMPTS - r.attempts }, { status: 400 })
    }
    r.token = newId('rec')
    return HttpResponse.json({ token: r.token })
  }),

  // Troca a senha e já entra (os outros aparelhos saem — no mock só há este)
  http.post('/api/auth/recovery/reset', async ({ request }) => {
    const { token, password } = (await request.json()) as { token: string; password: string }
    if (!db.recovery?.token || token !== db.recovery.token) return HttpResponse.json({ message: 'Código expirado' }, { status: 410 })
    if (!passwordRules(password).every((r) => r.ok)) return HttpResponse.json({ message: 'Senha fraca' }, { status: 422 })
    await latency()
    db.password = password
    db.recovery = null
    db.loginAttempts = 0
    setLoggedIn(true)
    return new HttpResponse(null, { status: 204 })
  }),

  // Convite do treinador: código errado ou já usado → 404
  http.get('/api/auth/invites/:code', async ({ params }) => {
    await latency()
    const invite = inviteFor(String(params.code))
    if (!invite) return HttpResponse.json({ message: 'Código não encontrado ou expirado' }, { status: 404 })
    // O painel passa a mostrar "Convite aberto, sem cadastro"
    const created = db.coach.created.find((c) => c.code === invite.code)
    if (created?.student.invite) created.student.invite.opened = true
    return HttpResponse.json<Invite>(invite)
  }),

  // Cria a senha, registra os aceites e já entra
  http.post('/api/auth/invites/:code/accept', async ({ params, request }) => {
    const { password, terms, health } = (await request.json()) as { password: string; terms: boolean; health: boolean }
    const invite = inviteFor(String(params.code))
    if (!invite) return HttpResponse.json({ message: 'Código não encontrado ou expirado' }, { status: 404 })
    if (!terms || !health) return HttpResponse.json({ message: 'Aceite os termos para continuar' }, { status: 422 })
    if (!passwordRules(password, { name: invite.fullName, phone: invite.phone }).every((r) => r.ok)) {
      return HttpResponse.json({ message: 'Senha fraca' }, { status: 422 })
    }
    await latency()
    db.newStudent = { fullName: invite.fullName, anamnesis: null }
    db.password = password
    setLoggedIn(true)
    return new HttpResponse(null, { status: 201 })
  }),

  http.post('/api/me/anamnesis', async ({ request }) => {
    const anamnesis = Anamnesis.safeParse(await request.json())
    if (!anamnesis.success) return HttpResponse.json({ message: 'Respostas inválidas' }, { status: 422 })
    await latency()
    if (db.newStudent) db.newStudent = { ...db.newStudent, anamnesis: anamnesis.data }
    return new HttpResponse(null, { status: 204 })
  }),
]
