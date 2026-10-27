import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { setScenario } from '@workspace/mocks/handlers'
import { renderApp } from '../../../test/render-app'

const tile = (label: string) => screen.getByText(label, { selector: 'dt' }).parentElement!
const calendar = () => screen.getByRole('region', { name: /2026$/ })
const list = () => screen.getByRole('region', { name: 'Treinos feitos' })

async function openHistory(path = '/treinos/historico') {
  const utils = renderApp(path)
  await screen.findByRole('region', { name: 'Treinos feitos' })
  return utils
}

describe('Histórico de treinos', () => {
  it('mostra os números do mês e o calendário', async () => {
    await openHistory()
    expect(tile('Treinos no mês')).toHaveTextContent('14')
    expect(tile('Treinos no mês')).toHaveTextContent('meta 5 por semana')
    expect(tile('Tempo treinando')).toHaveTextContent(/média de \d+ min/)
    expect(tile('Volume levantado')).toHaveTextContent(/[+−]\d+% vs setembro/)
    expect(tile('Recordes')).toHaveTextContent(/último em \d\d\/10/)

    expect(within(calendar()).getByRole('heading', { name: 'Outubro 2026' })).toBeInTheDocument()
    expect(within(calendar()).getByRole('button', { name: 'Próximo mês' })).toBeDisabled()
    expect(within(calendar()).getByText('Esta semana: 2 de 5 treinos')).toBeInTheDocument()
    // só dias com treino são botões
    expect(within(calendar()).getAllByRole('button', { pressed: false })).toHaveLength(14)
    expect(within(calendar()).getByRole('button', { name: '20 de outubro, Treino B — Pull' })).toBeInTheDocument()
    expect(within(list()).getAllByRole('article')).toHaveLength(14)
  })

  it('tocar num dia do calendário abre o treino e guarda na URL', async () => {
    const user = userEvent.setup()
    const { router } = await openHistory()
    await user.click(within(calendar()).getByRole('button', { name: '20 de outubro, Treino B — Pull' }))

    expect(router.state.location.search).toBe('?dia=2026-10-20&mes=2026-10')
    const pull = within(list()).getAllByRole('article', { name: 'Treino B — Pull' })[0]!
    expect(within(pull).getByRole('button', { expanded: true })).toBeInTheDocument()
    const rows = within(pull).getAllByRole('row').slice(1)
    expect(rows).toHaveLength(5)
    expect(rows[0]).toHaveTextContent('Puxada alta60 kg × 10= mesma carga')
  })

  it('abre direto pelo link ?dia= com a anotação do aluno', async () => {
    await openHistory('/treinos/historico?dia=2026-10-19')
    const push = within(list()).getAllByRole('article', { name: 'Treino A — Push' })[0]!
    expect(within(push).getByRole('button', { expanded: true })).toBeInTheDocument()
    expect(within(push).getByText('Sua anotação: Senti o ombro tranquilo hoje. Subi o supino inclinado.')).toBeInTheDocument()
  })

  it('semana com carga nova mostra recordes e a diferença', async () => {
    await openHistory('/treinos/historico?dia=2026-10-12')
    const push = within(list()).getAllByRole('article', { name: 'Treino A — Push' })[1]!
    expect(within(push).getByText('recorde').parentElement).toHaveTextContent('1recorde')
    const rows = within(push).getAllByRole('row').slice(1)
    expect(rows[0]).toHaveTextContent('Supino inclinado (máquina)60 kg × 10= mesma carga')
    expect(rows[4]).toHaveTextContent('Elevação lateralPR10 kg × 15+2,5 kg')
  })

  it('filtra por treino', async () => {
    const user = userEvent.setup()
    await openHistory()
    await user.click(screen.getByRole('button', { name: 'C · Legs' }))
    expect(screen.getByRole('button', { name: 'C · Legs' })).toHaveAttribute('aria-pressed', 'true')
    const cards = within(list()).getAllByRole('article')
    expect(cards).toHaveLength(2)
    expect(cards.every((c) => c.getAttribute('aria-label') === 'Treino C — Legs')).toBe(true)
  })

  it('volta um mês e pode avançar de novo', async () => {
    const user = userEvent.setup()
    const { router } = await openHistory()
    await user.click(within(calendar()).getByRole('button', { name: 'Mês anterior' }))
    expect(await screen.findByRole('heading', { name: 'Setembro 2026' })).toBeInTheDocument()
    expect(router.state.location.search).toBe('?mes=2026-09')
    await waitFor(() => expect(within(list()).getAllByRole('article')[0]).toHaveTextContent('30'))
    expect(within(calendar()).getByRole('button', { name: 'Próximo mês' })).toBeEnabled()
  })

  it('aluno novo vê o mês vazio, sem poder voltar', async () => {
    setScenario('novo')
    await openHistory()
    expect(within(list()).getByText('Nenhum treino registrado neste mês.')).toBeInTheDocument()
    expect(within(calendar()).getByRole('button', { name: 'Mês anterior' })).toBeDisabled()
    expect(tile('Volume levantado')).toHaveTextContent('primeiro mês com treinos')
  })

  it('mostra erro com "Tentar de novo" e recupera', async () => {
    const user = userEvent.setup()
    setScenario('erro')
    renderApp('/treinos/historico')
    const retry = await screen.findByRole('button', { name: 'Tentar de novo' })
    setScenario(null)
    await user.click(retry)
    expect(await screen.findByRole('region', { name: 'Treinos feitos' })).toBeInTheDocument()
  })

  it('treino salvo no app aparece no histórico do dia', async () => {
    const start = new Date(Date.now() - 50 * 60_000).toISOString()
    const end = new Date().toISOString()
    await fetch(new URL('/api/me/sessions/s1/finish', location.origin), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dayId: 'day_c',
        startedAt: start,
        finishedAt: end,
        effort: 8,
        comment: 'Senti o joelho',
        sets: [{ key: 'day_c_1:v1', prescribedId: 'day_c_1', kind: 'working', kg: 85, reps: 8, doneAt: end }],
      }),
    })
    await openHistory('/treinos/historico?dia=2026-10-21')
    expect(tile('Treinos no mês')).toHaveTextContent('15')
    const legs = within(list()).getAllByRole('article', { name: 'Treino C — Legs' })[0]!
    expect(within(legs).getByText('50 min · 0,7 t · 1 exercícios')).toBeInTheDocument()
    expect(within(legs).getAllByRole('row')[1]).toHaveTextContent('Agachamento hack (máquina)PR85 kg × 8+5 kg')
    expect(within(legs).getByText('Sua anotação: Senti o joelho')).toBeInTheDocument()
  })
})
