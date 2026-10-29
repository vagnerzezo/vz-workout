import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { renderApp } from '../../../test/render-app'

// Relógio fixo: quarta, 21/10/2026, 20h. O setup responde "não" ao matchMedia: abre a versão do celular.

const fetchJson = async (url: string) => (await fetch(url)).json()

describe('Configurações (celular)', () => {
  it('lista agrupada; perfil com CREF inválido não salva', async () => {
    const user = userEvent.setup()
    renderApp('/configuracoes')
    expect(await screen.findByText('CREF 012345-G/RS', {}, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'SEU NEGÓCIO' })).toHaveTextContent('3 pessoas · 1 convite pendente')
    expect(screen.getByRole('region', { name: 'ROTINA DE ATENDIMENTO' })).toHaveTextContent('Quinzenal · 9 perguntas')
    expect(screen.getByRole('region', { name: 'ROTINA DE ATENDIMENTO' })).toHaveTextContent('6 dias por semana · 8h às 20h')
    expect(screen.getByRole('link', { name: /Marca do app/ })).toHaveAttribute('href', '/configuracoes/marca')

    await user.click(screen.getByRole('button', { name: /Perfil profissional/ }))
    const sheet = await screen.findByRole('dialog', { name: 'Perfil profissional' })
    const cref = within(sheet).getByRole('textbox', { name: 'Registro CREF' })
    await user.clear(cref)
    await user.type(cref, '12345-G/RS')
    expect(within(sheet).getByText(/Formato: 6 números/)).toBeInTheDocument()
    expect(within(sheet).getByRole('button', { name: 'Pronto' })).toBeDisabled()

    await user.clear(cref)
    await user.type(cref, '012345-p/sp')
    await user.click(within(sheet).getByRole('button', { name: 'Corrida' }))
    await user.click(within(sheet).getByRole('button', { name: 'Pronto' }))
    expect(await screen.findByText('Configurações salvas')).toBeInTheDocument()
    const saved = await fetchJson('/api/coach/settings')
    expect(saved.profile).toMatchObject({ cref: '012345-P/SP', specialties: ['Hipertrofia', 'Emagrecimento', 'Corrida'] })
  })

  it('duas etapas salva na hora e a sessão do iPhone é encerrada', async () => {
    const user = userEvent.setup()
    renderApp('/configuracoes')
    await user.click(await screen.findByRole('switch', { name: /Verificação em duas etapas/ }, { timeout: 3000 }))
    expect(await screen.findByText('Verificação em duas etapas desligada')).toBeInTheDocument()
    expect((await fetchJson('/api/coach/settings')).security.twoFactor).toBe(false)

    await user.click(screen.getByRole('button', { name: /Sessões ativas/ }))
    const sheet = await screen.findByRole('dialog', { name: 'Sessões ativas' })
    await user.click(within(sheet).getByRole('button', { name: /Encerrar Safari no iPhone/ }))
    expect(await screen.findByText('Sessão encerrada')).toBeInTheDocument()
    await waitFor(() => expect(within(sheet).getAllByRole('listitem')).toHaveLength(1))
  })

  it('marca: cor, nome longo e publicar muda o app do aluno', async () => {
    const user = userEvent.setup()
    renderApp('/configuracoes/marca')
    expect(await screen.findByText('Publicado para os alunos', {}, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.getByText('Contraste ótimo no app inteiro')).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: '#8B7BFF' }))
    expect(screen.getByRole('textbox', { name: 'HEX' })).toHaveValue('#8B7BFF')
    const hex = screen.getByRole('textbox', { name: 'HEX' })
    await user.clear(hex)
    await user.type(hex, '#1A1C21')
    expect(screen.getByText('Texto legível, mas a cor some no fundo escuro do app')).toBeInTheDocument()
    await user.clear(hex)
    await user.type(hex, '#38E1C6')

    const name = screen.getByRole('textbox', { name: 'Nome do app na tela inicial' })
    await user.clear(name)
    await user.type(name, 'Kaue Oliveira Team')
    expect(screen.getByText('Embaixo do ícone aparece "Kaue Olivei…"')).toBeInTheDocument()
    expect(screen.getByText('Alterações não publicadas')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Publicar para os alunos' }))
    expect(await screen.findByText(/Marca publicada/)).toBeInTheDocument()
    expect(await fetchJson('/api/public/branding')).toMatchObject({ appName: 'Kaue Oliveira Team', brandColor: '#38E1C6' })
    expect((await fetchJson('/api/coach/me')).branding.appName).toBe('Kaue Oliveira Team')
  })
})

describe('Configurações (desktop)', () => {
  const original = window.matchMedia
  afterEach(() => {
    window.matchMedia = original
  })
  const desktop = () => {
    window.matchMedia = (query: string) => ({ ...original(query), matches: query === '(min-width: 1024px)' })
  }

  it('permissões: dono fixo nas configurações, dieta só com CRN, salvar', async () => {
    desktop()
    const user = userEvent.setup()
    renderApp('/configuracoes?secao=equipe')
    const table = await screen.findByRole('table', { name: 'Permissões por função' }, { timeout: 3000 })
    expect(within(table).getByRole('button', { name: 'Configurações, Dono: Editar' })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent('Tudo salvo')

    const diet = within(table).getByRole('button', { name: 'Fichas de dieta, Assistente: Sem acesso' })
    await user.click(diet)
    expect(diet).toHaveAccessibleName('Fichas de dieta, Assistente: Ver')
    await user.click(diet)
    expect(diet).toHaveAccessibleName('Fichas de dieta, Assistente: Sem acesso') // nunca "Editar"
    await user.click(within(table).getByRole('button', { name: 'Financeiro, Assistente: Sem acesso' }))
    expect(screen.getByRole('status')).toHaveTextContent('Alterações não salvas')

    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))
    // O toast "Configurações salvas" pode ter sobrado do teste anterior: espera o status
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Tudo salvo'))
    expect((await fetchJson('/api/coach/settings')).permissions.finance.assistant).toBe('edit')
  })

  it('check-in: nova pergunta e trocar de seção mantém o rascunho', async () => {
    desktop()
    const user = userEvent.setup()
    renderApp('/configuracoes?secao=checkin')
    const list = await screen.findByRole('list', { name: 'Perguntas do check-in' }, { timeout: 3000 })
    await user.type(screen.getByRole('textbox', { name: 'Nova pergunta' }), 'Quantas horas dormiu?')
    await user.click(screen.getByRole('radio', { name: 'Número' }))
    await user.click(screen.getByRole('button', { name: 'Adicionar' }))
    expect(within(list).getAllByRole('listitem')).toHaveLength(10)
    expect(screen.getByRole('heading', { name: 'Check-in' })).toBeInTheDocument()

    await user.click(within(screen.getByRole('navigation', { name: 'Seções das configurações' })).getByRole('button', { name: /Atendimento e padrões/ }))
    await user.click(screen.getByRole('button', { name: 'Mais 15 segundos' }))
    expect(screen.getByText('Alterações não salvas')).toBeInTheDocument()
    expect(screen.getByLabelText('Descanso padrão', { selector: 'output' })).toHaveTextContent('1min 45s')
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))
    expect(await screen.findByText('Tudo salvo')).toBeInTheDocument()
    const saved = await fetchJson('/api/coach/settings')
    expect(saved.checkIn.questions.at(-1)).toMatchObject({ text: 'Quantas horas dormiu?', type: 'number' })
    expect(saved.defaults.restSeconds).toBe(105)
  })

  it('/configuracoes/marca no desktop abre a seção da marca', async () => {
    desktop()
    const { router } = renderApp('/configuracoes/marca')
    expect(await screen.findByRole('heading', { name: 'Marca do app' }, { timeout: 3000 })).toBeInTheDocument()
    expect(router.state.location.search).toBe('?secao=marca')
    expect(screen.getByRole('region', { name: 'Pré-visualização da marca' })).toHaveTextContent('Team Oliveira')
  })
})
