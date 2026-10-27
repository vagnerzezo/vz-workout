import { http, HttpResponse } from 'msw'
import { subDays } from 'date-fns'
import type { Billing } from '@workspace/core'
import { toIsoDate } from '@workspace/core'
import { currentScenario, db, latency } from '../db'
import { coachName } from '../fixtures/renato'
import { renatoPayments } from '../fixtures/renato-billing'

const MAX_BYTES = 10 * 1024 * 1024

export const billingHandlers = [
  http.get('/api/me/billing', async () => {
    await latency()
    if (currentScenario() === 'erro') return HttpResponse.json({ message: 'Erro simulado' }, { status: 500 })
    return HttpResponse.json<Billing>({
      coachName,
      // Cenário pausado: a mesma cobrança, vencida há 6 dias
      charge: db.charge && currentScenario() === 'pausado' ? { ...db.charge, dueDate: toIsoDate(subDays(new Date(), 6)) } : db.charge,
      history: currentScenario() === 'novo' ? [] : renatoPayments,
    })
  }),

  // Comprovante (imagem ou PDF). Mandar de novo troca o anterior; o treinador confere no painel.
  http.post('/api/me/charges/:id/proof', async ({ params, request }) => {
    const charge = db.charge
    if (!charge || charge.id !== params.id || charge.status === 'paid') {
      return HttpResponse.json({ message: 'Cobrança não encontrada' }, { status: 404 })
    }
    const file = (await request.formData()).get('file')
    // Sem `instanceof File`: no Node a classe do FormData é outra
    if (!file || typeof file === 'string') return HttpResponse.json({ message: 'Envie o comprovante' }, { status: 422 })
    const { name, type, size } = file as File
    if (!/^image\/|^application\/pdf$/.test(type) || size > MAX_BYTES) {
      return HttpResponse.json({ message: 'Envie uma imagem ou PDF de até 10 MB' }, { status: 422 })
    }
    await latency()
    db.charge = { ...charge, status: 'in_review', proof: { fileName: name, sentAt: new Date().toISOString() }, rejectionReason: null }
    return HttpResponse.json(db.charge, { status: 201 })
  }),
]
