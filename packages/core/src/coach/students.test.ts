import { describe, expect, it } from 'vitest'
import type { StudentListItem } from '../schemas/coach'
import {
  activityLine,
  adherenceTone,
  filterStudents,
  lastWorkoutLabel,
  planDueTone,
  sortStudents,
  statusCounts,
  studentsToCsv,
  subscriptionDueTone,
} from './students'

const now = new Date(2026, 9, 21, 20, 0) // quarta, 21/10/2026, 20h

const student = (over: Partial<StudentListItem>): StudentListItem => ({
  id: 'stu',
  fullName: 'Aluno',
  email: 'aluno@email.com',
  tags: [],
  status: 'active',
  adherence30d: 80,
  lastWorkoutOn: '2026-10-21',
  planEndsOn: null,
  subscriptionEndsOn: null,
  invite: null,
  alerts: [],
  conversationId: null,
  ...over,
})

describe('adherenceTone', () => {
  it.each([
    [92, 'good'],
    [80, 'good'],
    [79, 'warning'],
    [60, 'warning'],
    [59, 'bad'],
    [null, 'none'],
  ] as const)('%s → %s', (pct, tone) => {
    expect(adherenceTone(pct)).toBe(tone)
  })
})

describe('lastWorkoutLabel', () => {
  it.each([
    ['2026-10-21', 'Hoje'],
    ['2026-10-20', 'Ontem'],
    ['2026-10-18', 'Há 3 dias'],
    [null, '—'],
  ])('%s → %s', (iso, label) => {
    expect(lastWorkoutLabel(iso, now)).toBe(label)
  })
})

describe('activityLine', () => {
  it('treinou recente, com o plano quando ainda não venceu', () => {
    expect(activityLine(student({ subscriptionEndsOn: '2026-12-15' }), now)).toBe('Treinou hoje · plano até 15/12')
    expect(activityLine(student({ lastWorkoutOn: '2026-10-18', subscriptionEndsOn: '2026-10-21' }), now)).toBe('Treinou há 3 dias')
  })

  it('5 dias ou mais sem treinar', () => {
    expect(activityLine(student({ lastWorkoutOn: '2026-10-15', subscriptionEndsOn: '2026-12-15' }), now)).toBe('Sem treinar há 6 dias')
  })

  it('pendente: convite', () => {
    const sentAt = new Date(2026, 9, 19, 10).toISOString()
    expect(activityLine(student({ invite: { sentAt, opened: false } }), now)).toBe('Convite enviado há 2 dias')
    expect(activityLine(student({ invite: { sentAt, opened: true } }), now)).toBe('Convite aberto, sem cadastro')
  })
})

describe('vencimentos na tabela', () => {
  it('ficha perto de vencer fica amarela', () => {
    expect(planDueTone('2026-10-23', now)).toBe('warning')
    expect(planDueTone('2026-10-30', now)).toBe('normal')
    expect(planDueTone(null, now)).toBe('normal')
  })

  it('plano vencendo amanhã ou vencido fica vermelho', () => {
    expect(subscriptionDueTone('2026-10-22', now)).toBe('danger')
    expect(subscriptionDueTone('2026-10-10', now)).toBe('danger')
    expect(subscriptionDueTone('2026-10-24', now)).toBe('normal')
  })
})

describe('sortStudents', () => {
  const list = [
    student({ fullName: 'B', lastWorkoutOn: '2026-10-19', adherence30d: 70 }),
    student({ fullName: 'Pendente', lastWorkoutOn: null, adherence30d: null }),
    student({ fullName: 'A', lastWorkoutOn: '2026-10-21', adherence30d: 95 }),
    student({ fullName: 'C', lastWorkoutOn: '2026-10-21', adherence30d: 40 }),
  ]

  it('última atividade: mais recente primeiro, sem treino no fim', () => {
    expect(sortStudents(list, 'activity').map((s) => s.fullName)).toEqual(['A', 'C', 'B', 'Pendente'])
  })

  it('menor adesão primeiro, sem dado no fim', () => {
    expect(sortStudents(list, 'adherence').map((s) => s.fullName)).toEqual(['C', 'B', 'A', 'Pendente'])
  })
})

describe('filterStudents e statusCounts', () => {
  const list = [
    student({ fullName: 'Júlia Castro', email: 'julia.castro@email.com', tags: ['Online', 'Emagrecimento'] }),
    student({ fullName: 'Marcos Lima', email: 'marcos@email.com', tags: ['Presencial'] }),
    student({ fullName: 'Fernanda Luz', status: 'pending', tags: ['Online'] }),
  ]

  it('busca sem acento por nome ou e-mail', () => {
    expect(filterStudents(list, { status: 'active', query: 'julia', tags: [] }).map((s) => s.fullName)).toEqual(['Júlia Castro'])
    expect(filterStudents(list, { status: 'active', query: 'MARCOS@', tags: [] }).map((s) => s.fullName)).toEqual(['Marcos Lima'])
  })

  it('qualquer uma das tags marcadas, dentro da aba', () => {
    expect(filterStudents(list, { status: 'active', query: '', tags: ['Online', 'Presencial'] })).toHaveLength(2)
    expect(filterStudents(list, { status: 'pending', query: '', tags: ['Online'] }).map((s) => s.fullName)).toEqual(['Fernanda Luz'])
  })

  it('conta por status', () => {
    expect(statusCounts(list)).toEqual({ active: 2, pending: 1, overdue: 0, archived: 0 })
  })
})

describe('studentsToCsv', () => {
  it('ponto e vírgula, datas em pt-BR e aspas quando precisa', () => {
    const csv = studentsToCsv([student({ fullName: 'Ana; "Paula"', tags: ['Online', 'Força'], planEndsOn: '2026-10-23' })])
    expect(csv.split('\n')).toEqual([
      'Nome;E-mail;Tags;Adesão 30 dias (%);Último treino;Ficha até;Plano até;Status',
      '"Ana; ""Paula""";aluno@email.com;Online, Força;80;21/10/2026;23/10/2026;;Ativo',
    ])
  })
})
