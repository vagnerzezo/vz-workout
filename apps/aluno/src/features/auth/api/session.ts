import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Anamnesis } from '@workspace/core'
import { Invite, PublicBranding, RecoveryStarted, RecoveryVerified } from '@workspace/core'
import { api, ApiError } from '../../../shared/api/client'
import { meKeys } from '../../../shared/api/me'
import { useCheckInDraft } from '../../profile/store/check-in-draft'
import { useActiveWorkout } from '../../workout/store/active-workout'

/** Marca do treinador antes do login. */
export function useBranding() {
  return useQuery({ queryKey: ['public', 'branding'], queryFn: () => api('/public/branding', PublicBranding), staleTime: Infinity })
}

/** POST que pode responder sem corpo (201/204). Erros viram ApiError com a mensagem da API. */
async function post(path: string, body: unknown) {
  const res = await fetch(`/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { message?: string; attemptsLeft?: number }
    throw Object.assign(new ApiError(res.status, data.message ?? 'Erro'), { attemptsLeft: data.attemptsLeft })
  }
  const text = await res.text() // 201/204 podem vir sem corpo
  return text ? JSON.parse(text) : null
}

export type AuthError = ApiError & { attemptsLeft?: number }

/** Depois de entrar, busca o aluno de novo (o guard libera as telas). */
function useSignedIn() {
  const qc = useQueryClient()
  return () => qc.resetQueries({ queryKey: meKeys.me })
}

export function useLogin() {
  const signedIn = useSignedIn()
  return useMutation({
    mutationFn: (v: { login: string; password: string }) => post('/auth/login', v),
    onSuccess: signedIn,
  })
}

/** Sai e limpa o que é do aluno neste aparelho: cache, treino em andamento e rascunho do check-in. */
export function useLogout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => post('/auth/logout', {}),
    onSuccess: () => {
      useActiveWorkout.getState().reset()
      useCheckInDraft.getState().reset()
      qc.clear()
    },
  })
}

export function useStartRecovery() {
  return useMutation({
    mutationFn: async (v: { login: string; channel: 'whatsapp' | 'email' }) => RecoveryStarted.parse(await post('/auth/recovery', v)),
  })
}

export function useVerifyRecovery() {
  return useMutation({
    mutationFn: async (code: string) => RecoveryVerified.parse(await post('/auth/recovery/verify', { code })),
  })
}

export function useResetPassword() {
  const signedIn = useSignedIn()
  return useMutation({
    mutationFn: (v: { token: string; password: string }) => post('/auth/recovery/reset', v),
    onSuccess: signedIn,
  })
}

/** Convite do treinador (código com 6 letras e números). null = código não encontrado ou já usado. */
export function useInvite(code: string) {
  return useQuery({
    queryKey: ['public', 'invite', code],
    queryFn: async () => {
      try {
        return await api(`/auth/invites/${code}`, Invite)
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) return null
        throw e
      }
    },
    enabled: code.length === 6,
    retry: false,
    staleTime: Infinity,
  })
}

/** Cria a senha com os aceites e já entra no app. */
export function useAcceptInvite() {
  const signedIn = useSignedIn()
  return useMutation({
    mutationFn: ({ code, ...body }: { code: string; password: string; terms: boolean; health: boolean }) => post(`/auth/invites/${code}/accept`, body),
    onSuccess: signedIn,
  })
}

export function useSaveAnamnesis() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (anamnesis: Anamnesis) => post('/me/anamnesis', anamnesis),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  })
}
