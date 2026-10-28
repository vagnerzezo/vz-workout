import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { setScenario } from '@workspace/mocks/handlers'
import { renderApp } from '../../../test/render-app'

// No jsdom o CSS não se aplica: a tabela (desktop) e os cards (celular) estão os dois na tela.

const table = () => screen.getByRole('table')
const tableNames = () =>
  within(table())
    .getAllByRole('row')
    .slice(1)
    .map((r) => r.querySelector('strong')?.textContent)
const cards = () => screen.getByRole('region', { name: 'Lista de alunos' })
const card = (name: string) => within(cards()).getByRole('link', { name: `Abrir perfil de ${name}` }).closest('li')!

async function openList(path = '/alunos') {
  const utils = renderApp(path)
  await screen.findByRole('table', {}, { timeout: 3000 })
  return utils
}

afterEach(() => vi.restoreAllMocks())

describe('Lista de alunos', () => {
  it('abre nos ativos, com o uso do plano e os contadores das abas', async () => {
    await openList()
    expect(screen.getByRole('heading', { name: 'Alunos' })).toBeInTheDocument()
    expect(await screen.findByText(/52 ativos de 80 do seu plano/)).toHaveTextContent('· 3 convites pendentes')
    const tabs = screen.getByRole('group', { name: 'Status' })
    expect(within(tabs).getAllByRole('button').map((b) => b.textContent)).toEqual(['Ativos52', 'Pendentes3', 'Vencidos0', 'Arquivados18'])
    expect(within(tabs).getByRole('button', { name: /Ativos/ })).toHaveAttribute('aria-pressed', 'true')

    // Última atividade: quem treinou hoje primeiro; página de 25
    expect(tableNames()).toHaveLength(25)
    const rows = within(table()).getAllByRole('row').slice(1)
    expect(rows[0]).toHaveTextContent('Hoje')
    expect(rows.at(-1)).toHaveTextContent('Ontem')
    expect(screen.getByText(/Mostrando 25 de 52 alunos ativos/)).toBeInTheDocument()
  })

  it('linha da tabela com adesão, último treino, vencimentos e status', async () => {
    await openList('/alunos?busca=marcos')
    const row = within(table()).getAllByRole('row')[1]!
    expect(row).toHaveTextContent('Marcos Lima')
    expect(row).toHaveTextContent('marcos.lima@email.com')
    expect(row).toHaveTextContent('PresencialHipertrofia')
    expect(row).toHaveTextContent('40%')
    expect(within(row).getByText('Há 7 dias')).toHaveClass('text-destructive')
    expect(within(row).getByText('Ativo')).toBeInTheDocument()
    expect(within(row).getByRole('link', { name: 'Conversar com Marcos Lima' })).toHaveAttribute('href', '/chat/conv_marcos')
    expect(within(row).getAllByRole('link')[0]).toHaveAttribute('href', '/alunos/stu_marcos')

    // Card do celular: anel, linha de atividade e alertas
    const c = card('Marcos Lima')
    expect(within(c).getByRole('img', { name: 'Adesão de 40% em 30 dias' })).toBeInTheDocument()
    expect(within(c).getByText('Sem treinar há 7 dias')).toBeInTheDocument()
    expect(within(c).getByText('Pagamento atrasado')).toBeInTheDocument()
    expect(within(c).getByText('Check-in atrasado')).toBeInTheDocument()
  })

  it('busca sem acento chega pela URL (vinda do Dashboard)', async () => {
    const user = userEvent.setup()
    const { router } = await openList('/alunos?busca=julia')
    expect(tableNames()).toEqual(['Júlia Castro'])
    expect(screen.getByRole('searchbox', { name: 'Buscar aluno' })).toHaveValue('julia')

    await user.clear(screen.getByRole('searchbox', { name: 'Buscar aluno' }))
    await user.type(screen.getByRole('searchbox', { name: 'Buscar aluno' }), 'ana paula')
    expect(tableNames()).toEqual(['Ana Paula Reis'])
    expect(router.state.location.search).toBe('?busca=ana+paula')
  })

  it('tags, ordem por menor adesão e página 2 ficam na URL', async () => {
    const user = userEvent.setup()
    const { router } = await openList()
    await user.click(screen.getByRole('button', { name: /Ordenar: última atividade/ }))
    expect(screen.getByRole('button', { name: /Ordenar: menor adesão primeiro/ })).toBeInTheDocument()
    expect(tableNames().slice(0, 4)).toEqual(['Marcos Lima', 'Letícia Moura', 'Bruno Teixeira', 'Ana Paula Reis'])

    await user.click(within(screen.getByRole('group', { name: 'Tags' })).getByRole('button', { name: 'Presencial' }))
    expect(within(screen.getByRole('group', { name: 'Tags' })).getByRole('button', { name: 'Presencial' })).toHaveAttribute('aria-pressed', 'true')
    expect(tableNames()[0]).toBe('Marcos Lima')
    expect(new URLSearchParams(router.state.location.search).get('tags')).toBe('Presencial')
    expect(new URLSearchParams(router.state.location.search).get('ordem')).toBe('adesao')
  })

  it('paginação', async () => {
    const user = userEvent.setup()
    const { router } = await openList()
    await user.click(screen.getByRole('button', { name: 'Página 3' }))
    expect(screen.getByText(/Mostrando 2 de 52 alunos ativos/)).toBeInTheDocument()
    expect(router.state.location.search).toBe('?pagina=3')
    expect(screen.getByRole('button', { name: 'Próxima página' })).toBeDisabled()
  })

  it('pendentes: convite e reenviar', async () => {
    const user = userEvent.setup()
    await openList('/alunos?aba=pendentes')
    expect(tableNames()).toEqual(['Fernanda Luz', 'Rafael Costa', 'Sofia Martins'])
    expect(within(card('Sofia Martins')).getByText('Convite aberto, sem cadastro')).toBeInTheDocument()
    expect(within(card('Fernanda Luz')).getByText('Convite enviado há 2 dias')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Reenviar convite para Fernanda Luz' }))
    expect(await screen.findByText('Convite reenviado para Fernanda')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Convite reenviado para Fernanda Luz' })).toBeDisabled()
  })

  it('vencidos vazio', async () => {
    await openList('/alunos?aba=vencidos')
    expect(within(cards()).getByText('Nenhum aluno vencido. Tudo em dia.')).toBeInTheDocument()
  })

  it('seleciona na tabela e arquiva em massa, com confirmação; os contadores atualizam', async () => {
    const user = userEvent.setup()
    await openList('/alunos?busca=lima')
    await user.click(screen.getByRole('checkbox', { name: 'Selecionar todos' }))
    const bar = screen.getByRole('toolbar', { name: 'Ações em massa' })
    expect(bar).toHaveTextContent('1 selecionado')
    expect(within(bar).getByRole('link', { name: 'Enviar notificação' })).toHaveAttribute('href', '/notificacoes/nova?alunos=stu_marcos')
    expect(within(bar).getByRole('link', { name: 'Atribuir ficha' })).toHaveAttribute('href', '/fichas?atribuir=stu_marcos')

    await user.click(within(bar).getByRole('button', { name: 'Arquivar' }))
    const dialog = await screen.findByRole('alertdialog', { name: 'Arquivar Marcos Lima?' })
    await user.click(within(dialog).getByRole('button', { name: 'Arquivar' }))
    expect(await screen.findByText('Marcos Lima foi arquivado')).toBeInTheDocument()

    await waitFor(() => expect(screen.getByRole('button', { name: /Arquivados/ })).toHaveTextContent('19'))
    expect(screen.getByRole('button', { name: /Ativos/ })).toHaveTextContent('51')
    expect(within(cards()).getByText('Nenhum aluno com esses filtros.')).toBeInTheDocument()
    await waitFor(() => expect(within(screen.getByRole('navigation', { name: 'Seções' })).getByRole('link', { name: /Alunos/ })).toHaveTextContent('51'))
  })

  it('reativa pelo menu ⋮ na aba Arquivados', async () => {
    const user = userEvent.setup()
    await openList('/alunos?aba=arquivados')
    const first = within(table()).getAllByRole('row')[1]!
    const name = first.querySelector('strong')!.textContent!
    await user.click(within(first).getByRole('button', { name: `Mais ações para ${name}` }))
    await user.click(await screen.findByRole('menuitem', { name: 'Reativar' }))
    expect(await screen.findByText(`${name} voltou para os ativos`)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('button', { name: /Ativos/ })).toHaveTextContent('53'))
  })

  it('adiciona tag em massa', async () => {
    const user = userEvent.setup()
    await openList('/alunos?busca=renato')
    await user.click(screen.getByRole('checkbox', { name: 'Selecionar Renato Alves' }))
    await user.click(within(screen.getByRole('toolbar', { name: 'Ações em massa' })).getByRole('button', { name: 'Adicionar tag' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Presencial' }))
    expect(await screen.findByText('Tag "Presencial" adicionada a 1 aluno')).toBeInTheDocument()
    await waitFor(() => expect(within(table()).getAllByRole('row')[1]).toHaveTextContent('OnlineHipertrofiaPresencial'))
  })

  it('celular: "Selecionar" liga a seleção nos cards', async () => {
    const user = userEvent.setup()
    await openList('/alunos?busca=castro')
    expect(within(cards()).queryByRole('checkbox')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Selecionar' }))
    await user.click(within(cards()).getByRole('checkbox', { name: 'Selecionar Júlia Castro' }))
    expect(screen.getByRole('toolbar', { name: 'Ações em massa no celular' })).toHaveTextContent('1 selecionado')
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('toolbar', { name: 'Ações em massa no celular' })).not.toBeInTheDocument()
  })

  it('exporta o CSV do que está filtrado', async () => {
    const user = userEvent.setup()
    const createUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:csv')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    await openList('/alunos?aba=pendentes')
    await user.click(screen.getByRole('button', { name: 'Exportar CSV' }))
    expect(click).toHaveBeenCalled()
    const blob = createUrl.mock.calls[0]![0] as Blob
    const text = await blob.text()
    expect(text.split('\n')).toHaveLength(4) // cabeçalho + 3 pendentes
    expect(text).toContain('Fernanda Luz;fernanda.luz@email.com')
    expect(await screen.findByText('3 alunos exportados')).toBeInTheDocument()
  })

  it('erro ao carregar', async () => {
    setScenario('erro')
    renderApp('/alunos')
    expect(await screen.findByRole('heading', { name: 'Não foi possível carregar os alunos' }, { timeout: 3000 })).toBeInTheDocument()
  })
})
