import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderApp } from '../../../test/render-app'
import { useInstall } from '../../../shared/pwa/install'
import { useDevicePrefs } from '../../../shared/prefs/device-prefs'
import { useActiveWorkout } from '../../workout/store/active-workout'

const toggle = (name: string) => screen.getByRole('switch', { name: new RegExp(`^${name}`) })

async function openSettings() {
  const utils = renderApp('/perfil/configuracoes')
  await screen.findByRole('heading', { level: 1, name: 'Configurações' })
  await waitFor(() => expect(toggle('Lembrete de treino')).toBeChecked()) // notificações carregadas (o Switch desabilita com aria-disabled)
  return utils
}

beforeEach(() => {
  useDevicePrefs.setState({ sound: true, keepAwake: true, offlinePlan: true, offlineSyncedAt: null })
  useInstall.setState({ prompt: null, installed: false })
  useActiveWorkout.getState().setAutoRest(true)
})

describe('Configurações', () => {
  it('conta: dados do perfil e os links', async () => {
    await openSettings()
    const conta = screen.getByRole('region', { name: 'Conta' })
    await waitFor(() => expect(within(conta).getByRole('link', { name: /^Dados pessoais/ })).toHaveTextContent('Renato Alves'))
    expect(within(conta).getByRole('link', { name: /^Objetivo e nível/ })).toHaveTextContent('Hipertrofia · Intermediário')
    expect(within(conta).getByRole('link', { name: /^Assinatura e pagamento/ })).toHaveTextContent('Trimestral · até 15/12')
    expect(within(conta).getByRole('link', { name: /^Assinatura e pagamento/ })).toHaveAttribute('href', '/perfil/pagamento')
    expect(screen.getByRole('link', { name: /^Meus dados \(LGPD\)/ })).toHaveAttribute('href', '/perfil/configuracoes/meus-dados')
    expect(screen.getByText('Versão 0.0.1')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Instale na tela inicial' })).not.toBeInTheDocument() // navegador sem convite
  })

  it('notificações ficam salvas na conta', async () => {
    const user = userEvent.setup()
    const { router } = await openSettings()
    expect(toggle('Lembrete de água')).not.toBeChecked()
    expect(toggle('Mensagens do chat')).toBeChecked()

    await user.click(toggle('Lembrete de água'))
    expect(toggle('Lembrete de água')).toBeChecked()

    await router.navigate('/perfil')
    await router.navigate('/perfil/configuracoes')
    await waitFor(() => expect(toggle('Lembrete de água')).toBeChecked())
  })

  it('durante o treino: timer automático é o mesmo do timer de descanso; som e tela ficam no aparelho', async () => {
    const user = userEvent.setup()
    await openSettings()
    await user.click(toggle('Timer automático'))
    expect(useActiveWorkout.getState().autoRest).toBe(false)

    await user.click(toggle('Som e vibração'))
    await user.click(toggle('Manter tela ligada'))
    expect(useDevicePrefs.getState()).toMatchObject({ sound: false, keepAwake: false })
  })

  it('offline: ligar baixa a ficha e mostra quando sincronizou', async () => {
    const user = userEvent.setup()
    await openSettings()
    await user.click(toggle('Baixar ficha atual'))
    expect(toggle('Baixar ficha atual')).not.toBeChecked()
    useDevicePrefs.setState({ offlineSyncedAt: null })

    await user.click(toggle('Baixar ficha atual'))
    await waitFor(() => expect(toggle('Baixar ficha atual')).toHaveAccessibleDescription('Treine sem internet · sincronizado hoje, 20:00'))
  })

  it('instalar: usa o convite do navegador', async () => {
    const user = userEvent.setup()
    const prompt = vi.fn().mockResolvedValue(undefined)
    useInstall.setState({ prompt: Object.assign(new Event('beforeinstallprompt'), { prompt, userChoice: Promise.resolve({ outcome: 'accepted' as const }) }) })
    await openSettings()
    const card = screen.getByRole('region', { name: 'Instale na tela inicial' })
    await user.click(within(card).getByRole('button', { name: 'Instalar' }))

    expect(prompt).toHaveBeenCalled()
    await waitFor(() => expect(screen.queryByRole('region', { name: 'Instale na tela inicial' })).not.toBeInTheDocument())
  })

  it('a engrenagem do Perfil abre as configurações', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/perfil')
    await user.click(await screen.findByRole('link', { name: 'Configurações' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/perfil/configuracoes'), { timeout: 3000 })
    expect(await screen.findByRole('link', { name: 'Voltar ao perfil' })).toHaveAttribute('href', '/perfil')
  })
})
