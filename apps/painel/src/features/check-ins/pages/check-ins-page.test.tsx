import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { renderApp } from '../../../test/render-app'

// Relógio fixo: quarta, 21/10/2026, 20h. O setup responde "não" ao matchMedia: abre a versão do celular.

async function open(path = '/check-ins') {
  const user = userEvent.setup()
  const utils = renderApp(path)
  await screen.findAllByRole('heading', { level: 1 }, { timeout: 3000 }) // fila: "Check-ins"; revisão: o nome do aluno
  await screen.findByText(/aguardando|Aguardando/, {}, { timeout: 3000 })
  return { user, ...utils }
}

const fetchJson = async (url: string) => (await fetch(url)).json()

describe('Check-ins (celular)', () => {
  it('fila: resumo, dor e alertas primeiro, revisar em sequência', async () => {
    await open()
    const stats = await screen.findByRole('region', { name: 'Resumo dos check-ins' })
    expect(stats).toHaveTextContent('Aguardando6')
    expect(stats).toHaveTextContent('Mais de 48 h2')
    expect(stats).toHaveTextContent('No prazo87%')
    expect(screen.getByRole('link', { name: /Revisar em sequência/ })).toHaveAttribute('href', '/check-ins/revisar/ci_renato_9')

    const items = within(screen.getByRole('list', { name: 'Aguardando resposta' })).getAllByRole('link')
    // Dor primeiro; depois quem tem alerta (do mais antigo); depois o resto
    expect(items.map((a) => a.querySelector('.text-sm.font-extrabold')?.textContent)).toEqual(['Renato Alves', 'Ana Paula Reis', 'Pedro Nunes', 'Camila Rocha', 'Júlia Castro', 'Diego Santos'])
    expect(items[0]).toHaveTextContent('Relatou dor no joelho direito')
    expect(items[0]).toHaveTextContent('média 3,6/5')
  })

  it('revisar em sequência: responde com modelo pronto e vai para o próximo', async () => {
    const { user, router } = await open('/check-ins/revisar/ci_renato_9')
    expect(await screen.findByRole('heading', { level: 1, name: 'Renato Alves' })).toBeInTheDocument()
    expect(screen.getByText('1 de 6 · 6 aguardando')).toBeInTheDocument()
    expect(screen.getByRole('note', { name: 'Pontos de atenção' })).toHaveTextContent('Relatou dor no joelho direitoControle da fome caiu de 3 para 2')
    expect(screen.getByRole('img', { name: 'Controle da fome: 2 de 5, antes 3' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enviar e próximo' })).toBeDisabled()

    await user.click(within(screen.getByRole('group', { name: 'Respostas prontas' })).getByRole('button', { name: 'Atenção à dor' }))
    expect((screen.getByRole('textbox', { name: 'Resposta ao aluno' }) as HTMLTextAreaElement).value).toMatch(/^Renato, obrigado por avisar da dor/)
    await user.click(screen.getByRole('button', { name: 'Enviar e próximo' }))

    expect(await screen.findByText('Resposta enviada para Renato')).toBeInTheDocument()
    await waitFor(() => expect(router.state.location.pathname).toBe('/check-ins/revisar/ci_ana_5'))
    expect(await screen.findByText('2 de 6 · 5 aguardando')).toBeInTheDocument()

    // A resposta chega no perfil e sai da fila (contador do menu também)
    const profile = await fetchJson('/api/coach/students/stu_renato/check-ins')
    expect(profile[0]).toMatchObject({ id: 'ci_renato_9', status: 'answered', reply: expect.stringMatching(/^Renato, obrigado/) })
    const counters = await fetchJson('/api/coach/counters')
    expect(counters.pendingCheckIns).toBe(5)
  })

  it('pular não responde; a fila acaba em "Tudo respondido"', { timeout: 20_000 }, async () => {
    const { user } = await open('/check-ins/revisar/ci_diego_2')
    expect(await screen.findByText('6 de 6 · 6 aguardando')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Pular' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Renato Alves' })).toBeInTheDocument()
    for (let i = 0; i < 6; i++) {
      await user.type(await screen.findByRole('textbox', { name: 'Resposta ao aluno' }, { timeout: 3000 }), 'Ok!')
      await user.click(screen.getByRole('button', { name: /^Enviar/ }))
      // Espera a próxima revisão abrir (o aviso da anterior ainda pode estar na tela)
      if (i < 5) await screen.findByText(new RegExp(`· ${5 - i} aguardando$`), {}, { timeout: 3000 })
    }
    expect(await screen.findByRole('heading', { name: 'Tudo respondido' }, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.getByText('6 alunos receberam seu feedback no app.')).toBeInTheDocument()
  })

  it('respondidos e atrasados com lembrete', async () => {
    const { user } = await open('/check-ins?aba=respondidos')
    const done = within(await screen.findByRole('list', { name: 'Respondidos' })).getAllByRole('link')
    expect(done.length).toBeGreaterThan(5)
    expect(done[0]).toHaveTextContent('Thiago Alves')
    expect(done[0]).toHaveTextContent('Lido pelo aluno')

    await user.click(within(screen.getByRole('tablist', { name: 'Status' })).getByRole('tab', { name: /Atrasados/ }))
    const late = screen.getByRole('list', { name: 'Check-ins atrasados' })
    expect(within(late).getAllByRole('listitem')[0]).toHaveTextContent('Marcos Lima')
    expect(within(late).getAllByRole('listitem')[0]).toHaveTextContent('Quinzenal · vencia 18/10 · sem treinar há 7 dias')
    await user.click(within(within(late).getAllByRole('listitem')[0]!).getByRole('button', { name: 'Enviar lembrete' }))
    expect(await screen.findByText('Lembrete enviado para Marcos')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Enviar lembrete a todos (2)' }))
    expect(await screen.findByRole('button', { name: 'Lembretes enviados a todos' })).toBeDisabled()
  })
})

describe('Check-ins (desktop)', () => {
  const original = window.matchMedia
  afterEach(() => {
    window.matchMedia = original
  })

  it('lista e check-in aberto ao lado; responder abre o próximo', async () => {
    window.matchMedia = (query: string) => ({ ...original(query), matches: query === '(min-width: 1024px)' })
    const { user } = await open('/check-ins/revisar/ci_ana_5')
    const detail = await screen.findByRole('region', { name: 'Check-in selecionado' })
    expect(within(detail).getByRole('heading', { name: 'Ana Paula Reis' })).toBeInTheDocument()
    expect(within(detail).getByRole('note', { name: 'Pontos de atenção' })).toHaveTextContent('Fez uma pergunta')
    expect(screen.getByRole('region', { name: 'Resumo dos check-ins' })).toHaveTextContent('Respondidos na semana')

    await user.click(within(detail).getByRole('button', { name: 'Responder pergunta' }))
    await user.click(within(detail).getByRole('button', { name: 'Enviar e marcar como respondido' }))
    expect(await screen.findByText('Resposta enviada para Ana')).toBeInTheDocument()
    await waitFor(() => expect(within(screen.getByRole('region', { name: 'Check-in selecionado' })).getByRole('heading', { name: 'Renato Alves' })).toBeInTheDocument())
    expect(within(screen.getByRole('region', { name: 'Lista de check-ins' })).getAllByRole('button')).toHaveLength(5)
  })
})
