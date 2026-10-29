import { useSearchParams } from 'react-router'
import type { DietGoal } from '@workspace/core'
import { planTabs, type PlanTab } from '../../plans/hooks/use-plan-params'

const goalParams: Record<DietGoal, string> = { recomposition: 'recomposicao', fatLoss: 'emagrecimento', hypertrophy: 'hipertrofia', maintenance: 'manutencao' }

/** `?aba=atribuidas&busca=low&objetivo=emagrecimento` (as abas são as mesmas da lista de fichas). */
export function useDietParams() {
  const [params, setParams] = useSearchParams()
  const update = (changes: Record<string, string | null>) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [key, value] of Object.entries(changes)) {
          if (value) next.set(key, value)
          else next.delete(key)
        }
        return next
      },
      { replace: true, preventScrollReset: true },
    )
  return {
    tab: planTabs.find((t) => t.param === params.get('aba'))?.tab ?? 'templates',
    query: params.get('busca') ?? '',
    goal: (Object.keys(goalParams) as DietGoal[]).find((g) => goalParams[g] === params.get('objetivo')) ?? null,
    setTab: (t: PlanTab) => update({ aba: t === 'templates' ? null : planTabs.find((x) => x.tab === t)!.param }),
    setQuery: (q: string) => update({ busca: q || null }),
    setGoal: (g: DietGoal | null) => update({ objetivo: g ? goalParams[g] : null }),
  }
}
