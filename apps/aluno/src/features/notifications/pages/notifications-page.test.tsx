import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setScenario } from '@workspace/mocks/handlers'
import { renderApp } from '../../../test/render-app'
import { useDevicePrefs } from '../../../shared/prefs/device-prefs'

const group = (name: string) => screen.getByRole('region', { name })
/** Começo do texto de cada item (título; "Não lida:" vem antes nas não lidas) */
const titles = (name: string) => within(group(name)).getAllByRole('link').map((a) => a.textContent)

async function openInbox() {
  const utils = renderApp('/notificacoes')
  await screen.findByRole('region', { name: 'Hoje' })
  return utils
}

beforeEach(() => useDevicePrefs.setState({ pushEnabled: true }))
afterEach(() => vi.unstubAllGlobals())

describe('Notificações', () => {
  it('agrupa por dia, com horário e não lidas marcadas', async () => {
    await openInbox()
    expect(screen.getByText('3 não lidas')).toBeInTheDocument()
    expect(titles('Hoje')).toEqual([
      expect.stringMatching(/^Não lida: Bora treinar, Renato!19:00/),
      expect.stringMatching(/^Almoço às 12:3012:15/),
      expect.stringMatching(/^Não lida: Kaue respondeu seu check-in08:12/),
      expect.stringMatching(/^Não lida: Sua ficha foi atualizada08:11/),
    ])
    expect(titles('Ontem')).toEqual([expect.stringMatching(/^Novo recorde no supino inclinado20:52/), expect.stringMatching(/^Seu check-in está liberado08:00/)])
    expect(within(group('Esta semana')).getByRole('link')).toHaveTextContent('seg')
    expect(within(group('Hoje')).getAllByRole('link')[0]).toHaveAttribute('href', '/treinos')
    expect(within(group('Esta semana')).getByRole('link')).toHaveAttribute('href', '/perfil/pagamento')
  })

  it('abrir uma notificação marca como lida e atualiza o sino da Home', async () => {
    const user = userEvent.setup()
    const { router } = await openInbox()
    await user.click(screen.getByRole('link', { name: /Kaue respondeu seu check-in/ }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/chat'), { timeout: 3000 })

    await router.navigate('/')
    expect(await screen.findByRole('link', { name: 'Notificações, 2 novas' })).toBeInTheDocument()
  })

  it('marcar todas como lidas', async () => {
    const user = userEvent.setup()
    const { router } = await openInbox()
    await user.click(screen.getByRole('button', { name: 'Marcar como lidas' }))
    expect(screen.getByText('Tudo lido')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Marcar como lidas' })).toBeDisabled()
    expect(screen.queryByText(/^Não lida:/)).not.toBeInTheDocument()

    await router.navigate('/')
    expect(await screen.findByRole('link', { name: 'Notificações' })).toHaveAttribute('href', '/notificacoes')
  })

  it('lembretes: escolhas salvas na conta, as mesmas das Configurações', async () => {
    const user = userEvent.setup()
    const { router } = await openInbox()
    await user.click(screen.getByRole('button', { name: 'Escolher lembretes' }))
    const sheet = await screen.findByRole('dialog', { name: 'Lembretes' })
    await waitFor(() => expect(within(sheet).getByRole('switch', { name: /^Recordes/ })).toBeChecked())
    expect(within(sheet).getByRole('switch', { name: /^Dia de treino/ })).toHaveAccessibleName(/Nos dias de treino, às 18:00/)
    expect(sheet).toHaveTextContent('Mensagens do Kaue sempre chegam, mesmo no horário silencioso.')

    await user.click(within(sheet).getByRole('switch', { name: /^Água/ }))
    expect(within(sheet).getByRole('switch', { name: /^Água/ })).toBeChecked()

    await router.navigate('/perfil/configuracoes')
    await waitFor(() => expect(screen.getByRole('switch', { name: /^Lembrete de água/ })).toBeChecked())
  })

  it('avisos neste celular: pede a permissão do navegador ao ligar', async () => {
    const requestPermission = vi.fn().mockResolvedValue('granted')
    vi.stubGlobal('Notification', { permission: 'default', requestPermission })
    useDevicePrefs.setState({ pushEnabled: false })
    const user = userEvent.setup()
    await openInbox()
    expect(screen.getByText('Avisos neste celular: desligados')).toBeInTheDocument()

    await user.click(screen.getByRole('switch', { name: 'Avisos neste celular' }))
    expect(requestPermission).toHaveBeenCalled()
    expect(await screen.findByText('Avisos neste celular: ligados')).toBeInTheDocument()
    expect(useDevicePrefs.getState().pushEnabled).toBe(true)
  })

  it('navegador sem notificações: avisa e não deixa ligar', async () => {
    await openInbox()
    expect(screen.getByText('Avisos indisponíveis')).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'Avisos neste celular' })).toHaveAttribute('aria-disabled', 'true')
  })

  it('aluno novo: caixa vazia', async () => {
    setScenario('novo')
    renderApp('/notificacoes')
    expect(await screen.findByRole('heading', { name: 'Nada por aqui ainda' })).toBeInTheDocument()
  })

  it('o sino da Home abre as notificações', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/')
    await user.click(await screen.findByRole('link', { name: 'Notificações, 3 novas' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/notificacoes'), { timeout: 3000 })
    expect(await screen.findByRole('link', { name: 'Voltar para o início' })).toHaveAttribute('href', '/')
  })
})
