import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { renderApp } from '../../../test/render-app'

// Relógio fixo: quarta, 21/10/2026, 20h. O setup responde "não" ao matchMedia: abre a versão do celular.

const fetchJson = async (url: string) => (await fetch(url)).json()

describe('Notificações (celular)', () => {
  it('recebidas: 4 não lidas hoje; abrir uma e marcar todas', async () => {
    const user = userEvent.setup()
    renderApp('/notificacoes')
    expect(await screen.findByText('4 não lidas', {}, { timeout: 3000 })).toBeInTheDocument()
    const today = screen.getByRole('region', { name: 'HOJE' })
    const pain = within(today).getByRole('listitem', { name: 'Renato relatou dor no check-in, não lida' })
    expect(within(pain).getByRole('link', { name: 'Revisar check-in' })).toHaveAttribute('href', '/check-ins/revisar/ci_renato_9')

    await user.click(screen.getByRole('button', { name: 'Marcar todas como lidas' }))
    expect(await screen.findByText('Tudo lido')).toBeInTheDocument()
    expect((await fetchJson('/api/coach/counters')).unreadNotifications).toBe(0)
  })

  it('o que eu recebo e automações', async () => {
    const user = userEvent.setup()
    renderApp('/notificacoes')
    await screen.findByText('4 não lidas', {}, { timeout: 3000 })
    await user.click(screen.getByRole('button', { name: 'O que eu recebo' }))
    const prefs = await screen.findByRole('dialog', { name: 'O que eu recebo' })
    await user.click(within(prefs).getByRole('switch', { name: /Mensagens/ }))
    await waitFor(async () => expect((await fetchJson('/api/coach/notifications')).prefs.message).toBe(false))
    await user.keyboard('{Escape}')

    await user.click(within(screen.getByRole('tablist', { name: 'Seções de notificações' })).getByRole('tab', { name: 'Automações' }))
    const list = await screen.findByRole('list', { name: 'Automações' })
    expect(within(list).getByRole('switch', { name: 'Lembrete de água' })).not.toBeChecked()
    await user.click(within(list).getByRole('switch', { name: 'Lembrete de água' }))
    expect(await screen.findByText('Lembrete de água ligada')).toBeInTheDocument()
    expect(screen.getByText(/10 de 10 automações ligadas/)).toBeInTheDocument()
  })

  it('histórico: cancelar envio agendado', async () => {
    const user = userEvent.setup()
    renderApp('/notificacoes?aba=historico')
    const list = await screen.findByRole('list', { name: 'Histórico de envios' }, { timeout: 3000 })
    expect(within(list).getAllByRole('listitem')[0]).toHaveTextContent('Agendada')
    expect(within(list).getAllByRole('listitem')[1]).toHaveTextContent('52 enviadas · 41 push · 62% abriram')
    await user.click(within(list).getByRole('button', { name: 'Cancelar envio' }))
    expect(await screen.findByText('Envio agendado cancelado')).toBeInTheDocument()
    await waitFor(() => expect(within(list).getAllByRole('listitem')[0]).toHaveTextContent('Cancelada'))
  })

  it('nova: vinda da lista de alunos, preview com o Renato e chega no app dele', async () => {
    const user = userEvent.setup()
    renderApp('/notificacoes/nova?alunos=stu_renato,stu_marcos')
    await screen.findByRole('heading', { level: 1, name: 'Nova notificação' }, { timeout: 3000 })
    expect(await screen.findByRole('radio', { name: 'Alunos' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByText('Renato Alves')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('2 alunos · 1 no celular · 1 só na central')
    expect(screen.getByRole('button', { name: 'Enviar para 2 alunos' })).toBeDisabled()

    await user.type(screen.getByRole('textbox', { name: /Título/ }), 'Bora treinar, ')
    await user.click(within(screen.getByRole('group', { name: 'Inserir variável no título' })).getByRole('button', { name: '{nome}' }))
    await user.type(screen.getByRole('textbox', { name: /Texto/ }), 'Seu ')
    await user.click(within(screen.getByRole('group', { name: 'Inserir variável no texto' })).getByRole('button', { name: '{treino}' }))
    const preview = screen.getByRole('region', { name: 'Pré-visualização' })
    expect(preview).toHaveTextContent('Bora treinar, Renato')
    expect(preview).toHaveTextContent('Seu Treino C — Legs')
    expect(preview).toHaveTextContent('ao tocar abre treino do dia')

    await user.click(screen.getByRole('button', { name: 'Enviar para 2 alunos' }))
    expect(await screen.findByRole('heading', { name: 'Notificação enviada' })).toBeInTheDocument()
    expect(screen.getByText('1 alunos recebem no celular agora e 1 verão na central do app.')).toBeInTheDocument()

    const app = await fetchJson('/api/me/notifications')
    expect(app[0]).toMatchObject({ kind: 'workout', title: 'Bora treinar, Renato', body: 'Seu Treino C — Legs', link: '/treinos', read: false })
  })

  it('agendar de madrugada vai para as 7h', async () => {
    const user = userEvent.setup()
    renderApp('/notificacoes/nova')
    await screen.findByRole('radiogroup', { name: 'Público' }, { timeout: 3000 })
    await user.click(screen.getByRole('radio', { name: 'Agendar' }))
    const hour = screen.getByLabelText('Hora')
    await user.clear(hour)
    await user.type(hour, '05:30')
    expect(screen.getByText('Entre 22h e 7h o envio fica para as 7h, para não acordar ninguém.')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Pré-visualização' })).getByText('07:00')).toBeInTheDocument()
    await user.type(screen.getByRole('textbox', { name: /Título/ }), 'Feriado')
    await user.type(screen.getByRole('textbox', { name: /Texto/ }), 'Academia fechada amanhã.')
    await user.click(screen.getByRole('button', { name: /^Agendar para \d+ alunos$/ }))
    expect(await screen.findByRole('heading', { name: 'Notificação agendada' })).toBeInTheDocument()
    expect(screen.getByText(/^Sai em 22\/10 às 07:00 para \d+ alunos/)).toBeInTheDocument()
  })
})

describe('Notificações (desktop)', () => {
  const original = window.matchMedia
  afterEach(() => {
    window.matchMedia = original
  })

  it('indicadores e histórico em tabela', async () => {
    window.matchMedia = (query: string) => ({ ...original(query), matches: query === '(min-width: 1024px)' })
    renderApp('/notificacoes?aba=historico')
    const indicators = await screen.findByRole('region', { name: 'Indicadores' }, { timeout: 3000 })
    expect(indicators).toHaveTextContent(/Alunos com push ativo\d+ de 52/)
    expect(indicators).toHaveTextContent('Automações ativas9 de 101 envio agendado')
    expect(screen.getByRole('table', { name: 'Histórico de envios' })).toHaveTextContent('Feriado na segunda')
  })
})
