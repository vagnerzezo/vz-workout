import type { PlanTemplateSummary } from '@workspace/core'
import { toIsoDate } from '@workspace/core'

type Seed = Omit<PlanTemplateSummary, 'updatedAt' | 'studentsUsing' | 'archived'> & { updatedDaysAgo: number; archived?: boolean; usedBy: number }

/** Os 8 modelos do canvas (com quantos alunos ativos usam cada um, somando 52) e 5 arquivados. */
const seeds: Seed[] = [
  { id: 'tpl_ppl', name: 'Hipertrofia — Push/Pull/Legs + Upper/Lower', split: 'ABCDE · Push, Pull, Legs, Upper, Lower', goal: 'hypertrophy', level: 'intermediate', atHome: false, daysPerWeek: 5, durationWeeks: 10, phaseCount: 4, usedBy: 18, updatedDaysAgo: 7 },
  { id: 'tpl_ul', name: 'Hipertrofia — Upper/Lower 4x', split: 'ABCD · Upper, Lower, Upper, Lower', goal: 'hypertrophy', level: 'intermediate', atHome: false, daysPerWeek: 4, durationWeeks: 8, phaseCount: 3, usedBy: 9, updatedDaysAgo: 19 },
  { id: 'tpl_full', name: 'Full body iniciante', split: 'ABC alternado · corpo inteiro', goal: 'hypertrophy', level: 'beginner', atHome: false, daysPerWeek: 3, durationWeeks: 6, phaseCount: 2, usedBy: 11, updatedDaysAgo: 31 },
  { id: 'tpl_cut', name: 'Emagrecimento — força + cardio', split: 'ABC · força com circuito metabólico', goal: 'fatLoss', level: 'beginner', atHome: false, daysPerWeek: 3, durationWeeks: 8, phaseCount: 2, usedBy: 7, updatedDaysAgo: 21 },
  { id: 'tpl_hiit', name: 'Emagrecimento — 4x com HIIT', split: 'ABCD · 2 força, 2 HIIT', goal: 'fatLoss', level: 'intermediate', atHome: false, daysPerWeek: 4, durationWeeks: 8, phaseCount: 3, usedBy: 4, updatedDaysAgo: 10 },
  { id: 'tpl_5x5', name: 'Força — 5x5 adaptado', split: 'AB · agachamento, supino, terra, desenvolvimento', goal: 'strength', level: 'intermediate', atHome: false, daysPerWeek: 3, durationWeeks: 12, phaseCount: 4, usedBy: 2, updatedDaysAgo: 46 },
  { id: 'tpl_glute', name: 'Glúteos e posterior — foco', split: 'ABCD · 2 inferiores com ênfase em glúteo', goal: 'hypertrophy', level: 'advanced', atHome: false, daysPerWeek: 4, durationWeeks: 10, phaseCount: 4, usedBy: 1, updatedDaysAgo: 3 },
  { id: 'tpl_home', name: 'Condicionamento em casa', split: 'ABC · peso corporal e elásticos', goal: 'conditioning', level: 'beginner', atHome: true, daysPerWeek: 3, durationWeeks: 6, phaseCount: 2, usedBy: 0, updatedDaysAgo: 54 },
  { id: 'tpl_old_ppl', name: 'Hipertrofia — PPL 2025', split: 'ABC · Push, Pull, Legs', goal: 'hypertrophy', level: 'intermediate', atHome: false, daysPerWeek: 3, durationWeeks: 8, phaseCount: 3, usedBy: 0, updatedDaysAgo: 210, archived: true },
  { id: 'tpl_old_summer', name: 'Projeto verão — circuito', split: 'ABC · circuito metabólico', goal: 'fatLoss', level: 'beginner', atHome: false, daysPerWeek: 3, durationWeeks: 6, phaseCount: 2, usedBy: 0, updatedDaysAgo: 260, archived: true },
  { id: 'tpl_old_run', name: 'Corrida + força complementar', split: 'AB · força para corredores', goal: 'conditioning', level: 'intermediate', atHome: false, daysPerWeek: 2, durationWeeks: 8, phaseCount: 2, usedBy: 0, updatedDaysAgo: 300, archived: true },
  { id: 'tpl_old_abc', name: 'ABC clássico', split: 'ABC · peito/tríceps, costas/bíceps, pernas', goal: 'hypertrophy', level: 'beginner', atHome: false, daysPerWeek: 3, durationWeeks: 8, phaseCount: 2, usedBy: 0, updatedDaysAgo: 330, archived: true },
  { id: 'tpl_old_531', name: 'Força — 5/3/1', split: 'ABCD · um básico por dia', goal: 'strength', level: 'advanced', atHome: false, daysPerWeek: 4, durationWeeks: 12, phaseCount: 4, usedBy: 0, updatedDaysAgo: 365, archived: true },
]

export function planTemplates(now: Date): PlanTemplateSummary[] {
  return seeds.map(({ updatedDaysAgo, usedBy: _usedBy, archived, ...t }) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    d.setDate(d.getDate() - updatedDaysAgo)
    return { ...t, updatedAt: toIsoDate(d), studentsUsing: 0, archived: archived ?? false }
  })
}

/** Quantos alunos ativos (na ordem da carteira) começam usando cada modelo. */
export const initialUsage: [string, number][] = seeds.filter((s) => s.usedBy > 0).map((s) => [s.id, s.usedBy])
