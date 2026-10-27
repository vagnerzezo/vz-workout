import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { MonthHistory } from '@workspace/core'
import { api } from '../../../shared/api/client'
import { workoutKeys } from './queries'

export const historyKeys = {
  all: [...workoutKeys.all, 'history'] as const,
  month: (month: string) => [...historyKeys.all, month] as const,
}

export function useMonthHistory(month: string) {
  return useQuery({
    queryKey: historyKeys.month(month),
    queryFn: () => api(`/me/sessions?month=${month}`, MonthHistory),
    placeholderData: keepPreviousData, // ao trocar de mês, mantém o anterior na tela até o novo chegar
  })
}
