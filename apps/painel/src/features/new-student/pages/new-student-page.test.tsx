import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { renderApp } from '../../../test/render-app'

// Relógio fixo: quarta, 21/10/2026, 20h. O setup responde "não" ao matchMedia: a tela abre como página (celular).

async function openPage() {
  const user = userEvent.setup()
  const utils = renderApp('/alunos/novo')
  await screen.findByRole('form', { name: 'Novo aluno' }, { timeout: 3000 })
  return { user, ...utils }
}

const radio = (group: string, name: string | RegExp) => within(screen.getByRole('radiogroup', { name: group })).getByRole('radio', { name })

describe('Novo aluno', () => {
  it('cabeçalho com as vagas do plano e valores iniciais', async () => {
    await openPage()
    expect(screen.getByRole('heading', { level: 1, name: 'Novo aluno' })).toBeInTheDocument()
    expect(screen.getByText('52 de 80 vagas do plano Pro em uso')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar para alunos' })).toHaveAttribute('href', '/alunos')
    expect(radio('Modalidade', 'Online')).toHaveAttribute('aria-checked', 'true')
    expect(radio('Plano', /Mensal/)).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByLabelText('Começa em')).toHaveValue('2026-10-21')
    expect(screen.getByText('21/11/2026')).toBeInTheDocument() // vence em 1 mês
    expect(screen.getByText('A cobrança de R$ 230,00 vai junto com o acesso')).toBeInTheDocument()
    expect(radio('Ficha de treino', 'Montar depois da anamnese')).toHaveAttribute('aria-checked', 'true')
    expect(radio('Como enviar o acesso', /^E-mail/)).toBeDisabled()
  })

  it('pede nome e sobrenome e o WhatsApp com DDD', async () => {
    const { user } = await openPage()
    await user.type(screen.getByLabelText('Nome completo'), 'Joana')
    await user.click(screen.getByRole('button', { name: 'Criar aluno e gerar acesso' }))
    expect(await screen.findByText('Digite nome e sobrenome')).toBeInTheDocument()
    expect(screen.getByText('DDD + 9 dígitos')).toBeInTheDocument()
    expect(screen.getByLabelText('Nome completo')).toHaveAttribute('aria-invalid', 'true')
  })

  it('WhatsApp de quem já é aluno: avisa e leva ao perfil', async () => {
    const { user } = await openPage()
    await user.type(screen.getByLabelText('WhatsApp'), '51988771234')
    expect(await screen.findByText(/Este número já é de Pedro Nunes/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Abra o perfil' })).toHaveAttribute('href', '/alunos/stu_pedro')
    expect(screen.getByRole('button', { name: 'Criar aluno e gerar acesso' })).toBeDisabled()
  })

  it('cria o aluno com plano pago e envio por e-mail; vira pendente na lista e o convite funciona', async () => {
    const { user, router } = await openPage()
    await user.type(screen.getByLabelText('Nome completo'), 'Joana Prado')
    await user.type(screen.getByLabelText('WhatsApp'), '51991234567')
    await user.tab()
    expect(screen.getByLabelText('WhatsApp')).toHaveValue('(51) 99123-4567')
    expect(screen.getByText('Será o login do aluno · (51) 99123-4567')).toBeInTheDocument()
    await user.type(screen.getByLabelText(/^E-mail/), 'joana@email.com')
    await user.click(radio('Plano', /Trimestral/))
    expect(screen.getByText('21/01/2027')).toBeInTheDocument()
    await user.click(screen.getByRole('switch', { name: /Primeiro pagamento já recebido/ }))
    expect(screen.getByText('Plano ativo até 21/01/2027, sem cobrança agora')).toBeInTheDocument()
    await user.click(radio('Ficha de treino', 'Upper/Lower 4x'))
    await user.click(radio('Como enviar o acesso', /^E-mail/))
    await user.click(screen.getByRole('button', { name: 'Criar aluno e gerar acesso' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Aluno cadastrado' })).toBeInTheDocument()
    const done = screen.getByRole('region', { name: 'Acesso criado' })
    expect(within(done).getByText('Acesso criado para Joana')).toBeInTheDocument()
    expect(done).toHaveTextContent('Plano Trimestral ativo até 21/01/2027 · online · convite enviado para joana@email.com')
    const code = within(done).getByText(/^[A-Z0-9]{3}-[A-Z0-9]{3}$/).textContent!
    expect(screen.getByText(/^Oi, Joana! Aqui é o Kaue, da Team Oliveira/)).toHaveTextContent(`Código: ${code}`)
    expect(screen.getByRole('link', { name: 'Enviar no WhatsApp' }).getAttribute('href')).toMatch(/^https:\/\/wa\.me\/5551991234567\?text=Oi%2C%20Joana!/)
    expect(screen.queryByRole('region', { name: 'QR Code para escanear' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Mostrar QR Code na tela' }))
    expect(screen.getByRole('img', { name: 'QR Code do link de primeiro acesso de Joana' })).toBeInTheDocument()

    // O convite abre no primeiro acesso do app do aluno
    const invite = await (await fetch(`/api/auth/invites/${code}`)).json()
    expect(invite).toMatchObject({ fullName: 'Joana Prado', phone: '(51) 99123-4567', email: 'joana@email.com' })

    const profile = screen.getByRole('link', { name: 'Ver perfil' })
    expect(profile.getAttribute('href')).toMatch(/^\/alunos\/stu_novo_\d+$/)
    await user.click(profile)
    expect(await screen.findByRole('heading', { level: 1, name: 'Joana Prado' }, { timeout: 3000 })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe(profile.getAttribute('href'))

    await router.navigate('/alunos?aba=pendentes')
    expect(await screen.findAllByText('Joana Prado', {}, { timeout: 3000 })).not.toHaveLength(0)
  })

  it('presencial: o acesso vai por QR Code, que já aparece; "Cadastrar outro" limpa o formulário', async () => {
    const { user } = await openPage()
    await user.type(screen.getByLabelText('Nome completo'), 'Caio Ramos')
    await user.type(screen.getByLabelText('WhatsApp'), '51990001111')
    await user.click(radio('Modalidade', 'Presencial'))
    expect(radio('Como enviar o acesso', /Mostrar QR Code agora/)).toHaveAttribute('aria-checked', 'true')
    await user.click(screen.getByRole('button', { name: 'Criar aluno e gerar acesso' }))

    expect(await screen.findByRole('region', { name: 'QR Code para escanear' })).toHaveTextContent('Peça para Caio apontar a câmera do celular')
    expect(screen.getByRole('region', { name: 'Acesso criado' })).toHaveTextContent('Cobrança de R$ 230,00 enviada junto · presencial')

    await user.click(screen.getByRole('button', { name: 'Cadastrar outro' }))
    expect(await screen.findByLabelText('Nome completo')).toHaveValue('')
    expect(screen.getByRole('heading', { level: 1, name: 'Novo aluno' })).toBeInTheDocument()
  })

  describe('no desktop', () => {
    const original = window.matchMedia
    afterEach(() => {
      window.matchMedia = original
    })

    it('abre num painel lateral por cima da lista; fechar volta para /alunos', async () => {
      window.matchMedia = (query: string) => ({ ...original(query), matches: query === '(min-width: 1024px)' })
      const user = userEvent.setup()
      const { router } = renderApp('/alunos/novo')
      const sheet = await screen.findByRole('dialog', { name: 'Novo aluno' }, { timeout: 3000 })
      expect(await within(sheet).findByText('52 de 80 vagas do plano Pro em uso')).toBeInTheDocument()
      expect(await within(sheet).findByRole('form', { name: 'Novo aluno' })).toBeInTheDocument()
      expect(await screen.findByRole('heading', { level: 1, name: 'Alunos', hidden: true })).toBeInTheDocument() // a lista fica atrás

      await user.click(within(sheet).getByRole('button', { name: 'Fechar' }))
      await waitFor(() => expect(router.state.location.pathname).toBe('/alunos'))
    })
  })
})
