import { screen, waitFor, within } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderApp } from '../../../test/render-app'
import { useDevicePrefs } from '../../../shared/prefs/device-prefs'

// Convite de teste da API simulada: packages/mocks/src/fixtures/renato-auth.ts
const signOut = () => fetch('/api/auth/logout', { method: 'POST' })
const step = () => screen.getByRole('progressbar', { name: 'Progresso do primeiro acesso' })

async function createPassword(user: UserEvent) {
  await screen.findByRole('heading', { name: 'Crie sua senha' })
  await user.type(screen.getByLabelText('Senha'), 'Corrida2026')
  await user.type(screen.getByLabelText('Repita a senha'), 'Corrida2026')
  await user.click(screen.getByRole('checkbox', { name: /Termos de uso/ }))
  await user.click(screen.getByRole('checkbox', { name: /dados de saúde/ }))
  await user.click(screen.getByRole('button', { name: 'Criar senha' }))
}

async function answerAbout(user: UserEvent) {
  await screen.findByRole('heading', { name: 'Conte sobre você' })
  await user.click(screen.getByRole('radio', { name: 'Emagrecer' }))
  await user.type(screen.getByLabelText('Peso (kg)'), '64,5')
  await user.type(screen.getByLabelText('Altura (cm)'), '165')
  await user.click(screen.getByRole('checkbox', { name: 'Nenhuma' }))
  await user.click(screen.getByRole('button', { name: 'Enviar respostas' }))
}

beforeEach(async () => {
  await signOut()
  useDevicePrefs.setState({ pushEnabled: true })
})
afterEach(() => vi.unstubAllGlobals())

describe('Primeiro acesso', () => {
  it('pelo link do WhatsApp: código, senha, sobre você, instalar, lembretes e entra no app', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/primeiro-acesso/K7M-2QX')
    expect(await screen.findByText('Código válido · acesso de Fernanda Luz')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Boas-vindas à Team Oliveira')
    expect(screen.getByLabelText('Código de acesso')).toHaveValue('K7M-2QX')
    expect(step()).toHaveAttribute('aria-valuenow', '1')
    await user.click(screen.getByRole('button', { name: 'Continuar' }))

    // Senha: não pode ter o nome; precisa repetir igual e aceitar os dois termos
    await screen.findByRole('heading', { name: 'Crie sua senha' })
    expect(screen.getByText('(51) 99812-4470 · fernanda.luz@email.com')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Senha'), 'Fernanda2026')
    expect(screen.getByRole('list', { name: 'Regras da senha' })).toHaveTextContent('Diferente do seu celular e nome (falta)')
    await user.clear(screen.getByLabelText('Senha'))
    await user.type(screen.getByLabelText('Senha'), 'Corrida2026')
    await user.type(screen.getByLabelText('Repita a senha'), 'Corrida2025')
    expect(screen.getByText('As senhas não são iguais.')).toBeInTheDocument()
    await user.clear(screen.getByLabelText('Repita a senha'))
    await user.clear(screen.getByLabelText('Senha'))
    await createPassword(user)

    await answerAbout(user)

    await screen.findByRole('heading', { name: 'Coloque o app na tela inicial' })
    expect(step()).toHaveAttribute('aria-valuenow', '4')
    await user.click(screen.getByRole('button', { name: 'Depois' }))

    await screen.findByRole('heading', { name: 'Quer receber lembretes?' })
    await user.click(screen.getByRole('button', { name: 'Agora não' }))

    expect(await screen.findByRole('heading', { name: 'Tudo pronto, Fernanda!' })).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Ir para o app' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/'), { timeout: 3000 })

    await router.navigate('/perfil')
    const me = await screen.findByRole('region', { name: 'Seus dados' })
    await waitFor(() => expect(me).toHaveTextContent('Fernanda Luz'))
    expect(me).toHaveTextContent('Emagrecimento · Iniciante')

    // O convite não serve mais
    await signOut()
    expect((await fetch('/api/auth/invites/K7M2QX')).status).toBe(404)
    expect((await fetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ login: '(51) 99734-2201', password: 'Corrida2026' }) })).status).toBe(204)
  })

  it('código digitado errado avisa e não deixa continuar', async () => {
    const user = userEvent.setup()
    renderApp('/entrar')
    await user.click(await screen.findByRole('link', { name: 'Tenho um código de acesso' }))
    expect(await screen.findByText('São 6 letras e números, como K7M-2QX')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Código de acesso'), 'abc123')
    expect(screen.getByLabelText('Código de acesso')).toHaveValue('ABC-123')
    expect(await screen.findByRole('alert')).toHaveTextContent('Código não encontrado ou expirado. Peça um novo ao treinador.')
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled()
  })

  it('lembretes: pede a permissão do navegador', async () => {
    vi.stubGlobal('Notification', { permission: 'default', requestPermission: vi.fn().mockResolvedValue('granted') })
    const user = userEvent.setup()
    renderApp('/primeiro-acesso/K7M2QX')
    await user.click(await screen.findByRole('button', { name: 'Continuar' }))
    await createPassword(user)
    await answerAbout(user)
    await user.click(await screen.findByRole('button', { name: 'Depois' }))

    await user.click(await screen.findByRole('button', { name: 'Permitir lembretes' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Lembretes ativados neste celular.')
    expect(screen.queryByRole('button', { name: 'Agora não' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(await screen.findByRole('heading', { name: 'Tudo pronto, Fernanda!' })).toBeInTheDocument()
    expect(within(screen.getByRole('main')).getByRole('link', { name: 'no chat' })).toHaveAttribute('href', '/chat')
  })
})
