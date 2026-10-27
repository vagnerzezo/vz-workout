import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { setScenario } from '@workspace/mocks/handlers'
import { renderApp } from '../../../test/render-app'

const card = (name: string) => screen.getByRole('article', { name })

describe('Lista de treinos', () => {
  it('mostra a ficha atual e os 5 treinos, como no canvas', async () => {
    renderApp('/treinos')
    expect(await screen.findByLabelText('Carregando seus treinos')).toBeInTheDocument()

    const plan = await screen.findByRole('region', { name: 'Hipertrofia — Bloco 2' })
    expect(within(plan).getByText('Atualizada em 14/10 · válida até 15/12')).toBeInTheDocument()
    expect(within(plan).getByText('Semana 2 de 8')).toBeInTheDocument()

    expect(screen.getByRole('heading', { name: 'Treinos da ficha (5)' })).toBeInTheDocument()
    expect(screen.getByText('2 de 5 feitos na semana')).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(5)

    const metas = [
      ['Treino A — Push', 'Segunda · 6 exercícios · ~50 min'],
      ['Treino B — Pull', 'Terça · 5 exercícios · ~45 min'],
      ['Treino C — Legs', 'Quarta · 6 exercícios · ~55 min'],
      ['Treino D — Upper', 'Sexta · 7 exercícios · ~60 min'],
      ['Treino E — Lower', 'Sábado · 5 exercícios · ~45 min'],
    ]
    for (const [name, meta] of metas) {
      expect(within(card(name!)).getByText(meta!)).toBeInTheDocument()
    }
    expect(screen.getByRole('link', { name: 'Treino' })).toHaveAttribute('aria-current', 'page')
  })

  it('marca o treino de hoje e os já feitos na semana', async () => {
    renderApp('/treinos')
    const legs = await screen.findByRole('article', { name: 'Treino C — Legs' })
    expect(within(legs).getByText('HOJE')).toBeInTheDocument()
    expect(within(legs).getByRole('link', { name: 'Começar Treino C — Legs' })).toHaveAttribute('href', '/treinos/day_c/ativo')
    expect(within(legs).getByText('Agachamento hack (máquina), Mesa flexora, Cadeira extensora, Cadeira adutora, Stiff, Panturrilha sentado')).toBeInTheDocument()
    expect(within(within(legs).getByRole('list', { name: 'Músculos trabalhados' })).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Quadríceps', 'Posterior', 'Glúteos'])

    expect(within(card('Treino A — Push')).getByText('FEITO')).toBeInTheDocument()
    expect(within(card('Treino B — Pull')).getByText('FEITO')).toBeInTheDocument()
    expect(within(card('Treino D — Upper')).queryByText(/FEITO|HOJE/)).not.toBeInTheDocument()
  })

  it('abre e fecha as orientações do treinador', async () => {
    const user = userEvent.setup()
    renderApp('/treinos')
    const toggle = await screen.findByRole('button', { name: 'Orientações do treinador' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText(/repetições em reserva/)).not.toBeInTheDocument()

    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(/repetições em reserva/)).toBeVisible()
  })

  it('no domingo não marca nenhum treino como hoje', async () => {
    vi.setSystemTime(new Date(2026, 9, 25, 10, 0))
    renderApp('/treinos')
    await screen.findByRole('article', { name: 'Treino C — Legs' })
    expect(screen.queryByText('HOJE')).not.toBeInTheDocument()
    expect(screen.getByText('5 de 5 feitos na semana')).toBeInTheDocument()
  })

  it('aluno sem ficha vê o aviso', async () => {
    setScenario('sem-ficha')
    renderApp('/treinos')
    expect(await screen.findByRole('heading', { name: 'Sua ficha ainda não chegou' })).toBeInTheDocument()
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
  })

  it('mostra erro com "Tentar de novo" e recupera', async () => {
    const user = userEvent.setup()
    setScenario('erro')
    renderApp('/treinos')
    const retry = await screen.findByRole('button', { name: 'Tentar de novo' })
    setScenario(null)
    await user.click(retry)
    expect(await screen.findByRole('article', { name: 'Treino C — Legs' })).toBeInTheDocument()
  })

  it('o atalho do histórico aponta para o histórico', async () => {
    renderApp('/treinos')
    expect(await screen.findByRole('link', { name: 'Histórico de treinos' })).toHaveAttribute('href', '/treinos/historico')
  })
})
