import { http, HttpResponse } from 'msw'
import type { Branding } from '@workspace/core'
import { CoachSettings, isValidCref } from '@workspace/core'
import { db, latency } from '../db'
import { initialCoachSettings } from '../fixtures/coach-settings'

export const coachSettings = (): CoachSettings => (db.coach.coachSettings ??= initialCoachSettings())

/** A marca publicada nas configurações: é a que o app do aluno mostra (login, ícone, cor). */
export const publishedBranding = (): Branding => {
  const { appName, brandColor } = coachSettings().branding
  return { appName, brandColor }
}

const invalid = (message: string) => HttpResponse.json({ message }, { status: 422 })

export const coachSettingsHandlers = [
  http.get('/api/coach/settings', async () => {
    await latency()
    return HttpResponse.json<CoachSettings>(coachSettings())
  }),

  // Salva tudo de uma vez ("Salvar alterações" no desktop, "Pronto"/"Publicar" no celular)
  http.put('/api/coach/settings', async ({ request }) => {
    const parsed = CoachSettings.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return invalid('Confira os campos destacados')
    const next = parsed.data
    if (!isValidCref(next.profile.cref)) return invalid('CREF inválido. Use o formato 000000-G/UF')
    const before = coachSettings()
    // O dono não perde o acesso às configurações; dieta só a nutricionista edita
    if (next.permissions.settings.owner !== 'edit') return invalid('O dono sempre edita as configurações')
    if (next.permissions.diets.owner === 'edit' || next.permissions.diets.assistant === 'edit') return invalid('Só a nutricionista edita fichas de dieta')
    await latency()
    db.coach.coachSettings = { ...next, profile: { ...next.profile, cref: next.profile.cref.trim().toUpperCase() }, team: before.team, security: { ...next.security, sessions: before.security.sessions }, plan: before.plan }
    return HttpResponse.json<CoachSettings>(db.coach.coachSettings)
  }),

  http.post('/api/coach/settings/sessions/:id/end', async ({ params }) => {
    await latency()
    const s = coachSettings()
    if (s.security.sessions.find((x) => x.id === params.id)?.current) return invalid('Não dá para encerrar a sessão atual')
    s.security.sessions = s.security.sessions.filter((x) => x.id !== params.id)
    return new HttpResponse(null, { status: 204 })
  }),
]
