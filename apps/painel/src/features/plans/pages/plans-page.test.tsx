import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../../../test/render-app'

// Relógio fixo: quarta, 21/10/2026, 20h.

async function openPage(path = '/fichas') {
  const user = userEvent.setup()
  const utils = renderApp(path)
  await screen.findByRole('heading', { level: 1, name: 'Fichas de treino' }, { timeout: 3000 })
  await screen.findByRole('region', { name: /Modelos|Fichas arquivadas/ }, { timeout: 3000 }).catch(() => null)
  return { user, ...utils }
}

const card = (name: string) => screen.getByRole('article', { name })
const tab = (name: RegExp) => within(screen.getByRole('tablist', { name: 'Tipo de ficha' })).getByRole('tab', { name })

describe('Fichas de treino', () => {
  it('modelos com as contagens do canvas', async () => {
    await openPage()
    expect(tab(/^Modelos/)).toHaveAttribute('aria-selected', 'true')
    expect(tab(/^Modelos/)).toHaveTextContent('8')
    expect(tab(/Atribuídas a alunos/)).toHaveTextContent('52')
    expect(tab(/Arquivadas/)).toHaveTextContent('5')

    const ppl = card('Hipertrofia — Push/Pull/Legs + Upper/Lower')
    expect(ppl).toHaveTextContent('ABCDE · Push, Pull, Legs, Upper, Lower')
    expect(ppl).toHaveTextContent('por semana5x')
    expect(ppl).toHaveTextContent('4 fases10 sem')
    expect(ppl).toHaveTextContent('alunos usando18')
    expect(ppl).toHaveTextContent('Atualizada em 14/10')
    expect(ppl).toHaveTextContent('18 alunos · atualizada há 7 dias')
    expect(within(ppl).getByRole('link', { name: 'Hipertrofia — Push/Pull/Legs + Upper/Lower' })).toHaveAttribute('href', '/fichas/tpl_ppl')
    expect(card('Condicionamento em casa')).toHaveTextContent('Em casa')
  })

  it('filtros na URL: objetivo, nível e busca', async () => {
    const { user, router } = await openPage()
    const goals = screen.getByRole('group', { name: 'Objetivo' })
    await user.click(within(goals).getByRole('button', { name: 'Emagrecimento' }))
    expect(router.state.location.search).toBe('?objetivo=emagrecimento')
    expect(within(screen.getByRole('region', { name: 'Modelos' })).getAllByRole('article')).toHaveLength(2)

    await user.click(within(screen.getByRole('group', { name: 'Nível' })).getByRole('button', { name: 'Intermediário' }))
    expect(within(screen.getByRole('region', { name: 'Modelos' })).getAllByRole('article').map((a) => a.getAttribute('aria-labelledby'))).toEqual(['ficha-tpl_hiit'])

    await user.click(within(goals).getByRole('button', { name: 'Todos' }))
    await user.type(screen.getByRole('searchbox', { name: 'Buscar ficha' }), 'glúteo')
    expect(within(screen.getByRole('region', { name: 'Modelos' })).queryAllByRole('article')).toHaveLength(0) // é Avançado
    await user.click(within(screen.getByRole('group', { name: 'Nível' })).getByRole('button', { name: 'Intermediário' }))
    expect(screen.getByRole('article', { name: 'Glúteos e posterior — foco' })).toBeInTheDocument()
  })

  it('duplicar e arquivar', async () => {
    const { user } = await openPage()
    await user.click(within(card('Full body iniciante')).getByRole('button', { name: 'Duplicar Full body iniciante' }))
    expect(await screen.findByText('Cópia de “Full body iniciante” criada')).toBeInTheDocument()
    expect(await screen.findByRole('article', { name: 'Full body iniciante (cópia)' })).toHaveTextContent('nenhum aluno · atualizada hoje')

    await user.click(within(card('Força — 5x5 adaptado')).getByRole('button', { name: 'Mais ações para Força — 5x5 adaptado' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Arquivar' }))
    expect(await screen.findByText('Força — 5x5 adaptado foi arquivada')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('article', { name: 'Força — 5x5 adaptado' })).not.toBeInTheDocument())

    await user.click(tab(/Arquivadas/))
    const archived = await screen.findByRole('region', { name: 'Fichas arquivadas' })
    expect(within(archived).getAllByRole('article')).toHaveLength(6)
    await user.click(within(card('Força — 5x5 adaptado')).getByRole('button', { name: 'Restaurar' }))
    expect(await screen.findByText('Força — 5x5 adaptado voltou para os modelos')).toBeInTheDocument()
  })

  it('atribuir: escolhe alunos, começa na próxima segunda e a vigência muda', async () => {
    const { user } = await openPage()
    await user.click(within(card('Hipertrofia — Upper/Lower 4x')).getByRole('button', { name: 'Atribuir Hipertrofia — Upper/Lower 4x' }))
    const drawer = await screen.findByRole('dialog', { name: 'Atribuir ficha' })
    expect(within(drawer).getByText('Hipertrofia — Upper/Lower 4x')).toBeInTheDocument()
    expect(within(drawer).getByLabelText('Começa em')).toHaveValue('2026-10-26')
    expect(within(drawer).getByRole('button', { name: 'Selecione os alunos' })).toBeDisabled()

    // Quem está sem ficha vem primeiro
    const people = within(within(drawer).getByRole('list', { name: 'Alunos' })).getAllByRole('listitem')
    expect(people[0]).toHaveTextContent(/Sem ficha · pendente/)

    await user.type(within(drawer).getByRole('searchbox', { name: 'Buscar aluno' }), 'ana paula')
    await user.click(within(drawer).getByRole('checkbox', { name: 'Ana Paula Reis' }))
    expect(within(drawer).getByText('Ficha atual vence amanhã')).toHaveClass('text-destructive')
    await user.click(within(drawer).getByRole('button', { name: 'Atribuir a 1 aluno' }))

    expect(await within(drawer).findByText('Ficha atribuída a 1 aluno')).toBeInTheDocument()
    expect(within(drawer).getByText('Os alunos recebem uma notificação na segunda-feira, 26/10.')).toBeInTheDocument()

    // A ficha nova vale 8 semanas: 26/10 a 20/12
    const list = await (await fetch('/api/coach/plans')).json()
    expect(list.assigned.find((a: { studentName: string }) => a.studentName === 'Ana Paula Reis')).toMatchObject({ planName: 'Hipertrofia — Upper/Lower 4x', validUntil: '2026-12-20' })
    await user.click(within(drawer).getByRole('button', { name: 'Fechar' }))
    await waitFor(() => expect(card('Hipertrofia — Upper/Lower 4x')).toHaveTextContent('alunos usando10'))
  })

  it('vindo da lista de alunos: os escolhidos já chegam marcados', async () => {
    const { user, router } = await openPage('/fichas?atribuir=stu_fernanda,stu_sofia')
    expect(await screen.findByText('Escolha a ficha para 2 alunos e toque em Atribuir')).toBeInTheDocument()
    await user.click(within(card('Full body iniciante')).getByRole('button', { name: 'Atribuir Full body iniciante' }))
    const drawer = await screen.findByRole('dialog', { name: 'Atribuir ficha' })
    expect(within(drawer).getByRole('checkbox', { name: 'Fernanda Luz' })).toBeChecked()
    expect(within(drawer).getByRole('checkbox', { name: 'Sofia Martins' })).toBeChecked()
    await user.click(within(drawer).getByRole('button', { name: 'Atribuir a 2 alunos' }))
    expect(await within(drawer).findByText('Ficha atribuída a 2 alunos')).toBeInTheDocument()
    await waitFor(() => expect(router.state.location.search).toBe(''))
  })

  it('atribuídas: a ficha de cada aluno leva para o perfil', async () => {
    const { user } = await openPage('/fichas?aba=atribuidas')
    const list = await screen.findByRole('list', { name: 'Fichas dos alunos' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(52)
    await user.type(screen.getByRole('searchbox', { name: 'Buscar aluno ou ficha' }), 'renato')
    const renato = within(screen.getByRole('list', { name: 'Fichas dos alunos' })).getByRole('link')
    expect(renato).toHaveAttribute('href', '/alunos/stu_renato?aba=treino')
    expect(renato).toHaveTextContent('Renato Alves')
    expect(renato).toHaveTextContent('Hipertrofia — Bloco 2')
  })
})
