import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { setScenario } from '@workspace/mocks/handlers'
import { renderApp } from '../../../test/render-app'

const water = () => screen.getByRole('region', { name: 'Água' })

describe('Home do aluno', () => {
  it('mostra esqueleto e depois os dados do aluno', async () => {
    renderApp('/')
    expect(await screen.findByLabelText('Carregando o início')).toBeInTheDocument()

    expect(await screen.findByRole('heading', { level: 1, name: /, Renato$/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Treino C — Legs' })).toBeInTheDocument()
    expect(screen.getByText('6 exercícios · ~55 min · Quadríceps, posterior, glúteos')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '1.240 de 2.127 kcal consumidas' })).toBeInTheDocument()
    // vem da dieta do dia: café, lanche e almoço feitos (1.240 kcal, como no canvas)
    expect(screen.getByRole('link', { name: 'Próxima refeição: Pré-treino às 16:00' })).toHaveAttribute('href', '/dieta/refeicoes/pre')
    expect(screen.getByRole('link', { name: 'Notificações, 3 novas' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Começar treino' })).toHaveAttribute('href', '/treinos/day_c/ativo')
    expect(screen.getByRole('link', { name: 'Início' })).toHaveAttribute('aria-current', 'page')
  })

  it('marca hoje como selecionado na faixa da semana e permite escolher outro dia', async () => {
    const user = userEvent.setup()
    renderApp('/')
    const week = await screen.findByRole('navigation', { name: 'Dias da semana' })
    const days = within(week).getAllByRole('button')
    expect(days).toHaveLength(7)
    const today = within(week).getByRole('button', { name: /hoje/ })
    expect(today).toHaveAttribute('aria-pressed', 'true')

    const other = days.find((d) => d !== today)!
    await user.click(other)
    expect(other).toHaveAttribute('aria-pressed', 'true')
    expect(today).toHaveAttribute('aria-pressed', 'false')
  })

  it('registra água e desfaz o último registro', async () => {
    const user = userEvent.setup()
    renderApp('/')
    await screen.findByRole('region', { name: 'Água' })
    expect(within(water()).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1250')

    await user.click(within(water()).getByRole('button', { name: '+250 ml' }))
    await waitFor(() => expect(within(water()).getByText('1,5 L')).toBeInTheDocument())

    await user.click(within(water()).getByRole('button', { name: '+500 ml' }))
    await waitFor(() => expect(within(water()).getByText('2 L')).toBeInTheDocument())

    const undo = within(water()).getByRole('button', { name: 'Desfazer último registro de 500 ml' })
    await waitFor(() => expect(undo).toBeEnabled())
    await user.click(undo)
    await waitFor(() => expect(within(water()).getByText('1,5 L')).toBeInTheDocument())
  })

  it('troca a métrica de atividade e guarda a aba na URL', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/')
    const activity = await screen.findByRole('region', { name: 'Atividade' })
    expect(within(activity).getByText('1h 35min')).toBeInTheDocument()

    await user.click(within(activity).getByRole('button', { name: 'Volume' }))
    expect(within(activity).getByText('4.100 kg')).toBeInTheDocument()
    expect(within(activity).getByText('de volume nesta semana · média de 9.400 kg')).toBeInTheDocument()
    expect(router.state.location.search).toBe('?atividade=volume')
  })

  it('abre já na aba da URL', async () => {
    renderApp('/?atividade=repeticoes')
    const activity = await screen.findByRole('region', { name: 'Atividade' })
    expect(within(activity).getByRole('button', { name: 'Repetições' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(activity).getByText('250 reps')).toBeInTheDocument()
  })

  it('mostra o dia de descanso quando não há treino', async () => {
    setScenario('descanso')
    renderApp('/')
    expect(await screen.findByRole('heading', { name: 'Hoje não tem treino' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Começar treino' })).not.toBeInTheDocument()
  })

  it('aluno novo: sem sequência e sem atividade', async () => {
    setScenario('novo')
    renderApp('/')
    expect(await screen.findByText('Seus números aparecem aqui depois do primeiro treino.')).toBeInTheDocument()
    expect(screen.queryByText(/dias? seguidos?/)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Notificações' })).toBeInTheDocument()
  })

  it('mostra erro com "Tentar de novo" e recupera', async () => {
    const user = userEvent.setup()
    setScenario('erro')
    renderApp('/')
    const retry = await screen.findByRole('button', { name: 'Tentar de novo' })

    setScenario(null)
    await user.click(retry)
    expect(await screen.findByRole('heading', { name: 'Treino C — Legs' })).toBeInTheDocument()
  })

  it('registra o peso pelo painel inferior', async () => {
    const user = userEvent.setup()
    renderApp('/')
    await user.click(await screen.findByRole('button', { name: 'Registrar peso' }))

    const dialog = await screen.findByRole('dialog', { name: 'Registrar peso' })
    expect(within(dialog).getByText('Último registro: 82,4 kg')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Diminuir peso em quilos' }))
    expect(within(dialog).getByText('82,3 kg')).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Salvar peso' }))
    expect(await screen.findByText('Peso registrado: 82,3 kg')).toBeInTheDocument()
  })

  it('treino concluído em outro dia aparece na data em que foi feito', async () => {
    // Treino D é de sexta, mas o Renato fez na quarta (hoje, no relógio dos testes)
    const now = new Date().toISOString()
    await fetch(new URL('/api/me/sessions/s1/finish', location.origin), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dayId: 'day_d', startedAt: now, finishedAt: now, sets: [], effort: null, comment: null }),
    })
    renderApp('/')
    const week = await screen.findByRole('navigation', { name: 'Dias da semana' })
    expect(within(week).getByRole('button', { name: 'quarta-feira, 21, hoje, treino feito' })).toBeInTheDocument()
    expect(within(week).getByRole('button', { name: 'sexta-feira, 23' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Treinos da semana' })).toHaveTextContent('3 de 5')
  })
})
