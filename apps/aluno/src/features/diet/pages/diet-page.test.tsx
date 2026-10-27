import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { setScenario } from '@workspace/mocks/handlers'
import { renderApp } from '../../../test/render-app'

const meals = () => screen.getByRole('region', { name: 'Refeições' }).querySelectorAll('li')
const mealItem = (name: string) => [...meals()].find((li) => li.textContent?.includes(name))!
const week = () => screen.getByRole('navigation', { name: 'Dias da semana' })

async function openDiet(path = '/dieta') {
  const utils = renderApp(path)
  await screen.findByRole('region', { name: 'Balanço do dia' })
  return utils
}

describe('Dieta do dia', () => {
  it('mostra o plano de hoje com o balanço e a próxima refeição', async () => {
    await openDiet()
    expect(screen.getByText('Plano atualizado pela nutri em 13/10')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Dia de treino' })).toHaveAttribute('aria-checked', 'true')

    const balance = screen.getByRole('region', { name: 'Balanço do dia' })
    expect(within(balance).getByRole('img', { name: '1.240 de 2.127 kcal' })).toBeInTheDocument()
    expect(within(balance).getByText('Proteínas').nextElementSibling).toHaveTextContent('92 / 160 g')
    expect(balance).toHaveTextContent('Faltam 887 kcal no plano de hoje')

    expect(screen.getByText('3 de 6 concluídas')).toBeInTheDocument()
    expect(within(mealItem('Pré-treino')).getByText('PRÓXIMA')).toBeInTheDocument()
    expect(within(mealItem('Café da manhã')).getByRole('button', { name: 'Desmarcar Café da manhã' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(mealItem('Almoço')).getByText('5 alimentos · 610 kcal')).toBeInTheDocument()
    expect(within(mealItem('Almoço')).getByRole('link')).toHaveAttribute('href', '/dieta/refeicoes/almoco?dia=2026-10-21')

    expect(within(week()).getByRole('button', { name: 'segunda-feira, 19, 95% do plano' })).toBeInTheDocument()
    expect(within(week()).getByRole('button', { name: 'quarta-feira, 21, hoje, 58% do plano' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(week()).getByRole('button', { name: 'quinta-feira, 22' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Dieta' })).toHaveAttribute('aria-current', 'page')
  })

  it('concluir uma refeição atualiza o balanço, a próxima e a Home', async () => {
    const user = userEvent.setup()
    const { router } = await openDiet()
    await user.click(within(mealItem('Pré-treino')).getByRole('button', { name: 'Concluir Pré-treino' }))

    expect(screen.getByRole('img', { name: '1.540 de 2.127 kcal' })).toBeInTheDocument()
    expect(within(mealItem('Jantar')).getByText('PRÓXIMA')).toBeInTheDocument()
    await waitFor(() => expect(within(week()).getByRole('button', { name: /quarta-feira, 21, hoje, 72% do plano/ })).toBeInTheDocument())

    await router.navigate('/')
    expect(await screen.findByRole('img', { name: '1.540 de 2.127 kcal consumidas' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Próxima refeição: Jantar às 20:00' })).toBeInTheDocument()
  })

  it('trocar a ficha do dia muda as refeições e a meta, também pelo teclado', async () => {
    const user = userEvent.setup()
    await openDiet()
    await user.click(screen.getByRole('radio', { name: 'Dia de descanso' }))
    expect(screen.getByRole('radio', { name: 'Dia de descanso' })).toHaveAttribute('aria-checked', 'true')
    expect(meals()).toHaveLength(5)
    expect(screen.getByRole('img', { name: '1.240 de 1.827 kcal' })).toBeInTheDocument()

    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('radio', { name: 'Refeição livre' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'Refeição livre' })).toHaveFocus()
    expect(mealItem('Refeição livre')).toBeTruthy()
  })

  it('dia anterior: mostra o que foi feito, sem água e sem "próxima"', async () => {
    const user = userEvent.setup()
    const { router } = await openDiet()
    await user.click(within(week()).getByRole('button', { name: /terça-feira, 20/ }))

    expect(router.state.location.search).toBe('?dia=2026-10-20')
    await waitFor(() => expect(screen.getByText('6 de 6 concluídas')).toBeInTheDocument())
    expect(screen.getByText('Meta de calorias do dia cumprida')).toBeInTheDocument()
    expect(screen.queryByText('PRÓXIMA')).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Água' })).not.toBeInTheDocument()
  })

  it('dia futuro: refeições só para consulta', async () => {
    await openDiet('/dieta?dia=2026-10-22')
    await waitFor(() => expect(screen.getByText('0 de 5 concluídas')).toBeInTheDocument()) // quinta não tem treino: ficha de descanso
    expect(within(mealItem('Jantar')).getByRole('button', { name: 'Concluir Jantar' })).toBeDisabled()
  })

  it('a água é a mesma da Home', async () => {
    const user = userEvent.setup()
    const { router } = await openDiet()
    const water = await screen.findByRole('region', { name: 'Água' })
    await user.click(within(water).getByRole('button', { name: '+1 L' }))
    await waitFor(() => expect(within(water).getByText('2,25 L')).toBeInTheDocument())

    await router.navigate('/')
    await screen.findByRole('heading', { level: 1, name: /, Renato$/ })
    const homeWater = await screen.findByRole('region', { name: 'Água' })
    expect(within(homeWater).getByText('2,25 L')).toBeInTheDocument()
  })

  it('abre as observações da nutricionista', async () => {
    const user = userEvent.setup()
    await openDiet()
    await user.click(screen.getByRole('button', { name: 'Observações da nutricionista' }))
    const dialog = await screen.findByRole('dialog', { name: 'Observações da nutricionista' })
    expect(within(dialog).getByText(/uma vez por semana/)).toBeInTheDocument()
  })

  it('aluno sem dieta vê o aviso', async () => {
    setScenario('sem-ficha')
    renderApp('/dieta')
    expect(await screen.findByRole('heading', { name: 'Sua dieta ainda não chegou' })).toBeInTheDocument()
  })

  it('mostra erro com "Tentar de novo" e recupera', async () => {
    const user = userEvent.setup()
    setScenario('erro')
    renderApp('/dieta')
    const retry = await screen.findByRole('button', { name: 'Tentar de novo' })
    setScenario(null)
    await user.click(retry)
    expect(await screen.findByRole('region', { name: 'Balanço do dia' })).toBeInTheDocument()
  })
})
