import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { renderApp } from '../../../test/render-app'

// Relógio fixo: quarta, 21/10/2026, 20h. O setup responde "não" ao matchMedia: abre a versão do celular.

const fetchJson = async (url: string) => (await fetch(url)).json()

describe('Biblioteca (celular)', () => {
  it('exercícios: os meus primeiro, filtros e sem vídeo', async () => {
    const user = userEvent.setup()
    renderApp('/biblioteca')
    const list = await screen.findByRole('region', { name: 'Exercícios' }, { timeout: 3000 })
    const cards = within(list).getAllByRole('link')
    expect(cards[0]).toHaveTextContent('Afundo búlgaro com pausa')
    expect(cards[0]).toHaveTextContent('MEU')
    const hack = within(list).getByRole('link', { name: /Agachamento hack \(máquina\)/ })
    expect(hack).toHaveTextContent('0:24')
    expect(hack).toHaveAttribute('href', '/biblioteca/exercicios/ex_hack_squat')

    await user.click(within(screen.getByRole('group', { name: 'Grupo muscular' })).getByRole('button', { name: 'Costas' }))
    expect(within(list).getAllByRole('link').every((a) => /Dorsais|Costas/.test(a.textContent ?? ''))).toBe(true)
    await user.click(within(screen.getByRole('group', { name: 'Grupo muscular' })).getByRole('button', { name: 'Todos' }))
    await user.click(screen.getByRole('button', { name: /sem vídeo$/ }))
    expect(within(list).getAllByRole('link').every((a) => a.textContent?.includes('Sem vídeo'))).toBe(true)
  })

  it('detalhe: passo a passo, substituições e fichas que usam; enviar para o aluno', async () => {
    const user = userEvent.setup()
    renderApp('/biblioteca/exercicios/ex_hack_squat')
    expect(await screen.findByRole('heading', { level: 2, name: 'Agachamento hack (máquina)' }, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.getByText('Costas e quadril bem apoiados no encosto')).toBeInTheDocument()
    expect(screen.getByText('Leg press 45°')).toBeInTheDocument()
    const used = screen.getByRole('link', { name: /Hipertrofia — Push\/Pull\/Legs \+ Upper\/Lower/ })
    expect(used).toHaveAttribute('href', '/fichas/tpl_ppl?treino=tpl_ppl_c')
    expect(used).toHaveTextContent('Modelo · Treino C — Legs · 18 alunos')

    await user.click(screen.getByRole('button', { name: 'Enviar para aluno' }))
    const drawer = await screen.findByRole('dialog', { name: 'Enviar no chat' })
    await user.type(within(drawer).getByRole('searchbox', { name: 'Buscar aluno' }), 'renato')
    await user.click(within(drawer).getByRole('checkbox', { name: 'Renato Alves' }))
    await user.click(within(drawer).getByRole('button', { name: 'Enviar para 1 aluno' }))
    expect(await within(drawer).findByText('Enviado para 1 aluno')).toBeInTheDocument()

    const app = await fetchJson('/api/me/conversation')
    expect(app.messages.at(-1)).toMatchObject({ from: 'coach', body: { type: 'event', event: 'exercise', title: 'Agachamento hack (máquina)' } })
  })

  it('duplicar e personalizar vira um exercício meu', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/biblioteca/exercicios/ex_stiff')
    await screen.findByRole('heading', { level: 2, name: 'Stiff' }, { timeout: 3000 })
    await user.click(screen.getByRole('button', { name: 'Duplicar e personalizar' }))
    expect(await screen.findByRole('heading', { level: 2, name: 'Stiff (minha versão)' }, { timeout: 3000 })).toBeInTheDocument()
    expect(router.state.location.pathname).toMatch(/^\/biblioteca\/exercicios\/ex_coach_\d+$/)
    expect(screen.getByText(/criado por você/)).toBeInTheDocument()
  })

  it('novo exercício entra na biblioteca e no editor de ficha', async () => {
    const user = userEvent.setup()
    renderApp('/biblioteca')
    await screen.findByRole('region', { name: 'Exercícios' }, { timeout: 3000 })
    await user.click(screen.getByRole('button', { name: 'Novo exercício' }))
    const drawer = await screen.findByRole('dialog', { name: 'Novo exercício' })
    await user.click(within(drawer).getByRole('button', { name: 'Salvar exercício' }))
    expect(within(drawer).getByText('Dê um nome com pelo menos 3 letras')).toBeInTheDocument()
    await user.type(within(drawer).getByRole('textbox', { name: 'Nome' }), 'Remada cavalinho (máquina)')
    await user.click(within(within(drawer).getByRole('radiogroup', { name: 'Músculo principal' })).getByRole('radio', { name: 'Costas' }))
    await user.type(within(drawer).getByRole('textbox', { name: /Como executar/ }), 'Peito apoiado no banco{Enter}Puxe os cotovelos para trás')
    await user.click(within(drawer).getByRole('button', { name: 'Salvar exercício' }))
    expect(await screen.findByText('Remada cavalinho (máquina) entrou nos seus exercícios')).toBeInTheDocument()

    const editor = await fetchJson('/api/coach/exercises')
    expect(editor[0]).toMatchObject({ name: 'Remada cavalinho (máquina)', primary: 'upperBack', origin: 'coach' })
  })

  it('editar exercício meu: nível, passos, substituições e vídeo; a ficha passa a ver o novo', async () => {
    const user = userEvent.setup()
    renderApp('/biblioteca/exercicios/ex_coach_plank_tap')
    await screen.findByRole('heading', { level: 2, name: 'Prancha com toque no ombro' }, { timeout: 3000 })
    expect(screen.getByText('Sem vídeo')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Editar' }))
    const drawer = await screen.findByRole('dialog', { name: 'Editar exercício' })
    const name = within(drawer).getByRole('textbox', { name: 'Nome' })
    expect(name).toHaveValue('Prancha com toque no ombro')
    expect(within(drawer).getByRole('textbox', { name: /Como executar/ })).toHaveValue('Apoio nas mãos, corpo em linha\nToque o ombro oposto sem girar o quadril\nAlterne os lados devagar')
    expect(within(within(drawer).getByRole('radiogroup', { name: 'Nível' })).getByRole('radio', { name: 'iniciante' })).toHaveAttribute('aria-checked', 'true')

    await user.clear(name)
    await user.type(name, 'Prancha com toque alternado')
    await user.click(within(within(drawer).getByRole('radiogroup', { name: 'Nível' })).getByRole('radio', { name: 'intermediário' }))
    await user.type(within(drawer).getByRole('textbox', { name: /Como executar/ }), '{Enter}Respire sem prender o ar')
    await user.type(within(drawer).getByRole('textbox', { name: /link do YouTube/ }), 'https://youtube.com/watch?v=abc')
    await user.click(within(drawer).getByRole('button', { name: 'Salvar alterações' }))

    expect(await screen.findByText('Exercício salvo')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { level: 2, name: 'Prancha com toque alternado' })).toBeInTheDocument()
    expect(screen.getByText(/intermediário · criado por você/)).toBeInTheDocument()
    expect(screen.getByText('Respire sem prender o ar')).toBeInTheDocument()
    expect(screen.getByText('Vídeo · 0:30')).toBeInTheDocument()

    const editor = await fetchJson('/api/coach/exercises')
    expect(editor.find((e: { id: string }) => e.id === 'ex_coach_plank_tap')).toMatchObject({ name: 'Prancha com toque alternado', level: 'intermediate', videoUrl: 'https://youtube.com/watch?v=abc' })
  })

  it('editar: remover o vídeo atual', async () => {
    const user = userEvent.setup()
    renderApp('/biblioteca/exercicios/ex_coach_bulgarian_pause')
    await screen.findByRole('heading', { level: 2, name: 'Afundo búlgaro com pausa' }, { timeout: 3000 })
    expect(screen.getByText('Vídeo · 0:31')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Editar' }))
    const drawer = await screen.findByRole('dialog', { name: 'Editar exercício' })
    await user.click(within(drawer).getByRole('button', { name: 'Remover vídeo' }))
    await user.click(within(drawer).getByRole('button', { name: 'Salvar alterações' }))
    expect(await screen.findByText('Sem vídeo')).toBeInTheDocument()
  })

  it('exercício da base não tem Editar nem Excluir', async () => {
    renderApp('/biblioteca/exercicios/ex_stiff')
    await screen.findByRole('heading', { level: 2, name: 'Stiff' }, { timeout: 3000 })
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Excluir exercício' })).not.toBeInTheDocument()
  })

  it('excluir exercício meu sem uso, com confirmação', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/biblioteca/exercicios/ex_coach_plank_tap')
    await screen.findByRole('heading', { level: 2, name: 'Prancha com toque no ombro' }, { timeout: 3000 })
    await user.click(screen.getByRole('button', { name: 'Excluir exercício' }))
    const dialog = await screen.findByRole('alertdialog', { name: 'Excluir Prancha com toque no ombro?' })
    await user.click(within(dialog).getByRole('button', { name: 'Excluir' }))
    expect(await screen.findByText('Prancha com toque no ombro foi excluído')).toBeInTheDocument()
    await waitFor(() => expect(router.state.location.pathname).toBe('/biblioteca'))
    const list = await screen.findByRole('region', { name: 'Exercícios' })
    expect(within(list).queryByRole('link', { name: /Prancha com toque no ombro/ })).not.toBeInTheDocument()
  })

  it('exercício em uso numa ficha não exclui; a API também recusa', async () => {
    // Põe o exercício no Treino A da ficha Full body
    const tpl = await fetchJson('/api/coach/plans/tpl_full')
    const day = tpl.plan.days[0]
    const item = { ...day.exercises[0], id: 'it_teste', exerciseId: 'ex_coach_plank_tap' }
    const plan = { ...tpl.plan, days: [{ ...day, exercises: [...day.exercises, item] }, ...tpl.plan.days.slice(1)] }
    expect((await fetch('/api/coach/plans/tpl_full', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan }) })).ok).toBe(true)

    renderApp('/biblioteca/exercicios/ex_coach_plank_tap')
    await screen.findByRole('heading', { level: 2, name: 'Prancha com toque no ombro' }, { timeout: 3000 })
    expect(screen.getByRole('button', { name: 'Excluir exercício' })).toBeDisabled()
    expect(screen.getByText(/^Para excluir, tire o exercício das \d+ fichas acima\.$/)).toBeInTheDocument()
    expect((await fetch('/api/coach/library/exercises/ex_coach_plank_tap', { method: 'DELETE' })).status).toBe(409)
  })

  it('em uso só numa ficha arquivada: a API recusa e a tela explica', async () => {
    const user = userEvent.setup()
    const tpl = await fetchJson('/api/coach/plans/tpl_full')
    const day = tpl.plan.days[0]
    const plan = { ...tpl.plan, days: [{ ...day, exercises: [...day.exercises, { ...day.exercises[0], id: 'it_teste', exerciseId: 'ex_coach_plank_tap' }] }, ...tpl.plan.days.slice(1)] }
    await fetch('/api/coach/plans/tpl_full', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan }) })
    await fetch('/api/coach/plans/tpl_full/archive', { method: 'POST' })

    renderApp('/biblioteca/exercicios/ex_coach_plank_tap')
    await screen.findByRole('heading', { level: 2, name: 'Prancha com toque no ombro' }, { timeout: 3000 })
    await user.click(screen.getByRole('button', { name: 'Excluir exercício' }))
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Excluir' }))
    expect(await screen.findByText(/Tire das fichas antes de excluir/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Prancha com toque no ombro' })).toBeInTheDocument()
  })

  it('alimentos e materiais', async () => {
    const user = userEvent.setup()
    renderApp('/biblioteca?aba=alimentos')
    const foods = await screen.findByRole('list', { name: 'Alimentos' }, { timeout: 3000 })
    expect(within(foods).getAllByRole('listitem')[0]).toHaveTextContent('Pão francês')
    expect(within(foods).getAllByRole('listitem')[0]).toHaveTextContent('1 unidade = 50 g')
    await user.click(within(screen.getByRole('radiogroup', { name: 'Origem do alimento' })).getByRole('radio', { name: 'Rótulo' }))
    expect(within(screen.getByRole('list', { name: 'Alimentos' })).getAllByRole('listitem').map((li) => li.textContent)).toEqual([expect.stringContaining('Whey protein')])

    await user.click(within(screen.getByRole('tablist', { name: 'Tipo de conteúdo' })).getByRole('tab', { name: 'Materiais' }))
    const mats = await screen.findByRole('list', { name: 'Materiais' })
    await user.click(within(within(mats).getAllByRole('listitem')[0]!).getByRole('button', { name: 'Enviar aos alunos' }))
    expect(await screen.findByText('Material enviado aos alunos')).toBeInTheDocument()
  })
})

describe('Biblioteca (desktop)', () => {
  const original = window.matchMedia
  afterEach(() => {
    window.matchMedia = original
  })

  it('lista e detalhe ao lado; alimentos em tabela', async () => {
    window.matchMedia = (query: string) => ({ ...original(query), matches: query === '(min-width: 1024px)' })
    const user = userEvent.setup()
    renderApp('/biblioteca/exercicios/ex_hack_squat')
    const aside = await screen.findByRole('complementary', { name: 'Detalhes do exercício' }, { timeout: 3000 })
    expect(await within(aside).findByRole('heading', { level: 2, name: 'Agachamento hack (máquina)' })).toBeInTheDocument()
    expect(within(screen.getByRole('tablist', { name: 'Tipo de conteúdo' })).getByRole('tab', { name: /Exercícios/ })).toHaveTextContent(/\d+/)
    await user.click(within(screen.getByRole('region', { name: 'Exercícios' })).getByRole('button', { name: /Stiff/ }))
    await waitFor(() => expect(within(aside).getByRole('heading', { level: 2, name: 'Stiff' })).toBeInTheDocument())

    await user.click(within(screen.getByRole('tablist', { name: 'Tipo de conteúdo' })).getByRole('tab', { name: /Alimentos/ }))
    expect(await screen.findByRole('table', { name: 'Alimentos' })).toHaveTextContent('Peito de frango grelhado')
  })
})
