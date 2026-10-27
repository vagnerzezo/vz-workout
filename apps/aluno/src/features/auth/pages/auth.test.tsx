import { screen, waitFor } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../../../test/render-app'

// Credenciais de teste da API simulada: packages/mocks/src/fixtures/renato-auth.ts
const PHONE = '(51) 99734-2201'
const PASSWORD = 'Treino2026'
const CODE = '482913'

const signOut = () => fetch('/api/auth/logout', { method: 'POST' })

async function fillLogin(user: UserEvent, login: string, password: string) {
  await user.clear(screen.getByLabelText('Celular ou e-mail'))
  if (login) await user.type(screen.getByLabelText('Celular ou e-mail'), login)
  await user.clear(screen.getByLabelText('Senha'))
  if (password) await user.type(screen.getByLabelText('Senha'), password)
  await user.click(screen.getByRole('button', { name: 'Entrar' }))
}

describe('Entrar', () => {
  it('sem sessão, qualquer tela leva para entrar; depois de entrar, volta para ela', async () => {
    await signOut()
    const user = userEvent.setup()
    const { router } = renderApp('/dieta?dia=2026-10-20')
    expect(await screen.findByRole('heading', { level: 1, name: 'Team Oliveira' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/entrar')
    expect(screen.getByText('Treino e dieta com Kaue Oliveira')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Tenho um código de acesso' })).toHaveAttribute('href', '/primeiro-acesso')

    await fillLogin(user, PHONE, PASSWORD)
    await waitFor(() => expect(router.state.location.pathname).toBe('/dieta'), { timeout: 3000 })
    expect(router.state.location.search).toBe('?dia=2026-10-20')
  })

  it('valida antes de enviar e mostra o erro da API', async () => {
    await signOut()
    const user = userEvent.setup()
    renderApp('/entrar')
    await screen.findByLabelText('Celular ou e-mail')

    await fillLogin(user, '', '')
    expect(screen.getByRole('alert')).toHaveTextContent('Digite seu celular com DDD (11 números) ou seu e-mail.')
    expect(screen.getByLabelText('Celular ou e-mail')).toHaveAttribute('aria-invalid', 'true')

    await fillLogin(user, 'renato@email.com', 'curta')
    expect(screen.getByRole('alert')).toHaveTextContent('A senha tem pelo menos 8 caracteres.')

    await fillLogin(user, 'renato@email.com', 'SenhaErrada1')
    expect(await screen.findByText('Celular, e-mail ou senha incorretos.')).toBeInTheDocument()
  })

  it('mostrar senha', async () => {
    await signOut()
    const user = userEvent.setup()
    renderApp('/entrar')
    const password = await screen.findByLabelText('Senha')
    expect(password).toHaveAttribute('type', 'password')
    await user.click(screen.getByRole('button', { name: 'Mostrar senha' }))
    expect(password).toHaveAttribute('type', 'text')
  })

  it('com sessão, /entrar vai para o início', async () => {
    const { router } = renderApp('/entrar')
    await waitFor(() => expect(router.state.location.pathname).toBe('/'), { timeout: 3000 })
  })

  it('sair nas Configurações volta para entrar e fecha o app', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/perfil/configuracoes')
    await user.click(await screen.findByRole('button', { name: 'Sair do aplicativo' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/entrar'), { timeout: 3000 })

    await router.navigate('/')
    await waitFor(() => expect(router.state.location.pathname).toBe('/entrar'))
  })
})

describe('Recuperar senha', () => {
  it('código errado, código certo, senha nova e já entra; a senha antiga para de valer', async () => {
    await signOut()
    const user = userEvent.setup()
    const { router } = renderApp('/entrar')
    await user.click(await screen.findByRole('link', { name: 'Esqueci minha senha' }))
    await screen.findByRole('heading', { name: 'Esqueceu a senha?' })

    expect(screen.getByRole('button', { name: 'Enviar código' })).toBeDisabled()
    await user.type(screen.getByLabelText('Celular ou e-mail cadastrado'), PHONE)
    await user.click(screen.getByRole('button', { name: 'Enviar código' }))

    await screen.findByRole('heading', { name: 'Digite o código' })
    expect(screen.getByText('Enviamos pelo WhatsApp (51) •••••-2201. Ele vale por 10 minutos.')).toBeInTheDocument()
    expect(screen.getByText('Passo 2 de 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reenviar código em 0:45' })).toBeDisabled()

    await user.type(screen.getByLabelText('Código de 6 números'), '111111')
    expect(await screen.findByRole('alert')).toHaveTextContent('Código incorreto. Você tem mais 4 tentativas.')
    await user.type(screen.getByLabelText('Código de 6 números'), CODE)

    await screen.findByRole('heading', { name: 'Nova senha' })
    expect(screen.getByRole('button', { name: 'Salvar nova senha' })).toBeDisabled()
    await user.type(screen.getByLabelText('Nova senha'), 'NovaSenha9')
    expect(screen.getByRole('list', { name: 'Regras da senha' })).toHaveTextContent('✓Pelo menos 8 caracteres (ok)✓Uma letra e um número (ok)')
    await user.click(screen.getByRole('button', { name: 'Salvar nova senha' }))

    expect(await screen.findByRole('heading', { name: 'Senha alterada' })).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Entrar no app' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/'), { timeout: 3000 })

    await signOut()
    expect((await fetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ login: PHONE, password: PASSWORD }) })).status).toBe(401)
    expect((await fetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ login: PHONE, password: 'NovaSenha9' }) })).status).toBe(204)
  })

  it('cadastro que não existe recebe a mesma resposta, mas o código não funciona', async () => {
    await signOut()
    const user = userEvent.setup()
    renderApp('/recuperar-senha')
    await user.type(await screen.findByLabelText('Celular ou e-mail cadastrado'), 'outra@pessoa.com')
    await user.click(screen.getByRole('radio', { name: 'E-mail' }))
    await user.click(screen.getByRole('button', { name: 'Enviar código' }))
    expect(await screen.findByText('Enviamos para o••••@pessoa.com. Ele vale por 10 minutos.')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Código de 6 números'), CODE)
    expect(await screen.findByRole('alert')).toHaveTextContent('Código incorreto.')
  })
})
