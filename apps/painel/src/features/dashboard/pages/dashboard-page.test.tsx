import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { setScenario } from '@workspace/mocks/handlers'
import { renderApp } from '../../../test/render-app'

// No jsdom o CSS não se aplica: as versões desktop e celular de cada parte estão as duas na tela.

const attention = () => screen.getByRole('region', { name: 'Precisa da sua atenção' })
const attentionNames = () =>
  within(within(attention()).getByRole('list'))
    .getAllByRole('listitem')
    .map((li) => li.querySelector('strong')?.textContent)

async function openDashboard(path = '/') {
  const utils = renderApp(path)
  await screen.findByRole('heading', { name: 'Boa noite, Kaue' })
  return utils
}

describe('Dashboard', () => {
  it('mostra o dia, os indicadores e o resumo do canvas', async () => {
    await openDashboard()
    expect(screen.getAllByText('Quarta-feira, 21 de outubro')[0]).toBeInTheDocument()
    expect(screen.getByText('7 alunos')).toBeInTheDocument() // "precisam da sua atenção hoje"

    const kpis = screen.getByRole('region', { name: 'Indicadores' })
    expect(within(kpis).getByRole('link', { name: /Alunos ativos.*52.*\+3 este mês/ })).toHaveAttribute('href', '/alunos')
    expect(within(kpis).getByRole('link', { name: /Adesão média \(7 dias\).*81%.*−4 pts vs semana passada/ })).toBeInTheDocument()
    expect(within(kpis).getByRole('link', { name: /Check-ins pendentes.*6.*2 há mais de 48 h/ })).toHaveAttribute('href', '/check-ins')
    expect(within(kpis).getByRole('link', { name: /Vencimentos em 7 dias.*4.*1 vence amanhã/ })).toHaveAttribute('href', '/financeiro')

    const chips = screen.getByRole('navigation', { name: 'Resumo rápido' })
    expect(within(chips).getByRole('link', { name: /Treinaram hoje.*18/ })).toBeInTheDocument()
    expect(within(chips).getByRole('link', { name: /Aniversariantes hoje.*2/ })).toHaveAttribute('href', '/#aniversariantes')
  })

  it('lista quem precisa de atenção, com o tempo de cada caso e a ação certa', async () => {
    await openDashboard()
    expect(attentionNames()).toEqual(['Renato Alves', 'Júlia Castro', 'Marcos Lima', 'Bruno Teixeira', 'Ana Paula Reis', 'Letícia Moura', 'Diego Santos'])

    const row = (name: string) => within(attention()).getByText(name).closest('li')!
    expect(within(row('Renato Alves')).getByText('há 3 h')).toBeInTheDocument()
    expect(within(row('Renato Alves')).getByRole('link', { name: 'Ver check-in' })).toHaveAttribute('href', '/check-ins/revisar/ci_renato_9')
    expect(within(row('Marcos Lima')).getByText('último treino 14/10')).toBeInTheDocument()
    expect(within(row('Marcos Lima')).getByRole('link', { name: 'Enviar mensagem' })).toHaveAttribute('href', '/chat/conv_marcos')
    expect(within(row('Bruno Teixeira')).getByText('vence hoje')).toBeInTheDocument()
    expect(within(row('Bruno Teixeira')).getByRole('link', { name: 'Cobrar renovação' })).toHaveAttribute('href', '/financeiro')
    expect(within(row('Ana Paula Reis')).getByText('vence amanhã')).toBeInTheDocument()
    expect(within(row('Ana Paula Reis')).getByRole('link', { name: 'Renovar ficha' })).toHaveAttribute('href', '/alunos/stu_ana?aba=treino')
  })

  it('filtra pela URL (?atencao=) e mostra o vazio da categoria', async () => {
    const user = userEvent.setup()
    const { router } = await openDashboard()
    await user.click(screen.getByRole('button', { name: 'Inatividade · 2' }))
    expect(screen.getByRole('button', { name: 'Inatividade · 2' })).toHaveAttribute('aria-pressed', 'true')
    expect(attentionNames()).toEqual(['Marcos Lima', 'Letícia Moura'])
    expect(router.state.location.search).toBe('?atencao=inatividade')

    for (const name of ['Marcos Lima', 'Letícia Moura']) {
      await user.click(screen.getByRole('button', { name: `Marcar ${name} como resolvido` }))
    }
    expect(within(attention()).getByText('Tudo em dia nesta categoria.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Todos · 5' })).toBeInTheDocument()
  })

  it('abre já filtrado quando a URL tem o filtro', async () => {
    await openDashboard('/?atencao=vencimentos')
    expect(attentionNames()).toEqual(['Bruno Teixeira', 'Ana Paula Reis'])
  })

  it('resolvido fica resolvido ao voltar para o dashboard', async () => {
    const user = userEvent.setup()
    const { router } = await openDashboard()
    await user.click(screen.getByRole('button', { name: 'Marcar Júlia Castro como resolvido' }))
    expect(await screen.findByText('Júlia Castro: marcado como resolvido')).toBeInTheDocument()
    expect(attentionNames()).not.toContain('Júlia Castro')

    await router.navigate('/alunos')
    await screen.findByRole('heading', { name: 'Alunos' }, { timeout: 3000 })
    await router.navigate('/')
    await screen.findByRole('heading', { name: 'Boa noite, Kaue' }, { timeout: 3000 })
    await waitFor(() => expect(screen.getByRole('button', { name: 'Todos · 6' })).toBeInTheDocument())
    expect(attentionNames()).not.toContain('Júlia Castro')
  })

  it('parabeniza o aniversariante pelo chat', async () => {
    const user = userEvent.setup()
    await openDashboard()
    const birthdays = screen.getByRole('region', { name: 'Aniversariantes de hoje' })
    await user.click(within(birthdays).getByRole('button', { name: 'Parabenizar Camila Rocha' }))
    expect(within(birthdays).getByRole('button', { name: 'Parabéns enviado para Camila Rocha' })).toBeDisabled()
    expect(await screen.findByText('Mensagem de parabéns enviada para Camila')).toBeInTheDocument()
    expect(within(birthdays).getByRole('button', { name: 'Parabenizar Thiago Alves' })).toBeEnabled()
  })

  it('adesão por semana, atividade recente e ranking do mês', async () => {
    await openDashboard()
    expect(screen.getByRole('img', { name: /Adesão por semana, meta de 80%\. S36: 86%, .* S43: 81%/ })).toBeInTheDocument()

    const feed = screen.getByRole('region', { name: 'Atividade recente' })
    expect(within(feed).getAllByRole('listitem')[0]).toHaveTextContent('Renato Alves concluiu Treino C — Legs com 2 recordes pessoaishá 12 min')

    const ranking = screen.getByRole('region', { name: 'Mais frequentes' })
    expect(within(ranking).getByText('outubro')).toBeInTheDocument()
    expect(within(ranking).getAllByRole('listitem')[0]).toHaveTextContent('1Renato Alves12 treinos')
  })

  it('a busca leva para a lista de alunos filtrada', async () => {
    const user = userEvent.setup()
    const { router } = await openDashboard()
    const [desktopSearch] = screen.getAllByRole('searchbox', { name: 'Buscar' })
    await user.type(desktopSearch!, 'júlia{Enter}')
    await waitFor(() => expect(router.state.location.pathname).toBe('/alunos'))
    expect(router.state.location.search).toBe('?busca=j%C3%BAlia')
  })

  it('erro ao carregar: mensagem e tentar de novo', async () => {
    const user = userEvent.setup()
    setScenario('erro')
    renderApp('/')
    expect(await screen.findByRole('heading', { name: 'Não foi possível carregar o dashboard' })).toBeInTheDocument()
    setScenario(null)
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(await screen.findByRole('heading', { name: 'Boa noite, Kaue' })).toBeInTheDocument()
  })
})
