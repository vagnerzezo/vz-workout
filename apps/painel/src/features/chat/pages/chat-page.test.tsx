import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { renderApp } from '../../../test/render-app'

// Relógio fixo: quarta, 21/10/2026, 20h. O setup responde "não" ao matchMedia: abre a versão do celular.

const fetchJson = async (url: string) => (await fetch(url)).json()
const conversations = () => within(screen.getByRole('list', { name: 'Conversas' })).getAllByRole('link')

describe('Chat (celular)', () => {
  it('lista: não lidas, grupo, "sem resposta" e filtros', async () => {
    const user = userEvent.setup()
    renderApp('/chat')
    await screen.findByRole('list', { name: 'Conversas' }, { timeout: 3000 })
    const list = conversations()
    expect(list.map((a) => a.getAttribute('aria-label'))).toEqual([
      'Renato Alves, 2 não lidas',
      'Desafio 30 dias — outubro, 1 não lida',
      'Ana Paula Reis, 1 não lida',
      'Júlia Castro',
      'Camila Rocha',
      'Pedro Nunes',
      'Diego Santos',
      'Marcos Lima',
    ])
    expect(list[0]).toHaveTextContent('Ok! Vou testar o leg press no lugar do hack hoje.')
    expect(list[1]).toHaveTextContent('Thiago: Eu! Às 18h.')
    expect(list[4]).toHaveTextContent('Você: Perfeito, Camila!')
    expect(list[7]).toHaveTextContent('sem resposta')
    expect(screen.getByRole('switch', { name: /Resposta automática/ })).toBeChecked()

    await user.click(within(screen.getByRole('tablist', { name: 'Filtro de conversas' })).getByRole('tab', { name: 'Não lidas' }))
    expect(conversations()).toHaveLength(3)
    await user.click(within(screen.getByRole('tablist', { name: 'Filtro de conversas' })).getByRole('tab', { name: 'Grupos' }))
    expect(conversations()).toHaveLength(1)
    await user.click(within(screen.getByRole('tablist', { name: 'Filtro de conversas' })).getByRole('tab', { name: 'Todas' }))
    await user.type(screen.getByRole('searchbox', { name: 'Buscar conversa' }), 'julia')
    expect(conversations().map((a) => a.getAttribute('aria-label'))).toEqual(['Júlia Castro'])
  })

  it('conversa do Renato: é a mesma do app; abrir marca como lida e o que o treinador manda chega ao aluno', async () => {
    const user = userEvent.setup()
    renderApp('/chat/conv_renato')
    const log = await screen.findByRole('log', { name: 'Mensagens' }, { timeout: 3000 })
    expect(within(log).getByRole('link', { name: /Check-in quinzenal enviado/ })).toHaveAttribute('href', '/check-ins/revisar/ci_renato_9')
    expect(log).toHaveTextContent('Áudio 0:42')
    expect(screen.getByText(/Joelho direito sensível/)).toBeInTheDocument() // nota privada no topo

    await user.click(within(screen.getByRole('group', { name: 'Respostas rápidas' })).getByRole('button', { name: 'Ótimo treino!' }))
    await user.click(screen.getByRole('button', { name: 'Enviar mensagem' }))
    await waitFor(() => expect(log).toHaveTextContent('Ótimo treino, Renato! Continue assim.'))
    expect(log).toHaveTextContent('Enviada')

    const app = await fetchJson('/api/me/conversation')
    expect(app.messages.at(-1)).toMatchObject({ from: 'coach', body: { type: 'text', text: 'Ótimo treino, Renato! Continue assim.' } })
    const counters = await fetchJson('/api/coach/counters')
    expect(counters.unreadChats).toBe(2) // as 2 do Renato foram lidas; sobram grupo e Ana
  })

  it('compartilhar a ficha vira cartão; contexto com notas privadas', async () => {
    const user = userEvent.setup()
    renderApp('/chat/conv_julia')
    const log = await screen.findByRole('log', { name: 'Mensagens' }, { timeout: 3000 })
    await user.click(screen.getByRole('button', { name: 'Anexar ou compartilhar' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Compartilhar ficha de treino' }))
    await waitFor(() => expect(within(log).getByRole('link', { name: /Ficha compartilhada · Hipertrofia — Bloco 2/ })).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: 'Ver contexto de Júlia Castro' }))
    const ctx = await screen.findByRole('dialog', { name: 'Contexto do aluno' })
    expect(await within(ctx).findByText('Adesão 30 dias')).toBeInTheDocument()
    const notes = within(ctx).getByRole('textbox', { name: 'Notas privadas' })
    await user.clear(notes)
    await user.type(notes, 'Gosta de áudio.')
    await user.click(within(ctx).getByRole('link', { name: 'Abrir perfil do aluno' }).parentElement!) // sai do campo
    await user.tab()
    expect(await screen.findByText('Notas salvas')).toBeInTheDocument()
    expect((await fetchJson('/api/coach/conversations/conv_julia')).notes).toBe('Gosta de áudio.')
  })

  it('transmissão personaliza {nome} e cria as conversas', async () => {
    const user = userEvent.setup()
    renderApp('/chat')
    await screen.findByRole('list', { name: 'Conversas' }, { timeout: 3000 })
    await user.click(screen.getByRole('button', { name: 'Transmissão' }))
    const drawer = await screen.findByRole('dialog', { name: 'Nova transmissão' })
    await user.click(within(within(drawer).getByRole('radiogroup', { name: 'Público' })).getByRole('radio', { name: /Só presencial/ }))
    await user.type(within(drawer).getByRole('textbox', { name: 'Mensagem da transmissão' }), 'Oi, {{nome}! Feriado na segunda.')
    const sendButton = within(drawer).getByRole('button', { name: /^Enviar para \d+ alunos$/ })
    const n = Number(sendButton.textContent!.match(/\d+/)![0])
    await user.click(sendButton)
    expect(await within(drawer).findByText(`Transmissão enviada a ${n} alunos`)).toBeInTheDocument()

    const pedro = await fetchJson('/api/coach/conversations/conv_pedro')
    expect(pedro.messages.at(-1).body.text).toBe('Oi, Pedro! Feriado na segunda.')
  })
})

describe('Chat (desktop)', () => {
  const original = window.matchMedia
  afterEach(() => {
    window.matchMedia = original
  })

  it('lista, conversa aberta e contexto do grupo', async () => {
    window.matchMedia = (query: string) => ({ ...original(query), matches: query === '(min-width: 1024px)' })
    const user = userEvent.setup()
    renderApp('/chat/grp_desafio')
    const conv = await screen.findByRole('region', { name: 'Conversa com Desafio 30 dias — outubro' }, { timeout: 3000 })
    expect(within(conv).getByText('Grupo · 24 membros')).toBeInTheDocument()
    expect(within(conv).getByRole('log')).toHaveTextContent('Thiago Alves')
    const aside = await screen.findByRole('complementary', { name: 'Contexto da conversa' })
    await user.click(within(aside).getByRole('switch', { name: 'Só o treinador envia' }))
    await waitFor(async () => expect((await fetchJson('/api/coach/conversations/grp_desafio')).group.onlyCoach).toBe(true))
    expect(screen.getByText(/mensagens recebidas fora de seg–sex, 8h–20h/)).toBeInTheDocument()
  })
})
