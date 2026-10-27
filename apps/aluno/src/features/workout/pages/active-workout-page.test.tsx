import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { server } from '@workspace/mocks/node'
import { renderApp } from '../../../test/render-app'
import { useActiveWorkout } from '../store/active-workout'

const hack = () => screen.getByRole('region', { name: 'Agachamento hack (máquina)' })
const setsOf = (region: HTMLElement) => within(region).getByRole('group', { name: /^Séries de/ })

async function openLegs() {
  const utils = renderApp('/treinos/day_c/ativo')
  await screen.findByRole('heading', { level: 1, name: 'Treino C — Legs' })
  return utils
}

function setOnline(online: boolean) {
  Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => online })
  window.dispatchEvent(new Event(online ? 'online' : 'offline'))
}

beforeEach(() => {
  useActiveWorkout.getState().reset()
  useActiveWorkout.getState().setAutoRest(true)
  localStorage.clear()
})

afterEach(() => setOnline(true))

describe('Treino em andamento', () => {
  it('mostra o treino do dia com a última sessão e a observação do treinador', async () => {
    await openLegs()
    expect(screen.getByText('Exercício 1 de 6')).toBeInTheDocument()
    expect(screen.getByText('0 de 22')).toBeInTheDocument()
    expect(within(hack()).getByText('Quadríceps · Glúteos')).toBeInTheDocument()
    expect(within(hack()).getByText(/Cadência 3-1-1/)).toBeInTheDocument()
    expect(within(hack()).getByText('6–10 reps · RIR 1–2')).toBeInTheDocument()
    expect(within(hack()).getByRole('button', { name: 'Descanso: 2min 30s' })).toBeInTheDocument()
    expect(within(setsOf(hack())).getByText('80 kg × 9')).toBeInTheDocument()
    expect(within(hack()).getByRole('textbox', { name: 'Carga da série válida 1, em kg' })).toHaveAttribute('placeholder', '85')
    expect(screen.getAllByRole('region').filter((r) => r.getAttribute('aria-labelledby')?.startsWith('exercicio-'))).toHaveLength(6)
  })

  it('concluir uma série soma volume, conta a série e começa o descanso', async () => {
    const user = userEvent.setup()
    await openLegs()

    const check = within(hack()).getByRole('button', { name: 'Concluir aquecimento 1' })
    await user.click(check)
    expect(within(hack()).getByRole('button', { name: 'Desmarcar aquecimento 1' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('1 de 22')).toBeInTheDocument()
    expect(screen.getByText('480 kg')).toBeInTheDocument() // 40 kg × 12
    expect(screen.getByRole('timer')).toHaveTextContent('01:00') // descanso do aquecimento

    await user.click(screen.getByRole('button', { name: 'Pular' }))
    expect(screen.getByText('Agachamento hack · 50 kg × 10')).toBeInTheDocument()
  })

  it('usa a carga digitada, marca recorde e ajusta o descanso em 15 s', async () => {
    const user = userEvent.setup()
    await openLegs()

    const kg = within(hack()).getByRole('textbox', { name: 'Carga da série válida 1, em kg' })
    await user.type(kg, '87,5')
    await user.tab()
    await user.click(within(hack()).getByRole('button', { name: 'Concluir série válida 1' }))

    expect(kg).toHaveValue('87,5')
    expect(within(hack()).getByTitle('Recorde pessoal')).toBeInTheDocument() // 87,5 × 9 passa de 80 × 9
    expect(screen.getByRole('timer')).toHaveTextContent('02:30')
    await user.click(screen.getByRole('button', { name: 'Aumentar 15 segundos' }))
    expect(screen.getByRole('timer')).toHaveTextContent('02:45')
  })

  it('o timer continua contando pelo relógio', async () => {
    const user = userEvent.setup()
    await openLegs()
    await user.click(within(hack()).getByRole('button', { name: 'Concluir série válida 1' }))
    act(() => vi.setSystemTime(Date.now() + 48_000))
    await waitFor(() => expect(screen.getByRole('timer')).toHaveTextContent('01:42'))
  })

  it('adicionar série aumenta as válidas do exercício', async () => {
    const user = userEvent.setup()
    await openLegs()
    await user.click(within(hack()).getByRole('button', { name: 'Adicionar série' }))
    expect(within(hack()).getByText('Válidas 4')).toBeInTheDocument()
    expect(within(hack()).getByRole('button', { name: 'Concluir série válida 4' })).toBeInTheDocument()
    expect(screen.getByText('0 de 23')).toBeInTheDocument()
  })

  it('sem internet guarda as séries e envia quando a conexão volta', async () => {
    const user = userEvent.setup()
    const puts: string[] = []
    server.events.on('request:start', ({ request }) => {
      if (request.method === 'PUT') puts.push(decodeURIComponent(new URL(request.url).pathname.split('/').pop()!))
    })
    await openLegs()

    setOnline(false)
    await user.click(within(hack()).getByRole('button', { name: 'Concluir série válida 1' }))
    expect(useActiveWorkout.getState().pendingSync).toEqual({ 'day_c_1:v1': 1 })
    expect(puts).toEqual([])

    act(() => setOnline(true))
    await waitFor(() => expect(useActiveWorkout.getState().pendingSync).toEqual({}))
    expect(puts).toEqual(['day_c_1:v1'])
    server.events.removeAllListeners()
  })

  it('o treino continua depois de fechar e abrir o app', async () => {
    const user = userEvent.setup()
    const first = await openLegs()
    await user.click(within(hack()).getByRole('button', { name: 'Concluir série válida 1' }))
    first.unmount()

    await openLegs()
    expect(within(hack()).getByRole('button', { name: 'Desmarcar série válida 1' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('1 de 22')).toBeInTheDocument()
  })

  it('o painel de descanso usa a faixa do treinador e o liga/desliga automático', async () => {
    const user = userEvent.setup()
    await openLegs()
    await user.click(screen.getByRole('button', { name: 'Abrir timer de descanso' }))
    const dialog = await screen.findByRole('dialog', { name: 'Descanso' })

    expect(within(dialog).getByText('Agachamento hack · Aquecimento')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Máx: 03:00' }))
    expect(within(dialog).getByRole('button', { name: 'Máx: 03:00' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(dialog).getByRole('button', { name: 'Pausar' })).toBeInTheDocument()

    await user.click(within(dialog).getByRole('switch', { name: 'Iniciar ao concluir a série' }))
    expect(useActiveWorkout.getState().autoRest).toBe(false)
  })

  it('com o automático desligado, concluir a série não inicia o descanso', async () => {
    const user = userEvent.setup()
    useActiveWorkout.getState().setAutoRest(false)
    await openLegs()
    await user.click(within(hack()).getByRole('button', { name: 'Concluir série válida 1' }))
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
  })

  it('concluir abre o resumo sem enviar nada ainda', async () => {
    const user = userEvent.setup()
    const posts: string[] = []
    server.events.on('request:start', ({ request }) => {
      if (request.method === 'POST') posts.push(request.url)
    })
    const { router } = await openLegs()
    await user.click(within(hack()).getByRole('button', { name: 'Concluir série válida 1' }))
    const sessionId = useActiveWorkout.getState().sessionId

    await user.click(screen.getByRole('button', { name: 'Concluir' }))
    await waitFor(() => expect(router.state.location.pathname).toBe(`/treinos/${sessionId}/resumo`))
    expect(useActiveWorkout.getState().finishedAt).not.toBeNull()
    expect(posts).toEqual([])
    server.events.removeAllListeners()
  })

  it('não conclui um treino sem nenhuma série', async () => {
    const user = userEvent.setup()
    const { router } = await openLegs()
    await user.click(screen.getByRole('button', { name: 'Concluir' }))
    expect(await screen.findByText('Conclua pelo menos uma série antes de finalizar.')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/treinos/day_c/ativo')
  })

  it('avisa quando já há outro treino com séries registradas', async () => {
    const user = userEvent.setup()
    const first = await openLegs()
    await user.click(within(hack()).getByRole('button', { name: 'Concluir série válida 1' }))
    first.unmount()

    renderApp('/treinos/day_a/ativo')
    expect(await screen.findByRole('heading', { name: 'Você tem outro treino em andamento' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Descartar e começar este' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Treino A — Push' })).toBeInTheDocument()
  })
})
