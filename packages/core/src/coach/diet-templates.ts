import { differenceInCalendarDays } from 'date-fns'
import { parseIsoDate, shortDate } from '../format/date'
import type { DietCandidate, DietGoal, DietTemplateSummary } from '../schemas/diet-templates'
import type { AssignCandidate } from './plan-templates'

export const dietGoalLabel: Record<DietGoal, string> = {
  recomposition: 'Recomposição',
  fatLoss: 'Emagrecimento',
  hypertrophy: 'Hipertrofia',
  maintenance: 'Manutenção',
}

const fold = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

export function filterDietTemplates(list: DietTemplateSummary[], f: { archived: boolean; query: string; goal: DietGoal | null }): DietTemplateSummary[] {
  const q = fold(f.query.trim())
  return list.filter((t) => t.archived === f.archived && (!q || fold(t.name).includes(q)) && (!f.goal || t.goal === f.goal))
}

/** Parte de cada macro nas calorias (a barra do card): proteína e carboidrato 4 kcal/g, gordura 9. */
export function macroShares(m: { protein: number; carbs: number; fat: number }) {
  const total = m.protein * 4 + m.carbs * 4 + m.fat * 9 || 1
  return { protein: (m.protein * 4) / total, carbs: (m.carbs * 4) / total, fat: (m.fat * 9) / total }
}

/** Alunos do "Atribuir dieta": sem dieta primeiro, depois quem vence antes; arquivados fora. */
export function dietCandidates(list: DietCandidate[], now: Date): (AssignCandidate & { weightKg: number | null })[] {
  return list
    .filter((c) => c.status !== 'archived')
    .sort((a, b) => (a.current?.until ?? '').localeCompare(b.current?.until ?? '') || a.name.localeCompare(b.name, 'pt-BR'))
    .map((c) => {
      const base = { id: c.studentId, name: c.name, weightKg: c.weightKg }
      if (!c.current) return { ...base, meta: c.status === 'pending' ? 'Sem dieta · pendente' : 'Sem dieta', tone: 'warning' as const }
      const days = differenceInCalendarDays(parseIsoDate(c.current.until), now)
      if (days < 0) return { ...base, meta: 'Dieta atual vencida', tone: 'danger' as const }
      if (days <= 1) return { ...base, meta: days === 0 ? 'Dieta atual vence hoje' : 'Dieta atual vence amanhã', tone: 'danger' as const }
      return { ...base, meta: `${c.current.name} até ${shortDate(parseIsoDate(c.current.until))}`, tone: 'muted' as const }
    })
}
