import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { setScenario } from '@workspace/mocks/handlers'
import { renderApp } from '../../../test/render-app'

const log = () => screen.getByRole('log', { name: 'Mensagens' })

async function openChat() {
  const utils = renderApp('/chat')
  await screen.findByRole('heading', { level: 1, name: 'Kaue Oliveira' })
  return utils
}

afterEach(() => vi.unstubAllGlobals())

describe('Chat', () => {
  it('mostra a conversa com separadores de dia, cartões e status', async () => {
    await openChat()
    expect(screen.getByText('Seu treinador · responde em até 2 h')).toBeInTheDocument()
    expect(within(log()).getByText('Ontem')).toBeInTheDocument()
    expect(within(log()).getByText('Hoje')).toBeInTheDocument()

    expect(within(log()).getByRole('link', { name: /Você concluiu o Treino C — Legs/ })).toHaveAttribute('href', '/treinos/historico?dia=2026-10-20')
    expect(within(log()).getByRole('link', { name: /Kaue atualizou sua ficha/ })).toHaveAttribute('href', '/treinos')
    expect(within(log()).getByText('Obrigado por avisar. Doeu na descida ou na subida?').closest('div')).toHaveTextContent('Treinador:')
    expect(within(log()).getByText('Na descida, quando passa da paralela.').parentElement?.nextElementSibling).toHaveTextContent('21:44 · Lida')
    expect(within(log()).getByRole('button', { name: 'Áudio de 0:42 (indisponível)' })).toBeDisabled()
  })

  it('enviar texto: aparece na hora e continua lá ao voltar', async () => {
    const user = userEvent.setup()
    const { router } = await openChat()
    await user.type(screen.getByRole('textbox', { name: 'Mensagem' }), 'Treino feito, joelho tranquilo!{Enter}')

    // Aparece na hora ("Enviando…") e é trocada pela resposta da API ("Enviada")
    await within(log()).findByText('Treino feito, joelho tranquilo!')
    expect(screen.getByRole('textbox', { name: 'Mensagem' })).toHaveValue('')
    await waitFor(() =>
      expect(within(log()).getByText('Treino feito, joelho tranquilo!').parentElement?.nextElementSibling).toHaveTextContent('20:00 · Enviada'),
    )

    await router.navigate('/')
    await router.navigate('/chat')
    expect(await within(await screen.findByRole('log')).findByText('Treino feito, joelho tranquilo!')).toBeInTheDocument()
  })

  it('respostas rápidas preenchem o campo', async () => {
    const user = userEvent.setup()
    await openChat()
    await user.click(screen.getByRole('button', { name: 'Não vou conseguir treinar hoje' }))
    expect(screen.getByRole('textbox', { name: 'Mensagem' })).toHaveValue('Kaue, hoje não vou conseguir treinar. Posso repor amanhã?')
    expect(screen.getByRole('button', { name: 'Enviar mensagem' })).toBeInTheDocument()
  })

  it('enviar foto', async () => {
    const user = userEvent.setup()
    await openChat()
    await user.upload(screen.getByLabelText('Enviar foto ou vídeo'), new File(['img'], 'prato.jpg', { type: 'image/jpeg' }))
    const photo = await within(log()).findByRole('img', { name: 'Foto enviada' })
    expect(photo.closest('div')).toHaveTextContent('Você:')
  })

  it('gravar e enviar áudio', async () => {
    const stopTrack = vi.fn()
    class FakeRecorder {
      mimeType = 'audio/webm'
      stream = { getTracks: () => [{ stop: stopTrack }] }
      ondataavailable: ((e: { data: Blob }) => void) | null = null
      onstop: (() => void) | null = null
      start() {}
      stop() {
        this.ondataavailable?.({ data: new Blob(['som'], { type: 'audio/webm' }) })
        this.onstop?.()
      }
    }
    vi.stubGlobal('MediaRecorder', FakeRecorder)
    vi.stubGlobal('navigator', Object.assign(Object.create(navigator), { mediaDevices: { getUserMedia: vi.fn().mockResolvedValue({}) } }))

    const user = userEvent.setup()
    await openChat()
    await user.click(screen.getByRole('button', { name: 'Gravar áudio' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Gravando 0:00')

    vi.setSystemTime(new Date(2026, 9, 21, 20, 0, 5)) // 5 segundos depois
    await user.click(screen.getByRole('button', { name: 'Parar e enviar áudio' }))
    expect(await within(log()).findByRole('button', { name: 'Ouvir áudio de 0:05' })).toBeEnabled()
    expect(stopTrack).toHaveBeenCalled() // microfone desligado
  })

  it('abrir a conversa apaga a bolinha de mensagens da Home', async () => {
    const { router } = renderApp('/')
    expect(await screen.findByRole('link', { name: 'Mensagens do treinador, há mensagens novas' })).toBeInTheDocument()
    await router.navigate('/chat')
    await screen.findByRole('heading', { level: 1, name: 'Kaue Oliveira' })
    await router.navigate('/')
    expect(await screen.findByRole('link', { name: 'Mensagens do treinador' })).toBeInTheDocument()
  })

  it('aluno novo: convite para a primeira mensagem', async () => {
    setScenario('novo')
    renderApp('/chat')
    expect(await screen.findByText('Mande sua primeira mensagem para o Kaue: dúvidas, dores, fotos da refeição.')).toBeInTheDocument()
  })
})
