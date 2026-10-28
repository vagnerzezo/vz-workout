import { differenceInCalendarDays } from 'date-fns'
import { parseIsoDate, shortDate } from '../format/date'
import type { StudentListItem, StudentStatus } from '../schemas/coach'
import { timeAgo } from './dashboard'

/** A partir de quantos dias sem treinar a última atividade fica em vermelho. */
export const INACTIVE_DAYS = 5

export type AdherenceTone = 'good' | 'warning' | 'bad' | 'none'

/** 80% ou mais · 60–79% · abaixo de 60% (a legenda da lista). */
export function adherenceTone(pct: number | null): AdherenceTone {
  if (pct === null) return 'none'
  if (pct >= 80) return 'good'
  return pct >= 60 ? 'warning' : 'bad'
}

const daysSince = (iso: string, now: Date) => differenceInCalendarDays(now, parseIsoDate(iso))
const daysUntil = (iso: string, now: Date) => differenceInCalendarDays(parseIsoDate(iso), now)

export const isInactive = (s: Pick<StudentListItem, 'lastWorkoutOn'>, now: Date) =>
  s.lastWorkoutOn !== null && daysSince(s.lastWorkoutOn, now) >= INACTIVE_DAYS

/** Coluna "Último treino": "Hoje" · "Ontem" · "Há 3 dias" · "—" */
export function lastWorkoutLabel(iso: string | null, now: Date): string {
  if (iso === null) return '—'
  const days = daysSince(iso, now)
  if (days <= 0) return 'Hoje'
  return days === 1 ? 'Ontem' : `Há ${days} dias`
}

/**
 * Linha de baixo do card no celular:
 * "Treinou hoje · plano até 15/12", "Sem treinar há 6 dias", "Convite enviado há 2 dias", "Convite aberto, sem cadastro".
 */
export function activityLine(s: Pick<StudentListItem, 'lastWorkoutOn' | 'subscriptionEndsOn' | 'invite'>, now: Date): string {
  if (s.invite) return s.invite.opened ? 'Convite aberto, sem cadastro' : `Convite enviado ${timeAgo(s.invite.sentAt, now)}`
  if (s.lastWorkoutOn === null) return 'Ainda não treinou'
  const days = daysSince(s.lastWorkoutOn, now)
  if (days >= INACTIVE_DAYS) return `Sem treinar há ${days} dias`
  const trained = days <= 0 ? 'Treinou hoje' : days === 1 ? 'Treinou ontem' : `Treinou há ${days} dias`
  return s.subscriptionEndsOn && daysUntil(s.subscriptionEndsOn, now) > 0 ? `${trained} · plano até ${shortDate(parseIsoDate(s.subscriptionEndsOn))}` : trained
}

export type DueTone = 'normal' | 'warning' | 'danger'

/** Datas de vencimento na tabela: ficha a 2 dias ou menos fica amarela; plano a 1 dia ou vencido, vermelho. */
export function planDueTone(iso: string | null, now: Date): DueTone {
  return iso !== null && daysUntil(iso, now) <= 2 ? 'warning' : 'normal'
}

export function subscriptionDueTone(iso: string | null, now: Date): DueTone {
  return iso !== null && daysUntil(iso, now) <= 1 ? 'danger' : 'normal'
}

export type StudentSort = 'activity' | 'adherence'

/** Última atividade: quem treinou mais recente primeiro. Menor adesão: quem precisa de ajuda primeiro. Sem dado vai para o fim. */
export function sortStudents<T extends Pick<StudentListItem, 'fullName' | 'lastWorkoutOn' | 'adherence30d'>>(list: T[], sort: StudentSort): T[] {
  const byName = (a: T, b: T) => a.fullName.localeCompare(b.fullName, 'pt-BR')
  return [...list].sort((a, b) => {
    const [x, y] = sort === 'adherence' ? [a.adherence30d, b.adherence30d] : [a.lastWorkoutOn, b.lastWorkoutOn]
    if (x === y) return byName(a, b)
    if (x === null) return 1
    if (y === null) return -1
    return sort === 'adherence' ? (x as number) - (y as number) : (y as string).localeCompare(x as string)
  })
}

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

export type StudentFilter = { status: StudentStatus; query: string; tags: string[] }

/** Aba de status + busca por nome ou e-mail (sem acento) + qualquer uma das tags marcadas. */
export function filterStudents<T extends Pick<StudentListItem, 'status' | 'fullName' | 'email' | 'tags'>>(list: T[], f: StudentFilter): T[] {
  const q = normalize(f.query.trim())
  return list.filter(
    (s) =>
      s.status === f.status &&
      (!q || normalize(s.fullName).includes(q) || normalize(s.email).includes(q)) &&
      (f.tags.length === 0 || f.tags.some((t) => s.tags.includes(t))),
  )
}

export function statusCounts(list: Pick<StudentListItem, 'status'>[]): Record<StudentStatus, number> {
  const of = (st: StudentStatus) => list.filter((s) => s.status === st).length
  return { active: of('active'), pending: of('pending'), overdue: of('overdue'), archived: of('archived') }
}

const csvCell = (v: string) => (/[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
const csvDate = (iso: string | null) => (iso ? parseIsoDate(iso).toLocaleDateString('pt-BR') : '')

/** "Exportar CSV": separado por ponto e vírgula, que é o que o Excel em português abre direto. */
export function studentsToCsv(list: StudentListItem[]): string {
  const header = ['Nome', 'E-mail', 'Tags', 'Adesão 30 dias (%)', 'Último treino', 'Ficha até', 'Plano até', 'Status']
  const status: Record<StudentStatus, string> = { active: 'Ativo', pending: 'Pendente', overdue: 'Vencido', archived: 'Arquivado' }
  const rows = list.map((s) => [
    s.fullName,
    s.email,
    s.tags.join(', '),
    s.adherence30d === null ? '' : String(Math.round(s.adherence30d)),
    csvDate(s.lastWorkoutOn),
    csvDate(s.planEndsOn),
    csvDate(s.subscriptionEndsOn),
    status[s.status],
  ])
  return [header, ...rows].map((r) => r.map(csvCell).join(';')).join('\n')
}
