import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../../../test/render-app'

// Relógio fixo: quarta, 21/10/2026, 20h. No jsdom as versões desktop e celular estão as duas na tela.

async function openProfile(path = '/alunos/stu_renato') {
  const utils = renderApp(path)
  await screen.findByRole('heading', { level: 1, name: 'Renato Alves' }, { timeout: 3000 })
  return utils
}
const tabs = () => screen.getByRole('navigation', { name: 'Seções do aluno' })

describe('Perfil do aluno', () => {
  it('cabeçalho, números e ações', async () => {
    await openProfile()
    expect(screen.getByText('renato.alves@email.com · (51) 99876-5432 · 33 anos')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Adesão de 92% em 30 dias' })).toBeInTheDocument()
    expect(screen.getByText('Aluno desde 06/2026 · plano até 15/12')).toBeInTheDocument()

    const stats = screen.getByRole('region', { name: 'Resumo do aluno' })
    expect(stats).toHaveTextContent('Adesão 30 dias92%')
    expect(stats).toHaveTextContent('Último treinoOntem') // o Treino C de hoje ainda não foi feito no app
    expect(stats).toHaveTextContent('Peso atual82,4 kg−2,6')
    expect(stats).toHaveTextContent('Próximo check-in23/10')

    expect(screen.getByRole('link', { name: 'Mensagem' })).toHaveAttribute('href', '/chat/conv_renato')
    expect(screen.getByRole('link', { name: 'Notificar' })).toHaveAttribute('href', '/notificacoes/nova?alunos=stu_renato')
    expect(screen.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute('href', 'https://wa.me/5551998765432')
    expect(within(screen.getByRole('main')).getByRole('link', { name: 'Alunos' })).toHaveAttribute('href', '/alunos')
  })

  it('resumo: ponto de atenção, peso de 12 semanas e últimos treinos', async () => {
    await openProfile()
    expect(within(tabs()).getByRole('link', { name: 'Resumo' })).toHaveAttribute('aria-current', 'page')
    expect(await within(tabs()).findByRole('link', { name: /Check-ins.*1 aguardando resposta/ })).toBeInTheDocument()

    expect(screen.getByText('Dor no joelho direito')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Responder check-in' })).toHaveAttribute('href', '/check-ins/revisar/ci_renato_9')
    expect(screen.getByRole('img', { name: 'Peso de 85,0 kg em 01/08 para 82,4 kg em 14/10, meta de 76,0 kg' })).toBeInTheDocument()

    const recent = screen.getByRole('region', { name: 'Últimos treinos' })
    expect(within(recent).getAllByRole('listitem')).toHaveLength(3)
  })

  it('o peso que o aluno registra no app aparece no painel', async () => {
    const res = await fetch('/api/me/weights', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kg: 81.9 }) })
    expect(res.status).toBe(201)
    await openProfile()
    expect(screen.getByRole('region', { name: 'Resumo do aluno' })).toHaveTextContent('Peso atual81,9 kg−3,1')
  })

  it('histórico pela aba (URL)', async () => {
    const user = userEvent.setup()
    const { router } = await openProfile()
    await user.click(within(tabs()).getByRole('link', { name: 'Histórico' }))
    expect(router.state.location.search).toBe('?aba=historico')
    const table = await screen.findByRole('region', { name: 'Histórico de treinos' })
    const first = within(table).getAllByRole('row')[1]!
    expect(first).toHaveTextContent('20/10')
    expect(first).toHaveTextContent(/Treino B — Pull/)
  })

  it('check-ins: o que aguarda resposta abre primeiro; dá para abrir os anteriores', async () => {
    const user = userEvent.setup()
    await openProfile('/alunos/stu_renato?aba=check-ins')
    const opened = await screen.findByRole('region', { name: 'Check-in de 21/10' })
    expect(within(opened).getByText('aguardando sua resposta')).toBeInTheDocument()
    expect(within(opened).getByText(/Joelho direito, na descida do agachamento hack/)).toBeInTheDocument()
    expect(within(opened).getByRole('link', { name: 'Responder check-in' })).toHaveAttribute('href', '/check-ins/revisar/ci_renato_9')

    await user.click(screen.getByRole('link', { name: /07\/10 · quinzenal/ }))
    const old = await screen.findByRole('region', { name: 'Check-in de 07/10' })
    expect(within(old).getByText('respondido por você em 08/10')).toBeInTheDocument()
    expect(within(old).getByText(/Vamos subir 100 kcal no jantar/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /07\/10 · quinzenal/ })).toHaveAttribute('aria-current', 'true')
  })

  it('informações: dados, anamnese e configurações que salvam', async () => {
    const user = userEvent.setup()
    await openProfile('/alunos/stu_renato?aba=info')
    expect(screen.getByRole('region', { name: 'Dados pessoais' })).toHaveTextContent('Nascimento12/05/1993 (33 anos)')
    expect(within(screen.getByRole('region', { name: 'Anamnese' })).getByText(/Desconforto no joelho direito/)).toHaveClass('text-warning')
    expect(screen.getByRole('region', { name: 'Plano e acesso' })).toHaveTextContent('PagamentoEm dia')

    await user.click(screen.getByRole('switch', { name: 'Mostrar dieta no app' }))
    expect(await screen.findByText('Mostrar dieta no app: desligado')).toBeInTheDocument()
    await user.selectOptions(screen.getByRole('combobox', { name: 'Frequência do check-in' }), 'weekly')
    expect(await screen.findByText('Check-in semanal')).toBeInTheDocument()

    // Volta da API com o que foi salvo
    const settings = await (await fetch('/api/coach/students/stu_renato')).json()
    expect(settings.settings).toMatchObject({ showDiet: false, checkInFrequency: 'weekly' })
  })

  it('treino: escolher o treino pela URL, virar rascunho e remover exercício', async () => {
    const user = userEvent.setup()
    const { router } = await openProfile('/alunos/stu_renato?aba=treino')
    const plans = await screen.findByRole('region', { name: 'Fichas do aluno' })
    const dayB = within(plans).getByRole('button', { name: /Treino B/ })
    await user.click(dayB)
    expect(router.state.location.search).toContain('treino=')
    expect(dayB).toHaveAttribute('aria-pressed', 'true')
    const detail = screen.getByRole('region', { name: /^Treino B — / })

    // Remover o primeiro exercício (confirma no diálogo); o app do aluno deixa de ver
    const exercises = () => within(within(detail).getAllByRole('list')[0]!).getAllByRole('listitem')
    const first = exercises()[0]!
    const removeButton = within(first).getByRole('button', { name: /^Remover / })
    const name = removeButton.getAttribute('aria-label')!.replace('Remover ', '')
    const before = exercises().length
    await user.click(removeButton)
    await user.click(within(await screen.findByRole('alertdialog', { name: `Remover ${name}?` })).getByRole('button', { name: 'Remover' }))
    expect(await screen.findByText(`${name} removido`)).toBeInTheDocument()
    expect(exercises()).toHaveLength(before - 1)

    // Rascunho: o switch (desktop e celular estão os dois no DOM)
    await user.click(screen.getAllByRole('switch', { name: /Visível para o aluno: Treino B/ })[0]!)
    expect(await screen.findByText(/Treino B — .* virou rascunho/)).toBeInTheDocument()
    expect(within(plans).getByText('FORA DO TREINO · RASCUNHOS')).toBeInTheDocument()

    const plan = await (await fetch('/api/coach/students/stu_renato/workout-plan')).json()
    const day = plan.plan.days.find((d: { letter: string }) => d.letter === 'B')
    expect(plan.hiddenDayIds).toContain(day.id)
    expect(day.exercises).toHaveLength(before - 1)
  })

  it('treino no celular: séries válidas com − e +', async () => {
    const user = userEvent.setup()
    await openProfile('/alunos/stu_renato?aba=treino')
    const steppers = await screen.findAllByRole('group', { name: /^Séries válidas de / })
    const stepper = steppers[0]!
    const label = stepper.getAttribute('aria-label')!
    const value = () => Number(within(screen.getByRole('group', { name: label })).getByRole('status').textContent)
    const start = value()
    await user.click(within(stepper).getByRole('button', { name: /^Aumentar/ }))
    await waitFor(() => expect(value()).toBe(start + 1))
  })

  it('dieta: metas e fichas; a da nutricionista não tem Editar', async () => {
    await openProfile('/alunos/stu_renato?aba=dieta')
    const goals = await screen.findByRole('region', { name: 'Metas diárias' })
    expect(within(goals).getByText('Calorias')).toBeInTheDocument()
    expect(goals).toHaveTextContent(/Refeições concluídas nos últimos 7 dias: \d+%/)
    const plans = screen.getByRole('region', { name: 'Fichas de dieta' })
    expect(within(plans).queryByRole('link', { name: 'Editar' })).not.toBeInTheDocument()
    expect(plans).toHaveTextContent('Dieta montada por Paula Mendes (CRN-2 12345)')
  })

  it('dieta montada pelo treinador pode ser editada', async () => {
    renderApp('/alunos/stu_marcos?aba=dieta')
    const plans = await screen.findByRole('region', { name: 'Fichas de dieta' }, { timeout: 3000 })
    const edit = within(plans).getAllByRole('link', { name: 'Editar' })[0]!
    expect(edit.getAttribute('href')).toBe('/dietas/diet_recomp_treino?aluno=stu_marcos')
    expect(within(plans).getByRole('link', { name: '+ Nova ficha de dieta' })).toHaveAttribute('href', '/dietas/nova?aluno=stu_marcos')
  })

  it('avaliação: troca de protocolo pela URL', async () => {
    const user = userEvent.setup()
    const { router } = await openProfile('/alunos/stu_renato?aba=avaliacao')
    const protocol = await screen.findByRole('radiogroup', { name: 'Protocolo' })
    expect(within(protocol).getByRole('radio', { name: 'Pollock 7 dobras' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('region', { name: 'Dobras cutâneas (7)' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Composição corporal' })).toHaveTextContent('Gordura corporal')
    expect(screen.getByText(/Jackson & Pollock 7 dobras para homens/)).toBeInTheDocument()

    await user.click(within(protocol).getByRole('radio', { name: 'Pollock 3 dobras' }))
    expect(router.state.location.search).toContain('protocolo=pollock3')
    const folds = screen.getByRole('region', { name: 'Dobras cutâneas (3)' })
    expect(within(folds).getAllByRole('row')).toHaveLength(1 + 3 + 1) // cabeçalho, 3 dobras e soma

    await user.click(within(protocol).getByRole('radio', { name: 'Bioimpedância' }))
    expect(screen.getByText('Valores registrados manualmente a partir do relatório da balança.')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Perímetros' })).toHaveTextContent('Cintura')
  })

  it('arquivar pelo menu leva para os arquivados', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/alunos/stu_marcos')
    await screen.findByRole('heading', { level: 1, name: 'Marcos Lima' }, { timeout: 3000 })
    await user.click(screen.getByRole('button', { name: 'Mais ações' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Arquivar' }))
    await user.click(within(await screen.findByRole('alertdialog', { name: 'Arquivar Marcos Lima?' })).getByRole('button', { name: 'Arquivar' }))
    await waitFor(() => expect(router.state.location.search).toBe('?aba=arquivados'), { timeout: 3000 })
    expect(await screen.findByText('Marcos Lima foi arquivado')).toBeInTheDocument()
  })

  it('aluno que não existe', async () => {
    renderApp('/alunos/stu_nao_existe')
    expect(await screen.findByRole('heading', { name: 'Aluno não encontrado' }, { timeout: 3000 })).toBeInTheDocument()
  })
})
