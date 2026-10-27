import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { crc16 } from '@workspace/core'
import { setScenario } from '@workspace/mocks/handlers'
import { server } from '@workspace/mocks/node'
import { renderApp } from '../../../test/render-app'

const plan = () => screen.getByRole('region', { name: 'RENOVAÇÃO DO PLANO' })
const receipt = (name = 'comprovante.png', type = 'image/png') => new File(['pix'], name, { type })

async function openPayment() {
  const utils = renderApp('/perfil/pagamento')
  await screen.findByRole('region', { name: 'RENOVAÇÃO DO PLANO' })
  return utils
}

describe('Pagamento', () => {
  it('mostra a renovação, o QR Code e os dados do Pix', async () => {
    await openPayment()
    expect(plan()).toHaveTextContent('Vence em 55 dias')
    expect(plan()).toHaveTextContent('TrimestralR$ 600,00')
    expect(plan()).toHaveTextContent('Vence em 15/12 · renova até 15/03/2027 · Kaue Oliveira')

    expect(screen.getByRole('img', { name: 'QR Code Pix para pagar R$ 600,00' })).toBeInTheDocument()
    const code = screen.getByRole('status', { name: 'Código Pix copia e cola' }).textContent!
    expect(code).toMatch(/^000201/)
    expect(code).toContain('0513RENATO1512TRI6304')
    expect(code.slice(-4)).toBe(crc16(code.slice(0, -4)))

    const pix = screen.getByRole('region', { name: '1. Pague com Pix' })
    expect(within(pix).getByText('Chave CNPJ').nextElementSibling).toHaveTextContent('12.345.678/0001-90')
    expect(within(pix).getByText('Recebedor').nextElementSibling).toHaveTextContent('KAUE OLIVEIRA')

    const history = screen.getByRole('region', { name: 'Histórico' })
    expect(within(history).getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      'TrimestralPago em 14/09 · PixR$ 600,00Pago',
      'TrimestralPago em 15/06 · PixR$ 600,00Pago',
    ])
  })

  it('copia o código Pix', async () => {
    const user = userEvent.setup()
    await openPayment()
    await user.click(screen.getByRole('button', { name: 'Copiar código Pix' }))
    expect(screen.getByRole('button', { name: 'Código copiado' })).toBeInTheDocument()
    expect(await navigator.clipboard.readText()).toBe(screen.getByRole('status', { name: 'Código Pix copia e cola' }).textContent)
  })

  it('enviar o comprovante mostra o acompanhamento; dá para trocar', async () => {
    const user = userEvent.setup()
    await openPayment()
    const send = screen.getByRole('button', { name: 'Enviar comprovante' })
    expect(send).toBeDisabled()

    await user.upload(screen.getByLabelText('Escolher o comprovante'), receipt())
    expect(screen.getByText('comprovante.png')).toBeInTheDocument()
    await user.click(send)

    const status = await screen.findByRole('region', { name: 'Acompanhe seu pagamento' })
    expect(plan()).toHaveTextContent('Em análise')
    expect(within(status).getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      // o nome do arquivo não sobrevive ao FormData do jsdom no Node (chega "blob"); no navegador chega certo
      expect.stringMatching(/^Comprovante enviado.+ · hoje$/),
      'Em análise pelo KaueNormalmente em até 1 dia útil',
      'Pagamento confirmadoSeu plano é renovado até 15/03/2027 e você recebe uma notificação',
    ])
    expect(screen.queryByRole('region', { name: '1. Pague com Pix' })).not.toBeInTheDocument()

    await user.click(within(status).getByRole('button', { name: 'Trocar comprovante' }))
    await user.upload(screen.getByLabelText('Escolher o comprovante'), receipt('pix-banco.pdf', 'application/pdf'))
    await user.click(screen.getByRole('button', { name: 'Enviar comprovante' }))
    expect(await screen.findByRole('region', { name: 'Acompanhe seu pagamento' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: '1. Pague com Pix' })).not.toBeInTheDocument()
  })

  it('comprovante recusado: mostra o motivo e o Pix de novo', async () => {
    const charge = {
      id: 'chg_2026_12',
      planLabel: 'Trimestral',
      amount: 600,
      dueDate: '2026-12-15',
      renewsUntil: '2027-03-15',
      pix: { key: '12345678000190', keyLabel: 'Chave CNPJ', keyDisplay: '12.345.678/0001-90', receiver: 'KAUE OLIVEIRA', city: 'Novo Hamburgo', txid: 'RENATO1512TRI' },
      proof: { fileName: 'pix.png', sentAt: '2026-10-20T10:00:00.000Z' },
    }
    server.use(
      http.get('/api/me/billing', () =>
        HttpResponse.json({
          coachName: 'Kaue Oliveira',
          charge: { ...charge, status: 'rejected', rejectionReason: 'O valor do comprovante é R$ 60,00.' },
          history: [],
        }),
      ),
    )
    await openPayment()
    expect(plan()).toHaveTextContent('Comprovante recusado')
    expect(within(plan()).getByRole('alert')).toHaveTextContent('Motivo: O valor do comprovante é R$ 60,00.')
    expect(screen.getByRole('region', { name: '1. Pague com Pix' })).toBeInTheDocument()
    expect(screen.getByText('Nenhum pagamento ainda.')).toBeInTheDocument()
  })

  it('Configurações → Assinatura e pagamento abre esta tela', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/perfil/configuracoes')
    await user.click(await screen.findByRole('link', { name: /^Assinatura e pagamento/ }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/perfil/pagamento'), { timeout: 3000 })
    expect(await screen.findByRole('link', { name: 'Voltar para configurações' })).toHaveAttribute('href', '/perfil/configuracoes')
  })

  it('erro ao carregar', async () => {
    setScenario('erro')
    renderApp('/perfil/pagamento')
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar o pagamento')
  })
})
