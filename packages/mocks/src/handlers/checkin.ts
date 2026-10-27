import { http, HttpResponse } from 'msw'
import type { PendingCheckIn, ProgressPhoto } from '@workspace/core'
import { CheckInAnswers, toIsoDate } from '@workspace/core'
import { currentScenario, db, latency, newId } from '../db'
import { renatoCheckIn } from '../fixtures/renato-checkin'

/** Check-in pendente agora: some depois de enviado, e o aluno novo ainda não tem. */
export function pendingCheckIn(today: Date): PendingCheckIn | null {
  if (currentScenario() === 'novo') return null
  const pending = renatoCheckIn(today, db.weights.at(-1)?.kg ?? null)
  return db.sentCheckIns.includes(pending.id) ? null : pending
}

/** No navegador a foto vira uma URL local, para aparecer no Progresso; nos testes (sem createObjectURL), fica sem. Arquivo é checado sem `instanceof File`: no Node a classe do FormData é outra. */
const photoUrl = (file: Blob) => (typeof URL.createObjectURL === 'function' ? URL.createObjectURL(file) : null)

export const checkInHandlers = [
  http.get('/api/me/check-in', async () => {
    await latency()
    if (currentScenario() === 'erro') return HttpResponse.json({ message: 'Erro simulado' }, { status: 500 })
    return HttpResponse.json<PendingCheckIn | null>(pendingCheckIn(new Date()))
  }),

  http.post('/api/me/check-ins/:id', async ({ params, request }) => {
    const today = new Date()
    const pending = pendingCheckIn(today)
    if (!pending || pending.id !== params.id) return HttpResponse.json({ message: 'Check-in não encontrado' }, { status: 404 })

    const form = await request.formData()
    const answers = CheckInAnswers.safeParse(JSON.parse(String(form.get('answers') ?? 'null')))
    const photos = pending.poses.map((pose) => [pose, form.get(`photo_${pose}`)] as const)
    const missingRating = pending.questions.some((q) => !answers.success || !answers.data.ratings[q.id])
    if (!answers.success || missingRating || photos.some(([, f]) => !f || typeof f === 'string')) {
      return HttpResponse.json({ message: 'Check-in incompleto' }, { status: 422 })
    }
    await latency()

    const date = toIsoDate(today)
    const { weightKg } = answers.data
    db.weights.push({ id: newId('kg'), kg: weightKg, date })
    db.photos = [
      ...db.photos,
      ...photos.map(([pose, file]): ProgressPhoto => ({ id: newId('ph'), date, pose, weightKg, url: photoUrl(file as Blob) })),
    ]
    db.sentCheckIns = [...db.sentCheckIns, pending.id]
    return HttpResponse.json({ id: pending.id, sentAt: today.toISOString() }, { status: 201 })
  }),
]
