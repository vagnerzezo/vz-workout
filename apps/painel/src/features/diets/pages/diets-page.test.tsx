import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../../../test/render-app'

// Relógio fixo: quarta, 21/10/2026, 20h.

async function openPage(path = '/dietas') {
  const user = userEvent.setup()
  const utils = renderApp(path)
  await screen.findByRole('heading', { level: 1, name: 'Fichas de dieta' }, { timeout: 3000 })
  await screen.findByRole('region', { name: /Modelos de dieta|Dietas arquivadas/ }, { timeout: 3000 }).catch(() => null)
  return { user, ...utils }
}

const card = (name: string) => screen.getByRole('article', { name })
const tab = (name: RegExp) => within(screen.getByRole('tablist', { name: 'Tipo de ficha' })).getByRole('tab', { name })

describe('Fichas de dieta', () => {
  it('modelos com metas, macros e contagens', async () => {
    await openPage()
    expect(tab(/Modelos/)).toHaveTextContent('6')
    expect(tab(/Atribuídas a alunos/)).toHaveTextContent('52')
    expect(tab(/Arquivadas/)).toHaveTextContent('4')

    const recomp = card('Dia de treino — recomposição')
    expect(recomp).toHaveTextContent('6 refeições · 12 substituições')
    expect(recomp).toHaveTextContent('Recomposição')
    expect(recomp).toHaveTextContent('2.127')
    expect(recomp).toHaveTextContent('P 174 gC 194 gG 73 g')
    expect(within(recomp).getByRole('img', { name: 'Proteína 33%, carboidrato 36%, gordura 31% das calorias' })).toBeInTheDocument()
    expect(recomp).toHaveTextContent('19 alunos · atualizada em 13/10')
    expect(within(recomp).getByRole('link', { name: 'Dia de treino — recomposição' })).toHaveAttribute('href', '/dietas/diet_recomp_treino')
  })

  it('filtra por objetivo e busca; duplicar e arquivar', async () => {
    const { user, router } = await openPage()
    await user.click(within(screen.getByRole('group', { name: 'Objetivo' })).getByRole('button', { name: 'Emagrecimento' }))
    expect(router.state.location.search).toBe('?objetivo=emagrecimento')
    expect(within(screen.getByRole('region', { name: 'Modelos de dieta' })).getAllByRole('article')).toHaveLength(2)
    await user.type(screen.getByRole('searchbox', { name: 'Buscar ficha de dieta' }), 'low')
    expect(within(screen.getByRole('region', { name: 'Modelos de dieta' })).getAllByRole('article')).toHaveLength(1)

    await user.click(within(card('Low carb 1.800 kcal')).getByRole('button', { name: 'Duplicar Low carb 1.800 kcal' }))
    expect(await screen.findByRole('article', { name: 'Low carb 1.800 kcal (cópia)' })).toHaveTextContent('nenhum aluno · atualizada hoje')

    await user.click(within(card('Low carb 1.800 kcal')).getByRole('button', { name: 'Mais ações para Low carb 1.800 kcal' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Arquivar' }))
    expect(await screen.findByText('Low carb 1.800 kcal foi arquivada')).toBeInTheDocument()
    await user.click(tab(/Arquivadas/))
    expect(within(await screen.findByRole('region', { name: 'Dietas arquivadas' })).getByRole('article', { name: 'Low carb 1.800 kcal' })).toBeInTheDocument()
  })

  it('atribuir ajustando ao peso de cada aluno', async () => {
    const { user } = await openPage()
    await user.click(within(card('Emagrecimento 1.600 kcal')).getByRole('button', { name: 'Atribuir Emagrecimento 1.600 kcal' }))
    const drawer = await screen.findByRole('dialog', { name: 'Atribuir dieta' })
    expect(within(drawer).getByText('Emagrecimento 1.600 kcal · modelo para 70,0 kg')).toBeInTheDocument()
    expect(within(drawer).getByRole('switch', { name: /Ajustar ao peso de cada aluno/ })).toBeChecked()
    expect(within(within(drawer).getByRole('list', { name: 'Alunos' })).getAllByRole('listitem')[0]).toHaveTextContent('Sem dieta · pendente')

    await user.type(within(drawer).getByRole('searchbox', { name: 'Buscar aluno' }), 'renato')
    const renato = within(drawer).getByRole('checkbox', { name: 'Renato Alves' }).closest('label')!
    expect(renato).toHaveTextContent('1.883 kcal') // 1.600 × 82,4 ÷ 70
    expect(renato).toHaveTextContent('82,4 kg · P 153 g')
    await user.click(within(drawer).getByRole('switch', { name: /Ajustar ao peso/ }))
    expect(renato).toHaveTextContent('1.600 kcal')
    await user.click(within(drawer).getByRole('switch', { name: /Ajustar ao peso/ }))

    await user.click(within(drawer).getByRole('checkbox', { name: 'Renato Alves' }))
    await user.click(within(drawer).getByRole('button', { name: 'Atribuir a 1 aluno' }))
    expect(await within(drawer).findByText('Dieta atribuída a 1 aluno')).toBeInTheDocument()
    expect(within(drawer).getByText('Porções ajustadas ao peso de cada um · início em 26/10')).toBeInTheDocument()

    const list = await (await fetch('/api/coach/diets')).json()
    expect(list.assigned.find((a: { studentId: string }) => a.studentId === 'stu_renato')).toMatchObject({ planName: 'Emagrecimento 1.600 kcal', validUntil: '2026-12-20' })
    await user.click(within(drawer).getByRole('button', { name: 'Fechar' }))
    await waitFor(() => expect(card('Emagrecimento 1.600 kcal')).toHaveTextContent('16 alunos'))
  })

  it('atribuídas: a dieta de cada aluno leva à aba Dieta do perfil', async () => {
    const { user } = await openPage('/dietas?aba=atribuidas')
    const list = await screen.findByRole('list', { name: 'Dietas dos alunos' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(52)
    await user.type(screen.getByRole('searchbox', { name: 'Buscar aluno ou dieta' }), 'renato')
    const link = within(screen.getByRole('list', { name: 'Dietas dos alunos' })).getByRole('link')
    expect(link).toHaveAttribute('href', '/alunos/stu_renato?aba=dieta')
    expect(link).toHaveTextContent('Dia de treino — recomposição + Dia de descanso — recomposição')
  })
})
