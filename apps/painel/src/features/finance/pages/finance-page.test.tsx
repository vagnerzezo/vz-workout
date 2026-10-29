import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { renderApp } from '../../../test/render-app'

// Relógio fixo: quarta, 21/10/2026, 20h. O setup responde "não" ao matchMedia: abre a versão do celular.

const fetchJson = async (url: string) => (await fetch(url)).json()

describe('Financeiro (celular)', () => {
  it('resumo do mês, filtros e conferir em sequência', async () => {
    const user = userEvent.setup()
    renderApp('/financeiro')
    const summary = await screen.findByRole('region', { name: 'Resumo do mês' }, { timeout: 3000 })
    expect(summary).toHaveTextContent('Recebido no mês')
    expect(summary).toHaveTextContent('R$ 2.140,00')
    expect(summary).toHaveTextContent('Conferir4R$ 1.290,00')
    expect(summary).toHaveTextContent('Em atraso2R$ 460,00')
    expect(screen.getByRole('link', { name: /Conferir 4 comprovantes/ })).toHaveAttribute('href', '/financeiro/comprovantes/chg_julia')

    const rows = within(screen.getByRole('list', { name: 'Cobranças' })).getAllByRole('listitem')
    expect(rows[0]).toHaveTextContent('Júlia Castro')
    expect(rows[0]).toHaveTextContent('A conferir')
    await user.click(within(screen.getByRole('tablist', { name: 'Status do pagamento' })).getByRole('tab', { name: /Em atraso/ }))
    const late = within(screen.getByRole('list', { name: 'Cobranças' })).getAllByRole('listitem')
    expect(late.map((r) => r.querySelector('.truncate.text-sm')?.textContent)).toEqual(['Marcos Lima', 'Letícia Moura'])
    expect(late[0]).toHaveTextContent('10 dias de atraso')
  })

  it('conferir: confirma um, recusa outro com motivo sugerido e termina', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/financeiro/comprovantes/chg_julia')
    expect(await screen.findByText('Júlia Castro', {}, { timeout: 3000 })).toBeInTheDocument()
    const checks = screen.getByRole('region', { name: 'Conferência' })
    expect(checks).toHaveTextContent('Valor confere')
    expect(checks).toHaveTextContent('Chave de destino é a sua')
    await user.click(screen.getByRole('button', { name: 'Confirmar e renovar' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/financeiro/comprovantes/chg_camila'))

    expect(await screen.findByText('Valor diferente da cobrança')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Recusar' }))
    const reasons = screen.getByRole('region', { name: 'Motivo da recusa' })
    expect(within(reasons).getByRole('button', { name: /Valor diferente/ })).toHaveTextContent('sugerido')
    await user.click(within(reasons).getByRole('button', { name: /Valor diferente/ }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/financeiro/comprovantes/chg_pedro'))

    expect(await screen.findByText('Chave de destino diferente')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Confirmar e renovar' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/financeiro/comprovantes/chg_ana'))
    await user.click(await screen.findByRole('button', { name: 'Confirmar e renovar' }))
    expect(await screen.findByRole('heading', { name: 'Comprovantes conferidos' })).toBeInTheDocument()
    expect(screen.getByText('3 confirmados (R$ 1.060,00) e 1 recusado. Os alunos já foram avisados no app.')).toBeInTheDocument()
    expect((await fetchJson('/api/coach/counters')).pendingProofs).toBe(0)
  })

  it('comprovante do Renato enviado pelo app: confirmar quita a cobrança dele', async () => {
    const file = new File(['x'], 'pix_renato.png', { type: 'image/png' })
    const form = new FormData()
    form.append('file', file)
    expect((await fetch('/api/me/charges/chg_2026_12/proof', { method: 'POST', body: form })).status).toBe(201)

    const user = userEvent.setup()
    renderApp('/financeiro/comprovantes/chg_2026_12')
    expect(await screen.findByText('Renato Alves', {}, { timeout: 3000 })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Confirmar e renovar' }))
    await waitFor(async () => expect((await fetchJson('/api/me/billing')).charge).toBeNull())
  })

  it('cobrar: Pix copia e cola com o valor e o identificador', async () => {
    const user = userEvent.setup()
    renderApp('/financeiro?status=late')
    const list = await screen.findByRole('list', { name: 'Cobranças' }, { timeout: 3000 })
    await user.click(within(within(list).getAllByRole('listitem')[0]!).getByRole('button', { name: 'Cobrar' }))
    const sheet = await screen.findByRole('dialog', { name: 'Cobrar Marcos' })
    expect(sheet).toHaveTextContent('R$ 230,00 · Mensal · 10 dias de atraso')
    expect(within(sheet).getByText(/^00020126/)).toHaveTextContent('5406230.00')
    expect(sheet).toHaveTextContent('identificador MARCOS1110MEN')
    await user.click(within(sheet).getByRole('button', { name: /Enviar notificação no app/ }))
    expect(await screen.findByText('Notificação enviada')).toBeInTheDocument()
  })

  it('Pix e planos: valida a chave, salva e desliga um plano', async () => {
    const user = userEvent.setup()
    renderApp('/financeiro?aba=pix')
    const pix = await screen.findByRole('region', { name: 'Configurar Pix' }, { timeout: 3000 })
    await user.click(within(pix).getByRole('radio', { name: 'Celular' }))
    const key = within(pix).getByRole('textbox', { name: 'Chave' })
    await user.type(key, '5199812')
    expect(within(pix).getByText('DDD + 9 dígitos')).toBeInTheDocument()
    expect(within(pix).getByRole('button', { name: 'Salvar Pix' })).toBeDisabled()
    await user.type(key, '4470')
    expect(within(pix).getByText('Será enviado como +5551998124470')).toBeInTheDocument()
    await user.click(within(pix).getByRole('button', { name: 'Salvar Pix' }))
    expect(await screen.findByText('Pix salvo')).toBeInTheDocument()
    expect((await fetchJson('/api/coach/finance')).pix).toMatchObject({ keyType: 'phone', key: '5199812 4470'.replace(' ', '') })

    await user.click(screen.getByRole('switch', { name: 'Plano Semestral à venda' }))
    await waitFor(async () => expect((await fetchJson('/api/coach/finance')).plans.find((p: { id: string }) => p.id === 'sem').active).toBe(false))
  })
})

describe('Financeiro (desktop)', () => {
  const original = window.matchMedia
  afterEach(() => {
    window.matchMedia = original
  })

  it('tabela e comprovante ao lado; decidir abre o próximo', async () => {
    window.matchMedia = (query: string) => ({ ...original(query), matches: query === '(min-width: 1024px)' })
    const user = userEvent.setup()
    renderApp('/financeiro/comprovantes/chg_pedro')
    const aside = await screen.findByRole('complementary', { name: 'Comprovante de Pedro Nunes' }, { timeout: 3000 })
    expect(within(aside).getByRole('region', { name: 'Conferência' })).toHaveTextContent('Chave de destino diferente')
    await user.click(within(aside).getByRole('button', { name: 'Recusar' }))
    await user.click(within(aside).getByRole('button', { name: /Chave errada/ }))
    expect(await screen.findByText('Comprovante de Pedro recusado')).toBeInTheDocument()
    expect(await screen.findByRole('complementary', { name: /^Comprovante de (?!Pedro)/ })).toBeInTheDocument()
    expect(screen.getByRole('table', { name: 'Cobranças do mês' })).toHaveTextContent('Recusado')
  })
})
