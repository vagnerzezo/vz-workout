import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../test/render-app'

describe('Casca do painel', () => {
  it('sidebar: seções do canvas, contadores e a seção atual marcada', async () => {
    renderApp('/alunos/stu_ana')
    const nav = await screen.findByRole('navigation', { name: 'Seções' })
    expect(within(nav).getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual([
      '/', '/alunos', '/fichas', '/dietas', '/biblioteca', '/check-ins', '/chat', '/notificacoes', '/financeiro', '/configuracoes',
    ])
    expect(within(nav).getByRole('link', { name: /Alunos/ })).toHaveAttribute('aria-current', 'page')
    await waitFor(() => expect(within(nav).getByRole('link', { name: /Check-ins/ })).toHaveTextContent('6'))
    expect(within(nav).getByRole('link', { name: /Chat/ })).toHaveTextContent('4')
    expect(await screen.findByText('Plano Pro · 52 de 80 alunos')).toBeInTheDocument()
    expect(screen.getByText('Kaue Oliveira')).toBeInTheDocument()
  })

  it('barra inferior: Início, Alunos, Check-ins, Chat e Mais', async () => {
    renderApp('/')
    const bar = await screen.findByRole('navigation', { name: 'Navegação principal' })
    expect(await within(bar).findByRole('link', { name: 'Check-ins, 6 novos' })).toHaveAttribute('href', '/check-ins')
    expect(within(bar).getByRole('link', { name: 'Chat, 4 novos' })).toHaveAttribute('href', '/chat')
    expect(within(bar).getByRole('link', { name: 'Início' })).toHaveAttribute('aria-current', 'page')
    expect(within(bar).getByRole('button', { name: 'Mais' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('"Mais" abre as outras seções e navega', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/')
    const bar = await screen.findByRole('navigation', { name: 'Navegação principal' })
    await user.click(within(bar).getByRole('button', { name: 'Mais' }))

    const more = await screen.findByRole('navigation', { name: 'Mais seções' })
    expect(within(more).getAllByRole('link').map((a) => a.textContent)).toEqual([
      'Fichas de treino', 'Fichas de dieta', 'Biblioteca', 'Notificações', 'Financeiro4', 'Configurações',
    ])
    await user.click(within(more).getByRole('link', { name: /Financeiro/ }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/financeiro'))
    expect(await screen.findByRole('heading', { name: 'Financeiro' }, { timeout: 3000 })).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('navigation', { name: 'Mais seções' })).not.toBeInTheDocument())
    expect(within(bar).getByRole('button', { name: 'Mais' })).toHaveAttribute('aria-expanded', 'true') // seção do "Mais" ativa
  })
})
