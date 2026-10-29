import { differenceInCalendarDays, nextMonday } from 'date-fns'
import { parseIsoDate, shortDate, toIsoDate } from '../format/date'
import type { StudentListItem } from '../schemas/coach'
import type { PlanGoal, PlanTemplateSummary } from '../schemas/plan-templates'
import { planDueTone } from './students'

export const planGoalLabel: Record<PlanGoal, string> = {
  hypertrophy: 'Hipertrofia',
  fatLoss: 'Emagrecimento',
  strength: 'Força',
  conditioning: 'Condicionamento',
}

export const levelLabel = { beginner: 'Iniciante', intermediate: 'Intermediário', advanced: 'Avançado' } as const

const fold = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

export type TemplateFilters = { archived: boolean; query: string; goal: PlanGoal | null; level: keyof typeof levelLabel | null }

/** Busca pelo nome e pela divisão, sem acento; objetivo e nível são filtros exatos. */
export function filterTemplates(list: PlanTemplateSummary[], f: TemplateFilters): PlanTemplateSummary[] {
  const q = fold(f.query.trim())
  return list.filter(
    (t) => t.archived === f.archived && (!q || fold(`${t.name} ${t.split}`).includes(q)) && (!f.goal || t.goal === f.goal) && (!f.level || t.level === f.level),
  )
}

/** Card no celular: "atualizada hoje", "há 8 dias", "há 1 mês", "há 2 meses". */
export function updatedAgo(iso: string, now: Date): string {
  const days = differenceInCalendarDays(now, parseIsoDate(iso))
  if (days <= 0) return 'atualizada hoje'
  if (days === 1) return 'atualizada ontem'
  if (days < 30) return `atualizada há ${days} dias`
  const months = Math.floor(days / 30)
  return `atualizada há ${months === 1 ? '1 mês' : `${months} meses`}`
}

export const studentsUsingLabel = (n: number) => (n === 0 ? 'nenhum aluno' : n === 1 ? '1 aluno' : `${n} alunos`)

/** A ficha atribuída começa na próxima segunda (o padrão do canvas). */
export const defaultPlanStart = (now: Date) => toIsoDate(nextMonday(now))

export type AssignCandidate = { id: string; name: string; meta: string; tone: 'warning' | 'danger' | 'muted' }

/**
 * Alunos para o painel "Atribuir ficha": quem está sem ficha primeiro, depois quem vence antes.
 * Arquivados ficam de fora.
 */
export function assignCandidates(students: StudentListItem[], now: Date): AssignCandidate[] {
  return students
    .filter((s) => s.status !== 'archived')
    .sort((a, b) => (a.planEndsOn ?? '').localeCompare(b.planEndsOn ?? '') || a.fullName.localeCompare(b.fullName, 'pt-BR'))
    .map((s) => {
      if (!s.planEndsOn) return { id: s.id, name: s.fullName, meta: s.status === 'pending' ? 'Sem ficha · pendente' : 'Sem ficha', tone: 'warning' }
      const days = differenceInCalendarDays(parseIsoDate(s.planEndsOn), now)
      if (days < 0) return { id: s.id, name: s.fullName, meta: 'Ficha atual vencida', tone: 'danger' }
      if (days <= 1) return { id: s.id, name: s.fullName, meta: days === 0 ? 'Ficha atual vence hoje' : 'Ficha atual vence amanhã', tone: 'danger' }
      return { id: s.id, name: s.fullName, meta: `Ficha atual até ${shortDate(parseIsoDate(s.planEndsOn))}`, tone: planDueTone(s.planEndsOn, now) === 'warning' ? 'warning' : 'muted' }
    })
}
