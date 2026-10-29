import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import type { FinishSessionRequest } from '@workspace/core'
import { server } from '@workspace/mocks/node'
import { renderApp } from '../../../test/render-app'
import { useActiveWorkout } from '../store/active-workout'

const working = (prescribedId: string) => ({ prescribedId, kind: 'working' as const })

/** Treino C feito em 58 min: 3 válidas no hack a 85 kg × 8 e uma na mesa flexora a 45 kg × 12. */
function seedFinishedLegs() {
  const s = useActiveWorkout.getState()
  s.reset()
  s.start('day_c')
  useActiveWorkout.setState({ startedAt: new Date(Date.now() - 58 * 60_000).toISOString() })
  for (const n of [1, 2, 3]) {
    s.editSet(`day_c_1:v${n}`, working('day_c_1'), { kg: 85, reps: 8 })
    s.toggleDone(`day_c_1:v${n}`, working('day_c_1'), { kg: 85, reps: 8 })
  }
  s.toggleDone('day_c_2:v1', working('day_c_2'), { kg: 45, reps: 12 })
  s.markFinished()
  return useActiveWorkout.getState().sessionId!
}

async function openSummary() {
  const sessionId = seedFinishedLegs()
  const utils = renderApp(`/treinos/${sessionId}/resumo`)
  await screen.findByRole('heading', { level: 1, name: 'Treino concluído' })
  return { ...utils, sessionId }
}

const tile = (label: string) => screen.getByText(label, { selector: 'dt' }).nextElementSibling

beforeEach(() => localStorage.clear())

describe('Resumo do treino', () => {
  it('mostra os números, recordes e séries por músculo', async () => {
    await openSummary()
    await waitFor(() => expect(screen.getByText('Treino C — Legs · quarta, 21/10 · 3º treino da semana')).toBeInTheDocument())
    expect(tile('Duração')).toHaveTextContent('58min')
    expect(tile('Volume')).toHaveTextContent('2.580 kg')
    expect(tile('Séries')).toHaveTextContent('4 de 22')
    expect(tile('Recordes')).toHaveTextContent('2 novos')

    const records = screen.getByRole('region', { name: 'Recordes pessoais' })
    const items = within(records).getAllByRole('listitem').map((li) => li.textContent)
    expect(items).toEqual([
      'Agachamento hackMaior carga · antes 80 kg × 985 kg × 8',
      'Mesa flexoraMais repetições · antes 45 kg × 1145 kg × 12',
    ])

    const muscles = screen.getByRole('region', { name: 'Séries válidas por músculo' })
    expect(within(muscles).getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      'Quadríceps3',
      'Glúteos1,5',
      'Posterior de coxa1',
    ])
  })

  it('salva com esforço e comentário e volta para o início', async () => {
    const user = userEvent.setup()
    let body: FinishSessionRequest | undefined
    server.events.on('request:start', async ({ request }) => {
      if (request.method === 'POST' && request.url.endsWith('/finish')) body = await request.clone().json()
    })
    const { router, sessionId } = await openSummary()

    await user.click(screen.getByRole('button', { name: 'Esforço 8 de 10: Difícil' }))
    expect(screen.getByText('8 · Difícil')).toBeInTheDocument()
    await user.type(screen.getByRole('textbox', { name: 'Comentário para o treinador' }), 'Senti o joelho')
    await user.click(screen.getByRole('button', { name: 'Salvar treino' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    expect(await screen.findByText('Treino salvo')).toBeInTheDocument()
    expect(body).toMatchObject({ dayId: 'day_c', effort: 8, comment: 'Senti o joelho' })
    expect(body!.sets).toHaveLength(4)
    expect(useActiveWorkout.getState().sessionId).toBeNull()
    expect(sessionId).toBeTruthy()
    server.events.removeAllListeners()
  })

  it('o treino salvo aparece como feito na lista', async () => {
    const user = userEvent.setup()
    const { router } = await openSummary()
    await user.click(screen.getByRole('button', { name: 'Salvar treino' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))

    await router.navigate('/treinos')
    const legs = await screen.findByRole('article', { name: 'Treino C — Legs' })
    expect(within(legs).getByText('FEITO')).toBeInTheDocument()
    expect(screen.getByText('3 de 5 feitos na semana')).toBeInTheDocument()
  })

  it('se salvar falhar, o treino continua no aparelho', async () => {
    const user = userEvent.setup()
    server.use(http.post('/api/me/sessions/:id/finish', () => HttpResponse.error()))
    const { router } = await openSummary()
    await user.click(screen.getByRole('button', { name: 'Salvar treino' }))
    expect(await screen.findByText(/Não foi possível salvar agora/)).toBeInTheDocument()
    expect(router.state.location.pathname).toMatch(/resumo$/)
    expect(useActiveWorkout.getState().dayId).toBe('day_c')
  })

  it('descartar pede confirmação e apaga o treino', async () => {
    const user = userEvent.setup()
    const deleted: string[] = []
    server.events.on('request:start', ({ request }) => {
      if (request.method === 'DELETE') deleted.push(request.url)
    })
    const { router, sessionId } = await openSummary()

    await user.click(screen.getByRole('button', { name: 'Descartar treino' }))
    const dialog = await screen.findByRole('alertdialog', { name: 'Descartar este treino?' })
    await user.click(within(dialog).getByRole('button', { name: 'Descartar' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/treinos'))
    expect(useActiveWorkout.getState().sessionId).toBeNull()
    expect(deleted.some((u) => u.endsWith(`/api/me/sessions/${sessionId}`))).toBe(true)
    server.events.removeAllListeners()
  })

  it('voltar ao treino reabre a sessão com as séries', async () => {
    const user = userEvent.setup()
    const { router } = await openSummary()
    await user.click(screen.getByRole('link', { name: 'Voltar ao treino' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/treinos/day_c/ativo'), { timeout: 3000 }) // rota lazy: a 1ª carga demora com a suíte em paralelo
    expect(useActiveWorkout.getState().finishedAt).toBeNull()
    expect(await screen.findByText('4 de 22', {}, { timeout: 3000 })).toBeInTheDocument()
  })

  it('sem treino em andamento, mostra que o resumo não está disponível', async () => {
    useActiveWorkout.getState().reset()
    renderApp('/treinos/qualquer/resumo')
    expect(await screen.findByRole('heading', { name: 'Resumo indisponível' })).toBeInTheDocument()
  })
})
