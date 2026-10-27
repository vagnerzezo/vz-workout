import { screen, waitFor, within } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { setScenario } from '@workspace/mocks/handlers'
import { renderApp } from '../../../test/render-app'
import { useCheckInDraft } from '../store/check-in-draft'

const photo = (name: string) => new File(['foto'], name, { type: 'image/jpeg' })
const filled = () => screen.getByRole('progressbar', { name: 'Itens preenchidos' })

async function openCheckIn() {
  const utils = renderApp('/perfil/check-in')
  await screen.findByRole('heading', { level: 1, name: 'Check-in quinzenal' })
  return utils
}

async function fillAll(user: UserEvent) {
  await user.upload(screen.getByLabelText('Adicionar foto de frente'), photo('frente.jpg'))
  await user.upload(screen.getByLabelText('Adicionar foto de lado'), photo('lado.jpg'))
  await user.upload(screen.getByLabelText('Adicionar foto de costas'), photo('costas.jpg'))
  for (const q of ['Energia no dia a dia', 'Qualidade do sono', 'Controle da fome', 'Aderência ao treino', 'Aderência à dieta']) {
    await user.click(within(screen.getByRole('group', { name: q })).getByRole('radio', { name: '4, Bom' }))
  }
}

beforeEach(() => useCheckInDraft.getState().reset())

describe('Check-in', () => {
  it('mostra prazo, fotos, peso de partida e as perguntas do treinador', async () => {
    await openCheckIn()
    expect(screen.getByText('Prazo 23/10 · leva uns 3 minutos')).toBeInTheDocument()
    expect(filled()).toHaveAttribute('aria-valuenow', '1') // o peso já vem do último registro
    expect(screen.getByText('1 de 10')).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'peso em quilos' })).toHaveTextContent('82,4 kg')
    expect(screen.getAllByRole('group', { name: /Energia|sono|fome|Aderência/ })).toHaveLength(5)
    expect(screen.getByRole('link', { name: 'Voltar ao perfil' })).toHaveAttribute('href', '/perfil')
  })

  it('enviar incompleto diz o que falta', async () => {
    const user = userEvent.setup()
    await openCheckIn()
    await user.upload(screen.getByLabelText('Adicionar foto de frente'), photo('frente.jpg'))
    expect(screen.getByLabelText('Trocar foto de frente')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Enviar check-in' }))

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Falta preencher: foto de lado, foto de costas, Energia no dia a dia, Qualidade do sono, Controle da fome, Aderência ao treino, Aderência à dieta e dor ou desconforto.',
    )
  })

  it('com dor, pede onde doeu', async () => {
    const user = userEvent.setup()
    await openCheckIn()
    await fillAll(user)
    await user.click(within(screen.getByRole('group', { name: 'Sentiu dor ou desconforto?' })).getByRole('radio', { name: 'Sim' }))
    expect(screen.getByText('9 de 10')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Enviar check-in' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Falta preencher: onde doeu.')

    await user.type(screen.getByLabelText('Onde e em qual exercício?'), 'Joelho direito no hack')
    expect(screen.getByText('10 de 10')).toBeInTheDocument()
  })

  it('enviar completo: volta ao perfil sem o cartão, e o peso e as fotos entram no progresso', async () => {
    const user = userEvent.setup()
    const { router } = await openCheckIn()
    await fillAll(user)
    await user.click(screen.getByRole('button', { name: 'Diminuir peso em quilos' }))
    await user.click(within(screen.getByRole('group', { name: 'Sentiu dor ou desconforto?' })).getByRole('radio', { name: 'Não' }))
    await user.type(screen.getByLabelText('5. Algo mais para o treinador?'), 'Semana boa.')
    await user.click(screen.getByRole('button', { name: 'Enviar check-in' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/perfil'), { timeout: 3000 })
    expect(await screen.findByText('Check-in enviado ao Carlos')).toBeInTheDocument()
    await screen.findByRole('region', { name: 'Seus dados' })
    expect(screen.queryByRole('region', { name: 'Check-in quinzenal' })).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Objetivo de peso' })).toHaveTextContent('Atual82,3 kg')
    expect(useCheckInDraft.getState().checkInId).toBeNull()

    await router.navigate('/perfil/progresso#fotos')
    const fotos = await screen.findByRole('region', { name: 'Fotos de evolução' })
    expect(within(fotos).getByText('Agora · 21/10')).toBeInTheDocument()

    await router.navigate('/perfil/check-in')
    expect(await screen.findByRole('heading', { name: 'Nenhum check-in pendente' })).toBeInTheDocument()
  })

  it('as respostas ficam guardadas ao sair e voltar', async () => {
    const user = userEvent.setup()
    const { router } = await openCheckIn()
    await user.click(within(screen.getByRole('group', { name: 'Qualidade do sono' })).getByRole('radio', { name: '2, Ruim' }))
    await user.type(screen.getByLabelText('5. Algo mais para o treinador?'), 'Dormi mal')

    await router.navigate('/perfil')
    await router.navigate('/perfil/check-in')
    await screen.findByRole('heading', { level: 1, name: 'Check-in quinzenal' })
    expect(within(screen.getByRole('group', { name: 'Qualidade do sono' })).getByRole('radio', { name: '2, Ruim' })).toBeChecked()
    expect(screen.getByLabelText('5. Algo mais para o treinador?')).toHaveValue('Dormi mal')
  })

  it('o cartão do Perfil abre o check-in', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/perfil')
    await user.click(await screen.findByRole('link', { name: 'Fazer check-in' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/perfil/check-in'), { timeout: 3000 })
    expect(await screen.findByRole('heading', { level: 1, name: 'Check-in quinzenal' })).toBeInTheDocument()
  })

  it('aluno novo: nenhum check-in pendente', async () => {
    setScenario('novo')
    renderApp('/perfil/check-in')
    expect(await screen.findByRole('heading', { name: 'Nenhum check-in pendente' })).toBeInTheDocument()
  })
})
