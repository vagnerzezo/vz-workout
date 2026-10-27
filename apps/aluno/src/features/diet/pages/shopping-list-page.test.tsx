import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { setScenario } from '@workspace/mocks/handlers'
import { renderApp } from '../../../test/render-app'

const group = (name: string) => screen.getByRole('region', { name })
const row = (name: string) => screen.getByRole('checkbox', { name: new RegExp(name) })

async function openList(path = '/dieta/lista-de-compras') {
  const utils = renderApp(path)
  await screen.findByRole('progressbar', { name: 'Itens comprados' })
  return utils
}

describe('Lista de compras', () => {
  it('soma a ficha de dia de treino por seção do mercado', async () => {
    await openList()
    expect(screen.getByText('Gerada do plano “Dia de treino” · quantidades somadas')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '1 semana' })).toBeChecked()
    expect(screen.getByText('3 de 21')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '3')

    expect(within(screen.getByRole('main')).getAllByRole('region').map((r) => r.getAttribute('aria-label'))).toEqual([
      'Hortifrúti',
      'Carnes e ovos',
      'Grãos e cereais',
      'Laticínios',
      'Outros',
    ])
    expect(group('Hortifrúti')).toHaveTextContent('1 de 5')
    expect(row('Banana prata')).toBeChecked()
    expect(row('Banana prata').closest('label')).toHaveTextContent('7 un.')
    expect(row('Batata-doce').closest('label')).toHaveTextContent('1,1 kg')
    expect(row('Alface').closest('label')).toHaveTextContent('2 un.')
    expect(row('Ovos').closest('label')).toHaveTextContent('14 un.')
    expect(row('Azeite de oliva').closest('label')).toHaveTextContent('100 ml')
  })

  it('duas semanas dobram as quantidades e ficam na URL', async () => {
    const user = userEvent.setup()
    const { router } = await openList()
    await user.click(screen.getByRole('radio', { name: '2 semanas' }))

    expect(router.state.location.search).toBe('?semanas=2')
    expect(row('Banana prata').closest('label')).toHaveTextContent('14 un.')
    expect(row('Batata-doce').closest('label')).toHaveTextContent('2,1 kg')
    expect(screen.getByText('3 de 21')).toBeInTheDocument() // o que já foi comprado continua marcado
  })

  it('marcar um item conta no progresso e continua marcado ao voltar', async () => {
    const user = userEvent.setup()
    const { router } = await openList()
    await user.click(row('Tomate'))

    expect(row('Tomate')).toBeChecked()
    expect(screen.getByText('4 de 21')).toBeInTheDocument()
    expect(group('Hortifrúti')).toHaveTextContent('2 de 5')

    await user.click(row('Banana prata'))
    expect(row('Banana prata')).not.toBeChecked()

    await router.navigate('/dieta')
    await router.navigate('/dieta/lista-de-compras')
    await waitFor(() => expect(row('Tomate')).toBeChecked())
    expect(row('Banana prata')).not.toBeChecked()
  })

  it('adiciona e remove item fora do plano', async () => {
    const user = userEvent.setup()
    await openList()
    await user.click(screen.getByRole('button', { name: 'Adicionar item fora do plano' }))
    const dialog = await screen.findByRole('dialog', { name: 'Item fora do plano' })
    await user.type(within(dialog).getByLabelText('Item'), 'Café em pó')
    await user.type(within(dialog).getByLabelText(/Quantidade/), '1 pacote')
    await user.click(within(dialog).getByRole('button', { name: 'Adicionar à lista' }))

    expect(await screen.findByRole('region', { name: 'Fora do plano' })).toHaveTextContent('Café em pó1 pacote')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByText('3 de 22')).toBeInTheDocument()

    await user.click(row('Café em pó'))
    expect(screen.getByText('4 de 22')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Remover Café em pó' }))
    await waitFor(() => expect(screen.queryByRole('region', { name: 'Fora do plano' })).not.toBeInTheDocument())
    expect(screen.getByText('3 de 21')).toBeInTheDocument()
  })

  it('o carrinho da Dieta abre a lista', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/dieta')
    await user.click(await screen.findByRole('link', { name: 'Lista de compras' }))
    expect(router.state.location.pathname).toBe('/dieta/lista-de-compras')
    expect(await screen.findByRole('heading', { name: 'Lista de compras' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar para a dieta' })).toHaveAttribute('href', '/dieta')
  })

  it('sem dieta: explica que a lista vem do plano', async () => {
    setScenario('sem-ficha')
    renderApp('/dieta/lista-de-compras')
    expect(await screen.findByRole('heading', { name: 'Sua lista ainda está vazia' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Adicionar item fora do plano' })).not.toBeInTheDocument()
  })

  it('erro ao carregar', async () => {
    setScenario('erro')
    renderApp('/dieta/lista-de-compras')
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar a lista')
  })
})
