import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { DietDay, StudentDiet } from '@workspace/core'
import { api } from '../../../shared/api/client'

export const dietKeys = {
  all: ['diet'] as const,
  day: (date: string) => [...dietKeys.all, 'day', date] as const,
}

export function useDiet(date: string) {
  return useQuery({
    queryKey: dietKeys.day(date),
    queryFn: () => api(`/me/diet?date=${date}`, StudentDiet),
  })
}

/** Troca o dia no cache na hora; se a API recusar, volta. Depois recarrega a semana e a Home. */
function useDietDayMutation<V>(date: string, request: (v: V) => Promise<DietDay>, optimistic: (day: DietDay, v: V) => DietDay) {
  const qc = useQueryClient()
  const key = dietKeys.day(date)
  const setDay = (update: (day: DietDay) => DietDay) =>
    qc.setQueryData<StudentDiet>(key, (old) => (old?.day ? { ...old, day: update(old.day) } : old))

  return useMutation({
    mutationFn: request,
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData<StudentDiet>(key)?.day
      setDay((day) => optimistic(day, v))
      return { previous }
    },
    onError: (_error, _v, context) => {
      if (context?.previous) setDay(() => context.previous!)
    },
    onSuccess: (day) => setDay(() => day),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: dietKeys.all }) // percentuais da semana
      qc.invalidateQueries({ queryKey: ['home'] }) // "Nutrição de hoje" e "Próxima refeição"
    },
  })
}

export function useToggleMeal(date: string) {
  return useDietDayMutation(
    date,
    ({ mealId, done }: { mealId: string; done: boolean }) =>
      api(`/me/diet/days/${date}/meals/${mealId}`, DietDay, { method: 'PUT', body: JSON.stringify({ done }) }),
    (day, { mealId, done }) => {
      const rest = day.doneMealIds.filter((id) => id !== mealId)
      return { ...day, doneMealIds: done ? [...rest, mealId] : rest }
    },
  )
}

export function useChooseVariant(date: string) {
  return useDietDayMutation(
    date,
    (variantId: string) => api(`/me/diet/days/${date}`, DietDay, { method: 'PUT', body: JSON.stringify({ variantId }) }),
    (day, variantId) => ({ ...day, variantId }),
  )
}
