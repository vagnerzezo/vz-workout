import { useSearchParams } from 'react-router'
import type { levelLabel, PlanGoal } from '@workspace/core'

type Level = keyof typeof levelLabel

export type PlanTab = 'templates' | 'assigned' | 'archived'

export const planTabs: { tab: PlanTab; param: string; label: [string, string] }[] = [
  { tab: 'templates', param: 'modelos', label: ['Modelos', 'Modelos'] },
  { tab: 'assigned', param: 'atribuidas', label: ['Atribuídas a alunos', 'Atribuídas'] },
  { tab: 'archived', param: 'arquivadas', label: ['Arquivadas', 'Arquivo'] },
]

const goalParams: Record<PlanGoal, string> = { hypertrophy: 'hipertrofia', fatLoss: 'emagrecimento', strength: 'forca', conditioning: 'condicionamento' }
const levelParams: Record<Level, string> = { beginner: 'iniciante', intermediate: 'intermediario', advanced: 'avancado' }
const keyOf = <K extends string>(map: Record<K, string>, value: string | null) => (Object.keys(map) as K[]).find((k) => map[k] === value) ?? null

/** `?aba=atribuidas&busca=ppl&objetivo=forca&nivel=iniciante&atribuir=stu_a,stu_b` (o último vem da lista de alunos). */
export function usePlanParams() {
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
  const goal = keyOf(goalParams, params.get('objetivo'))
  const level = keyOf(levelParams, params.get('nivel'))
  return {
    tab: planTabs.find((t) => t.param === params.get('aba'))?.tab ?? 'templates',
    query: params.get('busca') ?? '',
    goal,
    level,
    assignTo: params.get('atribuir')?.split(',').filter(Boolean) ?? [],
    setTab: (t: PlanTab) => update({ aba: t === 'templates' ? null : planTabs.find((x) => x.tab === t)!.param }),
    setQuery: (q: string) => update({ busca: q || null }),
    setGoal: (g: PlanGoal | null) => update({ objetivo: g ? goalParams[g] : null }),
    toggleLevel: (l: Level) => update({ nivel: level === l ? null : levelParams[l] }),
    clearAssignTo: () => update({ atribuir: null }),
  }
}
