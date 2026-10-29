import { describe, expect, it } from 'vitest'
import type { StudentListItem } from '../schemas/coach'
import type { PlanTemplateSummary } from '../schemas/plan-templates'
import { assignCandidates, defaultPlanStart, filterTemplates, studentsUsingLabel, updatedAgo, type TemplateFilters } from './plan-templates'

const now = new Date(2026, 9, 21, 20, 0) // quarta, 21/10/2026

const tpl = (over: Partial<PlanTemplateSummary>): PlanTemplateSummary => ({
  id: 't',
  name: 'Ficha',
  split: 'ABC',
  goal: 'hypertrophy',
  level: 'intermediate',
  atHome: false,
  daysPerWeek: 3,
  durationWeeks: 8,
  phaseCount: 3,
  studentsUsing: 0,
  updatedAt: '2026-10-14',
  archived: false,
  ...over,
})

const student = (over: Partial<StudentListItem>): StudentListItem => ({
  id: 'stu',
  fullName: 'Aluno',
  email: null,
  tags: [],
  status: 'active',
  adherence30d: 80,
  lastWorkoutOn: null,
  planEndsOn: null,
  subscriptionEndsOn: null,
  invite: null,
  alerts: [],
  conversationId: null,
  ...over,
})

describe('filterTemplates', () => {
  const list = [
    tpl({ id: 'ppl', name: 'Hipertrofia — PPL', split: 'ABCDE · Push, Pull, Legs' }),
    tpl({ id: 'cut', name: 'Emagrecimento — HIIT', goal: 'fatLoss', level: 'beginner' }),
    tpl({ id: 'old', name: 'Força antiga', goal: 'strength', archived: true }),
  ]
  const base: TemplateFilters = { archived: false, query: '', goal: null, level: null }
  const ids = (f: Partial<TemplateFilters>) => filterTemplates(list, { ...base, ...f }).map((t) => t.id)

  it('separa as arquivadas', () => {
    expect(ids({})).toEqual(['ppl', 'cut'])
    expect(ids({ archived: true })).toEqual(['old'])
  })

  it('busca pelo nome ou pela divisão, sem acento', () => {
    expect(ids({ query: 'pull' })).toEqual(['ppl'])
    expect(ids({ query: 'hiit' })).toEqual(['cut'])
    expect(ids({ query: 'forca', archived: true })).toEqual(['old'])
  })

  it('objetivo e nível', () => {
    expect(ids({ goal: 'fatLoss' })).toEqual(['cut'])
    expect(ids({ level: 'intermediate' })).toEqual(['ppl'])
  })
})

describe('textos do card', () => {
  it.each([
    ['2026-10-21', 'atualizada hoje'],
    ['2026-10-20', 'atualizada ontem'],
    ['2026-10-13', 'atualizada há 8 dias'],
    ['2026-09-20', 'atualizada há 1 mês'],
    ['2026-08-21', 'atualizada há 2 meses'],
  ])('%s → %s', (iso, label) => expect(updatedAgo(iso, now)).toBe(label))

  it('alunos usando', () => {
    expect([0, 1, 18].map(studentsUsingLabel)).toEqual(['nenhum aluno', '1 aluno', '18 alunos'])
  })

  it('começa na próxima segunda', () => {
    expect(defaultPlanStart(now)).toBe('2026-10-26')
  })
})

describe('assignCandidates', () => {
  it('sem ficha primeiro, depois quem vence antes; arquivados fora', () => {
    const list = assignCandidates(
      [
        student({ id: 'diego', fullName: 'Diego', planEndsOn: '2026-12-08' }),
        student({ id: 'ana', fullName: 'Ana', planEndsOn: '2026-10-22' }),
        student({ id: 'fer', fullName: 'Fernanda', status: 'pending' }),
        student({ id: 'x', fullName: 'Arquivado', status: 'archived' }),
        student({ id: 'bia', fullName: 'Bia', planEndsOn: '2026-10-23' }),
      ],
      now,
    )
    expect(list).toEqual([
      { id: 'fer', name: 'Fernanda', meta: 'Sem ficha · pendente', tone: 'warning' },
      { id: 'ana', name: 'Ana', meta: 'Ficha atual vence amanhã', tone: 'danger' },
      { id: 'bia', name: 'Bia', meta: 'Ficha atual até 23/10', tone: 'warning' },
      { id: 'diego', name: 'Diego', meta: 'Ficha atual até 08/12', tone: 'muted' },
    ])
  })
})
