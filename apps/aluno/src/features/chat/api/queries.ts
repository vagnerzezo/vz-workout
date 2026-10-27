import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Conversation, Message } from '@workspace/core'
import { api } from '../../../shared/api/client'

const key = ['conversation'] as const

/** A conversa recarrega sozinha a cada 15 s enquanto a tela está aberta (respostas do treinador). */
export function useConversation() {
  const qc = useQueryClient()
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const conversation = await api('/me/conversation', Conversation)
      qc.invalidateQueries({ queryKey: ['home'] }) // abrir a conversa apaga a bolinha de mensagens da Home
      return conversation
    },
    refetchInterval: 15_000,
  })
}

/** Mensagens que ainda não voltaram da API ficam com este prefixo no id ("Enviando…"). */
export const PENDING = 'pendente-'

export function useSendText() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (text: string) => api('/me/conversation/messages', Message, { method: 'POST', body: JSON.stringify({ text }) }),
    onMutate: async (text) => {
      await qc.cancelQueries({ queryKey: key })
      const temp: Message = { id: `${PENDING}${Date.now()}`, from: 'student', sentAt: new Date().toISOString(), status: 'sent', body: { type: 'text', text } }
      qc.setQueryData<Conversation>(key, (old) => old && { ...old, messages: [...old.messages, temp] })
      return { tempId: temp.id }
    },
    onError: (_e, _text, context) =>
      qc.setQueryData<Conversation>(key, (old) => old && { ...old, messages: old.messages.filter((m) => m.id !== context?.tempId) }),
    onSuccess: (message, _text, context) =>
      qc.setQueryData<Conversation>(key, (old) => old && { ...old, messages: old.messages.map((m) => (m.id === context?.tempId ? message : m)) }),
  })
}

/** Foto, vídeo ou áudio gravado. */
export function useSendFile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ file, type, durationSec }: { file: Blob; type: 'image' | 'video' | 'audio'; durationSec?: number }) => {
      const body = new FormData()
      body.set('file', file, file instanceof File ? file.name : `audio.${file.type.includes('mp4') ? 'm4a' : 'webm'}`)
      body.set('type', type)
      if (durationSec) body.set('durationSec', String(Math.round(durationSec)))
      return api('/me/conversation/messages', Message, { method: 'POST', body })
    },
    onSuccess: (message) => qc.setQueryData<Conversation>(key, (old) => old && { ...old, messages: [...old.messages, message] }),
  })
}
