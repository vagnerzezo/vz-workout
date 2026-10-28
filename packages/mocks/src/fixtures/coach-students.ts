import type { StudentAlert, StudentListItem } from '@workspace/core'
import { toIsoDate } from '@workspace/core'
import { renatoMe } from './renato'

export const filterTags = ['Online', 'Presencial', 'Hipertrofia', 'Emagrecimento']

const info = (label: string): StudentAlert => ({ label, tone: 'info' })
const warning = (label: string): StudentAlert => ({ label, tone: 'warning' })
const danger = (label: string): StudentAlert => ({ label, tone: 'danger' })

const email = (name: string) =>
  `${name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/ /g, '.')}@email.com`

type Seed = {
  id: string
  name: string
  tags: string[]
  adherence: number | null
  /** Dias desde o último treino (null = nunca treinou) */
  lastDays: number | null
  /** Dias até a ficha e o plano vencerem */
  planDays: number | null
  subscriptionDays: number | null
  alerts?: StudentAlert[]
  status?: StudentListItem['status']
  invite?: { daysAgo: number; opened: boolean }
}

/** Os alunos que aparecem no canvas (lista web e mobile), com as datas contadas a partir de hoje. */
const canvas: Seed[] = [
  { id: renatoMe.id, name: renatoMe.fullName, tags: ['Online', 'Hipertrofia'], adherence: 92, lastDays: 0, planDays: 55, subscriptionDays: 55, alerts: [info('Check-in novo'), warning('Dor no joelho')] },
  { id: 'stu_diego', name: 'Diego Santos', tags: ['Online', 'Hipertrofia'], adherence: 95, lastDays: 0, planDays: 48, subscriptionDays: 48, alerts: [info('Check-in novo')] },
  { id: 'stu_pedro', name: 'Pedro Nunes', tags: ['Presencial', 'Hipertrofia'], adherence: 90, lastDays: 0, planDays: 32, subscriptionDays: 50, alerts: [info('Comprovante enviado')] },
  { id: 'stu_julia', name: 'Júlia Castro', tags: ['Online', 'Emagrecimento'], adherence: 88, lastDays: 1, planDays: 40, subscriptionDays: 76, alerts: [info('Check-in novo')] },
  { id: 'stu_camila', name: 'Camila Rocha', tags: ['Online', 'Emagrecimento'], adherence: 84, lastDays: 1, planDays: 24, subscriptionDays: 30, alerts: [warning('Comprovante com valor diferente')] },
  { id: 'stu_ana', name: 'Ana Paula Reis', tags: ['Online', 'Condicionamento'], adherence: 76, lastDays: 2, planDays: 1, subscriptionDays: 89, alerts: [warning('Ficha vence amanhã')] },
  { id: 'stu_bruno', name: 'Bruno Teixeira', tags: ['Online', 'Força'], adherence: 71, lastDays: 3, planDays: 9, subscriptionDays: 0, alerts: [danger('Plano vence hoje')] },
  { id: 'stu_leticia', name: 'Letícia Moura', tags: ['Online', 'Emagrecimento'], adherence: 62, lastDays: 6, planDays: 15, subscriptionDays: 38, alerts: [danger('Pagamento atrasado')] },
  { id: 'stu_marcos', name: 'Marcos Lima', tags: ['Presencial', 'Hipertrofia'], adherence: 40, lastDays: 7, planDays: 22, subscriptionDays: 43, alerts: [danger('Pagamento atrasado'), warning('Check-in atrasado')] },
  { id: 'stu_thiago', name: 'Thiago Alves', tags: ['Presencial', 'Força'], adherence: 86, lastDays: 1, planDays: 36, subscriptionDays: 60 },
  { id: 'stu_fernanda', name: 'Fernanda Luz', tags: ['Online', 'Emagrecimento'], adherence: null, lastDays: null, planDays: null, subscriptionDays: 91, status: 'pending', invite: { daysAgo: 2, opened: false } },
  { id: 'stu_rafael', name: 'Rafael Costa', tags: ['Presencial', 'Força'], adherence: null, lastDays: null, planDays: null, subscriptionDays: 86, status: 'pending', invite: { daysAgo: 5, opened: false } },
  { id: 'stu_sofia', name: 'Sofia Martins', tags: ['Online', 'Hipertrofia'], adherence: null, lastDays: null, planDays: null, subscriptionDays: 104, status: 'pending', invite: { daysAgo: 3, opened: true } },
]

const FIRST = ['Lucas', 'Mariana', 'Gabriel', 'Beatriz', 'Rafaela', 'Felipe', 'Larissa', 'Gustavo', 'Isabela', 'Matheus', 'Carolina', 'Vinícius', 'Amanda', 'Leonardo', 'Natália', 'Eduardo', 'Patrícia', 'Rodrigo', 'Aline', 'Henrique', 'Bianca']
const LAST = ['Oliveira', 'Souza', 'Pereira', 'Ferreira', 'Almeida', 'Ribeiro', 'Carvalho', 'Gomes', 'Barbosa', 'Araújo', 'Mendes', 'Cardoso', 'Freitas', 'Moreira', 'Duarte']
const TAG_SETS = [['Online', 'Hipertrofia'], ['Presencial', 'Hipertrofia'], ['Online', 'Emagrecimento'], ['Presencial', 'Emagrecimento'], ['Online', 'Condicionamento'], ['Presencial', 'Força']]

/** O resto da carteira (52 ativos e 18 arquivados no total), gerado sempre igual. */
function filler(count: number, status: 'active' | 'archived', offset: number): Seed[] {
  return Array.from({ length: count }, (_, k) => {
    const i = k + offset
    const name = `${FIRST[i % FIRST.length]} ${LAST[(i * 7) % LAST.length]}`
    const archived = status === 'archived'
    return {
      id: `stu_${status === 'active' ? 'a' : 'x'}${k + 1}`,
      name,
      tags: TAG_SETS[i % TAG_SETS.length]!,
      adherence: archived ? null : 80 + ((i * 13) % 19),
      lastDays: archived ? 30 + i : i % 4,
      planDays: archived ? null : 10 + ((i * 11) % 70),
      subscriptionDays: archived ? -(20 + i) : 10 + ((i * 17) % 80),
      status,
    }
  })
}

const seeds = [...canvas, ...filler(42, 'active', 0), ...filler(18, 'archived', 42)]

export function coachStudents(now: Date): StudentListItem[] {
  const day = (offset: number | null) => {
    if (offset === null) return null
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    d.setDate(d.getDate() + offset)
    return toIsoDate(d)
  }
  return seeds.map((s) => ({
    id: s.id,
    fullName: s.name,
    email: email(s.name),
    tags: s.tags,
    status: s.status ?? 'active',
    adherence30d: s.adherence,
    lastWorkoutOn: day(s.lastDays === null ? null : -s.lastDays),
    planEndsOn: day(s.planDays),
    subscriptionEndsOn: day(s.subscriptionDays),
    invite: s.invite ? { sentAt: new Date(now.getTime() - s.invite.daysAgo * 86_400_000).toISOString(), opened: s.invite.opened } : null,
    alerts: s.alerts ?? [],
    conversationId: s.status === 'pending' ? null : `conv_${s.id.replace('stu_', '')}`,
  }))
}
