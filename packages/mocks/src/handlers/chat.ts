import { http, HttpResponse } from 'msw'
import type { Conversation, Message, MessageBody } from '@workspace/core'
import { currentScenario, db, latency, newId } from '../db'
import { renatoConversation } from '../fixtures/renato-chat'

const coach = { name: 'Carlos Oliveira', responseTime: 'responde em até 2 h' }

export function conversation(now: Date): Message[] {
  const base = currentScenario() === 'novo' ? [] : renatoConversation(now)
  return [...base, ...db.sentMessages]
}

/** Há mensagem do treinador que o aluno ainda não viu? (bolinha do chat na Home) */
export const hasUnreadMessages = (now: Date) => !db.chatOpened && conversation(now).some((m) => m.from === 'coach')

/** No navegador vira URL local para tocar/mostrar; nos testes (sem createObjectURL), fica sem. */
const fileUrl = (file: Blob) => (typeof URL.createObjectURL === 'function' ? URL.createObjectURL(file) : null)
const MAX_BYTES = 25 * 1024 * 1024

export const chatHandlers = [
  http.get('/api/me/conversation', async () => {
    await latency()
    if (currentScenario() === 'erro') return HttpResponse.json({ message: 'Erro simulado' }, { status: 500 })
    db.chatOpened = true
    return HttpResponse.json<Conversation>({ coach, messages: conversation(new Date()) })
  }),

  // Texto em JSON; foto, vídeo e áudio em FormData (`file`, `type` e `durationSec` no áudio)
  http.post('/api/me/conversation/messages', async ({ request }) => {
    let body: MessageBody
    if (request.headers.get('content-type')?.includes('application/json')) {
      const { text } = (await request.json()) as { text?: string }
      if (!text?.trim() || text.length > 2000) return HttpResponse.json({ message: 'Mensagem vazia' }, { status: 422 })
      body = { type: 'text', text: text.trim() }
    } else {
      const form = await request.formData()
      const file = form.get('file')
      const type = form.get('type')
      // Sem `instanceof File`: no Node a classe do FormData é outra
      if (!file || typeof file === 'string' || (file as Blob).size > MAX_BYTES) {
        return HttpResponse.json({ message: 'Arquivo inválido' }, { status: 422 })
      }
      const url = fileUrl(file as Blob)
      if (type === 'audio') body = { type: 'audio', url, durationSec: Math.max(1, Number(form.get('durationSec')) || 1) }
      else if (type === 'image' || type === 'video') body = { type, url }
      else return HttpResponse.json({ message: 'Tipo inválido' }, { status: 422 })
    }
    await latency()
    const message: Message = { id: newId('msg'), from: 'student', sentAt: new Date().toISOString(), status: 'sent', body }
    db.sentMessages = [...db.sentMessages, message]
    return HttpResponse.json<Message>(message, { status: 201 })
  }),
]
