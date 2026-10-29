import { describe, expect, it } from 'vitest'
import type { DietTemplateSummary } from '../schemas/diet-templates'
import { dietCandidates, filterDietTemplates, macroShares } from './diet-templates'

const now = new Date(2026, 9, 21, 20, 0)
const tpl = (over: Partial<DietTemplateSummary>): DietTemplateSummary => ({
  id: 't',
  name: 'Dieta',
  goal: 'recomposition',
  meals: 5,
  substitutions: 10,
  targets: { kcal: 2000, protein: 150, carbs: 200, fat: 60 },
  refWeightKg: 80,
  studentsUsing: 0,
  updatedAt: '2026-10-13',
  archived: false,
  ...over,
})

describe('lista de dietas', () => {
  it('filtra por arquivada, nome sem acento e objetivo', () => {
    const list = [tpl({ id: 'a', name: 'Emagrecimento 1.600 kcal', goal: 'fatLoss' }), tpl({ id: 'b', name: 'Vegetariana', goal: 'maintenance' }), tpl({ id: 'c', archived: true })]
    expect(filterDietTemplates(list, { archived: false, query: '', goal: null }).map((t) => t.id)).toEqual(['a', 'b'])
    expect(filterDietTemplates(list, { archived: false, query: 'vegetariana', goal: null }).map((t) => t.id)).toEqual(['b'])
    expect(filterDietTemplates(list, { archived: false, query: '', goal: 'fatLoss' }).map((t) => t.id)).toEqual(['a'])
    expect(filterDietTemplates(list, { archived: true, query: '', goal: null }).map((t) => t.id)).toEqual(['c'])
  })

  it('parte de cada macro nas calorias', () => {
    const s = macroShares({ protein: 160, carbs: 214, fat: 70 })
    expect(Math.round(s.protein * 100)).toBe(30)
    expect(Math.round(s.carbs * 100)).toBe(40)
    expect(Math.round(s.fat * 100)).toBe(30)
  })

  it('alunos para atribuir: sem dieta primeiro', () => {
    const list = dietCandidates(
      [
        { studentId: 'p', name: 'Pedro', status: 'active', weightKg: 88, current: { name: 'Low carb 1.800', until: '2026-11-22' } },
        { studentId: 'a', name: 'Ana', status: 'active', weightKg: 71, current: { name: 'Emagrecimento', until: '2026-10-22' } },
        { studentId: 'f', name: 'Fernanda', status: 'pending', weightKg: 64, current: null },
        { studentId: 'x', name: 'Arquivado', status: 'archived', weightKg: 70, current: null },
      ],
      now,
    )
    expect(list.map((c) => [c.name, c.meta, c.tone])).toEqual([
      ['Fernanda', 'Sem dieta · pendente', 'warning'],
      ['Ana', 'Dieta atual vence amanhã', 'danger'],
      ['Pedro', 'Low carb 1.800 até 22/11', 'muted'],
    ])
  })
})
