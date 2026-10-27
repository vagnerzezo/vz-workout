import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { setScenario } from '@workspace/mocks/handlers'
import { renderApp } from '../../../test/render-app'

const region = (name: string) => screen.getByRole('region', { name })
const calendar = () => screen.getByRole('region', { name: 'Calendário de treinos' })

async function openProfile(path = '/perfil') {
  const utils = renderApp(path)
  await screen.findByRole('region', { name: 'Seus dados' })
  return utils
}

describe('Perfil', () => {
  it('mostra os dados, o check-in pendente, o treinador e a meta de peso', async () => {
    await openProfile()
    const me = region('Seus dados')
    expect(within(me).getByRole('heading', { name: 'Renato Alves' })).toBeInTheDocument()
    expect(me).toHaveTextContent('RA')
    expect(me).toHaveTextContent('Hipertrofia · Intermediário · 33 anos')
    expect(within(me).getByText('de sequência').nextElementSibling).toHaveTextContent('3 dias')
    expect(within(me).getByText('na consultoria').nextElementSibling).toHaveTextContent('4 meses')
    expect(within(me).getByText('treinos feitos').nextElementSibling).toHaveTextContent(/^\d+$/)

    const checkIn = region('Check-in quinzenal')
    expect(checkIn).toHaveTextContent('Vence em 2 dias')
    expect(checkIn).toHaveTextContent('Envie 3 fotos e responda 6 perguntas para o Kaue ajustar o próximo bloco.')
    expect(within(checkIn).getByRole('link', { name: 'Fazer check-in' })).toHaveAttribute('href', '/perfil/check-in')

    expect(region('Seu treinador')).toHaveTextContent('Kaue OliveiraSeu treinador · plano trimestral até 15/12')
    expect(screen.getByRole('link', { name: 'Conversar com o treinador' })).toHaveAttribute('href', '/chat')

    const weight = region('Objetivo de peso')
    expect(weight).toHaveTextContent('Atual82,4 kg')
    expect(weight).toHaveTextContent('Meta76 kg')
    expect(weight).toHaveTextContent('Início 85,0 kg · 01/08')
    expect(weight).toHaveTextContent('−2,6 kg de 9 kg')
    expect(within(weight).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '29')

    expect(screen.getByRole('link', { name: 'Configurações' })).toHaveAttribute('href', '/perfil/configuracoes')
    expect(screen.getByRole('link', { name: 'Histórico de treinos' })).toHaveAttribute('href', '/treinos/historico')
    expect(screen.getByRole('link', { name: 'Perfil' })).toHaveAttribute('aria-current', 'page')
  })

  it('registrar uma pesagem atualiza a meta', async () => {
    const user = userEvent.setup()
    await openProfile()
    await user.click(within(region('Objetivo de peso')).getByRole('button', { name: 'Pesagem' }))
    const dialog = await screen.findByRole('dialog', { name: 'Registrar peso' })
    await user.click(within(dialog).getByRole('button', { name: /Diminuir/ }))
    await user.click(within(dialog).getByRole('button', { name: /Diminuir/ }))
    await user.click(within(dialog).getByRole('button', { name: 'Salvar peso' }))

    await waitFor(() => expect(region('Objetivo de peso')).toHaveTextContent('Atual82,2 kg'))
    expect(region('Objetivo de peso')).toHaveTextContent('−2,8 kg de 9 kg')
  })

  it('calendário: dias treinados abrem o histórico e dá para trocar de mês', async () => {
    const user = userEvent.setup()
    const { router } = await openProfile()
    await waitFor(() => expect(calendar()).toHaveTextContent(/\d+ treinos em outubro/))
    expect(within(calendar()).getByRole('button', { name: 'Próximo mês' })).toBeDisabled()
    expect(within(calendar()).getByText('21')).toHaveClass('border-primary') // hoje

    await user.click(within(calendar()).getByRole('button', { name: 'Mês anterior' }))
    expect(router.state.location.search).toBe('?mes=2026-09')
    await waitFor(() => expect(calendar()).toHaveTextContent(/\d+ treinos em setembro/))
    expect(within(calendar()).getByRole('button', { name: 'Próximo mês' })).toBeEnabled()

    const trainedDay = within(calendar()).getAllByRole('link')[0]!
    expect(trainedDay).toHaveAccessibleName(/^\d+ de setembro: treinou$/)
    await user.click(trainedDay)
    await waitFor(() => expect(router.state.location.pathname).toBe('/treinos/historico'), { timeout: 3000 })
    expect(router.state.location.search).toMatch(/^\?dia=2026-09-\d{2}$/)
  })

  it('aluno novo: sem check-in, sem treinos e sem peso registrado', async () => {
    setScenario('novo')
    await openProfile()
    expect(within(region('Seus dados')).getByText('treinos feitos').nextElementSibling).toHaveTextContent('0')
    expect(within(region('Seus dados')).getByText('na consultoria').nextElementSibling).toHaveTextContent('menos de 1 mês')
    expect(screen.queryByRole('region', { name: 'Check-in quinzenal' })).not.toBeInTheDocument()
    expect(region('Objetivo de peso')).toHaveTextContent('Registre seu peso')
    await waitFor(() => expect(calendar()).toHaveTextContent('Nenhum treino em outubro'))
  })

  it('erro ao carregar', async () => {
    setScenario('erro')
    renderApp('/perfil')
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar seu perfil')
  })
})
