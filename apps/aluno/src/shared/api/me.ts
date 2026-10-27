import { useQuery } from '@tanstack/react-query'
import { Me } from '@workspace/core'
import { api, ApiError } from './client'

export const meKeys = {
  me: ['me'] as const,
}

/** Sem sessão (401) não adianta tentar de novo: o guard manda para /entrar. */
export const isUnauthorized = (error: unknown) => error instanceof ApiError && error.status === 401

/** Aluno logado e a marca do treinador. Muda pouco: busca uma vez por sessão. */
export function useMe() {
  return useQuery({
    queryKey: meKeys.me,
    queryFn: () => api('/me', Me),
    staleTime: Infinity,
    retry: (count, error) => !isUnauthorized(error) && count < 1,
  })
}
