import type { NewNotification, NotificationAudience, NotificationTarget } from '../schemas/coach-notifications'

export const notificationTargetLabel: Record<NotificationTarget, string> = { home: 'Início', workout: 'Treino do dia', diet: 'Dieta', checkIn: 'Check-in', chat: 'Chat' }

/** Tela do app do aluno que a notificação abre. */
export const notificationTargetLink: Record<NotificationTarget, string> = { home: '/', workout: '/treinos', diet: '/dieta', checkIn: '/perfil/check-in', chat: '/chat' }

export const NOTIFICATION_VARIABLES = ['{nome}', '{treino}', '{treinador}'] as const

/** "{nome}", "{treino}" e "{treinador}" trocados pelos dados de cada aluno. */
export function fillNotification(text: string, v: { name: string; workout: string; coach: string }): string {
  return text.replaceAll('{nome}', v.name.split(' ')[0]!).replaceAll('{treino}', v.workout).replaceAll('{treinador}', v.coach.split(' ')[0]!)
}

/** Insere a variável no fim do campo, com um espaço antes se precisar. */
export const insertVariable = (text: string, variable: string) => (text ? `${text.replace(/\s*$/, '')} ${variable}` : variable)

/** Entre 22h e 7h o envio fica para as 7h (do mesmo dia, ou do seguinte se for depois das 22h). */
export function quietHoursAdjust(at: Date): { at: Date; moved: boolean } {
  const h = at.getHours()
  if (h >= 7 && h < 22) return { at, moved: false }
  const next = new Date(at.getFullYear(), at.getMonth(), at.getDate() + (h >= 22 ? 1 : 0), 7, 0)
  return { at: next, moved: true }
}

/** Quem recebe: todos os ativos, por tag (qualquer uma das escolhidas) ou alunos escolhidos. */
export function notificationReach(audience: NotificationAudience['students'], n: Pick<NewNotification, 'audience' | 'tags' | 'studentIds'>) {
  const list = n.audience === 'all' ? audience : n.audience === 'tags' ? audience.filter((s) => s.tags.some((t) => n.tags.includes(t))) : audience.filter((s) => n.studentIds.includes(s.id))
  const push = list.filter((s) => s.push).length
  return { students: list, total: list.length, push, noPush: list.length - push }
}

/** Rótulo do público no histórico. */
export function audienceLabel(n: Pick<NewNotification, 'audience' | 'tags' | 'studentIds'>): string {
  if (n.audience === 'all') return 'Todos os ativos'
  if (n.audience === 'tags') return `Tag: ${n.tags.join(', ')}`
  return n.studentIds.length === 1 ? '1 aluno' : `${n.studentIds.length} alunos`
}
