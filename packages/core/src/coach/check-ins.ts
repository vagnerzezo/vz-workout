import { differenceInCalendarDays, differenceInHours } from 'date-fns'
import { parseIsoDate } from '../format/date'
import type { CheckInReview } from '../schemas/coach-checkins'

export const average = (values: number[]) => (values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0)

/** Mais de 48 h esperando: fica em vermelho e conta no resumo. */
export const isOverdue = (c: Pick<CheckInReview, 'sentAt'>, now: Date) => differenceInHours(now, new Date(c.sentAt)) > 48

/**
 * Pontos de atenção do check-in: dor, notas que caíram 1 ponto ou mais e pergunta no comentário.
 * A ordem é a de prioridade (dor primeiro).
 */
export function checkInAlerts(c: Pick<CheckInReview, 'pain' | 'ratings' | 'comment'>): { text: string; tone: 'danger' | 'warning' | 'info' }[] {
  return [
    ...(c.pain ? [{ text: `Relatou dor no ${c.pain}`, tone: 'danger' as const }] : []),
    ...c.ratings.filter((r) => r.previous !== null && r.previous - r.value >= 1).map((r) => ({ text: `${r.label} caiu de ${r.previous} para ${r.value}`, tone: 'warning' as const })),
    ...(c.comment?.includes('?') ? [{ text: 'Fez uma pergunta', tone: 'info' as const }] : []),
  ]
}

/** "Revisar em sequência": dor primeiro, depois quem tem alerta, depois o que espera há mais tempo. */
export function reviewOrder<C extends Pick<CheckInReview, 'pain' | 'ratings' | 'comment' | 'sentAt'>>(list: C[]): C[] {
  const rank = (c: C) => (c.pain ? 0 : checkInAlerts(c).length > 0 ? 1 : 2)
  return [...list].sort((a, b) => rank(a) - rank(b) || a.sentAt.localeCompare(b.sentAt))
}

/** "3 dias de atraso" (mínimo 1). */
export function lateLabel(dueOn: string, now: Date): string {
  const days = Math.max(1, differenceInCalendarDays(now, parseIsoDate(dueOn)))
  return days === 1 ? '1 dia de atraso' : `${days} dias de atraso`
}

/** Respostas prontas do canvas, com o primeiro nome do aluno. */
export function replyTemplates(firstName: string): { label: string; text: string }[] {
  return [
    { label: 'Ótima evolução', text: `Ótima evolução, ${firstName}! Os números mostram que o plano está funcionando. Seguimos com a mesma estratégia nas próximas duas semanas.` },
    { label: 'Atenção à dor', text: `${firstName}, obrigado por avisar da dor. Troquei o exercício por uma opção com menos carga no joelho. Se a dor continuar, procure avaliação médica.` },
    { label: 'Ajustar dieta', text: `${firstName}, vou ajustar a dieta para melhorar a fome e a energia. A nova versão já aparece no app.` },
    { label: 'Responder pergunta', text: `Boa pergunta, ${firstName}! Pode trocar, sim. Mantenha o mesmo tempo e intensidade.` },
  ]
}
