import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { renderApp } from '../../../test/render-app'

// Relógio fixo: quarta, 21/10/2026, 20h. O setup responde "não" ao matchMedia: abre a versão do celular.

const PPL = 'Hipertrofia — Push/Pull/Legs + Upper/Lower'

async function openEditor(path = '/fichas/tpl_ppl') {
  const user = userEvent.setup()
  const utils = renderApp(path)
  await screen.findByRole('tablist', { name: 'Dia' }, { timeout: 3000 })
  return { user, ...utils }
}

const dayTab = (name: RegExp) => within(screen.getByRole('tablist', { name: 'Dia' })).getByRole('tab', { name })
const exercisesOf = (day: string) => within(screen.getByRole('region', { name: `Exercícios de ${day}` })).getAllByRole('article')
const fetchJson = async (url: string) => (await fetch(url)).json()

describe('Editor de ficha (celular)', () => {
  it('abre o modelo na fase atual, com o resumo do dia', async () => {
    await openEditor()
    expect(screen.getByRole('heading', { level: 1, name: PPL })).toBeInTheDocument()
    expect(screen.getByText('atualizada em 14/10')).toBeInTheDocument()
    const phases = screen.getByRole('radiogroup', { name: 'Fase' })
    expect(within(phases).getAllByRole('radio').map((r) => r.textContent)).toEqual(['AdaptaçãoSem. 1–2 · séries ×0,7 · RIR 3', 'AcumulaçãoSem. 3–6 · séries ×1 · RIR 2', 'IntensificaçãoSem. 7–9 · séries ×0,8 · RIR 1', 'DeloadSem. 10 · séries ×0,5 · RIR 4'])
    expect(within(phases).getByRole('radio', { name: /Acumulação/ })).toHaveAttribute('aria-checked', 'true')
    expect(dayTab(/A · Push/)).toHaveAttribute('aria-selected', 'true')
    expect(exercisesOf('Treino A — Push')).toHaveLength(6)
    expect(screen.getByText('Séries').nextSibling).toHaveTextContent('22')
    expect(screen.getByRole('button', { name: 'Salvo' })).toBeDisabled()
  })

  it('a fase muda as séries do dia e o volume', async () => {
    const { user } = await openEditor()
    await user.click(within(screen.getByRole('radiogroup', { name: 'Fase' })).getByRole('radio', { name: /Deload/ }))
    expect(screen.getByText('Séries').nextSibling).toHaveTextContent('16') // 6 aquec./prep. + 10 válidas (×0,5)
    expect(screen.getByText('Deload: volume reduzido de propósito')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Volume semanal por músculo/ }))
    expect(within(screen.getByRole('list', { name: 'Séries por músculo' })).getAllByRole('listitem')[0]).toHaveTextContent('Peito')
  })

  it('edita o dia (válidas, ordem, trocar, adicionar, remover) e salva', async () => {
    const { user } = await openEditor()
    const first = exercisesOf('Treino A — Push')[0]!
    expect(first).toHaveAccessibleName('Supino inclinado (máquina)')
    await user.click(within(first).getByRole('button', { name: 'Aumentar Séries válidas de Supino inclinado (máquina)' }))
    expect(within(first).getByRole('group', { name: 'Séries válidas de Supino inclinado (máquina)' })).toHaveTextContent('4')
    expect(screen.getByText('alterações não salvas')).toBeInTheDocument()

    // Descer o primeiro
    await user.click(within(first).getByRole('button', { name: 'Opções de Supino inclinado (máquina)' }))
    await user.click(within(first).getByRole('button', { name: 'Descer' }))
    expect(exercisesOf('Treino A — Push').map((a) => a.getAttribute('aria-label')).slice(0, 2)).toEqual(['Crucifixo', 'Supino inclinado (máquina)'])

    // Trocar o crucifixo pelo supino reto
    const fly = exercisesOf('Treino A — Push')[0]!
    await user.click(within(fly).getByRole('button', { name: 'Opções de Crucifixo' }))
    await user.click(within(fly).getByRole('button', { name: 'Trocar' }))
    const swap = await screen.findByRole('dialog', { name: 'Trocar Crucifixo' })
    await user.type(within(swap).getByRole('searchbox', { name: 'Buscar exercício' }), 'supino reto')
    await user.click(within(swap).getByRole('button', { name: 'Trocar por Supino reto (barra)' }))
    await waitFor(() => expect(exercisesOf('Treino A — Push')[0]).toHaveAccessibleName('Supino reto (barra)'))

    // Adicionar pela biblioteca (filtro por grupo)
    await user.click(screen.getByRole('button', { name: '+ Adicionar exercício' }))
    const add = await screen.findByRole('dialog', { name: 'Adicionar ao Treino A — Push' })
    await user.click(within(within(add).getByRole('group', { name: 'Grupo muscular' })).getByRole('button', { name: 'Costas' }))
    await user.click(within(add).getByRole('button', { name: 'Adicionar Face pull' }))
    await waitFor(() => expect(exercisesOf('Treino A — Push')).toHaveLength(7))
    expect(dayTab(/A · Push/)).toHaveTextContent('7')

    // Remover o último
    const last = exercisesOf('Treino A — Push')[6]!
    await user.click(within(last).getByRole('button', { name: 'Opções de Face pull' }))
    await user.click(within(last).getByRole('button', { name: 'Remover' }))
    expect(exercisesOf('Treino A — Push')).toHaveLength(6)

    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))
    expect(await screen.findByText('Ficha salva')).toBeInTheDocument()
    expect(screen.getByText('salvo agora')).toBeInTheDocument()
    const saved = await fetchJson('/api/coach/plans/tpl_ppl')
    expect(saved.plan.days[0].exercises.map((e: { exerciseId: string }) => e.exerciseId).slice(0, 2)).toEqual(['ex_bench_press', 'ex_incline_press_machine'])
    expect(saved.plan.days[0].exercises[1].workingSets).toBe(4)
  })

  it('renomear muda o nome na lista de fichas', async () => {
    const { user } = await openEditor()
    await user.click(screen.getByRole('button', { name: 'Mais opções da ficha' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Renomear' }))
    const input = await screen.findByRole('textbox', { name: 'Nome da ficha' })
    await user.clear(input)
    await user.type(input, 'PPL + UL — bloco 3{Enter}')
    expect(screen.getByRole('heading', { level: 1, name: 'PPL + UL — bloco 3' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))
    await screen.findByText('Ficha salva')
    const list = await fetchJson('/api/coach/plans')
    expect(list.templates.find((t: { id: string }) => t.id === 'tpl_ppl')).toMatchObject({ name: 'PPL + UL — bloco 3', split: 'ABCDE · Push, Pull, Legs, Upper, Lower' })
  })

  it('sair com alterações pede confirmação', async () => {
    const { user, router } = await openEditor()
    await user.click(screen.getByRole('button', { name: 'Aumentar Séries válidas de Crucifixo' }))
    await user.click(screen.getByRole('link', { name: 'Voltar para fichas de treino' }))
    const dialog = await screen.findByRole('alertdialog', { name: 'Sair sem salvar?' })
    await user.click(within(dialog).getByRole('button', { name: 'Continuar editando' }))
    expect(router.state.location.pathname).toBe('/fichas/tpl_ppl')

    await user.click(screen.getByRole('link', { name: 'Voltar para fichas de treino' }))
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Sair sem salvar' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/fichas'))
  })

  it('ficha do aluno: abre no dia do link e o app do aluno recebe ao salvar', async () => {
    const { user } = await openEditor('/fichas/plan_hipertrofia_b2?aluno=stu_renato&treino=day_c')
    expect(dayTab(/C · Legs/)).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('link', { name: 'Voltar para o aluno' })).toHaveAttribute('href', '/alunos/stu_renato?aba=treino')
    await user.click(screen.getByRole('button', { name: 'Diminuir Séries válidas de Cadeira adutora' }))
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))
    expect(await screen.findByText('Ficha de Renato salva')).toBeInTheDocument()

    const app = await fetchJson('/api/me/workout-plan')
    const adductor = app.plan.days.find((d: { id: string }) => d.id === 'day_c').exercises.find((e: { exerciseId: string }) => e.exerciseId === 'ex_adductor')
    expect(adductor.workingSets).toBe(2)
  })

  it('nova ficha: cria um modelo vazio e abre o editor', async () => {
    const { router } = renderApp('/fichas/nova')
    expect(await screen.findByRole('heading', { level: 1, name: 'Nova ficha' }, { timeout: 3000 })).toBeInTheDocument()
    expect(router.state.location.pathname).toMatch(/^\/fichas\/tpl_\d+$/)
    expect(screen.getByText('Nenhum exercício neste dia.')).toBeInTheDocument()
  })
})

describe('Editor de ficha (desktop)', () => {
  const original = window.matchMedia
  afterEach(() => {
    window.matchMedia = original
  })
  const desktop = () => {
    window.matchMedia = (query: string) => ({ ...original(query), matches: query === '(min-width: 1024px)' })
  }

  it('biblioteca ao lado, tabela de séries, volume e alertas', async () => {
    desktop()
    const { user } = await openEditor()
    const library = screen.getByRole('region', { name: 'Biblioteca' })
    await user.type(within(library).getByRole('searchbox', { name: 'Buscar exercício' }), 'barra fixa')
    await user.click(within(library).getByRole('button', { name: 'Adicionar Barra fixa ao Treino A — Push' }))
    const added = screen.getByRole('article', { name: 'Barra fixa' })
    expect(within(added).getAllByRole('row').map((r) => r.textContent)).toEqual([
      'SÉRIEREPSCARGA / ESFORÇODESCANSO',
      'Preparatória6–8~75% da carga de trabalho1min 30s',
      'Válida 18–12RIR 2 · última até a falha técnica1min 30s',
      'Válida 28–12RIR 2 · última até a falha técnica1min 30s',
      'Válida 38–12RIR 2 · última até a falha técnica1min 30s',
    ])
    expect(screen.getByText(/Dia sugerido: Segunda · fase Acumulação: RIR 2 nas válidas/)).toBeInTheDocument()

    const alerts = screen.getByRole('region', { name: 'Alertas' })
    expect(within(alerts).getAllByRole('listitem').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Atribuir a alunos' })).toBeDisabled() // salve antes

    await user.click(screen.getByRole('button', { name: '+ Dia' }))
    expect(dayTab(/Treino F — Novo treino/)).toBeInTheDocument()
  })
})
