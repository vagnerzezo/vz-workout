import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { renderApp } from '../../../test/render-app'

// Relógio fixo: quarta, 21/10/2026, 20h. O setup responde "não" ao matchMedia: abre a versão do celular.

async function openEditor(path = '/dietas/diet_recomp_treino') {
  const user = userEvent.setup()
  const utils = renderApp(path)
  await screen.findByRole('region', { name: 'Refeições' }, { timeout: 3000 })
  return { user, ...utils }
}

const meal = (name: string) => within(screen.getByRole('region', { name: 'Refeições' })).getByRole('article', { name })
const fetchJson = async (url: string) => (await fetch(url)).json()

describe('Editor de dieta (celular)', () => {
  it('abre no almoço, com plano × meta e o resumo das metas', async () => {
    await openEditor()
    expect(screen.getByRole('heading', { level: 1, name: 'Dia de treino — recomposição' })).toBeInTheDocument()
    expect(within(meal('Almoço')).getByRole('button', { name: /Almoço/ })).toHaveAttribute('aria-expanded', 'true')
    expect(within(meal('Café da manhã')).getByRole('button', { name: /Café da manhã/ })).toHaveAttribute('aria-expanded', 'false')

    const compare = screen.getByRole('region', { name: 'Plano × meta' })
    expect(compare).toHaveTextContent('Calorias')
    expect(compare).toHaveTextContent('/ 2.127 kcal')
    expect(screen.getByRole('button', { name: /Metas e cálculo/ })).toHaveTextContent('2.127 kcal · P 174 · C 194 · G 73')

    const almoco = meal('Almoço')
    const arroz = within(almoco).getByRole('listitem', { name: 'Arroz integral cozido' })
    expect(arroz).toHaveTextContent('pesado pronto')
    expect(arroz).toHaveTextContent('186 kcal')
    expect(within(arroz).getByText('Arroz branco cozido').parentElement).toHaveTextContent('Arroz branco cozido 145 g')
  })

  it('metas: fator de atividade, meta calórica e g/kg', async () => {
    const { user } = await openEditor()
    await user.click(screen.getByRole('button', { name: /Metas e cálculo/ }))
    expect(screen.getByText('Basal (Mifflin-St Jeor)').nextSibling).toHaveTextContent('1.894 kcal')
    expect(screen.getByText('Gasto total').nextSibling).toHaveTextContent('2.935 kcal')

    await user.click(within(screen.getByRole('radiogroup', { name: 'Objetivo calórico' })).getByRole('radio', { name: 'Déficit de 20%' }))
    expect(screen.getByRole('button', { name: /Metas e cálculo/ })).toHaveTextContent('2.348 kcal')
    await user.click(within(screen.getByRole('radiogroup', { name: 'Fator de atividade' })).getByRole('radio', { name: /Leve/ }))
    expect(screen.getByRole('button', { name: /Metas e cálculo/ })).toHaveTextContent('2.083 kcal')

    await user.click(screen.getByRole('button', { name: 'Aumentar Proteína em gramas por quilo' }))
    expect(screen.getByRole('group', { name: 'Proteína em gramas por quilo' })).toHaveTextContent('2 g/kg')
    expect(screen.getByRole('button', { name: /Metas e cálculo/ })).toHaveTextContent('P 183')
    expect(screen.getByText('alterações não salvas')).toBeInTheDocument()
  })

  it('alimentos: quantidade, substituições, adicionar e remover; salva', async () => {
    const { user } = await openEditor()
    const almoco = () => meal('Almoço')
    await user.click(within(almoco()).getByRole('button', { name: 'Aumentar Quantidade de Peito de frango grelhado' }))
    expect(within(almoco()).getByRole('group', { name: 'Quantidade de Peito de frango grelhado' })).toHaveTextContent('160 g')

    // Substituição: tira a tilápia e põe de volta pelo "+"
    await user.click(within(almoco()).getByRole('button', { name: 'Remover substituição Filé de tilápia grelhado' }))
    await user.click(within(almoco()).getByRole('button', { name: '+ Filé de tilápia grelhado' }))
    expect(within(within(almoco()).getByRole('listitem', { name: 'Peito de frango grelhado' })).getByText('Filé de tilápia grelhado').parentElement).toHaveTextContent('265 g')

    // Adicionar pela tabela (filtro por grupo) e remover
    await user.click(within(almoco()).getByRole('button', { name: '+ Adicionar alimento' }))
    const sheet = await screen.findByRole('dialog', { name: 'Adicionar a: Almoço' })
    await user.click(within(within(sheet).getByRole('group', { name: 'Grupo de alimentos' })).getByRole('button', { name: 'Gorduras' }))
    await user.click(within(sheet).getByRole('button', { name: 'Adicionar Abacate ao Almoço' }))
    await waitFor(() => expect(within(almoco()).getByRole('listitem', { name: 'Abacate' })).toHaveTextContent('100 g'))
    await user.click(within(almoco()).getByRole('button', { name: 'Remover Brócolis cozido' }))
    expect(within(almoco()).queryByRole('listitem', { name: 'Brócolis cozido' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '+ Nova refeição' }))
    expect(meal('Nova refeição')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))
    expect(await screen.findByText('Dieta salva')).toBeInTheDocument()
    const saved = await fetchJson('/api/coach/diets/diet_recomp_treino')
    const lunch = saved.meals.find((m: { name: string }) => m.name === 'Almoço')
    expect(lunch.foods.map((f: { foodId: string }) => f.foodId)).toEqual(['arroz_integral', 'feijao', 'frango', 'azeite', 'abacate'])
    expect(saved.meals).toHaveLength(7)
    const list = await fetchJson('/api/coach/diets')
    expect(list.templates.find((d: { id: string }) => d.id === 'diet_recomp_treino').meals).toBe(7)
  })

  it('cópia do aluno: abre no peso dele e a aba Dieta do perfil mostra o que foi salvo', async () => {
    const { user } = await openEditor('/dietas/diet_recomp_treino?aluno=stu_marcos')
    expect(screen.getByText(/^Marcos Lima · /)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar para o aluno' })).toHaveAttribute('href', '/alunos/stu_marcos?aba=dieta')
    await user.click(within(meal('Almoço')).getByRole('button', { name: 'Remover Azeite de oliva' }))
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))
    expect(await screen.findByText('Dieta de Marcos salva')).toBeInTheDocument()

    const diet = await fetchJson('/api/coach/students/stu_marcos/diet')
    const training = diet.plan.variants.find((v: { id: string }) => v.id === 'diet_recomp_treino')
    expect(training.label).toBe('Dia de treino')
    const lunch = training.meals.find((m: { name: string }) => m.name === 'Almoço')
    expect(lunch.foods.map((f: { name: string }) => f.name)).not.toContain('Azeite de oliva')
    expect(lunch.foods[0].portion).toMatch(/^\d+ g$/)
  })

  it('nova dieta: cria um modelo e abre o editor', async () => {
    const { router } = renderApp('/dietas/nova')
    expect(await screen.findByRole('heading', { level: 1, name: 'Nova dieta' }, { timeout: 3000 })).toBeInTheDocument()
    expect(router.state.location.pathname).toMatch(/^\/dietas\/diet_\d+$/)
    expect(screen.getAllByText('Refeição sem alimentos.').length).toBeGreaterThan(0)
  })
})

describe('Editor de dieta (desktop)', () => {
  const original = window.matchMedia
  afterEach(() => {
    window.matchMedia = original
  })

  it('metas lado a lado, tabela de alimentos na refeição aberta e calorias por refeição', async () => {
    window.matchMedia = (query: string) => ({ ...original(query), matches: query === '(min-width: 1024px)' })
    const { user } = await openEditor()
    expect(screen.getByRole('region', { name: 'Cálculo das metas' })).toHaveTextContent('Taxa metabólica basal1.894 kcal')
    const table = screen.getByRole('region', { name: 'Adicionar a: Almoço' })
    await user.type(within(table).getByRole('searchbox', { name: 'Buscar alimento' }), 'salm')
    await user.click(within(table).getByRole('button', { name: 'Adicionar Salmão grelhado ao Almoço' }))
    expect(within(meal('Almoço')).getByRole('listitem', { name: 'Salmão grelhado' })).toBeInTheDocument()

    await user.click(within(meal('Almoço')).getByRole('button', { name: /Almoço/ }))
    expect(screen.getByRole('region', { name: 'Adicionar a: abra uma refeição' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Abra uma refeição para adicionar Salmão grelhado' })).toBeDisabled()
    expect(screen.getByRole('region', { name: 'Calorias por refeição' })).toHaveTextContent('Almoço')
  })
})
