import { useQuery } from '@tanstack/react-query'
import { Me } from '@workspace/core'
import { api } from './client'

export const meKeys = {
  me: ['me'] as const,
}

/** Aluno logado e a marca do treinador. Muda pouco: busca uma vez por sessão. */
export function useMe() {
  return useQuery({
    queryKey: meKeys.me,
    queryFn: () => api('/me', Me),
    staleTime: Infinity,
  })
}
