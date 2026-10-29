import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CoachConversation, CoachInbox, CoachMessage, type BroadcastAudience, type ShareKind } from '@workspace/core'
import { z } from 'zod'
import { api } from '../../../shared/api/client'
import { coachKeys } from '../../../shared/api/coach'

export const chatKeys = {
  inbox: ['chat', 'inbox'] as const,
  conversation: (id: string) => ['chat', 'conversation', id] as const,
}

/** Lista de conversas, atualizada de tempos em tempos (como o chat do app). */
export function useInbox() {
  return useQuery({ queryKey: chatKeys.inbox, queryFn: () => api('/coach/conversations', CoachInbox), refetchInterval: 15_000 })
}

/** Abrir marca como lida: a lista e o contador do menu recarregam. */
export function useConversation(id: string | null) {
  const qc = useQueryClient()
  return useQuery({
    queryKey: chatKeys.conversation(id ?? ''),
    enabled: !!id,
    refetchInterval: 15_000,
    queryFn: async () => {
      const c = await api(`/coach/conversations/${id}`, CoachConversation)
      void qc.invalidateQueries({ queryKey: chatKeys.inbox })
      void qc.invalidateQueries({ queryKey: coachKeys.counters })
      return c
    },
  })
}

async function send(path: string, method: 'PUT' | 'POST', body: unknown) {
  const res = await fetch(`/api${path}`, { method, credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res
}

/** Texto ou cartão (ficha, dieta): entra na conversa aberta e no topo da lista. */
export function useSendMessage(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { text: string } | { share: ShareKind }) => api(`/coach/conversations/${id}/messages`, CoachMessage, { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: (m) => {
      qc.setQueryData<CoachConversation>(chatKeys.conversation(id), (old) => old && { ...old, messages: [...old.messages, m] })
      return qc.invalidateQueries({ queryKey: chatKeys.inbox })
    },
  })
}

export function useConversationSetting(id: string, setting: 'notes' | 'muted' | 'only-coach') {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => send(`/coach/conversations/${id}/${setting}`, 'PUT', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: chatKeys.conversation(id) }),
  })
}

export function useAutoReply() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (enabled: boolean) => send('/coach/chat/auto-reply', 'PUT', { enabled }),
    onMutate: (enabled) => qc.setQueryData<CoachInbox>(chatKeys.inbox, (old) => old && { ...old, autoReply: { ...old.autoReply, enabled } }),
    onSettled: () => qc.invalidateQueries({ queryKey: chatKeys.inbox }),
  })
}

export function useBroadcast() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { audience: BroadcastAudience; text: string }) => z.object({ sent: z.number() }).parse(await (await send('/coach/broadcasts', 'POST', body)).json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chat'] }),
  })
}
