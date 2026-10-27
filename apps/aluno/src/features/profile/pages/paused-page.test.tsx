import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { setScenario } from '@workspace/mocks/handlers'
import { renderApp } from '../../../test/render-app'

describe('Acesso pausado', () => {
  it('com a cobrança vencida, qualquer tela leva para o acesso pausado', async () => {
    setScenario('pausado')
    const { router } = renderApp('/treinos')
    expect(await screen.findByRole('heading', { level: 1, name: 'Seu acesso está pausado' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/acesso-pausado')
    expect(screen.getByText('O plano trimestral venceu em 15/10. Assim que o pagamento cair, seus treinos voltam na hora.')).toBeInTheDocument()

    const pay = screen.getByRole('region', { name: 'Pagamento' })
    expect(pay).toHaveTextContent('Plano TrimestralR$ 600,00')
    expect(within(pay).getByRole('img', { name: 'QR Code Pix de R$ 600,00 para Kaue Oliveira' })).toBeInTheDocument()
    expect(pay).toHaveTextContent('Recebedor: KAUE OLIVEIRA · CNPJ 12.345.678/0001-90')
    expect(screen.getByRole('link', { name: 'Falar com o Kaue' })).toHaveAttribute('href', '/chat')
    expect(screen.queryByRole('navigation', { name: /Navegação/ })).not.toBeInTheDocument()
  })

  it('chat e progresso continuam abertos', async () => {
    setScenario('pausado')
    const user = userEvent.setup()
    const { router } = renderApp('/acesso-pausado')
    await user.click(await screen.findByRole('link', { name: /Seu progresso e histórico/ }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/perfil/progresso'), { timeout: 3000 })
    expect(await screen.findByRole('heading', { level: 1, name: 'Progresso' })).toBeInTheDocument()

    await router.navigate('/chat')
    await waitFor(() => expect(router.state.location.pathname).toBe('/chat'))
  })

  it('enviar o comprovante mostra que o treinador vai conferir', async () => {
    setScenario('pausado')
    const user = userEvent.setup()
    renderApp('/acesso-pausado')
    await user.upload(await screen.findByLabelText('Já paguei · enviar comprovante'), new File(['pix'], 'pix.png', { type: 'image/png' }))

    const sent = await screen.findByRole('region', { name: 'Comprovante enviado' })
    expect(sent).toHaveTextContent('O Kaue confere e libera seu acesso. Costuma levar menos de 2 horas em dias úteis.')
    expect(screen.queryByLabelText('Já paguei · enviar comprovante')).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Pagamento' })).toBeInTheDocument() // o Pix continua à mão
  })

  it('com o acesso ativo, a página manda para o início', async () => {
    const { router } = renderApp('/acesso-pausado')
    await waitFor(() => expect(router.state.location.pathname).toBe('/'), { timeout: 3000 })
  })
})
