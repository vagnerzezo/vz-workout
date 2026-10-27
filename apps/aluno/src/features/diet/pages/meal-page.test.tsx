import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../../../test/render-app'

const foods = () => within(screen.getByRole('region', { name: 'Alimentos' })).getAllByRole('listitem')
const subtitle = () => screen.getByRole('heading', { level: 1 }).nextElementSibling
const food = (name: string) => foods().find((li) => li.textContent?.includes(name))!

async function openMeal(path = '/dieta/refeicoes/pre') {
  const utils = renderApp(path)
  await screen.findByRole('heading', { level: 1 })
  return utils
}

describe('Detalhe da refeição', () => {
  it('mostra os alimentos, os macros e a observação da nutri', async () => {
    await openMeal()
    expect(screen.getByRole('heading', { level: 1, name: 'Pré-treino' })).toBeInTheDocument()
    expect(screen.getByText('PRÓXIMA REFEIÇÃO')).toBeInTheDocument()
    expect(subtitle()).toHaveTextContent('16:00 · 3 alimentos · 300 kcal')
    expect(screen.getByText('PROT').closest('div')).toHaveTextContent('20 g')
    expect(screen.getByText('CARB').closest('div')).toHaveTextContent('40 g')
    expect(screen.getByText('GORD').closest('div')).toHaveTextContent('8 g')
    expect(screen.getByRole('region', { name: 'OBSERVAÇÃO DA NUTRI' })).toHaveTextContent('60 a 90 minutos antes do treino')

    expect(foods()).toHaveLength(3)
    expect(within(food('Tapioca')).getByText('1 unidade média')).toBeInTheDocument()
    expect(within(food('Tapioca')).getByRole('button', { name: 'Ver 2 substituições' })).toHaveAttribute('aria-expanded', 'false')
    expect(within(food('Pasta de amendoim')).queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar para a dieta' })).toHaveAttribute('href', '/dieta')
  })

  it('trocar um alimento recalcula a refeição e o dia; voltar ao original desfaz', async () => {
    const user = userEvent.setup()
    const { router } = await openMeal()
    await user.click(within(food('Tapioca')).getByRole('button', { name: 'Ver 2 substituições' }))

    const options = within(screen.getByRole('group', { name: 'Opções para Tapioca' }))
    expect(options.getByRole('radio', { name: /Tapioca/ })).toBeChecked()
    await user.click(options.getByRole('radio', { name: /Pão francês/ }))

    expect(options.getByRole('radio', { name: /Pão francês/ })).toBeChecked()
    expect(subtitle()).toHaveTextContent('3 alimentos · 310 kcal')
    expect(food('Pão francês')).toHaveTextContent('Substituição escolhida · original: Tapioca 1 unidade média')

    await user.click(screen.getByRole('button', { name: 'Concluir refeição' }))
    expect(screen.getByRole('button', { name: 'Refeição concluída' })).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('link', { name: 'Voltar para a dieta' }))
    expect(await screen.findByRole('img', { name: '1.550 de 2.127 kcal' })).toBeInTheDocument()
    expect(screen.getByText('4 de 6 concluídas')).toBeInTheDocument()

    await router.navigate('/dieta/refeicoes/pre')
    await screen.findByRole('heading', { level: 1, name: 'Pré-treino' })
    await user.click(within(food('Pão francês')).getByRole('button', { name: 'Ver 2 substituições' }))
    await user.click(screen.getByRole('radio', { name: /Tapioca/ }))
    expect(subtitle()).toHaveTextContent('3 alimentos · 300 kcal')
    expect(screen.queryByText(/Substituição escolhida/)).not.toBeInTheDocument()
  })

  it('o card da linha do tempo abre a refeição do dia escolhido', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/dieta?dia=2026-10-20')
    const almoco = await screen.findByRole('link', { name: /Almoço/ })
    await user.click(almoco)

    expect(router.state.location.pathname).toBe('/dieta/refeicoes/almoco')
    expect(await screen.findByRole('heading', { level: 1, name: 'Almoço' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Refeição concluída' })).toBeInTheDocument()
    expect(screen.queryByText('PRÓXIMA REFEIÇÃO')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar para a dieta' })).toHaveAttribute('href', '/dieta?dia=2026-10-20')
  })

  it('dia futuro: dá para escolher substituições, mas não concluir', async () => {
    const user = userEvent.setup()
    await openMeal('/dieta/refeicoes/jantar?dia=2026-10-22')
    expect(screen.getByRole('button', { name: 'Concluir refeição' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Concluir refeição' })).toHaveAccessibleDescription('Você poderá concluir no dia da refeição.')

    await user.click(within(food('Batata-doce')).getByRole('button', { name: 'Ver 2 substituições' }))
    await user.click(screen.getByRole('radio', { name: /Mandioquinha/ }))
    await waitFor(() => expect(food('Mandioquinha')).toHaveTextContent('original: Batata-doce 150 g'))
  })

  it('refeição que não está na ficha do dia', async () => {
    await openMeal('/dieta/refeicoes/nao-existe')
    expect(screen.getByRole('heading', { name: 'Refeição não encontrada' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver as refeições do dia' })).toHaveAttribute('href', '/dieta')
  })
})
