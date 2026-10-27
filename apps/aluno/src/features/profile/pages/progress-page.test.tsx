import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { setScenario } from '@workspace/mocks/handlers'
import { renderApp } from '../../../test/render-app'

const region = (name: string) => screen.getByRole('region', { name })

async function openProgress(path = '/perfil/progresso') {
  const utils = renderApp(path)
  await screen.findByRole('region', { name: 'Peso' })
  return utils
}

describe('Progresso', () => {
  it('peso: gráfico de 90 dias com a meta; 30 dias encurta a janela', async () => {
    const user = userEvent.setup()
    await openProgress()
    const peso = region('Peso')
    expect(within(peso).getByRole('radio', { name: '90 dias' })).toBeChecked()
    expect(peso).toHaveTextContent('82,4 kg−2,6 kg em 90 dias')
    expect(within(peso).getByRole('img')).toHaveAccessibleName('Peso de 85,0 a 82,4 kg entre 01/08 e 14/10. Meta de 76 kg')

    await user.click(within(peso).getByRole('radio', { name: '30 dias' }))
    expect(peso).toHaveTextContent('−0,6 kg em 30 dias')
    expect(within(peso).getByRole('img')).toHaveAccessibleName('Peso de 83,0 a 82,4 kg entre 26/09 e 14/10. Meta de 76 kg')
  })

  it('carga: 8 semanas do exercício escolhido', async () => {
    const user = userEvent.setup()
    await openProgress()
    const carga = region('Progressão de carga')
    expect(within(carga).getAllByRole('radio').map((r) => r.closest('label')?.textContent)).toEqual([
      'Supino inclinado (máquina)',
      'Puxada alta',
      'Agachamento hack (máquina)',
    ])
    expect(within(carga).getByRole('radio', { name: 'Supino inclinado (máquina)' })).toBeChecked()
    const bars = () => within(carga).getByRole('list').getAttribute('aria-label')!
    expect(bars()).toMatch(/^Carga da melhor série por semana: S36 .+, S43 [\d,]+ kg$/)
    expect(within(carga).getByText('Melhor série').nextElementSibling).toHaveTextContent(/^[\d,]+ kg × \d+$/)
    expect(within(carga).getByText('Em 8 semanas').nextElementSibling).toHaveTextContent(/^[+−][\d,]+ kg$/)

    const supino = bars()
    await user.click(within(carga).getByRole('radio', { name: 'Agachamento hack (máquina)' }))
    expect(bars()).not.toBe(supino)
  })

  it('medidas: antes e agora com a diferença', async () => {
    await openProgress()
    const medidas = region('Medidas')
    expect(medidas).toHaveTextContent('01/08 → 17/10, em cm')
    const row = (name: string) => within(medidas).getByRole('rowheader', { name }).closest('tr')!
    expect(row('Cintura')).toHaveTextContent('Cintura9894−4')
    expect(row('Braço (contraído)')).toHaveTextContent('3738,5+1,5')
  })

  it('fotos: ângulo e data de comparação', async () => {
    const user = userEvent.setup()
    await openProgress()
    const fotos = region('Fotos de evolução')
    expect(within(fotos).getByRole('tab', { name: 'Frente' })).toHaveAttribute('aria-selected', 'true')
    expect(within(fotos).getByRole('img', { name: 'Antes: frente, 01/08 (foto indisponível)' })).toBeInTheDocument()
    expect(within(fotos).getByRole('img', { name: 'Agora: frente, 17/10 (foto indisponível)' })).toBeInTheDocument()
    expect(fotos).toHaveTextContent('85,0 kg')

    await user.click(within(fotos).getByRole('radio', { name: '01/09' }))
    expect(within(fotos).getByText('Antes · 01/09')).toBeInTheDocument()
    expect(fotos).toHaveTextContent('83,9 kg')

    await user.click(within(fotos).getByRole('tab', { name: 'Lado' }))
    expect(within(fotos).getByRole('img', { name: 'Antes: lado, 01/09 (foto indisponível)' })).toBeInTheDocument()
  })

  it('o Perfil abre o Progresso; os atalhos levam à seção certa', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/perfil')
    await user.click(await screen.findByRole('link', { name: 'Fotos de evolução' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/perfil/progresso'), { timeout: 3000 })
    expect(router.state.location.hash).toBe('#fotos')
    expect(await screen.findByRole('region', { name: 'Fotos de evolução' })).toHaveAttribute('id', 'fotos')
    expect(screen.getByRole('link', { name: 'Voltar ao perfil' })).toHaveAttribute('href', '/perfil')
  })

  it('aluno novo: explica o que vai aparecer em cada seção', async () => {
    setScenario('novo')
    await openProgress()
    expect(region('Peso')).toHaveTextContent('Registre seu peso no Perfil')
    expect(region('Medidas')).toHaveTextContent('Suas medidas aparecem aqui depois do primeiro check-in.')
    expect(region('Fotos de evolução')).toHaveTextContent('As fotos dos seus check-ins aparecem aqui.')
  })

  it('erro ao carregar', async () => {
    setScenario('erro')
    renderApp('/perfil/progresso')
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar seu progresso')
  })
})
